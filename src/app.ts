import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { prisma } from "./prisma";
import { configureDependencies } from "./core/di/config";
import { getRoutes } from "./routes/index.routes";
import { errorHandler } from "./middleware/errors/errorHandler";
import { InitializationService } from "./modules/initial/services/initialization.service";
import { DependencyContainer } from "./core/di/container";
import { logger } from "./logger/logger";
import "./utils/helper/markAbsentUsersForToday";

configureDependencies();

async function bootstrap() {
  const routes = await getRoutes(); // Obtener las rutas de forma asíncrona
  const app = express();
  app.use(
    cors({
      origin: "https://abilityapps.com.pe",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));
  app.options("*", cors()); // responde automáticamente a OPTIONS con los headers
  app.use(morgan("dev"));
  app.use(express.json());
  app.use("/api/", routes);
  app.use("/api/test", (req, res) => {
    res.json({ message: "Hello World" });
  });
  app.use(express.static("public"));

  // Middleware de manejo de errores
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
  });

  console.log("Starting server...🚀");

  const PORT = process.env.PORT;

  try {
    // Conectar a la base de datos
    await prisma.$connect();
    console.log("Conexión a la base de datos establecida");
    logger.info("Conexión a la base de datos establecida");

    // Inicializar datos
    const initialData = DependencyContainer.resolve(InitializationService);
    console.log("Inicializando datos...");
    await initialData.initialize();
    console.log("Datos inicializados");
    logger.info("Datos inicializados");

    // Iniciar servidor
    console.log("Server started");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      logger.info(`Servidor iniciado en el puerto ${PORT}`);
    });

    return app; // Devolver la instancia de la aplicación
  } catch (e) {
    // Manejar errores globales
    logger.error("Error starting server:", e);
    console.error("Error starting server:", e);

    // Asegurarse de desconectar recursos
    try {
      await prisma.$disconnect();
      console.log("Conexión a la base de datos cerrada");
    } catch (prismaError) {
      logger.error("Error al desconectar Prisma:", prismaError);
    }

    process.exit(1); // Detener el servidor de manera segura
  }
}

// Manejadores globales para excepciones no manejadas
process.on("uncaughtException", (err) => {
  logger.error("Excepción no manejada:", err.message);
  logger.error(err.stack);
  process.exit(1); // Detener el servidor de manera segura
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Promesa no manejada:", reason);
  process.exit(1); // Detener el servidor de manera segura
});

bootstrap();

export default bootstrap; // Exportar la función bootstrap para pruebas
