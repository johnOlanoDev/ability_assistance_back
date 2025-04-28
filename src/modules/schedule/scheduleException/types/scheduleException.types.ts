import { UserResponse } from "@/modules/users/types/user.types";
import { ScheduleResponse } from "../../Schedule/types/schedule.types";
export interface ScheduleExceptionResponse {
  id: string;
  scheduleId?: string | null;
  userId?: string | null;
  workplaceId?: string | null;
  positionId?: string | null;
  companyId?: string | null;
  date: Date;
  checkIn?: string | null;
  checkOut?: string | null;
  isDayOff: boolean;
  reason?: string;
  schedule?: ScheduleResponse;
  user?: UserResponse;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateScheduleExceptionDTO = {
  scheduleId?: string | null;
  userId?: string | null;
  workplaceId?: string | null;
  positionId?: string | null;
  companyId?: string | null;
  date: Date | string;
  checkIn?: string | null;
  checkOut?: string | null;
  isDayOff?: boolean;
  reason: string;
};

export type UpdateScheduleExceptionDTO = Partial<CreateScheduleExceptionDTO>;

export type ScheduleExceptionFilters = {
  scheduleId?: string;
  userId?: string;
  workplaceId?: string;
  positionId?: string;
  companyId?: string;
  fromDate?: Date | string;
  toDate?: Date | string;
  isDayOff?: boolean;
};
