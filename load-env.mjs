import { config } from "dotenv";
import path from "path";


const env = process.env.NODE_ENV || "development";

console.log(env)

const envPath = path.resolve(process.cwd(), `.env.${env}`)

config({ path: envPath, override: true})

console.log(`Archivo .env cargado: ${envPath}`);