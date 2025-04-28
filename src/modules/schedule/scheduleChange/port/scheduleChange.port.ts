// File: src/ports/schedule-change.port.ts
import {
  CreateScheduleChangeDTO,
  ScheduleChangeFilters,
  ScheduleChangeResponse,
  UpdateScheduleChangeDTO,
} from "../types/scheduleChange.types";

export interface IScheduleChangeRepository {
  findScheduleChangeById(id: string): Promise<ScheduleChangeResponse | null>;

  findScheduleChangesByFilters(
    filters: ScheduleChangeFilters
  ): Promise<ScheduleChangeResponse[]>;

  createScheduleChange(
    data: CreateScheduleChangeDTO
  ): Promise<ScheduleChangeResponse>;

  updateScheduleChange(
    id: string,
    data: UpdateScheduleChangeDTO
  ): Promise<ScheduleChangeResponse>;

  deleteScheduleChange(id: string): Promise<boolean>;

  findScheduleChangeByDate(
    date: Date | string,
    scheduleId?: string,
    workplaceId?: string,
    positionId?: string,
    companyId?: string
  ): Promise<ScheduleChangeResponse | null>;

  countScheduleChanges(filters?: ScheduleChangeFilters): Promise<number>;
}
