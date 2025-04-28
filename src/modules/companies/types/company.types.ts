export interface CompanyResponse {
  id: string;
  name: string;
  ruc: string;
  companyName: string;
  logo?: string | null;
  colorPrimary?: string | null;
  colorSecondary?: string | null;
  colorSidebar?: string | null;
  fontPrincipal?: string | null;
  fontSecondary?: string | null;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateCompanyDTO {
  name: string;
  ruc: string;
  companyName: string;
  logo?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  colorSidebar?: string;
  fontPrincipal?: string;
  fontSecondary?: string;
  status: boolean;
}

export type UpdateCompanyDto = Partial<CreateCompanyDTO>;
