import {CompanyResponse} from "@/modules/companies/types/company.types";

export interface WorkPlacesResponse {
    id: string;
    name: string;
    status: boolean;
    companyId: string;
    company?: CompanyResponse;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export type CreateWorkPlacesDTO = {
    name: string;
    status: boolean;
    companyId: string;
};

export type UpdateWorkPlacesDTO = Partial<CreateWorkPlacesDTO>