/* import { injectable } from "tsyringe";
import { redis } from "@/config/redis";
import { logger } from "@/logger/logger";

@injectable()
export class CacheService {
  getCacheKey(
    model: string,
    type: "active" | "deleted" | "id",
    id?: string,
    companyId?: string
  ): string {
    if (type === "id" && id) {
      return `${model}:id:${id}`;
    } 
    return `${model}:${type}:${companyId || "undefined"}`;
  }

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error: any) {
      logger.error(`Error al obtener caché para ${key}: ${error.message}`);
      return null;
    }
  }

  async setCache(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
      logger.info(`Caché guardada para ${key}`);
    } catch (error: any) {
      logger.error(`Error al guardar caché para ${key}: ${error.message}`);
    }
  }

  async invalidateCache(keys: string[]): Promise<void> {
    try {
      for (const key of keys) {
        const result = await redis.del(key);
        console.log(
          `Invalidación de caché para ${key}: ${result ? "exitosa" : "fallida"}`
        );
        if (!result) {
          await redis.set(key, "", { EX: 1 });
          console.log(`Sobrescritura para ${key}: exitosa`);
        }
      }
      logger.info("Caché invalidada correctamente");
    } catch (error: any) {
      logger.error("Error al invalidar caché:", error.message);
    }
  }

  async invalidateModelCache(model: string, companyId?: string, id?: string): Promise<void> {
    const keys = [
      this.getCacheKey(model, "active", undefined, companyId),
      this.getCacheKey(model, "deleted", undefined, companyId),
    ];

    if (id) {
      keys.push(this.getCacheKey(model, "id", id, companyId));
    }

    await this.invalidateCache(keys);
  }

  async invalidateById(model: string, id: string, companyId?: string): Promise<void> {
    const key = this.getCacheKey(model, "id", id, companyId);
    await this.invalidateCache([key]);
  }
}

 */