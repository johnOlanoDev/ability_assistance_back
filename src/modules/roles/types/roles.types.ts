import { CompanyResponse } from "@/modules/companies/types/company.types";

export interface RoleResponse {

    id: string;
    name: string;
    description: string;
    companyId: string | null;
    company?: CompanyResponse | null;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;

}

export type CreateRoleDTO = {
    id?: string;
    name: string;
    description: string;
    companyId?: string | null;
    status: boolean
};


export type UpdateRoleDTO = Partial<CreateRoleDTO>;