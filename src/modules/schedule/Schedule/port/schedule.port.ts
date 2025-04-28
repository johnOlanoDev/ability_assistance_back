import {
  CreateScheduleDTO,
  UpdateScheduleDTO,
  ScheduleResponse,
} from "../types/schedule.types";

export interface IScheduleRepository {
  // Obtener todos los horarios (con filtro opcional por companyId)
  getAllSchedules(
    companyId?: string,
    workplaceId?: string,
    positionId?: string
  ): Promise<{ schedules: ScheduleResponse[]; total: number }>;

  // Obtener un horario por ID
  getScheduleById(
    id: string,
    companyId?: string
  ): Promise<ScheduleResponse | null>;

  // Crear un nuevo horario
  createSchedule(data: CreateScheduleDTO): Promise<ScheduleResponse>;

  // Actualizar un horario
  updateSchedule(
    id: string,
    data: UpdateScheduleDTO,
    companyId?: string
  ): Promise<ScheduleResponse>;

  // Eliminar (soft delete) un horario
  softDeleteSchedule(id: string, companyId?: string): Promise<ScheduleResponse>;

  // Validar si el rango de horario ya existe
  findScheduleRange(
    scheduleId: string,
    startDay: string,
    endDay: string,
    checkIn: string,
    checkOut: string,
    companyId?: string,
    excludeId?: string
  ): Promise<boolean>;
}
