// src/modules/scheduleException/application/scheduleExceptionService.ts
import { inject, injectable } from "tsyringe";
import {
  CreateScheduleExceptionDTO,
  ExceptionType,
  ScheduleExceptionFilters,
  ScheduleExceptionResponse,
  UpdateScheduleExceptionDTO,
} from "../types/scheduleException.types";
import { AppError } from "@/middleware/errors/AppError";
import { ScheduleExceptionRepository } from "../repository/scheduleException.repository";
import { ScheduleExceptionValidator } from "../validator/scheduleException.validator";
import { PermissionUtils } from "@/utils/helper/permissions.helper";
import { UserRepository } from "@/modules/users/repository/user.repository";
import { WorkplaceRepository } from "@/modules/workplace/repository/workplace.repository";
import { PositionRepository } from "@/modules/position/repository/position.repository";
import { AttendanceRepository } from "@/modules/attendance/repository/attendance.repository";
import { startOfDay } from "date-fns";
import { UserResponse } from "@/modules/users/types/user.types";
import { PermissionType } from "@/modules/attendance/types/attendance.types";

@injectable()
export class ScheduleExceptionService {
  constructor(
    @inject("ScheduleExceptionRepository")
    private scheduleExceptionRepository: ScheduleExceptionRepository,
    @inject("AttendanceRepository")
    private attendanceRepository: AttendanceRepository,
    @inject("PermissionUtils")
    private permissionUtils: PermissionUtils,
    @inject("UserRepository")
    private userRepository: UserRepository,
    @inject("WorkplaceRepository")
    private workplaceRepository: WorkplaceRepository,
    @inject("PositionRepository")
    private positionRepository: PositionRepository,
    @inject("ScheduleExceptionValidator")
    private validator: ScheduleExceptionValidator
  ) {}

