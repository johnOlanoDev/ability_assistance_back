import { inject, injectable } from "tsyringe";
import { AppError } from "@/middleware/errors/AppError";
import { RoleRepository } from "@/modules/roles/repository/role.repository";
import { CompanyRepository } from "@/modules/companies/repository/company.repository";
import { CreateRoleDTO, RoleResponse } from "@/modules/roles/types/roles.types";

@injectable()
export class RoleValidator {
  constructor(
    @inject("RoleRepository") private roleRepository: RoleRepository,
    @inject("CompanyRepository") private companyRepository: CompanyRepository
  ) {}

  async validateExistsCompany(companyId: string): Promise<string | null> {
    const company = await this.companyRepository.getCompanyById(companyId);
    if (!company) throw new AppError("Empresa no encontrada", 404);
    return company.id;
  }

  async validateRoleExistsByCompany(
    roleId: string,
    companyId?: string
  ): Promise<RoleResponse> {
    const role = await this.roleRepository.getRoleById(roleId, companyId);
    if (!role) throw new AppError(`Rol no encontrado`, 404);

    // Validar que el rol pertenezca a la empresa del usuario a actualizar
    if (companyId && role.companyId !== companyId) {
      throw new AppError("El rol no pertenece a la empresa", 400);
    }

    return role;
  }

  async validateRoleExistsByName(name: string, companyId?: string): Promise<RoleResponse[]> {
    const role = await this.roleRepository.findByNameRole(name, companyId);
    if (!role) throw new AppError(`Rol no encontrado`, 404);

    return role;
  }

  async validateRoleCompanyId(roleData: CreateRoleDTO): Promise<void> {
    // Validar que el rol tenga companyId, excepto si es Superadmin
    if (!roleData.companyId && roleData.name !== "superadmin") {
      throw new AppError(
        "Rol inválido: Todos los roles deben pertenecer a una empresa",
        400
      );
    }
  }

  async validateRoleNameExists(
    name: string,
    companyId?: string
  ): Promise<void> {
    const role = await this.roleRepository.findByNameRole(name, companyId);

    if (role.some(name => name.name)) throw new AppError("El nombre del rol ya existe", 400);
  }

  async validateRoleNameUniqueIfUpdated(
    name?: string,
    excludeRoleId?: string
  ): Promise<void> {
    if (!name) return;

    const role = await this.roleRepository.findByNameRole(name);
    if (role && role.some((r) => r.id !== excludeRoleId)) {
      throw new AppError("El nombre del rol ya existe", 400);
    }

  }

  async validateRoleDelete(roleId: string): Promise<void> {
    const role = await this.roleRepository.getRoleById(roleId);
    if (!role?.status) throw new AppError("El rol ya ha sido eliminado", 400);
  }
}
