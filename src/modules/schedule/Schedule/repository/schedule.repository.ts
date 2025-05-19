import { injectable } from "tsyringe";
import { IScheduleRepository } from "../port/schedule.port";
import { inject } from "tsyringe";
import {
  CreateScheduleDTO,
  ScheduleResponse,
  UpdateScheduleDTO,
} from "../types/schedule.types";
import { toZonedTime } from "date-fns-tz";
import { DayOfWeek } from "../../scheduleRange/types/scheduleRange.types";
import { PRISMA_TOKEN, PrismaType } from "@/prisma";
import { AppError } from "@/middleware/errors/AppError";

export const transformScheduleRanges = (schedule: any) => {
  if (!schedule) return null;

  return {
    ...schedule,
    scheduleRanges: schedule.scheduleRanges?.map((range: any) => ({
      ...range,
      checkIn: range.checkIn,
      checkOut: range.checkOut,
      startDay: range.startDay.toString(),
      endDay: range.endDay.toString(),
      isNightShift: !!range.isNightShift,
    })),
  };
};

const transformCreateScheduleRanges = (ranges: any[]) => {
  return ranges.map((range) => ({
    ...range,
    startDay: range.startDay as DayOfWeek,
    endDay: range.endDay as DayOfWeek,
    checkIn: range.checkIn,
    checkOut: range.checkOut,
    isNightShift: range.isNightShift ?? false,
  }));
};

