// src/seed.ts
import { InitializationService } from "@/modules/initial/services/initialization.service";
import "reflect-metadata";
import { container } from "tsyringe";

async function main() {
  const initSvc = container.resolve(InitializationService);
  try {
    await initSvc.initialize();
  } catch (e: any) {
    console.error("Falló la inicialización:", e);
    process.exit(1);
  } finally {
    await initSvc.close();
  }
  console.log("✅ Seed completado");
  process.exit(0);
}

main();
