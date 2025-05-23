import { UserResponse } from "@/modules/users/types/user.types";
import { ScheduleResponse } from "../../Schedule/types/schedule.types";
import { WorkPlacesResponse } from "@/modules/workplace/types/workplace.types";
import { PositionResponse } from "@/modules/position/types/position.types";
import { CompanyResponse } from "@/modules/companies/types/company.types";
import {
  AsistentType,
  PermissionType,
} from "@/modules/attendance/types/attendance.types";

// Enum para los tipos de excepción
export enum ExceptionType {
  INDIVIDUAL = "INDIVIDUAL",
  WORKPLACE = "WORKPLACE",
  POSITION = "POSITION",
  COMPANY = "COMPANY",
  HOLIDAY = "HOLIDAY",
}

export interface ScheduleExceptionResponse {
  id?: string;
  scheduleId?: string | null;
  userId?: string | null;
  workplaceId?: string | null;
  positionId?: string | null;
  companyId?: string | null;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  isDayOff: boolean;
  checkIn?: string | null;
  checkOut?: string | null;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
  schedule?: ScheduleResponse;
  user?: UserResponse;
  workplace?: WorkPlacesResponse;
  position?: PositionResponse;
  company?: CompanyResponse;
  deletedAt?: Date | null;

  exceptionType: ExceptionType;
  assistanceType?: AsistentType;
}

export interface ScheduleExceptionFilters {
  userId?: string;
  workplaceId?: string;
  positionId?: string;
  companyId?: string;
  scheduleId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
}

export type CreateScheduleExceptionDTO = {
  startDate: Date;
  endDate: Date;
  isDayOff: boolean;
  checkIn?: string | null;
  checkOut?: string | null;
  reason: string;
  scheduleId?: string;
  userId?: string;
  workplaceId?: string;
  positionId?: string;
  companyId?: string;
  exceptionType: ExceptionType;

  assistanceType?: PermissionType;
};

export type UpdateScheduleExceptionDTO = Partial<
  Omit<CreateScheduleExceptionDTO, "exceptionType">
> & {
  id: string;
};
