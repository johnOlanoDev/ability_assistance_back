import { inject, injectable } from "tsyringe";
import {
  DayOfWeek, 
  CreateScheduleRangeDTO,
  ScheduleRangeResponse,
  UpdateOrCreateScheduleRangeDTO,
} from "../types/scheduleRange.types";
import { PRISMA_TOKEN, PrismaType } from "@/prisma";

const transformResponse = (data: any): ScheduleRangeResponse | null => {
  if (!data) return null;
  return {
    ...data,
    checkIn: data.checkIn.toISOString(),
    checkOut: data.checkOut.toISOString(),
    startDay: data.startDay.toString(),
    endDay: data.endDay.toString(),
  };
};

const cleanData = (obj: Record<string, any>) =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

@injectable()
export class ScheduleRangeRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaType) {}

  async createScheduleRange(
    data: CreateScheduleRangeDTO
  ): Promise<ScheduleRangeResponse> {
    const result = await this.prisma.scheduleRange.create({
      data: {
        scheduleId: data.scheduleId,
        startDay: data.startDay,
        endDay: data.endDay,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        isNightShift: data.isNightShift,
      },
      include: { schedule: true },
    });
    return transformResponse(result)!;
  }

  async deleteScheduleRangesByScheduleId(scheduleId: string) {
    await this.prisma.scheduleRange.deleteMany({
      where: { scheduleId },
    });
  }

  async bulkCreateScheduleRanges(data: CreateScheduleRangeDTO[]) {
    await this.prisma.scheduleRange.createMany({
      data,
    });
  }

  async updateScheduleRange(
    id: string,
    data: UpdateOrCreateScheduleRangeDTO
  ): Promise<ScheduleRangeResponse> {
    const cleanedData = cleanData({
      startDay: data.startDay,
      endDay: data.endDay,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      isNightShift: data.isNightShift,
    });

    const result = await this.prisma.scheduleRange.update({
      where: { id },
      data: cleanedData,
      include: { schedule: true },
    });
    return transformResponse(result)!;
  }

  async softDeleteScheduleRange(id: string): Promise<ScheduleRangeResponse> {
    const result = await this.prisma.scheduleRange.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { schedule: true },
    });
    return transformResponse(result)!;
  }

  async findRangesByScheduleId(
    scheduleId: string
  ): Promise<ScheduleRangeResponse[]> {
    const results = await this.prisma.scheduleRange.findMany({
      where: { scheduleId, deletedAt: null },
      include: { schedule: true },
    });
    return results
      .map(transformResponse)
      .filter((r): r is ScheduleRangeResponse => r !== null);
  }

  async findScheduleRangeById(
    id: string
  ): Promise<ScheduleRangeResponse | null> {
    const result = await this.prisma.scheduleRange.findUnique({
      where: { id },
      include: { schedule: true },
    });
    return transformResponse(result);
  }

  async findScheduleRangeForCurrentDay(
    scheduleId: string
  ): Promise<ScheduleRangeResponse | null> {
    const today = new Date().getDay();
    const dayOfWeek = Object.values(DayOfWeek)[today];
    const result = await this.prisma.scheduleRange.findFirst({
      where: {
        scheduleId,
        startDay: dayOfWeek,
        endDay: dayOfWeek,
      },
    });
    return transformResponse(result);
  }
}
