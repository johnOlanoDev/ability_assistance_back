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
  status?: boolean;
  workplace?: WorkPlacesResponse | null;
  position?: PositionResponse | null;
  scheduleRanges?: ScheduleRangeResponse[] | null;
  scheduleChanges?: ScheduleChangeResponse[] | null;
  scheduleExceptions?: ScheduleExceptionResponse[] | null;
  company?: CompanyResponse | null;
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
