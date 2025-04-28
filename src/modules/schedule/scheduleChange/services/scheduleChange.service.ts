// src/modules/scheduleChange/application/scheduleChangeService.ts
import { injectable, inject } from "tsyringe";
import {
  CreateScheduleChangeDTO,
  ScheduleChangeFilters,
  ScheduleChangeResponse,
  UpdateScheduleChangeDTO,
} from "../types/scheduleChange.types";
import { PermissionUtils } from "@/utils/helper/permissions.helper";
import { AppError } from "@/middleware/errors/AppError";
import { ScheduleValidator } from "@/modules/schedule/Schedule/validator/schedule.validator";
import { ScheduleChangeRepository } from "../repository/scheduleChange.repository";
import { AsistentType } from "@/modules/attendance/types/attendance.types";
import { AttendanceRepository } from "@/modules/attendance/repository/attendance.repository";

@injectable()
export class ScheduleChangeService {
  constructor(
    @inject("ScheduleChangeRepository")
    private scheduleChangeRepository: ScheduleChangeRepository,
    @inject("AttendanceRepository")
    private attendanceRepository: AttendanceRepository,
    @inject("ScheduleValidator")
    private scheduleValidator: ScheduleValidator,
    @inject("PermissionUtils")
    private permissionUtils: PermissionUtils
  ) {}