@injectable()
export class ScheduleRepository implements IScheduleRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaType) {}

  // ScheduleRepository.ts
  async getAllSchedules(
    companyId?: string,
    workplaceId?: string,
    positionId?: string
  ): Promise<{ schedules: ScheduleResponse[]; total: number }> {
    const timeZone = "America/Bogota";
    const now = new Date();
    const localteCreatedAt = toZonedTime(now, timeZone);

    const schedules = await this.prisma.schedule.findMany({
      where: {
        companyId: companyId,
        workplaceId: workplaceId,
        positionId: positionId,
        deletedAt: null,
      },
      include: {
        scheduleRanges: {
          include: {
            schedule: false,
          },
        },
        scheduleChanges: true,
        scheduleExceptions: true,
        company: true,
        workplace: true,
        position: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await this.prisma.schedule.count({
      where: {
        companyId: companyId,
        workplaceId: workplaceId,
        positionId: positionId,
        createdAt: localteCreatedAt,
        deletedAt: null,
      },
    });

    return {
      schedules: schedules.map(transformScheduleRanges),
      total,
    };
  }

  async getAllSchedulesWithDisabled(
    companyId?: string,
    workplaceId?: string,
    positionId?: string
  ): Promise<{
    schedules: ScheduleResponse[];
    total: number;
  }> {
    const timeZone = "America/Bogota";
    const now = new Date();
    const localteCreatedAt = toZonedTime(now, timeZone);

    const schedules = await this.prisma.schedule.findMany({
      where: {
        companyId,
        workplaceId,
        positionId,
        NOT: { deletedAt: null },
      },
      include: {
        scheduleRanges: { include: { schedule: false } },
        scheduleChanges: true,
        scheduleExceptions: true,
        company: true,
        workplace: true,
        position: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await this.prisma.schedule.count({
      where: {
        companyId,
        workplaceId,
        positionId,
        NOT: { deletedAt: null },
        createdAt: localteCreatedAt,
      },
    });

    return {
      schedules: schedules.map(transformScheduleRanges),
      total,
    };
  }

  async getScheduleById(
    id: string,
    companyId?: string
  ): Promise<ScheduleResponse | null> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id, companyId, deletedAt: null },
      include: {
        scheduleRanges: {
          include: {
            schedule: true,
          },
        },
        scheduleChanges: true,
        scheduleExceptions: true,
      },
    });
    return transformScheduleRanges(schedule);
  }

  async createSchedule(data: CreateScheduleDTO): Promise<ScheduleResponse> {
    const timeZone = "America/Bogota";
    const now = new Date();
    const localteCreatedAt = toZonedTime(now, timeZone);

    const existing = await this.prisma.schedule.findFirst({
      where: {
        workplaceId: data.workplaceId,
        positionId: data.positionId,
        deletedAt: null,
        status: true,
      },
    });

    if (existing) {
      throw new AppError(
        "Ya existe un horario activo para ese cargo en esta área."
      );
    }

    const schedule = await this.prisma.schedule.create({
      data: {
        name: data.name,
        workplaceId: data.workplaceId ?? null,
        positionId: data.positionId ?? null,
        companyId: data.companyId ?? null,
        status: data.status ?? true,
        createdAt: localteCreatedAt,
        scheduleRanges: data.scheduleRanges?.length
          ? {
              create: data.scheduleRanges.map((range) => ({
                startDay: convertToDayOfWeek(range.startDay),
                endDay: convertToDayOfWeek(range.endDay),
                checkIn: range.checkIn,
                checkOut: range.checkOut,
                isNightShift: range.isNightShift,
              })),
            }
          : undefined,
      },
      include: {
        scheduleRanges: true,
        workplace: true,
        position: true,
        company: true,
      },
    });

    return {
      ...schedule,
      workplace: schedule.workplace ?? undefined,
      position: schedule.position ?? undefined,
      company: schedule.company ?? undefined,
      createdAt: localteCreatedAt,
    };
  }

  async updateSchedule(
    id: string,
    data: UpdateScheduleDTO,
    companyId?: string
  ): Promise<ScheduleResponse> {
    const { scheduleRanges, ...scheduleData } = data;

    const schedule = await this.prisma.schedule.update({
      where: { id }, // ✅ Ahora busca solo por ID
      data: {
        ...scheduleData,
        ...(companyId !== undefined && { companyId }), // Actualiza companyId si viene
        updatedAt: new Date(),
        ...(scheduleRanges && {
          scheduleRanges: {
            deleteMany: { scheduleId: id }, // Elimina rangos antiguos del horario
            create: transformCreateScheduleRanges(scheduleRanges),
          },
        }),
      },
      include: {
        scheduleRanges: true,
        scheduleChanges: true,
        scheduleExceptions: true,
      },
    });

    return transformScheduleRanges(schedule);
  }

  async softDeleteSchedule(
    id: string,
    companyId?: string
  ): Promise<ScheduleResponse> {
    const deletedAt = new Date();

    // Marca el horario como eliminado
    const schedule = await this.prisma.schedule.update({
      where: { id, companyId: companyId || undefined },
      data: { deletedAt, status: false },
    });

    // Marca sus relaciones como eliminadas
    await this.prisma.scheduleRange.updateMany({
      where: { scheduleId: id },
      data: { deletedAt },
    });

    await this.prisma.scheduleChange.updateMany({
      where: { scheduleId: id },
      data: { deletedAt },
    });

    await this.prisma.scheduleException.updateMany({
      where: { scheduleId: id },
      data: { deletedAt },
    });

    return transformScheduleRanges(schedule);
  }

  async findScheduleRange(
    scheduleId: string,
    startDay: string | number,
    endDay: string | number | null | undefined,
    checkIn: string,
    checkOut: string,
    excludeId?: string
  ): Promise<any> {
    // Función para convertir números a valores del enum DayOfWeek
    const convertToDayOfWeek = (day: string | number): DayOfWeek => {
      if (typeof day === "number") {
        // Convierte números a strings del enum
        const dayMap: { [key: number]: DayOfWeek } = {
          0: "SUNDAY",
          1: "MONDAY",
          2: "TUESDAY",
          3: "WEDNESDAY",
          4: "THURSDAY",
          5: "FRIDAY",
          6: "SATURDAY",
        };
        return dayMap[day] as DayOfWeek;
      }
      return day as DayOfWeek;
    };

    // Crear la base del where
    const whereClause: any = {
      scheduleId,
      startDay: {
        equals: convertToDayOfWeek(startDay),
      },
      checkIn: {
        equals: checkIn,
      },
      checkOut: {
        equals: checkOut,
      },
    };

    // Si hay un excludeId, añadir la condición NOT
    if (excludeId) {
      whereClause.NOT = { id: excludeId };
    }

    // Realizar consultas específicas dependiendo del valor de endDay
    let result;

    if (endDay === null || endDay === undefined) {
      // Consulta para encontrar registros donde endDay es NULL
      try {
        result = await this.prisma.scheduleRange.findFirst({
          where: {
            ...whereClause,
            endDay: null,
          },
        });
      } catch (error) {
        // Si la consulta anterior falla, intentar con is
        result = await this.prisma.scheduleRange.findFirst({
          where: {
            ...whereClause,
            endDay: { is: null },
          },
        });
      }
    } else {
      // Consulta para encontrar registros con un endDay específico
      result = await this.prisma.scheduleRange.findFirst({
        where: {
          ...whereClause,
          endDay: {
            equals: convertToDayOfWeek(endDay),
          },
        },
      });
    }

    return result;
  }

  async findScheduleByWorkplaceAndPosition(
    workplaceId: string,
    positionId: string,
    user: { roleId: string; companyId?: string }
  ): Promise<ScheduleResponse | null> {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        workplaceId,
        positionId,
        deletedAt: null,
      },
    });
    return transformScheduleRanges(schedule);
  }

  async findScheduleById(id: string): Promise<ScheduleResponse | null> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id, deletedAt: null },
      include: {
        scheduleRanges: true,
        workplace: true,
        position: true,
        company: true,
      },
    });
    return transformScheduleRanges(schedule);
  }

  // En schedule.repository.ts
  async findActiveSchedule(
    workplaceId: string,
    positionId: string,
    companyId: string,
  ) {
    return this.prisma.schedule.findFirst({
      where: {
        workplaceId,
        positionId,
        companyId: companyId ? companyId : undefined,
        status: true,
      },
      include: { scheduleRanges: true },
    });
  }
}

function convertToDayOfWeek(day: number | string | null | undefined): any {
  if (day === null || day === undefined) return null;

  if (typeof day === "number") {
    const dayMap: { [key: number]: string } = {
      0: "SUNDAY",
      1: "MONDAY",
      2: "TUESDAY",
      3: "WEDNESDAY",
      4: "THURSDAY",
      5: "FRIDAY",
      6: "SATURDAY",
    };
    return dayMap[day];
  }
  return day;
}
