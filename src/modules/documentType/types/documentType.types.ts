import { CompanyResponse } from "@/modules/companies/types/company.types";

export interface DocumentTypeResponse {

    id: string,
    name: string,
    status: boolean,
    companyId: string;
    company?: CompanyResponse,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null
}

export interface CreateDocumentType {

    name: string;
    status: boolean;
    companyId: string;
}


export type UpdateDocumentType = Partial<CreateDocumentType>;