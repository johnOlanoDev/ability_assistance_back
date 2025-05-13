import { injectable } from "tsyringe";
import { PermissionUtils } from "@/utils/helper/permissions.helper";
import { ScheduleRepository } from "../repository/schedule.repository";
import { inject } from "tsyringe";
import {
  CreateScheduleDTO,
  ScheduleResponse,
  UpdateScheduleDTO,
} from "../types/schedule.types";
import { AppError } from "@/middleware/errors/AppError";
import { ScheduleRangeRepository } from "../../scheduleRange/repository/scheduleRange.repository";
import { ScheduleValidator } from "../validator/schedule.validator";
import { transformScheduleRanges } from "../repository/schedule.repository";
import { UserRepository } from "@/modules/users/repository/user.repository";

@injectable()
export class ScheduleService {
  constructor(
    @inject("ScheduleRepository")
    private scheduleRepository: ScheduleRepository,
    @inject("UserRepository")
    private userRepository: UserRepository,
    @inject("PermissionUtils") private permissionUtils: PermissionUtils,
    @inject("ScheduleRangeRepository")
    private scheduleRangeRepository: ScheduleRangeRepository,
    @inject("ScheduleValidator") private scheduleValidator: ScheduleValidator
  ) {}

  getAllSchedules = async (user: {
    roleId: string;
    companyId?: string;
    userId: string;
  }) => {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const isAdmin = await this.permissionUtils.isAdmin(user.roleId);

    let companyId, workplaceId, positionId;

    if (isSuperAdmin) {
      // Superadmin ve todos los horarios
      companyId = undefined;
      workplaceId = undefined;
      positionId = undefined;
    } else if (isAdmin) {
      // Administrador ve todos los horarios de su empresa
      companyId = user.companyId;
      workplaceId = undefined; // No filtrar por área
      positionId = undefined; // No filtrar por cargo
    } else {
      // Usuario normal ve solo sus horarios
      const userData = await this.userRepository.getUserAreaAndPosition(
        user.userId
      );
      companyId = user.companyId;
      workplaceId = userData.workplaceId;
      positionId = userData.positionId;
    }

    const data = await this.scheduleRepository.getAllSchedules(
      companyId,
      workplaceId || undefined,
      positionId || undefined
    );
    return data;
  };

  getScheduleById = async (
    id: string,
    user: { roleId: string; companyId?: string }
  ) => {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    const data = await this.scheduleRepository.getScheduleById(id, companyId);

    return data;
  };

  // Función para convertir una hora en formato HH:mm:ss a un objeto Date
  parseTimeStringToDate = (timeString: string): Date => {
    if (!timeString) throw new Error("Hora inválida");

    // Extraer horas, minutos y segundos
    const [hours, minutes, seconds] = timeString.split(":").map(Number);

    // Crear un objeto Date con la fecha actual y la hora especificada
    return new Date(1970, 0, 1, hours, minutes, seconds || 0);
  };