  /**
   * Crear un nuevo cambio de horario
   */
  async createScheduleChange(
    changeData: CreateScheduleChangeDTO,
    user: { userId: string; roleId: string; companyId?: string }
  ): Promise<ScheduleChangeResponse> {
    // Verificar si el usuario es superadmin
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    let companyId = isSuperAdmin ? undefined : user.companyId;

    // Validar que al menos un nivel está especificado
    if (
      !changeData.scheduleId &&
      !changeData.workplaceId &&
      !changeData.positionId &&
      !companyId
    ) {
      throw new AppError(
        "Debe especificar al menos un nivel (horario, lugar de trabajo, posición o empresa)",
        400
      );
    }

    // Validaciones adicionales si NO es superadmin
    if (!isSuperAdmin) {
      // Validar schedule
      if (changeData.scheduleId) {
        await this.scheduleValidator.validateScheduleExists(
          user,
          changeData.workplaceId,
          changeData.positionId
        );
      }

      // Validar workplace
      if (changeData.workplaceId) {
        await Promise.all([
          this.scheduleValidator.validateWorkplaceExists(
            user,
            changeData.workplaceId
          ),
          this.scheduleValidator.validateWorkplaceActive(
            user,
            changeData.workplaceId
          ),
          this.scheduleValidator.validateWorkplaceAndPositionBelongToCompany(
            user,
            changeData.workplaceId,
            companyId
          ),
        ]);
      }

      // Validar position
      if (changeData.positionId) {
        await Promise.all([
          this.scheduleValidator.validatePositionExists(
            user,
            changeData.positionId
          ),
          this.scheduleValidator.validatePositionActive(
            user,
            changeData.positionId
          ),
          this.scheduleValidator.validatePositionBelongsToCompany(
            user,
            changeData.positionId,
            companyId
          ),
        ]);
      }
    }

    // Validar fechas y horarios
    const changeDate = new Date(changeData.changeDate);
    const newCheckIn = changeData.newCheckIn;
    const newCheckOut = changeData.newCheckOut;

    // Validar que la fecha de check-out es posterior a check-in
    if (newCheckOut <= newCheckIn) {
      throw new AppError(
        "La hora de salida debe ser posterior a la hora de entrada",
        400
      );
    }

    try {
      // Verificar si ya existe un cambio para la misma entidad en la misma fecha
      const existingChange =
        await this.scheduleChangeRepository.findScheduleChangeByDate(
          changeDate,
          changeData.scheduleId,
          changeData.workplaceId,
          changeData.positionId,
          companyId
        );

      if (existingChange) {
        throw new AppError(
          "Ya existe un cambio programado para esta fecha y entidad",
          400
        );
      }

      // Crear el cambio
      const changeToCreate = {
        ...changeData,
        companyId: companyId || undefined,
        changeDate: changeDate,
        newCheckIn: newCheckIn,
        newCheckOut: newCheckOut,
      };

      const newChange =
        await this.scheduleChangeRepository.createScheduleChange(
          changeToCreate
        );

      if (!newChange) {
        throw new AppError("Error al crear el cambio de horario", 500);
      }

      // Recalcular el tipo de asistencia para los registros afectados
      await this.recalculateAttendanceForChange(newChange);

      return newChange;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Error al crear el cambio de horario: ${error.message}`,
        500
      );
    }
  }

  /**
   * Actualizar un cambio de horario existente
   */
  async updateScheduleChange(
    id: string,
    changeData: UpdateScheduleChangeDTO,
    user: { roleId: string; companyId?: string }
  ): Promise<ScheduleChangeResponse> {
    // Verificar que el cambio existe
    const existingChange =
      await this.scheduleChangeRepository.findScheduleChangeById(id);
    if (!existingChange) {
      throw new AppError("Cambio de horario no encontrado", 404);
    }

    // Verificar permisos
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    if (!isSuperAdmin) {
      if (!user.companyId) {
        throw new AppError("No tienes una empresa asignada", 401);
      }

      // Verificar que el cambio pertenece a la empresa del usuario
      if (
        existingChange.companyId &&
        existingChange.companyId !== user.companyId
      ) {
        throw new AppError(
          "No tienes permiso para actualizar este cambio",
          403
        );
      }
    }

    // Validar datos de actualización
    if (changeData.newCheckIn && changeData.newCheckOut) {
      const checkIn = changeData.newCheckIn;
      const checkOut = changeData.newCheckOut;

      if (checkOut <= checkIn) {
        throw new AppError(
          "La hora de salida debe ser posterior a la hora de entrada",
          400
        );
      }
    } else if (changeData.newCheckIn && !changeData.newCheckOut) {
      const checkIn = changeData.newCheckIn;
      const existingCheckOut = existingChange.newCheckOut;

      if (existingCheckOut <= checkIn) {
        throw new AppError(
          "La hora de salida debe ser posterior a la hora de entrada",
          400
        );
      }
    } else if (!changeData.newCheckIn && changeData.newCheckOut) {
      const checkOut = changeData.newCheckOut;
      const existingCheckIn = existingChange.newCheckIn;

      if (checkOut <= existingCheckIn) {
        throw new AppError(
          "La hora de salida debe ser posterior a la hora de entrada",
          400
        );
      }
    }

    try {
      // Preparar datos para actualización
      const updateData: UpdateScheduleChangeDTO = { ...changeData };

      // Actualizar el cambio
      const updatedChange =
        await this.scheduleChangeRepository.updateScheduleChange(
          id,
          updateData
        );

      // Recalcular el tipo de asistencia para los registros afectados por el cambio anterior
      await this.recalculateAttendanceForChange(existingChange);

      // Recalcular el tipo de asistencia para los registros afectados por el cambio actualizado
      await this.recalculateAttendanceForChange(updatedChange);

      return updatedChange;
    } catch (error: any) {
      throw new AppError(
        `Error al actualizar el cambio de horario: ${error.message}`,
        500
      );
    }
  }

  /**
   * Eliminar un cambio de horario
   */
  async deleteScheduleChange(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<boolean> {
    // Verificar que el cambio existe
    const existingChange =
      await this.scheduleChangeRepository.findScheduleChangeById(id);
    if (!existingChange) {
      throw new AppError("Cambio de horario no encontrado", 404);
    }

    // Verificar permisos
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    if (!isSuperAdmin && existingChange.companyId !== user.companyId) {
      throw new AppError("No tienes permiso para eliminar este cambio", 403);
    }

    if (!existingChange) {
      throw new AppError("Cambio de horario no encontrado", 404);
    }

    // Restaurar el tipo de asistencia basado en el horario original
    await this.recalculateAttendanceForChange(existingChange);

    try {
      return await this.scheduleChangeRepository.deleteScheduleChange(id);
    } catch (error: any) {
      throw new AppError(
        `Error al eliminar el cambio de horario: ${error.message}`,
        500
      );
    }
  }

  /**
   * Obtener un cambio de horario por su ID
   */
  async getScheduleChangeById(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<ScheduleChangeResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    const change = await this.scheduleChangeRepository.findScheduleChangeById(
      id
    );
    if (!change) {
      throw new AppError("Cambio de horario no encontrado", 404);
    }

    // Si no es superadmin, verificar que el cambio pertenece a su empresa
    if (
      !isSuperAdmin &&
      change.companyId &&
      change.companyId !== user.companyId
    ) {
      throw new AppError(
        "No tienes permiso para ver este cambio de horario",
        403
      );
    }

    return change;
  }

  /**
   * Obtener cambios de horario según filtros
   */
  async getScheduleChanges(
    filters: ScheduleChangeFilters,
    user: { roleId: string; companyId?: string }
  ): Promise<{ changes: ScheduleChangeResponse[]; total: number }> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    // Si no es superadmin, asegurarse que solo vea cambios de su empresa
    if (!isSuperAdmin) {
      if (!user.companyId) {
        throw new AppError("No tienes una empresa asignada", 401);
      }
      filters.companyId = user.companyId;
    }

    const changes =
      await this.scheduleChangeRepository.findScheduleChangesByFilters(filters);
    const total = await this.scheduleChangeRepository.countScheduleChanges(
      filters
    );

    return { changes, total };
  }

  /**
   * Verificar si existe un cambio de horario para una fecha y entidad específicas
   */
  async checkScheduleChangeForDate(
    date: Date | string,
    scheduleId?: string,
    workplaceId?: string,
    positionId?: string,
    companyId?: string
  ): Promise<ScheduleChangeResponse | null> {
    return await this.scheduleChangeRepository.findScheduleChangeByDate(
      date,
      scheduleId,
      workplaceId,
      positionId,
      companyId
    );
  }

  /**
   * Obtener el horario modificado para una fecha específica
   * considerando los cambios programados en diferentes niveles
   */
  async getEffectiveScheduleChangeForDate(
    date: Date | string,
    scheduleId?: string,
    workplaceId?: string,
    positionId?: string,
    companyId?: string
  ): Promise<{
    newCheckIn?: string;
    newCheckOut?: string;
    reason?: string;
  } | null> {
    const dateObj = new Date(date);

    // Prioridad para buscar cambios:
    // 1. Cambio específico para el horario
    if (scheduleId) {
      const scheduleChange =
        await this.scheduleChangeRepository.findScheduleChangeByDate(
          dateObj,
          scheduleId
        );

      if (scheduleChange) {
        return {
          newCheckIn: scheduleChange.newCheckIn,
          newCheckOut: scheduleChange.newCheckOut,
          reason: scheduleChange.reason,
        };
      }
    }

    // 2. Cambio para la posición
    if (positionId) {
      const positionChange =
        await this.scheduleChangeRepository.findScheduleChangeByDate(
          dateObj,
          undefined,
          undefined,
          positionId
        );

      if (positionChange) {
        return {
          newCheckIn: positionChange.newCheckIn,
          newCheckOut: positionChange.newCheckOut,
          reason: positionChange.reason,
        };
      }
    }

    // 3. Cambio para el área/workplace
    if (workplaceId) {
      const workplaceChange =
        await this.scheduleChangeRepository.findScheduleChangeByDate(
          dateObj,
          undefined,
          workplaceId
        );

      if (workplaceChange) {
        return {
          newCheckIn: workplaceChange.newCheckIn,
          newCheckOut: workplaceChange.newCheckOut,
          reason: workplaceChange.reason,
        };
      }
    }

    // 4. Cambio para la empresa
    if (companyId) {
      const companyChange =
        await this.scheduleChangeRepository.findScheduleChangeByDate(
          dateObj,
          undefined,
          undefined,
          undefined,
          companyId
        );

      if (companyChange) {
        return {
          newCheckIn: companyChange.newCheckIn,
          newCheckOut: companyChange.newCheckOut,
          reason: companyChange.reason,
        };
      }
    }

    // No hay cambios programados
    return null;
  }

  /**
   * Programar cambios masivos de horario para un rango de fechas
   */
  async scheduleBulkChanges(
    startDate: Date | string,
    endDate: Date | string,
    changeData: Omit<CreateScheduleChangeDTO, "changeDate">,
    user: { userId: string; roleId: string; companyId?: string }
  ): Promise<{ created: number; skipped: number }> {
    // Validar fechas
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      throw new AppError(
        "La fecha final debe ser posterior a la fecha inicial",
        400
      );
    }

    // Verificar permisos
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    let companyId: string | undefined = undefined;

    if (isSuperAdmin) {
      companyId = changeData.companyId;
    } else {
      if (!user.companyId) {
        throw new AppError("No tienes una empresa asignada", 401);
      }
      companyId = user.companyId;
    }

    // Validar que al menos un nivel está especificado
    if (
      !changeData.scheduleId &&
      !changeData.workplaceId &&
      !changeData.positionId &&
      !companyId
    ) {
      throw new AppError(
        "Debe especificar al menos un nivel (horario, lugar de trabajo, posición o empresa)",
        400
      );
    }

    // Realizar validaciones adicionales si no es superadmin
    if (!isSuperAdmin) {
      // Validar schedule
      if (changeData.scheduleId) {
        await this.scheduleValidator.validateScheduleExists(
          user,
          changeData.workplaceId,
          changeData.positionId
        );
      }

      // Validar workplace
      if (changeData.workplaceId) {
        await Promise.all([
          this.scheduleValidator.validateWorkplaceExists(
            user,
            changeData.workplaceId
          ),
          this.scheduleValidator.validateWorkplaceActive(
            user,
            changeData.workplaceId
          ),
          this.scheduleValidator.validateWorkplaceAndPositionBelongToCompany(
            user,
            changeData.workplaceId,
            companyId
          ),
        ]);
      }

      // Validar position
      if (changeData.positionId) {
        await Promise.all([
          this.scheduleValidator.validatePositionExists(
            user,
            changeData.positionId
          ),
          this.scheduleValidator.validatePositionActive(
            user,
            changeData.positionId
          ),
          this.scheduleValidator.validatePositionBelongsToCompany(
            user,
            changeData.positionId,
            companyId
          ),
        ]);
      }
    }

    let created = 0;
    let skipped = 0;
    const current = new Date(start);

    try {
      // Recorrer cada día del rango
      while (current <= end) {
        // Verificar si ya existe un cambio para esta fecha
        const existingChange =
          await this.scheduleChangeRepository.findScheduleChangeByDate(
            new Date(current),
            changeData.scheduleId,
            changeData.workplaceId,
            changeData.positionId,
            companyId
          );

        if (existingChange) {
          skipped++;
        } else {
          // Crear el cambio para esta fecha
          await this.scheduleChangeRepository.createScheduleChange({
            ...changeData,
            companyId: companyId || undefined,
            changeDate: new Date(current),
          });
          created++;
        }

        // Avanzar al siguiente día
        current.setDate(current.getDate() + 1);
      }

      return { created, skipped };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Error al programar cambios masivos: ${error.message}`,
        500
      );
    }
  }

  /**
   * Obtener un resumen de cambios de horario para un rango de fechas
   */
  async getScheduleChangeSummary(
    startDate: Date | string,
    endDate: Date | string,
    filters: {
      scheduleId?: string;
      workplaceId?: string;
      positionId?: string;
      companyId?: string;
    },
    user: { roleId: string; companyId?: string }
  ): Promise<any> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    // Si no es superadmin, asegurarse que solo vea cambios de su empresa
    if (!isSuperAdmin) {
      if (!user.companyId) {
        throw new AppError("No tienes una empresa asignada", 401);
      }
      filters.companyId = user.companyId;
    }

    try {
      const searchFilters: ScheduleChangeFilters = {
        ...filters,
        fromDate: startDate,
        toDate: endDate,
      };

      const changes =
        await this.scheduleChangeRepository.findScheduleChangesByFilters(
          searchFilters
        );

      // Agrupar por fecha
      const groupedByDate = changes.reduce((acc, change) => {
        const dateKey = change.changeDate.toISOString().split("T")[0];

        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }

        acc[dateKey].push({
          id: change.id,
          scheduleId: change.scheduleId,
          workplaceId: change.workplaceId,
          positionId: change.positionId,
          companyId: change.companyId,
          newCheckIn: change.newCheckIn,
          newCheckOut: change.newCheckOut,
          reason: change.reason,
        });

        return acc;
      }, {} as Record<string, any[]>);

      return groupedByDate;
    } catch (error: any) {
      throw new AppError(
        `Error al obtener resumen de cambios: ${error.message}`,
        500
      );
    }
  }

  /**
   * Recalcula el tipo de asistencia para los registros afectados por un cambio de horario.
   */
  private async recalculateAttendanceForChange(
    change: ScheduleChangeResponse
  ): Promise<void> {
    if (!change.scheduleId) {
      throw new AppError("El ID del horario no está definido", 400);
    }
    if (!change.changeDate) {
      throw new AppError("La fecha de cambio no está definida", 400);
    }
    if (!change.newCheckIn) {
      throw new AppError("La nueva hora de entrada no está definida", 400);
    }

    // Obtener los registros de asistencia afectados
    const affectedAttendances =
      await this.attendanceRepository.findAttendanceByDateAndSchedule(
        change.changeDate,
        change.scheduleId
      );

    // Preparar las actualizaciones en lote
    const updates = affectedAttendances.map((attendance) => {
      if (!attendance.checkIn) {
        throw new AppError(
          "La hora de entrada (checkIn) no está definida",
          400
        );
      }

      if (!attendance.id) {
        throw new AppError(
          "El ID del registro de asistencia no está definido",
          400
        );
      }

      // Obtener la hora real de entrada
      const actualCheckIn = attendance.checkIn;

      // Obtener el nuevo horario modificado
      const expectedCheckIn = change.newCheckIn;
      const expectedCheckOut = change.newCheckOut;

      // Validar si la hora de marcación está dentro del rango del nuevo horario
      const isPresent = this.isWithinRange(
        actualCheckIn,
        expectedCheckIn,
        expectedCheckOut
      );

      // Determinar el tipo de asistencia
      const updatedTypeAssistanceId = isPresent
        ? AsistentType.PRESENT
        : AsistentType.LATE;

      // Retornar la actualización
      return {
        id: attendance.id,
        typeAssistanceId: updatedTypeAssistanceId,
      };
    });

    // Actualizar todos los registros en lote
    await this.attendanceRepository.bulkUpdateReportAttendance(updates);
  }

  /**
   * Verifica si una hora está dentro de un rango específico.
   */
  private isWithinRange(
    checkTime: string,
    startTime: string,
    endTime: string
  ): boolean {
    return checkTime >= startTime && checkTime <= endTime;
  }
}
