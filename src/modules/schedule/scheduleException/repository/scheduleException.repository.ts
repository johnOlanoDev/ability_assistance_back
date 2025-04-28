// src/modules/scheduleException/infrastructure/scheduleExceptionRepository.ts

import { PrismaClient } from "@prisma/client";
import {
  CreateScheduleExceptionDTO,
  ScheduleExceptionFilters,
  ScheduleExceptionResponse,
  UpdateScheduleExceptionDTO,
} from "../types/scheduleException.types";
import { inject, injectable } from "tsyringe";
import { IScheduleExceptionRepository } from "../port/scheduleException.port";
import { AppError } from "@/middleware/errors/AppError";

@injectable()
export class ScheduleExceptionRepository
  implements IScheduleExceptionRepository
{
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findScheduleExceptionById(
    id: string
  ): Promise<ScheduleExceptionResponse | null> {
    const scheduleException = await this.prisma.scheduleException.findUnique({
      where: { id, deletedAt: null },
      include: {
        schedule: true,
        user: true,
      },
    });

    return scheduleException as ScheduleExceptionResponse | null;
  }

  async findScheduleExceptionsByFilters(
    filters: ScheduleExceptionFilters
  ): Promise<ScheduleExceptionResponse[]> {
    const {
      scheduleId,
      userId,
      workplaceId,
      positionId,
      companyId,
      fromDate,
      toDate,
      isDayOff,
    } = filters;

    const where: any = {
      deletedAt: null,
      ...(scheduleId && { scheduleId }),
      ...(userId && { userId }),
      ...(workplaceId && { workplaceId }),
      ...(positionId && { positionId }),
      ...(companyId && { companyId }),
      ...(isDayOff !== undefined && { isDayOff }),
    };

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate);
    }

    const scheduleExceptions = await this.prisma.scheduleException.findMany({
      where,
      include: {
        schedule: true,
        user: true,
      },
      orderBy: { date: "asc" },
    });

    return scheduleExceptions as ScheduleExceptionResponse[];
  }

  async createScheduleException(
    data: CreateScheduleExceptionDTO
  ): Promise<ScheduleExceptionResponse> {
    const {
      scheduleId,
      userId,
      workplaceId,
      positionId,
      companyId,
      date,
      checkIn,
      checkOut,
      isDayOff,
      reason,
    } = data;

    // Validar que al menos uno de los IDs esté presente
    if (!scheduleId && !userId && !workplaceId && !positionId && !companyId) {
      throw new AppError(
        "Debe especificar al menos un nivel (horario, usuario, lugar de trabajo, posición o empresa)"
      );
    }

    const scheduleException = await this.prisma.scheduleException.create({
      data: {
        scheduleId: scheduleId || undefined,
        userId: userId || undefined,
        workplaceId: workplaceId || undefined,
        positionId: positionId || undefined,
        companyId: companyId || undefined,
        date: date,
        checkOut: checkOut || undefined,
        checkIn: checkIn || undefined,
        isDayOff: isDayOff ?? false,
        reason,
      },
      include: {
        schedule: true,
        user: true,
      },
    });

    return scheduleException as ScheduleExceptionResponse;
  }

  async updateScheduleException(
    id: string,
    data: UpdateScheduleExceptionDTO
  ): Promise<ScheduleExceptionResponse> {
    const { date, checkIn, checkOut, isDayOff, reason } = data;

    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (checkIn !== undefined)
      updateData.checkIn = checkIn ? new Date(checkIn) : null;
    if (checkOut !== undefined)
      updateData.checkOut = checkOut ? new Date(checkOut) : null;
    if (isDayOff !== undefined) updateData.isDayOff = isDayOff;
    if (reason) updateData.reason = reason;

    const scheduleException = await this.prisma.scheduleException.update({
      where: { id },
      data: updateData,
      include: {
        schedule: true,
        user: true,
      },
    });

    return scheduleException as ScheduleExceptionResponse;
  }

  async deleteScheduleException(id: string): Promise<boolean> {
    const now = new Date();
    await this.prisma.scheduleException.update({
      where: { id },
      data: { deletedAt: now },
    });
    return true;
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
        workplace: true
      },
    });

    return scheduleException as ScheduleExceptionResponse | null;
  }

  async countScheduleExceptions(
    filters?: ScheduleExceptionFilters
  ): Promise<number> {
    const where: any = { deletedAt: null };

    if (filters) {
      const {
        scheduleId,
        userId,
        workplaceId,
        positionId,
        companyId,
        fromDate,
        toDate,
        isDayOff,
      } = filters;

      if (scheduleId) where.scheduleId = scheduleId;
      if (userId) where.userId = userId;
      if (workplaceId) where.workplaceId = workplaceId;
      if (positionId) where.positionId = positionId;
      if (companyId) where.companyId = companyId;
      if (isDayOff !== undefined) where.isDayOff = isDayOff;

      if (fromDate || toDate) {
        where.date = {};
        if (fromDate) where.date.gte = new Date(fromDate);
        if (toDate) where.date.lte = new Date(toDate);
      }
    }

    return await this.prisma.scheduleException.count({ where });
  }
}