  // Función para convertir una hora en formato ISO (HH:mm:ss)
  convertTimeToISO = (time: string): string => {
    if (!time || typeof time !== "string") {
      throw new Error(`Valor de hora inválido: ${time}`);
    }

    // Convertir la cadena en un objeto Date
    const date = this.parseTimeStringToDate(time);

    // Formatear como ISO (HH:mm:ss)
    const isoTime = `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
    return isoTime;
  };

  // Crear un nuevo horario
  async createSchedule(
    scheduleData: CreateScheduleDTO,
    user: { roleId: string; companyId?: string }
  ): Promise<ScheduleResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? scheduleData.companyId : user.companyId;

    // 👉 Validaciones sólo si NO es SuperAdmin
    if (!isSuperAdmin) {
      await Promise.all([
        this.scheduleValidator.validateCompanyExists(user, companyId),
        this.scheduleValidator.validateWorkplaceExists(
          user,
          scheduleData.workplaceId ?? undefined
        ),
        this.scheduleValidator.validatePositionExists(
          user,
          scheduleData.positionId ?? undefined
        ),
        this.scheduleValidator.validateCompanyActive(user, companyId),
        this.scheduleValidator.validateWorkplaceActive(
          user,
          scheduleData.workplaceId ?? undefined
        ),
        this.scheduleValidator.validatePositionActive(
          user,
          scheduleData.positionId ?? undefined
        ),
        this.scheduleValidator.validateScheduleExists(
          user,
          scheduleData.workplaceId ?? undefined,
          scheduleData.positionId
        ),
        this.scheduleValidator.validateWorkplaceAndPositionBelongToCompany(
          user,
          scheduleData.workplaceId ?? undefined,
          scheduleData.positionId,
          companyId
        ),
      ]);
    }

    try {
      const scheduleToCreate = {
        ...scheduleData,
        companyId: companyId,
        scheduleRanges:
          scheduleData.scheduleRanges?.map((range) => ({
            startDay: range.startDay,
            endDay: range.endDay,
            checkIn: this.convertTimeToISO(range.checkIn),
            checkOut: this.convertTimeToISO(range.checkOut),
            isNightShift: !!range.isNightShift,
          })) || [],
      };

      const newSchedule = await this.scheduleRepository.createSchedule(
        scheduleToCreate
      );

      if (!newSchedule) {
        throw new AppError("Error al crear el horario.", 500);
      }

      return newSchedule;
    } catch (error: any) {
      throw new AppError(`Error al crear el horario: ${error.message}`, 500);
    }
  }

  // Actualizar un horario existente
  async updateSchedule(
    id: string,
    scheduleData: UpdateScheduleDTO,
    user: { roleId: string; companyId?: string }
  ): Promise<ScheduleResponse> {
    const existingSchedule = await this.scheduleRepository.findScheduleById(id);
    if (!existingSchedule) {
      throw new AppError("Horario no encontrado", 404);
    }

    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    let companyId: string | undefined = undefined;

    if (isSuperAdmin) {
      companyId = scheduleData.companyId;
    } else {
      if (!user.companyId) {
        throw new AppError("No tienes una empresa asignada", 401);
      }
      companyId = user.companyId;
    }

    // 👉 Validaciones sólo si NO es SuperAdmin
    if (!isSuperAdmin) {
      await Promise.all([
        this.scheduleValidator.validateCompanyExists(user, companyId),
        this.scheduleValidator.validateWorkplaceExists(
          user,
          scheduleData.workplaceId ?? undefined
        ),
        this.scheduleValidator.validatePositionExists(
          user,
          scheduleData.positionId ?? undefined
        ),
        this.scheduleValidator.validateCompanyActive(user, companyId),
        this.scheduleValidator.validateWorkplaceActive(
          user,
          scheduleData.workplaceId ?? undefined
        ),
        this.scheduleValidator.validatePositionActive(
          user,
          scheduleData.positionId ?? undefined
        ),
        this.scheduleValidator.validateWorkplaceAndPositionBelongToCompany(
          user,
          scheduleData.workplaceId ?? undefined,
          scheduleData.positionId,
          companyId
        ),
      ]);
    }

    const updatedSchedule = await this.scheduleRepository.updateSchedule(
      id,
      {
        name: scheduleData.name,
        workplaceId: scheduleData.workplaceId,
        positionId: scheduleData.positionId,
      },
      companyId
    );

    if (!updatedSchedule.id) {
      throw new AppError("Error al actualizar el horario", 500);
    }

    // Eliminar rangos antiguos
    await this.scheduleRangeRepository.deleteScheduleRangesByScheduleId(
      updatedSchedule.id
    );

    // Procesar nuevos rangos
    if (scheduleData.scheduleRanges?.length) {
      try {
        const uniqueRanges = new Set();
        const rangesToCreate = [];

        for (const range of scheduleData.scheduleRanges) {
          if (!range.checkIn || !range.checkOut) {
            throw new Error("Los campos checkIn y checkOut son obligatorios");
          }

          if (
            typeof range.checkIn !== "string" ||
            typeof range.checkOut !== "string"
          ) {
            throw new Error("Los campos checkIn y checkOut deben ser cadenas");
          }

          const uniqueKey = `${range.startDay}_${range.endDay}_${range.checkIn}_${range.checkOut}`;

          if (!uniqueRanges.has(uniqueKey)) {
            uniqueRanges.add(uniqueKey);
            rangesToCreate.push({
              scheduleId: updatedSchedule.id!,
              startDay: range.startDay,
              endDay: range.endDay,
              checkIn: this.convertTimeToISO(range.checkIn),
              checkOut: this.convertTimeToISO(range.checkOut),
              isNightShift: !!range.isNightShift,
            });
          }
        }

        await this.scheduleRangeRepository.bulkCreateScheduleRanges(
          rangesToCreate
        );
      } catch (error: any) {
        throw new AppError(
          `Error al crear los rangos de horario: ${error.message}`,
          500
        );
      }
    }

    return updatedSchedule;
  }

  async deleteSchedule(
    id: string,
    user: { roleId: string; companyId?: string }
  ) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const existingSchedule = isSuperAdmin
      ? await this.scheduleRepository.getScheduleById(id)
      : await this.scheduleRepository.getScheduleById(id, user.companyId);

    if (!existingSchedule) throw new AppError("El horario no existe", 404);

    if (!isSuperAdmin && existingSchedule.companyId !== user.companyId) {
      throw new AppError("No tienes permisos para eliminar este horario", 403);
    }

    return await this.scheduleRepository.softDeleteSchedule(
      id,
      existingSchedule.companyId || undefined
    );
  }

  // ScheduleService
  async getActiveScheduleForUser(
    workplaceId: string,
    positionId: string,
    user: { roleId: string; companyId?: string },
    companyId?: string
  ): Promise<ScheduleResponse | null> {
    // 1. Verificar permisos
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const targetCompanyId = isSuperAdmin ? companyId : user.companyId;

    if (!isSuperAdmin && !targetCompanyId) {
      throw new AppError("No tienes una empresa asignada", 401);
    }

    // 2. Validar acceso a la compañía
    await this.scheduleValidator.validateCompanyExists(user, targetCompanyId);
    await this.scheduleValidator.validateCompanyActive(user, targetCompanyId);

    // 4. Buscar horario activo en BD
    const activeSchedule = await this.scheduleRepository.findActiveSchedule(
      workplaceId,
      positionId,
      targetCompanyId!
    );

    // 5. Almacenar en caché si existe
    if (activeSchedule) {
      const transformedSchedule = transformScheduleRanges(activeSchedule);
      return transformedSchedule;
    }
    return null;
  }
}
