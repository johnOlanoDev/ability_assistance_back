// src/modules/scheduleException/application/scheduleExceptionService.ts

import { injectable, inject } from "tsyringe";
import {
  CreateScheduleExceptionDTO,
  ScheduleExceptionFilters,
  ScheduleExceptionResponse,
  UpdateScheduleExceptionDTO,
} from "../types/scheduleException.types";
import { PermissionUtils } from "@/utils/helper/permissions.helper";
import { AppError } from "@/middleware/errors/AppError";
import { ScheduleValidator } from "@/modules/schedule/Schedule/validator/schedule.validator";
import { ScheduleExceptionRepository } from "../repository/scheduleException.repository";
import { UserRepository } from "@/modules/users/repository/user.repository";
import { CompanyRepository } from "@/modules/companies/repository/company.repository";

// Lista de feriados nacionales de Perú
interface Holiday {
  date: string; // Formato MM-DD (sin año)
  description: string;
  isRecurring: boolean; // Si se repite todos los años
  specificYear?: number; // Para feriados de un año específico
}

@injectable()
export class ScheduleExceptionService {
  // Lista de feriados nacionales de Perú
  private peruvianHolidays: Holiday[] = [
    { date: "01-01", description: "Año Nuevo", isRecurring: true },
    { date: "04-18", description: "Jueves Santo", isRecurring: true }, // Fecha aproximada, varía cada año
    { date: "04-19", description: "Viernes Santo", isRecurring: true }, // Fecha aproximada, varía cada año
    { date: "05-01", description: "Día del Trabajo", isRecurring: true },
    { date: "06-29", description: "San Pedro y San Pablo", isRecurring: true },
    { date: "07-28", description: "Fiestas Patrias", isRecurring: true },
    { date: "07-29", description: "Fiestas Patrias", isRecurring: true },
    { date: "08-30", description: "Santa Rosa de Lima", isRecurring: true },
    { date: "10-08", description: "Combate de Angamos", isRecurring: true },
    { date: "11-01", description: "Todos los Santos", isRecurring: true },
    { date: "12-08", description: "Inmaculada Concepción", isRecurring: true },
    { date: "12-25", description: "Navidad", isRecurring: true },
    // Puedes agregar más feriados específicos con años
  ];

  constructor(
    @inject("ScheduleExceptionRepository")
    private scheduleExceptionRepository: ScheduleExceptionRepository,
    @inject("ScheduleValidator")
    private scheduleValidator: ScheduleValidator,
    @inject("UserRepository")
    private userRepository: UserRepository,
    @inject("CompanyRepository")
    private companyRepository: CompanyRepository,
    @inject("PermissionUtils")
    private permissionUtils: PermissionUtils
  ) {}

  /**
   * Crear una nueva excepción de horario
   */
  async createScheduleException(
    exceptionData: CreateScheduleExceptionDTO,
    user: { userId: string; roleId: string; companyId?: string }
  ): Promise<ScheduleExceptionResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    let companyId = isSuperAdmin ? undefined : user.companyId;

    // 👉 Validaciones sólo si NO es SuperAdmin
    if (!isSuperAdmin) {
      // Validamos si la excepción aplica a un schedule específico
      if (exceptionData.scheduleId) {
        await this.scheduleValidator.validateScheduleExists(
          user,
          exceptionData.workplaceId || undefined,
          exceptionData.positionId || undefined
        );
      }

      // Validamos si la excepción aplica a un workplace
      if (exceptionData.workplaceId) {
        await Promise.all([
          this.scheduleValidator.validateWorkplaceExists(
            user,
            exceptionData.workplaceId
          ),
          this.scheduleValidator.validateWorkplaceActive(
            user,
            exceptionData.workplaceId
          ),
          this.scheduleValidator.validateWorkplaceAndPositionBelongToCompany(
            user,
            exceptionData.workplaceId,
            companyId
          ),
        ]);
      }

      // Validamos si la excepción aplica a un position
      if (exceptionData.positionId) {
        await Promise.all([
          this.scheduleValidator.validatePositionExists(
            user,
            exceptionData.positionId
          ),
          this.scheduleValidator.validatePositionActive(
            user,
            exceptionData.positionId
          ),
          this.scheduleValidator.validatePositionBelongsToCompany(
            user,
            exceptionData.positionId,
            companyId
          ),
        ]);
      }

      // Validamos si la excepción aplica a un usuario específico
      if (exceptionData.userId) {
        const userExists = await this.userRepository.getUserById(
          exceptionData.userId
        );
        if (!userExists) {
          throw new AppError("El usuario no existe", 404);
        }

        // Validar que el usuario pertenece a la misma empresa
        if (userExists.companyId !== companyId) {
          throw new AppError("El usuario no pertenece a tu empresa", 400);
        }
      }
    }

