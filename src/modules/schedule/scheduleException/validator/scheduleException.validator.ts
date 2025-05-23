// schedule-exception.validator.ts

import { inject, injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import { AppError } from "@/middleware/errors/AppError";
import { ExceptionType } from "../types/scheduleException.types";
import { WorkplaceRepository } from "@/modules/workplace/repository/workplace.repository";
import { PositionRepository } from "@/modules/position/repository/position.repository";
import { CompanyRepository } from "@/modules/companies/repository/company.repository";
import { ScheduleRepository } from "../../Schedule/repository/schedule.repository";
import { UserRepository } from "@/modules/users/repository/user.repository";

@injectable()
export class ScheduleExceptionValidator {
  constructor(
   @inject("UserRepository") private userRepository: UserRepository,
   @inject("WorkplaceRepository") private workplaceRepository: WorkplaceRepository,
   @inject("PositionRepository") private positionRepository: PositionRepository,
   @inject("CompanyRepository") private companyRepository: CompanyRepository,
   @inject("ScheduleRepository") private scheduleRepository: ScheduleRepository
  ) {}

  /**
   * Valida que un usuario exista y esté activo
   */
  async validateUserExists(userId: string): Promise<void> {
    const user = await this.userRepository.getUserById(userId);

    if (!user) {
      throw new AppError("El usuario seleccionado no existe.", 404);
    }

    if (!user.status) {
      throw new AppError("El usuario seleccionado no está activo.", 400);
    }
  }

  /**
   * Valida que una área de trabajo exista y esté activa
   */
  async validateWorkplaceExists(workplaceId: string): Promise<void> {
    const workplace = await this.workplaceRepository.getWorkPlaceById(workplaceId);

    if (!workplace) {
      throw new AppError("El área de trabajo seleccionada no existe.", 404);
    }

    if (!workplace.status) {
      throw new AppError(
        "El área de trabajo seleccionada no está activa.",
        400
      );
    }
  }

  /**
   * Valida que un cargo exista y esté activo
   */
  async validatePositionExists(positionId: string): Promise<void> {
    const position = await this.positionRepository.getPositionById(positionId);

    if (!position) {
      throw new AppError("El cargo seleccionado no existe.", 404);
    }

    if (!position.status) {
      throw new AppError("El cargo seleccionado no está activo.", 400);
    }
  }

  /**
   * Valida que una compañía exista y esté activa
   */
  async validateCompanyExists(companyId: string): Promise<void> {
    const company = await this.companyRepository.getCompanyById(companyId);

    if (!company) {
      throw new AppError("La compañía seleccionada no existe.", 404);
    }

    if (!company.status) {
      throw new AppError("La compañía seleccionada no está activa.", 400);
    }
  }

  /**
   * Valida que un horario exista
   */
  async validateScheduleExists(scheduleId: string): Promise<void> {
    const schedule = await this.scheduleRepository.getScheduleById(scheduleId);

    if (!schedule) {
      throw new AppError("El horario seleccionado no existe.", 404);
    }

    if (!schedule.status) {
      throw new AppError("El horario seleccionado no está activo.", 400);
    }
  }

  /**
   * Valida que los datos de la entidad correspondan a la compañía del usuario
   */
  async validateEntityBelongsToCompany(
    exceptionType: ExceptionType,
    entityId: string,
    companyId: string
  ): Promise<void> {
    let entity;
    let entityType;

    switch (exceptionType) {
      case ExceptionType.INDIVIDUAL:
        entity = await this.userRepository.getUserById(entityId);
        entityType = "usuario";
        break;
      case ExceptionType.WORKPLACE:
        entity = await this.workplaceRepository.getWorkPlaceById(entityId);
        entityType = "área de trabajo";
        break;
      case ExceptionType.POSITION:
        entity = await this.positionRepository.getPositionById(entityId);
        entityType = "cargo";
        break;
      default:
        // Para COMPANY no necesitamos validar
        return;
    }

    if (!entity) {
      throw new AppError(`El ${entityType} seleccionado no existe.`, 404);
    }

    if (entity.companyId !== companyId) {
      throw new AppError(
        `El ${entityType} seleccionado no pertenece a la compañía del usuario.`,
        403
      );
    }
  }

  /**
   * Valida que las horas sean válidas cuando no es día completo libre
   */
  validateTimeFormat(time: string | undefined): void {
    if (!time) return;

    // Validar formato HH:MM
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new AppError("El formato de hora debe ser HH:MM (24 horas).", 400);
    }
  }

  /**
   * Valida que la hora de salida sea posterior a la hora de entrada
   */
  validateCheckInCheckOut(checkIn: string, checkOut: string): void {
    const [inHour, inMinute] = checkIn.split(":").map(Number);
    const [outHour, outMinute] = checkOut.split(":").map(Number);

    const inMinutes = inHour * 60 + inMinute;
    const outMinutes = outHour * 60 + outMinute;

    if (outMinutes <= inMinutes) {
      throw new AppError(
        "La hora de salida debe ser posterior a la hora de entrada.",
        400
      );
    }
  }
}
