import {CompanyResponse, CreateCompanyDTO, UpdateCompanyDto} from "../types/company.types";

export interface ICompanyRepository {
    getAllCompanies(
        take: number,
        cursorId?: string,
        companyId?: string,
    ): Promise<{ companies: CompanyResponse[]; total: number }>;

    getCompanyById(
        id: string,
    ): Promise<CompanyResponse | null>;

    getCompanyByName(
        name: string,
    ): Promise<CompanyResponse[] | null>;

    getCompanyByCompanyName(
        companyName: string,
    ): Promise<CompanyResponse[] | null>;

    getCompanyByCompanyRuc(
        ruc: string,
    ): Promise<CompanyResponse[] | null>;

    createCompany(
        companyData: CreateCompanyDTO,
    ): Promise<CompanyResponse>;

    updateCompany(
        id: string,
        companyDataUpdated: UpdateCompanyDto,
    ): Promise<CompanyResponse>;

    softDeleteCompany(id: string, companyId?: string): Promise<CompanyResponse>;
}