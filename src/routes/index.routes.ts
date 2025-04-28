import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const PATH_ROUTES = dirname(__filename);

const router = express.Router();

// Initialize routes function
async function initializeRoutes() {
    console.log("Initializing routes from:", PATH_ROUTES);
    
    // List all files in the directory to see what's available
    const allFiles = fs.readdirSync(PATH_ROUTES);
    console.log("All files in directory:", allFiles);
    
    console.log("Current environment:", process.env.NODE_ENV);
    

    const isProduction = process.env.NODE_ENV !== "development";
    console.log("Is production environment:", isProduction);
    
    // Adjust filter based on environment
    const routeFiles = allFiles.filter((file) => {
        // In production, look for '.js' files that include 'routes'
        // In development, look for '.ts' files that include 'routes'
        const isRouteFile = isProduction 
            ? file.endsWith('.js') && file.includes('routes')
            : file.endsWith('.ts') && file.includes('routes');
        
        const isNotIndex = !file.startsWith('index.');
        return isRouteFile && isNotIndex;
    });
    
    console.log("Route files to load:", routeFiles);
    
    // If no route files found, log extra info
    if (routeFiles.length === 0) {
        console.error("No route files found! Check build output and directory structure.");
        console.log("Current directory:", process.cwd());
        console.log("NODE_ENV:", process.env.NODE_ENV);
    }
    
    // Process each route file
    for (const file of routeFiles) {
        // Extract the route name - remove extensions and any 'routes' suffix
        let routeName = file.split('.')[0]; // Remove extension
        routeName = routeName.replace('.routes', '').replace('routes.', '').replace('routes', '');
        
        // If the routeName is empty after removing 'routes', use the original name before extension
        if (!routeName) {
            routeName = file.split('.')[0];
        }
        
        const routePath = `/${routeName}`;
        
        try {
            // Create a proper file URL for ESM imports
            const modulePath = join(PATH_ROUTES, file);
            const moduleURL = pathToFileURL(modulePath).href;
            
            console.log(`Importing module from: ${moduleURL}`);
            
            const module = await import(moduleURL);
            
            if (module.default) {
                console.log(`Registered route: ${routePath}`);
                router.use(routePath, module.default);
            } else if (module.router) {
                // Some modules might export 'router' instead of default
                console.log(`Registered route (router export): ${routePath}`);
                router.use(routePath, module.router);
            } else {
                console.warn(`Module ${file} has no router export`);
                // If we can't find a proper export, check what is exported
                console.log("Available exports:", Object.keys(module));
                
                // Try to use the first export that looks like a router
                for (const key of Object.keys(module)) {
                    if (module[key] && typeof module[key].use === 'function') {
                        console.log(`Using export '${key}' as router for ${routePath}`);
                        router.use(routePath, module[key]);
                        break;
                    }
                }
            }
        } catch (err) {
            console.error(`Error loading route ${file}:`, err);
        }
    }
    
    // Add a catch-all route for debugging
    router.all('*', (req, res, next) => {
        console.log(`Route not found: ${req.method} ${req.originalUrl}`);
        next();
    });
    
    return router;
}

// Export the function
export async function getRoutes() {
    return await initializeRoutes();
}