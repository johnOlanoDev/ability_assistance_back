import { ScheduleResponse } from "../../Schedule/types/schedule.types";

export interface ScheduleRangeResponse {
  scheduleId: string;
  schedule?: ScheduleResponse;
  startDay: DayOfWeek;
  endDay: DayOfWeek;
  checkIn: string;
  checkOut: string;
  isNightShift: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateScheduleRangeDTO = {
  scheduleId: string;
  startDay: DayOfWeek;
  endDay: DayOfWeek;
  checkIn: string;
  checkOut: string;
  isNightShift: boolean;
};

export type UpdateOrCreateScheduleRangeDTO = Omit<
  CreateScheduleRangeDTO,
  "scheduleId"
> & {
  id?: string;
};

export const DayOfWeek = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const;

export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek]
