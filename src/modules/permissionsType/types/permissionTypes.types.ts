import { AsistentType } from "@/modules/attendance/types/attendance.types";
import { CompanyResponse } from "@/modules/companies/types/company.types";

export interface CreatePermissionType {
  name: string; // Nombre del tipo de permiso (obligatorio)
  companyId?: string | null; // ID de la compañía (opcional, por defecto null)
  description: string; // Descripción del tipo de permiso
  durationUnit: DurationUnit;
  duration: number; // Duración del permiso en días (obligatorio)
  typeAssistanceEffect?: AsistentType
  status?: boolean; // Estado del permiso (opcional, por defecto true)
}

export interface PermissionTypeResponse {
  id: string; // ID del tipo de permiso
  name: string; // Nombre del tipo de permiso
  companyId?: string | null; // ID de la compañía (opcional, por defecto null)
  description: string; // Descripción del tipo de permiso
  duration: number; // Duración del permiso en días
  durationUnit: DurationUnit;
  typeAssistanceEffect?: AsistentType | null;
  status?: boolean; // Estado del permiso (opcional, por defecto true)
  company?: CompanyResponse | null; // Compañía asociada (opcional, por defecto null)
  createdAt: Date; // Fecha de creación
  updatedAt: Date; // Fecha de actualización
  deletedAt?: Date | null; // Fecha de eliminación (opcional, por defecto null)
}

export type UpdatePermissionTypeDto = Partial<CreatePermissionType>;

export const DurationUnit = {
  HOURS: "HOURS",
  DAYS: "DAYS",
} as const;

export type DurationUnit = (typeof DurationUnit)[keyof typeof DurationUnit];
