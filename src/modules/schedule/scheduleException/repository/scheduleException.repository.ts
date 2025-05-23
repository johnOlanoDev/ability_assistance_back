// src/modules/scheduleException/infrastructure/scheduleExceptionRepository.ts
import {
  CreateScheduleExceptionDTO,
  ExceptionType,
  ScheduleExceptionFilters,
  ScheduleExceptionResponse,
  UpdateScheduleExceptionDTO,
} from "../types/scheduleException.types";
import { inject, injectable } from "tsyringe";
import { IScheduleExceptionRepository } from "../port/scheduleException.port";
import { AppError } from "@/middleware/errors/AppError";
import { PRISMA_TOKEN, PrismaType } from "@/prisma";
import { differenceInDays } from "date-fns";
import { Prisma } from "@prisma/client";
import { UserResponse } from "@/modules/users/types/user.types";
import { toExceptionType } from "@/utils/helper/toExceptionType";
@injectable()
export class ScheduleExceptionRepository
  implements IScheduleExceptionRepository
{
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaType) {}

  async findScheduleExceptionById(
    id: string
  ): Promise<ScheduleExceptionResponse | null> {
    const exception = await this.prisma.scheduleException.findUnique({
      where: { id },
      include: {
        user: true,
        schedule: true,
        company: true,
        position: true,
        workplace: true,
      },
    });

    if (!exception) return null;

    return {
      ...exception,
      exceptionType: toExceptionType(exception.exceptionType),
      user: exception.user || undefined,
      workplace: exception.workplace || undefined,
      position: exception.position || undefined,
      company: exception.company || undefined,
      schedule: exception.schedule || undefined,
    };
  }

  async findUsersByTarget(
    exceptionType: ExceptionType,
    targetId: string,
    companyId?: string
  ): Promise<UserResponse[]> {
    switch (exceptionType) {
      case ExceptionType.INDIVIDUAL:
        return this.prisma.user.findMany({
          where: { id: targetId },
          include: {
            workplace: true,
            position: true,
            company: true,
          },
        });
      case ExceptionType.WORKPLACE:
        return this.prisma.user.findMany({
          where: { workplaceId: targetId },
          include: {
            workplace: true,
            position: true,
            company: true,
          },
        });
      case ExceptionType.POSITION:
        return this.prisma.user.findMany({
          where: { positionId: targetId },
          include: {
            workplace: true,
            position: true,
            company: true,
          },
        });
      case ExceptionType.COMPANY:
      case ExceptionType.HOLIDAY:
        return this.prisma.user.findMany({
          where: { companyId: targetId },
          include: {
            workplace: true,
            position: true,
            company: true,
          },
        });
      default:
        throw new Error(`Tipo de excepción no soportado: ${exceptionType}`);
    }
  }

  async createScheduleException(data: any): Promise<ScheduleExceptionResponse> {
    try {
      const durationDays = differenceInDays(data.endDate, data.startDate);

      const exception = await this.prisma.scheduleException.create({
        data: {
          scheduleId: data.scheduleId ?? undefined,
          userId:
            data.exceptionType === ExceptionType.INDIVIDUAL
              ? data.userId
              : undefined,
          workplaceId:
            data.exceptionType === ExceptionType.WORKPLACE
              ? data.workplaceId
              : undefined,
          positionId:
            data.exceptionType === ExceptionType.POSITION
              ? data.positionId
              : undefined,
          companyId:
            data.exceptionType === ExceptionType.COMPANY
              ? data.companyId
              : undefined,
          exceptionType: data.exceptionType,
          startDate: data.startDate,
          endDate: data.endDate,
          durationDays,
          isDayOff: data.isDayOff,
          checkIn: !data.isDayOff ? data.checkIn : undefined,
          checkOut: !data.isDayOff ? data.checkOut : undefined,
          reason: data.reason,
        },
        include: {
          user: true,
          schedule: true,
          company: true,
          position: true,
          workplace: true,
        },
      });

      return {
        ...exception,
        exceptionType: toExceptionType(exception.exceptionType),
        schedule: exception.schedule || undefined,
        user: exception.user || undefined,
        company: exception.company || undefined,
        position: exception.position || undefined,
        workplace: exception.workplace || undefined,
      };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          // Error de unicidad
          throw new AppError(
            "Ya existe una excepción registrada para este período y entidad.",
            400
          );
        }
      }
      throw new AppError(`Error al crear la excepción: ${error.message}`, 500);
    }
  }

  async findActiveExceptionsForUser(
    userId: string,
    date: Date
  ): Promise<ScheduleExceptionResponse[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workplace: true,
        position: true,
        company: true,
      },
    });

    if (!user) throw new Error("Usuario no encontrado");

    const exceptions = await this.prisma.scheduleException.findMany({
      where: {
        OR: [
          { companyId: user.companyId }, // Compañía
          { positionId: user.positionId }, // Cargo
          { workplaceId: user.workplaceId }, // Área
          { userId: user.id }, // Individual
        ],
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    return exceptions.map((exception) => ({
      ...exception,
      exceptionType: toExceptionType(exception.exceptionType),
    }));
  }

  async findOverlappingExceptions(
    exceptionType: ExceptionType,
    entityId: string,
    startDate: Date,
    endDate: Date,
    excludeExceptionId?: string
  ): Promise<ScheduleExceptionResponse[]> {
    const whereClause: any = {
      deletedAt: null,

      OR: [
        // Caso 1 : La excepción existente comienza dentro del nuevo periodo
        {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },

        // Caso 2: La excepción existente termina dentro del nuevo periodo
        {
          endDate: {
            gte: startDate,
            lte: endDate,
          },
        },

        // Caso 3: La excepción existente abarca completamente el nuevo periodo
        {
          startDate: {
            lte: startDate,
            gte: endDate,
          },
        },
      ],
    };

    // Agregar el filtro por tipo de entidad
    switch (exceptionType) {
      case ExceptionType.INDIVIDUAL:
        whereClause.userId = entityId;
        break;
      case ExceptionType.WORKPLACE:
        whereClause.workplaceId = entityId;
        break;
      case ExceptionType.POSITION:
        whereClause.positionId = entityId;
        break;
      case ExceptionType.COMPANY:
        whereClause.companyId = entityId;
        break;
    }

    if (excludeExceptionId) {
      whereClause.id = { not: excludeExceptionId };
    }

    const overlappingExceptions = await this.prisma.scheduleException.findMany({
      where: whereClause,
      include: {
        user: true,
        schedule: true,
        company: true,
        position: true,
        workplace: true,
      },
    });

    return overlappingExceptions.map((exception) => ({
      ...exception,
      exceptionType: toExceptionType(exception.exceptionType),
      user: exception.user || undefined,
      schedule: exception.schedule || undefined,
      company: exception.company || undefined,
      position: exception.position || undefined,
      workplace: exception.workplace || undefined,
    }));
  }

  async findScheduleExceptions(
    filters: ScheduleExceptionFilters,
    page = 1,
    limit = 10
  ): Promise<{
    data: ScheduleExceptionResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (filters.userId) where.userId = filters.userId;
    if (filters.workplaceId) where.workplaceId = filters.workplaceId;
    if (filters.positionId) where.positionId = filters.positionId;
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.scheduleId) where.scheduleId = filters.scheduleId;

    // Filtros de fecha
    if (filters.startDateFrom || filters.startDateTo) {
      where.startDate = {};
      if (filters.startDateFrom) where.startDate.gte = filters.startDateFrom;
      if (filters.startDateTo) where.startDate.lte = filters.startDateTo;
    }

    if (filters.endDateFrom || filters.endDateTo) {
      where.endDate = {};
      if (filters.endDateFrom) where.endDate.gte = filters.endDateFrom;
      if (filters.endDateTo) where.endDate.lte = filters.endDateTo;
    }

    // Obtener datos y total
    const [data, total] = await Promise.all([
      this.prisma.scheduleException.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "desc" },
        include: {
          user: true,
          schedule: true,
          company: true,
          position: true,
          workplace: true,
        },
      }),
      this.prisma.scheduleException.count({ where }),
    ]);

    return {
      data: data.map((exception) => ({
        ...exception,
        exceptionType: toExceptionType(exception.exceptionType),
        user: exception.user || undefined,
        workplace: exception.workplace || undefined,
        position: exception.position || undefined,
        company: exception.company || undefined,
        schedule: exception.schedule || undefined,
      })),
      total,
      page,
      limit,
    };
  }

  async updateScheduleException(
    id: string,
    data: UpdateScheduleExceptionDTO
  ): Promise<ScheduleExceptionResponse> {
    try {
      // Calcular la duración en días si se actualizan las fechas
      let durationDays: number | undefined;
      if (data.startDate && data.endDate) {
        durationDays = differenceInDays(data.endDate, data.startDate) + 1;
      }

      // Actualizar la excepción
      const exception = await this.prisma.scheduleException.update({
        where: { id },
        data: {
          scheduleId: data.scheduleId,
          userId: data.userId,
          workplaceId: data.workplaceId,
          positionId: data.positionId,
          companyId: data.companyId,
          startDate: data.startDate,
          endDate: data.endDate,
          durationDays: durationDays,
          isDayOff: data.isDayOff,
          checkIn: data.isDayOff === false ? data.checkIn : undefined,
          checkOut: data.isDayOff === false ? data.checkOut : undefined,
          reason: data.reason,
        },
        include: {
          user: true,
          schedule: true,
          company: true,
          position: true,
          workplace: true,
        },
      });

      return {
        ...exception,
        exceptionType: toExceptionType(exception.exceptionType),
        user: exception.user || undefined,
        workplace: exception.workplace || undefined,
        position: exception.position || undefined,
        company: exception.company || undefined,
        schedule: exception.schedule || undefined,
      };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new AppError(
            "Ya existe una excepción registrada para este período y entidad.",
            400
          );
        }
      }
      throw new AppError(
        `Error al actualizar la excepción: ${error.message}`,
        500
      );
    }
  }

  async deleteScheduleException(id: string): Promise<void> {
    await this.prisma.scheduleException.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findScheduleExceptionByDate(
    date: Date | string,
    userId?: string,
    scheduleId?: string,
    workplaceId?: string,
    positionId?: string,
    companyId?: string | null
  ): Promise<ScheduleExceptionResponse | null> {
    const dateObj = new Date(date);

    // Preparar condiciones de búsqueda
    const conditions = [];

    if (userId) {
      conditions.push({
        userId,
        date: dateObj,
        deletedAt: null,
      });
    }

    if (scheduleId) {
      conditions.push({
        scheduleId,
        date: dateObj,
        deletedAt: null,
      });
    }

    if (workplaceId) {
      conditions.push({
        workplaceId,
        date: dateObj,
        deletedAt: null,
      });
    }

    if (positionId) {
      conditions.push({
        positionId,
        date: dateObj,
        deletedAt: null,
      });
    }

    if (companyId) {
      conditions.push({
        companyId,
        date: dateObj,
        deletedAt: null,
      });
    }

    // Si no hay condiciones, retornamos null
    if (conditions.length === 0) {
      return null;
    }

    // Buscar la excepción para cualquiera de las condiciones
    const scheduleException = await this.prisma.scheduleException.findFirst({
      where: {
        OR: conditions,
      },
      include: {
        schedule: true,
        user: true,
        company: true,
        position: true,
        workplace: true,
      },
    });

    return scheduleException as ScheduleExceptionResponse | null;
  }
}
