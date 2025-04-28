import { WorkPlacesResponse } from "@/modules/workplace/types/workplace.types";
import {CompanyResponse} from "@/modules/companies/types/company.types";

export interface PositionResponse {
    id: string;
    name: string;
    description: string;
    status: boolean;
    companyId: string;
    company? : CompanyResponse;
    workplace?: WorkPlacesResponse;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export interface CreatePositionDTO {
    name: string;
    description: string;
    status: boolean;
    companyId: string;
    workplaceId: string;
};


export type UpdatePositionDTO = Partial<CreatePositionDTO>;