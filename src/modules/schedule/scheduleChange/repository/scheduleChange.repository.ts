import { inject, injectable } from "tsyringe";
import { IScheduleChangeRepository } from "../port/scheduleChange.port";
import {
  CreateScheduleChangeDTO,
  ScheduleChangeFilters,
  ScheduleChangeResponse,
  UpdateScheduleChangeDTO,
} from "../types/scheduleChange.types";
import { PRISMA_TOKEN, PrismaType } from "@/prisma";

@injectable()
export class ScheduleChangeRepository implements IScheduleChangeRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaType) {}

  async findScheduleChangeById(
    id: string,
    companyId?: string
  ): Promise<ScheduleChangeResponse | null> {
    const scheduleChange = await this.prisma.scheduleChange.findUnique({
      where: { id, companyId: companyId || undefined, deletedAt: null },
      include: {
        schedule: true,
      },
    });

    return scheduleChange as ScheduleChangeResponse | null;
  }

  async findScheduleChangesByFilters(
    filters: ScheduleChangeFilters,
    companyId?: string
  ): Promise<ScheduleChangeResponse[]> {
    const { scheduleId, workplaceId, positionId, fromDate, toDate } =
      filters;

    const where: any = {
      deletedAt: null,
      companyId: companyId || undefined,
      ...(scheduleId && { scheduleId }),
      ...(workplaceId && { workplaceId }),
      ...(positionId && { positionId }),
      ...(companyId && { companyId }),
    };

    if (fromDate || toDate) {
      where.changeDate = {};
      if (fromDate) where.changeDate.gte = new Date(fromDate);
      if (toDate) where.changeDate.lte = new Date(toDate);
    }

    const scheduleChanges = await this.prisma.scheduleChange.findMany({
      where,
      include: {
        schedule: {
          include: {
            scheduleChanges: true
          }
        },
      },
      orderBy: { changeDate: "asc" },
    });

    return scheduleChanges as ScheduleChangeResponse[];
  }

  async createScheduleChange(
    data: CreateScheduleChangeDTO
  ): Promise<ScheduleChangeResponse> {
    const {
      scheduleId,
      workplaceId,
      positionId,
      companyId,
      changeDate,
      newCheckIn,
      newCheckOut,
      reason,
    } = data;

    // Validar que al menos uno de los IDs esté presente
    if (!scheduleId && !workplaceId && !positionId && !companyId) {
      throw new Error(
        "Debe especificar al menos un nivel (horario, lugar de trabajo, posición o empresa)"
      );
    }

    const scheduleChange = await this.prisma.scheduleChange.create({
      data: {
        scheduleId: scheduleId || null,
        workplaceId: workplaceId || null,
        positionId: positionId || null,
        companyId: companyId || null,
        changeDate: changeDate,
        newCheckIn: newCheckIn,
        newCheckOut: newCheckOut,
        reason,
      },
      include: {
        schedule: true,
      },
    });

    return scheduleChange as ScheduleChangeResponse;
  }

  async updateScheduleChange(
    id: string,
    data: UpdateScheduleChangeDTO,
    companyId?: string
  ): Promise<ScheduleChangeResponse> {
    const { changeDate, newCheckIn, newCheckOut, reason } = data;

    const updateData: any = {};
    if (changeDate) updateData.changeDate = new Date(changeDate);
    if (newCheckIn) updateData.newCheckIn = new Date(newCheckIn);
    if (newCheckOut) updateData.newCheckOut = new Date(newCheckOut);
    if (reason) updateData.reason = reason;

    const scheduleChange = await this.prisma.scheduleChange.update({
      where: { id, companyId: companyId || undefined },
      data: updateData,
      include: {
        schedule: true,
      },
    });

    return scheduleChange as ScheduleChangeResponse;
  }

  async deleteScheduleChange(id: string, companyId?: string): Promise<boolean> {
    await this.prisma.scheduleChange.delete({
      where: { id, companyId: companyId || undefined, deletedAt: null },
    });
    return true;
  }

  async findScheduleChangeByDate(
    date: Date | string,
    scheduleId?: string,
    workplaceId?: string,
    positionId?: string,
    companyId?: string
  ): Promise<ScheduleChangeResponse | null> {
    const dateObj = new Date(date);

    // Preparar condiciones de búsqueda
    const conditions = [];

    if (scheduleId) {
      conditions.push({
        scheduleId,
        changeDate: dateObj,
        deletedAt: null,
      });
    }

    if (workplaceId) {
      conditions.push({
        workplaceId,
        changeDate: dateObj,
        deletedAt: null,
      });
    }

    if (positionId) {
      conditions.push({
        positionId,
        changeDate: dateObj,
        deletedAt: null,
      });
    }

    if (companyId) {
      conditions.push({
        companyId,
        changeDate: dateObj,
        deletedAt: null,
      });
    }

    // Si no hay condiciones, retornamos null
    if (conditions.length === 0) {
      return null;
    }

    // Buscar el cambio de horario para cualquiera de las condiciones
    const scheduleChange = await this.prisma.scheduleChange.findFirst({
      where: {
        OR: conditions,
      },
      include: {
        schedule: true,
      },
    });

    return scheduleChange as ScheduleChangeResponse | null;
  }

  async countScheduleChanges(
    filters?: ScheduleChangeFilters,
    companyId?: string
  ): Promise<number> {
    const where: any = { deletedAt: null, companyId: companyId || undefined };

    if (filters) {
      const {
        scheduleId,
        workplaceId,
        positionId,
        companyId,
        fromDate,
        toDate,
      } = filters;

      if (scheduleId) where.scheduleId = scheduleId;
      if (workplaceId) where.workplaceId = workplaceId;
      if (positionId) where.positionId = positionId;
      if (companyId) where.companyId = companyId;

      if (fromDate || toDate) {
        where.changeDate = {};
        if (fromDate) where.changeDate.gte = new Date(fromDate);
        if (toDate) where.changeDate.lte = new Date(toDate);
      }
    }

    return await this.prisma.scheduleChange.count({ where });
  }
}
