import { ScheduleResponse } from "../../Schedule/types/schedule.types";

export interface ScheduleChangeResponse {
  id: string;
  scheduleId?: string | null;
  workplaceId?: string | null;
  positionId?: string | null;
  companyId?: string | null;
  changeDate: Date;
  newCheckIn: string;
  newCheckOut: string;
  reason: string;
  schedule?: ScheduleResponse;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateScheduleChangeDTO = {
  scheduleId?: string;
  workplaceId?: string;
  positionId?: string;
  companyId?: string;
  changeDate: Date | string;
  newCheckIn: string;
  newCheckOut:  string;
  reason: string;
};

export type UpdateScheduleChangeDTO = Partial<CreateScheduleChangeDTO>;

export type ScheduleChangeFilters = {
  scheduleId?: string;
  workplaceId?: string;
  positionId?: string;
  companyId?: string;
  fromDate?: Date | string;
  toDate?: Date | string;
};
