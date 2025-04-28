// Configuración de Redis
import { createClient } from "redis";
import { logger } from "@/logger/logger";

export const redis = createClient({
  url: process.env.REDIS_URL,
});

// Método seguro para conectar Redis
export async function connectRedis() {
  if (!redis.isOpen && !redis.isReady) {
    await redis.connect();
    console.log("Conexión a Redis establecida");
  }
}

redis.on("error", (err) => {
  console.error("Redis error", err);
  logger.error("Redis error", err);
});

export default redis;