import { CompanyResponse } from "@/modules/companies/types/company.types";
import { ScheduleExceptionResponse } from "../../scheduleException/types/scheduleException.types";
import { ScheduleChangeResponse } from "../../scheduleChange/types/scheduleChange.types";
import {
  ScheduleRangeResponse,
  UpdateOrCreateScheduleRangeDTO,
} from "../../scheduleRange/types/scheduleRange.types";
import { WorkPlacesResponse } from "@/modules/workplace/types/workplace.types";
import { PositionResponse } from "@/modules/position/types/position.types";

export interface ScheduleResponse {
  id?: string;
  name: string;
  workplaceId?: string | null;
  positionId?: string | null;
  status: boolean;
  workplace?: WorkPlacesResponse;
  position?: PositionResponse;
  scheduleRanges?: ScheduleRangeResponse[];
  scheduleChanges?: ScheduleChangeResponse[];
  scheduleExceptions?: ScheduleExceptionResponse[];
  company?: CompanyResponse;
  companyId?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}

export type CreateScheduleDTO = {
  name: string;
  workplaceId?: string;
  positionId?: string;
  status?: boolean;
  companyId?: string;
  scheduleRanges?: Omit<UpdateOrCreateScheduleRangeDTO, "scheduleId">[];
};

export type UpdateScheduleDTO = Partial<CreateScheduleDTO>;
