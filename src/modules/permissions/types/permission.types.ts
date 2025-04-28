import { CompanyResponse } from "@/modules/companies/types/company.types";

export interface PermissionResponse {
    id: string;
    name: string;
    description: string;
    module?: string | null;
    status: boolean;
    companyId: string | null;
    company?: CompanyResponse | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}


export interface CreatePermissionDTO {
    name: string;
    description: string;
    module?: string;
    status: boolean;
    companyId?: string;
}


export type UpdatePermissionDto = Partial<CreatePermissionDTO>;