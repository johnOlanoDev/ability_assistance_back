import fs from 'fs';
import path from 'path';

// Función para actualizar los imports en un archivo
function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Agregar .js a los imports locales (comienzan con ./ o ../)
  content = content.replace(/(from\s+|import\s+)['"](\.\.?\/.+?)['"]/g, '$1"$2.js"');

  // Reemplazar alias @/* con rutas relativas y agregar .js
  content = content.replace(/(from\s+|import\s+)['"]@\/(.+?)['"]/g, (match, p1, p2) => {
    // Convertir la ruta del alias a una ruta relativa
    const relativePath = path.relative(path.dirname(filePath), path.join(process.cwd(), 'dist', p2));
    return `${p1}"${relativePath.replace(/\\/g, '/')}.js"`;
  });

  // Guardar el archivo modificado
  fs.writeFileSync(filePath, content);
}

// Función para procesar una carpeta recursivamente
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      processDirectory(filePath); // Procesar subcarpetas
    } else if (filePath.endsWith('.js')) {
      updateImports(filePath); // Actualizar imports en archivos .js
    }
  });
}

// Iniciar desde la carpeta dist
processDirectory('./dist');
console.log('Imports actualizados correctamente.');