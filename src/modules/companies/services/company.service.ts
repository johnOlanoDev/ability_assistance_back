import { inject, injectable } from "tsyringe";
import { CompanyRepository } from "../repository/company.repository";
import {
  CompanyResponse,
  CreateCompanyDTO,
  UpdateCompanyDto,
} from "../types/company.types";
import { AppError } from "@/middleware/errors/AppError";
import { PermissionUtils } from "@/utils/helper/permissions.helper";
import { logger } from "@/logger/logger";
import { UserRepository } from "@/modules/users/repository/user.repository";

@injectable()
export class CompanyService {
  constructor(
    @inject("CompanyRepository") private companyRepository: CompanyRepository,
    @inject("PermissionUtils") private permissionUtils: PermissionUtils,
    @inject("UserRepository") private userRepository: UserRepository
  ) {}

  // Obtener todas las empresas
  async getAllCompanies(
    take: number,
    user: { roleId: string; companyId?: string },
    cursorId?: string
  ): Promise<{ companies: CompanyResponse[]; total: number }> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    if (isSuperAdmin) {
      return this.companyRepository.getAllCompanies(take, cursorId);
    }

    if (!user.companyId) {
      throw new AppError("No tienes permiso para ver empresas", 403);
    }

    const data = await this.companyRepository.getAllCompanies(
      take,
      cursorId,
      user.companyId
    );

    return data;
  }

  // Obtener empresas eliminadas
  async getAllCompaniesByDeleted(user: {
    roleId: string;
    companyId?: string;
  }): Promise<CompanyResponse[] | null> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    if (isSuperAdmin) {
      return this.companyRepository.getAllCompanieByDeleted();
    }

    if (!user.companyId) {
      throw new AppError("No tienes permiso para ver empresas", 403);
    }

    const data = await this.companyRepository.getAllCompanieByDeleted(
      user.companyId
    );

    return data;
  }

  // Obtener empresa por ID
  async getCompanyById(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<CompanyResponse> {
    await this.permissionUtils.canAccessCompany(
      user.roleId,
      user.companyId,
      id
    );

    const company = await this.companyRepository.getCompanyById(id);
    if (!company) throw new AppError("La empresa no existe", 404);

    return company;
  }

  // Crear empresa
  async createCompany(
    companyData: CreateCompanyDTO,
    user: { roleId: string }
  ): Promise<CompanyResponse> {
    await this.permissionUtils.canCreateCompany(user.roleId);

    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    if (!isSuperAdmin) {
      throw new AppError("No tienes permiso para crear empresas", 403);
    }

    // Validar unicidad de campos
    const [existingRuc, existingName, existingCompanyName] = await Promise.all([
      this.companyRepository.findByRuc(companyData.ruc),
      this.companyRepository.findByName(companyData.name),
      this.companyRepository.findByCompanyName(companyData.companyName),
    ]);

    console.log(existingRuc);

    if (existingRuc) throw new AppError("El RUC ya está registrado", 400);
    if (existingName)
      throw new AppError("El nombre de la empresa ya existe", 400);
    if (existingCompanyName)
      throw new AppError("El nombre comercial ya está en uso", 400);

    const newCompany = await this.companyRepository.createCompany(companyData);

    return newCompany;
  }

  // Actualizar empresa
  async updateCompany(
    id: string,
    companyDataUpdated: UpdateCompanyDto,
    user: { roleId: string; companyId?: string }
  ): Promise<CompanyResponse> {
    // Verificar permisos
    await this.permissionUtils.canAccessCompany(
      user.roleId,
      user.companyId,
      id
    );
    await this.permissionUtils.canUpdateCompany(
      user.roleId,
      user.companyId,
      id
    );

    const existingCompany = await this.companyRepository.getCompanyById(id);
    if (!existingCompany) throw new AppError("La empresa no existe", 404);

    // Validar campos únicos (solo si se modifican)
    if (companyDataUpdated.ruc) {
      const isRucTaken = await this.companyRepository.findByRuc(
        companyDataUpdated.ruc,
        id
      );
      if (isRucTaken)
        throw new AppError(
          `El RUC "${companyDataUpdated.ruc}" ya está registrado`,
          400
        );
    }

    if (companyDataUpdated.name) {
      const isNameTaken = await this.companyRepository.findByName(
        companyDataUpdated.name,
        id
      );
      if (isNameTaken)
        throw new AppError(
          `El nombre "${companyDataUpdated.name}" ya existe`,
          400
        );
    }

    if (companyDataUpdated.companyName) {
      const isCompanyNameTaken = await this.companyRepository.findByCompanyName(
        companyDataUpdated.companyName,
        id
      );
      if (isCompanyNameTaken)
        throw new AppError(
          `El nombre comercial "${companyDataUpdated.companyName}" ya está en uso`,
          400
        );
    }

    // Actualizar empresa
    const updatedCompany = await this.companyRepository.updateCompany(
      id,
      companyDataUpdated
    );

    return updatedCompany;
  }

  // Eliminar empresa
  async deleteCompany(
    id: string,
    user: { roleId: string }
  ): Promise<CompanyResponse> {
    await this.permissionUtils.canDeleteCompany(user.roleId);

    const existingCompany = await this.companyRepository.getCompanyById(id);
    if (!existingCompany) throw new AppError("La empresa no existe", 404);

    const deletedCompany = await this.companyRepository.softDeleteCompany(id);

    return deletedCompany;
  }

  async validateUserInCompany(
    user: { userId: string, roleId: string; companyId?: string },
    companyId?: string,
  ): Promise<void> {

    const isSuperAdmin = this.permissionUtils.isSuperAdmin(user.roleId)

    // 1. Obtener el usuario usando el servicio de usuarios (con permisos)
    const existingUSer = await this.userRepository.getUserById(user.userId);

    // 2. Si el usuario no existe o no es accesible, lanzar error
    if (!existingUSer) {
      throw new AppError("Usuario no encontrado o no tienes acceso", 404);
    }

    // 3. Verificar que el usuario pertenezca a la compañía especificada
    if (!isSuperAdmin && existingUSer.companyId !== companyId) {
      throw new AppError("El usuario no pertenece a esta compañía", 400);
    }
  }
}