    try {
      // Verificar si ya existe una excepción para la misma entidad en la misma fecha
      const existingException =
        await this.scheduleExceptionRepository.findScheduleExceptionByDate(
          exceptionData.date,
          exceptionData.userId || undefined,
          exceptionData.scheduleId || undefined,
          exceptionData.workplaceId || undefined,
          exceptionData.positionId || undefined,
          companyId
        );

      if (existingException) {
        throw new AppError(
          "Ya existe una excepción para esta fecha y entidad",
          400
        );
      }

      const exceptionToCreate = {
        ...exceptionData,
        companyId: companyId || undefined,
        date: new Date(exceptionData.date),
        checkIn: exceptionData.checkIn,
        checkOut: exceptionData.checkOut,
        isDayOff: exceptionData.isDayOff ?? false,
      };

      const newException =
        await this.scheduleExceptionRepository.createScheduleException(
          exceptionToCreate
        );

      if (!newException) {
        throw new AppError("Error al crear la excepción de horario", 500);
      }

      return newException;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Error al crear la excepción de horario: ${error.message}`,
        500
      );
    }
  }

  /**
   * Actualizar una excepción de horario existente
   */
  async updateScheduleException(
    id: string,
    exceptionData: UpdateScheduleExceptionDTO,
    user: { roleId: string; companyId?: string }
  ): Promise<ScheduleExceptionResponse> {
    const existingException =
      await this.scheduleExceptionRepository.findScheduleExceptionById(id);
    if (!existingException) {
      throw new AppError("Excepción de horario no encontrada", 404);
    }

    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    let companyId: string | undefined = undefined;

    if (isSuperAdmin) {
      companyId =
        exceptionData.companyId || existingException.companyId || undefined;
    } else {
      if (!user.companyId) {
        throw new AppError("No tienes una empresa asignada", 401);
      }
      companyId = user.companyId;

      // Verificar que la excepción pertenece a la empresa del usuario
      if (
        existingException.companyId &&
        existingException.companyId !== companyId
      ) {
        throw new AppError(
          "No tienes permiso para actualizar esta excepción",
          403
        );
      }
    }

    try {
      const updatedData: UpdateScheduleExceptionDTO = {
        ...exceptionData,
      };

      if (exceptionData.date) {
        updatedData.date = new Date(exceptionData.date);
      }

      if (exceptionData.checkIn !== undefined) {
        updatedData.checkIn = exceptionData.checkIn;
      }

      if (exceptionData.checkOut !== undefined) {
        updatedData.checkOut = exceptionData.checkOut;
      }

      const updatedException =
        await this.scheduleExceptionRepository.updateScheduleException(
          id,
          updatedData
        );

      return updatedException;
    } catch (error: any) {
      throw new AppError(
        `Error al actualizar la excepción: ${error.message}`,
        500
      );
    }
  }

  /**
   * Eliminar una excepción de horario
   */
  async deleteScheduleException(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<boolean> {
    const existingException =
      await this.scheduleExceptionRepository.findScheduleExceptionById(id);
    if (!existingException) {
      throw new AppError("Excepción de horario no encontrada", 404);
    }

    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    if (!isSuperAdmin && existingException.companyId !== user.companyId) {
      throw new AppError("No tienes permiso para eliminar esta excepción", 403);
    }

    try {
      return await this.scheduleExceptionRepository.deleteScheduleException(id);
    } catch (error: any) {
      throw new AppError(
        `Error al eliminar la excepción: ${error.message}`,
        500
      );
    }
  }

  /**
   * Obtener una excepción de horario por su ID
   */
  async getScheduleExceptionById(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<ScheduleExceptionResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    const exception =
      await this.scheduleExceptionRepository.findScheduleExceptionById(id);
    if (!exception) {
      throw new AppError("Excepción de horario no encontrada", 404);
    }

    // Si no es superadmin, verificar que la excepción pertenece a su empresa
    if (
      !isSuperAdmin &&
      exception.companyId &&
      exception.companyId !== user.companyId
    ) {
      throw new AppError("No tienes permiso para ver esta excepción", 403);
    }

    return exception;
  }

  /**
   * Obtener excepciones de horario según filtros
   */
  async getScheduleExceptions(
    filters: ScheduleExceptionFilters,
    user: { roleId: string; companyId?: string }
  ): Promise<{ exceptions: ScheduleExceptionResponse[]; total: number }> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    // Si no es superadmin, asegurarse que solo vea excepciones de su empresa
    if (!isSuperAdmin) {
      if (!user.companyId) {
        throw new AppError("No tienes una empresa asignada", 401);
      }
      filters.companyId = user.companyId;
    }

    const exceptions =
      await this.scheduleExceptionRepository.findScheduleExceptionsByFilters(
        filters
      );
    const total =
      await this.scheduleExceptionRepository.countScheduleExceptions(filters);

    return { exceptions, total };
  }

  /**
   * Configurar automáticamente los feriados nacionales para un año específico
   */
  async configureNationalHolidays(
    year: number,
    user: { roleId: string; companyId?: string },
    companyId?: string
  ): Promise<{ created: number; skipped: number }> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    // Validar permisos
    if (!isSuperAdmin && !user.companyId) {
      throw new AppError("No tienes permiso para configurar feriados", 403);
    }

    let created = 0;
    let skipped = 0;

    try {
      // Procesar cada feriado
      for (const holiday of this.peruvianHolidays) {
        // Saltear si es un feriado de año específico que no corresponde
        if (!holiday.isRecurring && holiday.specificYear !== year) {
          continue;
        }

        // Fecha del feriado para el año especificado
        const [month, day] = holiday.date.split("-");
        const holidayDate = new Date(year, parseInt(month) - 1, parseInt(day));

        // Determinar el nivel y entidad automáticamente
        let companyId = undefined;
        let workplaceId = undefined;
        let positionId = undefined;
        let scheduleId = undefined;
        let userId = undefined;

        if (isSuperAdmin) {
          // Si es superadmin, puede crear feriados globales o por empresa
          companyId = user.companyId || undefined;
        } else {
          // Si no es superadmin, verifica el nivel más bajo posible
          const userRecord = await this.userRepository.getUserById(
            user.companyId || ""
          );
          if (userRecord) {
            companyId = userRecord.companyId;
            workplaceId = userRecord.workplaceId || undefined;
            positionId = userRecord.positionId || undefined;
          }
        }

        // Verificar si ya existe una excepción para esta fecha y nivel
        const existingException =
          await this.scheduleExceptionRepository.findScheduleExceptionByDate(
            holidayDate,
            userId,
            scheduleId,
            workplaceId,
            positionId,
            companyId
          );

        if (existingException) {
          skipped++;
          continue;
        }

        // Crear la excepción para el feriado
        await this.scheduleExceptionRepository.createScheduleException({
          companyId: companyId,
          workplaceId: workplaceId,
          positionId: positionId,
          scheduleId: scheduleId,
          userId: userId,
          date: holidayDate,
          isDayOff: true,
          reason: `Feriado Nacional: ${holiday.description}`,
        });

        created++;
      }

      return { created, skipped };
    } catch (error: any) {
      throw new AppError(
        `Error al configurar feriados nacionales: ${error.message}`,
        500
      );
    }
  }

  /**
   * Verificar si una fecha es un día no laborable (excepción)
   * Verifica en todos los niveles aplicables
   */
  async isDateDayOff(
    date: Date | string,
    userId: string,
    scheduleId?: string
  ): Promise<{ isDayOff: boolean; reason?: string }> {
    const dateObj = new Date(date);
    const user = await this.userRepository.getUserById(userId);

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    const companyId = user.companyId;
    const workplaceId = user.workplaceId;
    const positionId = user.positionId;

    // Prioridad de verificación:
    // 1. Excepción específica para el usuario
    const userException =
      await this.scheduleExceptionRepository.findScheduleExceptionByDate(
        dateObj,
        userId
      );

    if (userException?.isDayOff) {
      return { isDayOff: true, reason: userException.reason };
    }

    // 2. Excepción para el horario específico
    if (scheduleId) {
      const scheduleException =
        await this.scheduleExceptionRepository.findScheduleExceptionByDate(
          dateObj,
          undefined,
          scheduleId
        );

      if (scheduleException?.isDayOff) {
        return { isDayOff: true, reason: scheduleException.reason };
      }
    }

    // 3. Excepción para la posición
    if (positionId) {
      const positionException =
        await this.scheduleExceptionRepository.findScheduleExceptionByDate(
          dateObj,
          undefined,
          undefined,
          undefined,
          positionId
        );

      if (positionException?.isDayOff) {
        return { isDayOff: true, reason: positionException.reason };
      }
    }

    // 4. Excepción para el área/workplace
    if (workplaceId) {
      const workplaceException =
        await this.scheduleExceptionRepository.findScheduleExceptionByDate(
          dateObj,
          undefined,
          undefined,
          workplaceId
        );

      if (workplaceException?.isDayOff) {
        return { isDayOff: true, reason: workplaceException.reason };
      }
    }

    // 5. Excepción para la empresa
    if (companyId) {
      const companyException =
        await this.scheduleExceptionRepository.findScheduleExceptionByDate(
          dateObj,
          undefined,
          undefined,
          undefined,
          undefined,
          companyId
        );

      if (companyException?.isDayOff) {
        return { isDayOff: true, reason: companyException.reason };
      }
    }

    // No es un día no laborable
    return { isDayOff: false };
  }

  /**
   * Obtener el horario efectivo para un usuario en una fecha específica
   * considerando excepciones
   */
  async getEffectiveScheduleForDate(
    userId: string,
    date: Date | string,
    scheduleId: string
  ): Promise<{
    checkIn: string | null | undefined;
    checkOut: string | null | undefined;
    isDayOff: boolean;
    reason?: string;
  }> {
    const dateObj = new Date(date);

    // Primero verificar si es día no laborable
    const dayOffCheck = await this.isDateDayOff(dateObj, userId, scheduleId);
    if (dayOffCheck.isDayOff) {
      return {
        checkIn: null,
        checkOut: null,
        isDayOff: true,
        reason: dayOffCheck.reason,
      };
    }

    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    const companyId = user.companyId;
    const workplaceId = user.workplaceId;
    const positionId = user.positionId;

    // Prioridad para horarios modificados:
    // 1. Excepción específica para el usuario
    const userException =
      await this.scheduleExceptionRepository.findScheduleExceptionByDate(
        dateObj,
        userId
      );

    if (userException && (userException.checkIn || userException.checkOut)) {
      return {
        checkIn: userException.checkIn,
        checkOut: userException.checkOut,
        isDayOff: userException.isDayOff,
        reason: userException.reason,
      };
    }

    // 2. Excepción para el horario específico
    const scheduleException =
      await this.scheduleExceptionRepository.findScheduleExceptionByDate(
        dateObj,
        undefined,
        scheduleId
      );

    if (
      scheduleException &&
      (scheduleException.checkIn || scheduleException.checkOut)
    ) {
      return {
        checkIn: scheduleException.checkIn,
        checkOut: scheduleException.checkOut,
        isDayOff: scheduleException.isDayOff,
        reason: scheduleException.reason,
      };
    }

    // 3. Excepción para la posición
    if (positionId) {
      const positionException =
        await this.scheduleExceptionRepository.findScheduleExceptionByDate(
          dateObj,
          undefined,
          undefined,
          undefined,
          positionId
        );

      if (
        positionException &&
        (positionException.checkIn || positionException.checkOut)
      ) {
        return {
          checkIn: positionException.checkIn,
          checkOut: positionException.checkOut,
          isDayOff: positionException.isDayOff,
          reason: positionException.reason,
        };
      }
    }

    // 4. Excepción para el área/workplace
    if (workplaceId) {
      const workplaceException =
        await this.scheduleExceptionRepository.findScheduleExceptionByDate(
          dateObj,
          undefined,
          undefined,
          workplaceId
        );

      if (
        workplaceException &&
        (workplaceException.checkIn || workplaceException.checkOut)
      ) {
        return {
          checkIn: workplaceException.checkIn,
          checkOut: workplaceException.checkOut,
          isDayOff: workplaceException.isDayOff,
          reason: workplaceException.reason,
        };
      }
    }

    // 5. Excepción para la empresa
    if (companyId) {
      const companyException =
        await this.scheduleExceptionRepository.findScheduleExceptionByDate(
          dateObj,
          undefined,
          undefined,
          undefined,
          undefined,
          companyId
        );

      if (
        companyException &&
        (companyException.checkIn || companyException.checkOut)
      ) {
        return {
          checkIn: companyException.checkIn,
          checkOut: companyException.checkOut,
          isDayOff: companyException.isDayOff,
          reason: companyException.reason,
        };
      }
    }

    // Si no hay excepciones, devolvemos null para indicar que se use el horario normal
    return { checkIn: null, checkOut: null, isDayOff: false };
  }
}