  /**
   * Crea una nueva excepción de horario
   */
  async createScheduleException(
    data: CreateScheduleExceptionDTO,
    user: { userId: string; roleId: string; companyId?: string }
  ): Promise<ScheduleExceptionResponse> {
    try {
      // Verificar si el usuario es superadmin
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      // Validaciones según el tipo de excepción
      await this.validateExceptionData(data);

      // Validar fechas
      this.validateDates(data.startDate, data.endDate);

      const isDateRange =
        data.startDate &&
        data.endDate &&
        !this.isSameDay(data.startDate, data.endDate);

      // Validar horarios si no es día completo libre
      if (!data.isDayOff && !isDateRange) {
        if (!data.checkIn || !data.checkOut) {
          throw new AppError(
            "Las horas de entrada y salida son obligatorias cuando no es día completo libre.",
            400
          );
        }
        this.validator.validateTimeFormat(data.checkIn);
        this.validator.validateTimeFormat(data.checkOut);
        this.validator.validateCheckInCheckOut(data.checkIn, data.checkOut);
      }

      // Determinar ID de la entidad afectada y validar acceso
      let entityId: string;
      let companyIdFromEntity: string | undefined;

      switch (data.exceptionType) {
        case ExceptionType.INDIVIDUAL:
          entityId = data.userId!;
          if (!isSuperAdmin) {
            const userEntity = await this.userRepository.getUserById(entityId);
            if (!userEntity || userEntity.companyId !== user.companyId) {
              throw new AppError("El usuario no pertenece a tu compañía.", 403);
            }
            companyIdFromEntity = userEntity.companyId;
          }
          break;

        case ExceptionType.WORKPLACE:
          entityId = data.workplaceId!;
          if (!isSuperAdmin) {
            const workplace = await this.workplaceRepository.getWorkPlaceById(
              entityId
            );
            if (!workplace || workplace.companyId !== user.companyId) {
              throw new AppError(
                "El área de trabajo no pertenece a tu compañía.",
                403
              );
            }
            companyIdFromEntity = workplace.companyId;
          }
          break;

        case ExceptionType.POSITION:
          entityId = data.positionId!;
          if (!isSuperAdmin) {
            const position = await this.positionRepository.getPositionById(
              entityId
            );
            if (!position || position.companyId !== user.companyId) {
              throw new AppError("El cargo no pertenece a tu compañía.", 403);
            }
            companyIdFromEntity = position.companyId;
          }
          break;

        case ExceptionType.COMPANY:
          entityId = data.companyId!;
          if (!isSuperAdmin && entityId !== user.companyId) {
            throw new AppError(
              "No puedes crear excepciones para otra compañía.",
              403
            );
          }
          companyIdFromEntity = entityId;
          break;

        case ExceptionType.HOLIDAY:
          entityId = data.companyId!;
          if (!isSuperAdmin && entityId !== user.companyId) {
            throw new AppError(
              "No puedes crear feriados para otra compañía.",
              403
            );
          }
          companyIdFromEntity = entityId;
          break;

        default:
          throw new AppError("Tipo de excepción no válido.", 400);
      }

      // Usamos la companyId correcta (del usuario o de la entidad)
      const companyId = isSuperAdmin
        ? companyIdFromEntity ?? data.companyId
        : user.companyId;

      // Aseguramos que companyId esté definida
      if (!companyId)
        throw new AppError("No se pudo determinar la compañía asociada.", 400);

      // Sobreescribimos companyId en data
      data.companyId = companyId;

      // Verificar solapamientos
      const overlappingExceptions =
        await this.scheduleExceptionRepository.findOverlappingExceptions(
          data.exceptionType,
          entityId,
          data.startDate,
          data.endDate
        );

      if (overlappingExceptions.length > 0) {
        throw new AppError(
          "Ya existe una excepción para esta entidad en el período seleccionado.",
          400
        );
      }

      const { assistanceType, ...exceptionData } = data;

      const createdException =
        await this.scheduleExceptionRepository.createScheduleException(
          exceptionData
        );

      if (assistanceType) {
        // Verificar que el tipo de asistencia sea válido
        const validAssistanceTypes = Object.values(PermissionType);
        if (validAssistanceTypes.includes(assistanceType)) {
          await this.createDefaultAttendanceRecordsForException(
            data, // Pasamos los datos completos (incluye assistanceType)
            assistanceType
          );
          console.log("✅ Registros de asistencia creados exitosamente");
        } else {
          console.warn("⚠️ Tipo de asistencia no válido:", assistanceType);
          console.warn("Tipos válidos:", validAssistanceTypes);
        }
      } else {
        console.log(
          "ℹ️ No se crearon registros de asistencia (assistanceType no proporcionado)"
        );
      }

      return createdException;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error al crear excepción: ${error.message}`, 500);
    }
  }

  async createDefaultAttendanceRecordsForException(
    exception: CreateScheduleExceptionDTO,
    assistanceType: PermissionType
  ): Promise<void> {
    try {
      // Determinar el ID de la entidad target
      let targetId: string;
      switch (exception.exceptionType) {
        case ExceptionType.INDIVIDUAL:
          targetId = exception.userId!;
          break;
        case ExceptionType.WORKPLACE:
          targetId = exception.workplaceId!;
          break;
        case ExceptionType.POSITION:
          targetId = exception.positionId!;
          break;
        case ExceptionType.COMPANY:
        case ExceptionType.HOLIDAY:
          targetId = exception.companyId!;
          break;
        default:
          throw new Error(
            `Tipo de excepción no soportado: ${exception.exceptionType}`
          );
      }

      // Obtener usuarios afectados
      const usersAffected = await this.userRepository.findUsersByTarget(
        exception.exceptionType,
        targetId
      );

      // Procesar cada usuario
      for (const user of usersAffected) {
        let currentDate = new Date(exception.startDate);
        const endDate = new Date(exception.endDate ?? exception.startDate);

        while (currentDate <= endDate) {
          const dateForRecord = new Date(currentDate);

          // Verificar si ya existe un registro para esta fecha y usuario
          const existingRecord = await this.attendanceRepository.findAttendance(
            {
              userId: user.id,
              date: startOfDay(dateForRecord),
            }
          );

          if (!existingRecord) {
            // Crear nuevo registro
            const attendanceData = {
              userId: user.id,
              companyId: user.companyId,
              scheduleId: exception.scheduleId ?? null,
              checkIn: exception.isDayOff
                ? null
                : exception.checkIn?.trim() || null,
              checkOut: exception.isDayOff
                ? null
                : exception.checkOut?.trim() || null,
              typeAssistanceId: assistanceType,
              date: startOfDay(dateForRecord),
              description: exception.reason || "Ausencia programada",
              notes: `Generado automáticamente por excepción de horario`,
            };

            const typesWithoutCheckInOut: PermissionType[] = [
              PermissionType.VACATION,
              PermissionType.MEDICAL_LEAVE,
              PermissionType.JUSTIFIED_ABSENCE,
              PermissionType.INJUSTIFIED_ABSENCE,
            ];

            // Validación para días completos y por ausencia
            const isTypeWithoutCheckInOut = typesWithoutCheckInOut.includes(
              assistanceType as PermissionType
            );

            // Si no es día libre y el tipo sí requiere horas, valida que tenga checkIn o checkOut
            if (!exception.isDayOff && !isTypeWithoutCheckInOut) {
              if (!attendanceData.checkIn && !attendanceData.checkOut) {
                throw new AppError(
                  "El registro debe tener al menos checkIn o checkOut",
                  400
                );
              }
            }
            await this.attendanceRepository.createReportAttendance(
              attendanceData
            );
          } else {
            // Actualizar registro existente
            await this.attendanceRepository.updateReportAttendance(
              existingRecord.id,
              {
                typeAssistanceId: assistanceType,
                checkIn: exception.isDayOff ? null : exception.checkIn,
                checkOut: exception.isDayOff ? null : exception.checkOut,
                description: exception.reason || "Ausencia programada",
                notes: "Actualizado por excepción de horario",
              }
            );
          }

          // Avanzar al siguiente día
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    } catch (error: any) {
      throw new AppError(
        `Error al crear registros de asistencia: ${error.message}`,
        500
      );
    }
  }

  async findUsersByTarget(
    id: string,
    user: { userId: string; roleId: string; companyId?: string }
  ): Promise<{
    exception: ScheduleExceptionResponse;
    usersAffected: UserResponse[];
  }> {
    try {
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      const exception =
        await this.scheduleExceptionRepository.findScheduleExceptionById(id);
      if (!exception) {
        throw new AppError("La excepción de horario no existe.", 404);
      }

      let targetId: string;

      console.log("🚀 Tipo de excepción:", exception.exceptionType);

      switch (exception.exceptionType) {
        case ExceptionType.INDIVIDUAL:
          targetId = exception.userId!;
          break;
        case ExceptionType.WORKPLACE:
          targetId = exception.workplaceId!;
          break;
        case ExceptionType.POSITION:
          targetId = exception.positionId!;
          break;
        case ExceptionType.COMPANY:
        case ExceptionType.HOLIDAY:
          targetId = exception.companyId!;
          break;
        default:
          throw new AppError("Tipo de excepción no válido.", 400);
      }

      const usersAffected =
        await this.scheduleExceptionRepository.findUsersByTarget(
          exception.exceptionType,
          targetId,
          isSuperAdmin ? undefined : user.companyId
        );

      const usersMapped = usersAffected.map((user) => ({
        ...user,
        workplace: user.workplace || undefined,
        position: user.position || undefined,
        company: user.company || undefined,
      }));

      return {
        exception,
        usersAffected: usersMapped,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Error al buscar usuarios afectados: ${error.message}`,
        500
      );
    }
  }

  /**
   * Actualiza una excepción de horario existente
   */
  async updateScheduleException(
    data: UpdateScheduleExceptionDTO
  ): Promise<ScheduleExceptionResponse> {
    // Verificar que la excepción existe
    const existingException =
      await this.scheduleExceptionRepository.findScheduleExceptionById(data.id);

    if (!existingException) {
      throw new AppError("La excepción de horario no existe.", 404);
    }

    // Determinar el tipo de excepción actual
    const currentExceptionType = this.determineExceptionType(existingException);

    // Validar las entidades relacionadas según corresponda
    await this.validateUpdateExceptionData(data, existingException);

    // Validar fechas si se proporcionan
    if (data.startDate && data.endDate) {
      this.validateDates(data.startDate, data.endDate);
    } else if (data.startDate && !data.endDate) {
      this.validateDates(data.startDate, existingException.endDate);
    } else if (!data.startDate && data.endDate) {
      this.validateDates(existingException.startDate, data.endDate);
    }

    // Validar horarios si no es día completo libre
    const isDayOff =
      data.isDayOff !== undefined ? data.isDayOff : existingException.isDayOff;
    if (!isDayOff) {
      const checkIn = data.checkIn || existingException.checkIn;
      const checkOut = data.checkOut || existingException.checkOut;

      if (!checkIn || !checkOut) {
        throw new AppError(
          "Las horas de entrada y salida son obligatorias cuando no es día completo libre.",
          400
        );
      }

      this.validator.validateTimeFormat(checkIn);
      this.validator.validateTimeFormat(checkOut);
      this.validator.validateCheckInCheckOut(checkIn, checkOut);
    }

    // Verificar solapamientos con otras excepciones
    let entityId: string;
    let exceptionType: ExceptionType;

    if (data.userId !== undefined) {
      entityId = data.userId;
      exceptionType = ExceptionType.INDIVIDUAL;
    } else if (data.workplaceId !== undefined) {
      entityId = data.workplaceId;
      exceptionType = ExceptionType.WORKPLACE;
    } else if (data.positionId !== undefined) {
      entityId = data.positionId;
      exceptionType = ExceptionType.POSITION;
    } else if (data.companyId !== undefined) {
      entityId = data.companyId;
      exceptionType = ExceptionType.COMPANY;
    } else {
      // Si no se cambia la entidad, usar los valores existentes
      exceptionType = currentExceptionType;
      entityId = this.getEntityIdByType(
        existingException,
        currentExceptionType
      );
    }

    const startDate = data.startDate || existingException.startDate;
    const endDate = data.endDate || existingException.endDate;

    const overlappingExceptions =
      await this.scheduleExceptionRepository.findOverlappingExceptions(
        exceptionType,
        entityId,
        startDate,
        endDate,
        data.id // Excluir la excepción actual
      );

    if (overlappingExceptions.length > 0) {
      throw new AppError(
        "Ya existe una excepción para esta entidad en el período seleccionado.",
        400
      );
    }

    // Actualizar la excepción
    return this.scheduleExceptionRepository.updateScheduleException(
      data.id,
      data
    );
  }

  /**
   * Elimina lógicamente una excepción de horario
   */
  async deleteScheduleException(id: string): Promise<void> {
    // Verificar que la excepción existe
    const exception =
      await this.scheduleExceptionRepository.findScheduleExceptionById(id);
    if (!exception) {
      throw new AppError("La excepción de horario no existe.", 404);
    }

    await this.scheduleExceptionRepository.deleteScheduleException(id);
  }

  /**
   * Busca una excepción de horario por su ID
   */
  async findScheduleExceptionById(
    id: string
  ): Promise<ScheduleExceptionResponse> {
    const exception =
      await this.scheduleExceptionRepository.findScheduleExceptionById(id);
    if (!exception) {
      throw new AppError("La excepción de horario no existe.", 404);
    }
    return exception;
  }

  /**
   * Busca excepciones de horario según filtros
   */
  async findScheduleExceptions(
    filters: ScheduleExceptionFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: ScheduleExceptionResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.scheduleExceptionRepository.findScheduleExceptions(
      filters,
      page,
      limit
    );
  }

  /**
   * Busca una excepción de horario para una fecha específica
   */
  async findScheduleExceptionByDate(
    date: Date | string,
    userId?: string,
    scheduleId?: string,
    workplaceId?: string,
    positionId?: string,
    companyId?: string | null
  ): Promise<ScheduleExceptionResponse | null> {
    return this.scheduleExceptionRepository.findScheduleExceptionByDate(
      date,
      userId,
      scheduleId,
      workplaceId,
      positionId,
      companyId
    );
  }

  /**
   * Crea una excepción de horario para un feriado
   */
  async createHolidayException(
    user: { userId: string; roleId: string; companyId?: string },
    date: Date,
    description: string,
    isDayOff: boolean = true,
    companyId?: string,
    checkIn?: string,
    checkOut?: string
  ): Promise<ScheduleExceptionResponse> {
    // Crear un objeto de excepción para el feriado
    const holidayData: CreateScheduleExceptionDTO = {
      startDate: date,
      endDate: date, // Los feriados típicamente son de un día
      isDayOff,
      reason: `Feriado: ${description}`,
      exceptionType: ExceptionType.HOLIDAY,
      companyId, // Puede ser nulo para feriados nacionales
      checkIn,
      checkOut,
    };

    // Utilizar el método existente para crear la excepción
    return this.createScheduleException(holidayData, user);
  }

  /**
   * Verifica si una fecha dada es un feriado
   */
  async isHoliday(date: Date, companyId?: string): Promise<boolean> {
    // Convertir la fecha a formato ISO string para la comparación
    const formattedDate = date.toISOString().split("T")[0];

    // Buscar excepciones de tipo HOLIDAY para esta fecha
    const filters: ScheduleExceptionFilters = {
      startDateFrom: new Date(formattedDate),
      startDateTo: new Date(formattedDate),
      companyId,
    };

    const { data } = await this.findScheduleExceptions(filters);

    // Filtrar solo las excepciones de tipo HOLIDAY
    const holidays = data.filter((exception) =>
      // Asumimos que las excepciones de tipo feriado tienen razones que comienzan con "Feriado:"
      exception.reason.startsWith("Feriado:")
    );

    return holidays.length > 0;
  }

  /**
   * Obtiene todos los feriados en un rango de fechas
   */
  async getHolidays(
    startDate: Date,
    endDate: Date,
    companyId?: string
  ): Promise<ScheduleExceptionResponse[]> {
    const filters: ScheduleExceptionFilters = {
      startDateFrom: startDate,
      endDateTo: endDate,
      companyId,
    };

    const { data } = await this.findScheduleExceptions(filters);

    // Filtrar solo las excepciones de tipo HOLIDAY
    return data.filter((exception) => exception.reason.startsWith("Feriado:"));
  }

  /**
   * Importa feriados desde un archivo CSV o JSON
   */
  async importHolidays(
    user: { userId: string; roleId: string; companyId?: string },
    holidays: Array<{
      date: Date;
      description: string;
      isDayOff?: boolean;
      companyId?: string;
    }>
  ): Promise<void> {
    for (const holiday of holidays) {
      await this.createHolidayException(
        user,
        holiday.date,
        holiday.description,
        holiday.isDayOff !== undefined ? holiday.isDayOff : true
      );
    }
  }

  /**
   * Verifica si hay excepciones solapadas
   */
  async checkOverlappingExceptions(
    exceptionType: ExceptionType,
    entityId: string,
    startDate: Date,
    endDate: Date,
    excludeExceptionId?: string
  ): Promise<ScheduleExceptionResponse[]> {
    return this.scheduleExceptionRepository.findOverlappingExceptions(
      exceptionType,
      entityId,
      startDate,
      endDate,
      excludeExceptionId
    );
  }

  // Métodos auxiliares privados

  /**
   * Valida los datos de una excepción según su tipo
   */
  private async validateExceptionData(
    data: CreateScheduleExceptionDTO
  ): Promise<void> {
    switch (data.exceptionType) {
      case ExceptionType.INDIVIDUAL:
        if (!data.userId) {
          throw new AppError(
            "El ID de usuario es obligatorio para excepciones individuales.",
            400
          );
        }
        await this.validator.validateUserExists(data.userId);
        break;
      case ExceptionType.WORKPLACE:
        if (!data.workplaceId) {
          throw new AppError(
            "El ID de área de trabajo es obligatorio para excepciones de área.",
            400
          );
        }
        await this.validator.validateWorkplaceExists(data.workplaceId);
        break;
      case ExceptionType.POSITION:
        if (!data.positionId) {
          throw new AppError(
            "El ID de cargo es obligatorio para excepciones de cargo.",
            400
          );
        }
        await this.validator.validatePositionExists(data.positionId);
        break;
      case ExceptionType.COMPANY:
        if (!data.companyId) {
          throw new AppError(
            "El ID de compañía es obligatorio para excepciones de compañía.",
            400
          );
        }
        await this.validator.validateCompanyExists(data.companyId);
        break;

      case ExceptionType.HOLIDAY:
        // Para feriados, no necesitamos validaciones adicionales específicas
        // excepto verificar que la razón comience con "Feriado:"
        if (!data.reason.startsWith("Feriado:")) {
          data.reason = `Feriado: ${data.reason}`;
        }

        // Si se proporciona un ID de compañía, validarlo
        if (data.companyId) {
          await this.validator.validateCompanyExists(data.companyId);
        }
        break;
      default:
        throw new AppError("Tipo de excepción no válido.", 400);
    }

    // Validar que el horario exista (si se proporciona)
    if (data.scheduleId) {
      await this.validator.validateScheduleExists(data.scheduleId);
    }
  }

  /**
   * Valida los datos para actualización
   */
  private async validateUpdateExceptionData(
    data: UpdateScheduleExceptionDTO,
    existingException: ScheduleExceptionResponse
  ): Promise<void> {
    // Validar entidades si se proporcionan
    if (data.userId) {
      await this.validator.validateUserExists(data.userId);
    }
    if (data.workplaceId) {
      await this.validator.validateWorkplaceExists(data.workplaceId);
    }
    if (data.positionId) {
      await this.validator.validatePositionExists(data.positionId);
    }
    if (data.companyId) {
      await this.validator.validateCompanyExists(data.companyId);
    }
    if (data.scheduleId) {
      await this.validator.validateScheduleExists(data.scheduleId);
    }
  }

  /**
   * Valida las fechas de inicio y fin
   */
  private validateDates(startDate: Date, endDate: Date): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError("Las fechas proporcionadas no son válidas.", 400);
    }

    if (start > end) {
      throw new AppError(
        "La fecha de inicio debe ser anterior o igual a la fecha de fin.",
        400
      );
    }
  }

  /**
   * Determina el tipo de excepción basado en los campos existentes
   */
  private determineExceptionType(
    exception: ScheduleExceptionResponse
  ): ExceptionType {
    if (exception.userId) return ExceptionType.INDIVIDUAL;
    if (exception.workplaceId) return ExceptionType.WORKPLACE;
    if (exception.positionId) return ExceptionType.POSITION;
    if (exception.companyId) return ExceptionType.COMPANY;
    throw new AppError("No se pudo determinar el tipo de excepción.", 500);
  }

  /**
   * Obtiene el ID de la entidad según el tipo de excepción
   */
  private getEntityIdByType(
    exception: ScheduleExceptionResponse,
    type: ExceptionType
  ): string {
    switch (type) {
      case ExceptionType.INDIVIDUAL:
        return exception.userId!;
      case ExceptionType.WORKPLACE:
        return exception.workplaceId!;
      case ExceptionType.POSITION:
        return exception.positionId!;
      case ExceptionType.COMPANY:
        return exception.companyId!;
      default:
        throw new AppError("Tipo de excepción no válido.", 400);
    }
  }

  private isSameDay(date1: Date | string, date2: Date | string): boolean {
    // Convertir a Date si son strings
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }
}
