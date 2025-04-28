import { inject, injectable } from "tsyringe";
import { CompanyRepository } from "../repository/company.repository";
import { AppError } from "@/middleware/errors/AppError";

@injectable()
export class CompanyValidator {
  constructor(
    @inject("CompanyRepository") private companyRepository: CompanyRepository
  ) {}

  async validateExistingCompany(name: string): Promise<void> {
    const existingCompany = await this.companyRepository.getCompanyByName(name);

    const companyName =
      existingCompany && existingCompany.map((company) => company.name);

    if (existingCompany && existingCompany.length > 0)
      throw new AppError(
        `El nombre de la empresa '${companyName}' ya existe`,
        409
      );
  }

  async validateExistingCompanyName(name: string): Promise<void> {
    if (!name) throw new AppError("El nombre de la empresa es requerido", 400);

    const existingCompany =
      await this.companyRepository.getCompanyByCompanyName(name);
    const companyName =
      existingCompany && existingCompany.map((company) => company.name);

    if (existingCompany && existingCompany.length > 0)
      throw new AppError(`La razón social ${companyName} ya existe`, 409);
  }

  async validateExistingRuc(ruc: string): Promise<void> {
    if (!ruc) throw new AppError("El RUC de la empresa es requerido", 400);
    const existingRuc = await this.companyRepository.getCompanyByCompanyRuc(
      ruc
    );
    const rucName = existingRuc && existingRuc.map((company) => company.ruc);

    if (existingRuc && existingRuc.length > 0)
      throw new AppError(`El RUC ${rucName} ya existe`, 409);
  }

  async validateExistingId(id: string): Promise<void> {
    const existingId = await this.companyRepository.getCompanyById(id);

    if (!existingId)
      throw new AppError(`La empresa con el id ${id} no existe`, 404);
  }

  async validateSoftDelete(id: string): Promise<string | null> {
    const companyId = await this.companyRepository.getCompanyById(id);

    if (!companyId)
      throw new AppError(`La empresa con el id ${id} no existe`, 404);

    if (companyId && !companyId.status)
      throw new AppError(
        `La empresa ${companyId.name} ya se encuentra desactivada`
      );

    return companyId.id;
  }
}
