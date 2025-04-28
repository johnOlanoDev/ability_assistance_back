import { Request } from "express";

export interface CustomRequest extends Request {
    userId?: string; // ID del usuario autenticado
    role?: string;   // Rol del usuario autenticado
    companyId?: string; // ID de la empresa asociada al usuario
}