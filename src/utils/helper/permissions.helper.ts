import { AppError } from "@/middleware/errors/AppError";
import { CompanyRepository } from "@/modules/companies/repository/company.repository";
import { PermissionRepository } from "@/modules/permissions/repository/permission.repository";
import { RoleRepository } from "@/modules/roles/repository/role.repository";
import { inject, injectable } from "tsyringe";

@injectable()
export class PermissionUtils {
  constructor(
    @inject("RoleRepository") private roleRepository: RoleRepository,
    @inject("CompanyRepository") private companyRepository: CompanyRepository,
    @inject("PermissionRepository")
    private permissionRepository: PermissionRepository
  ) {}

  // Verificar si el usuario es Superadmin
  public async isSuperAdmin(roleId: string): Promise<boolean> {
    const role = await this.roleRepository.getRoleById(roleId);
    if (!role) throw new AppError("El rol no existe", 404);
    return role.name === "Superadmin" || role.name === "superadmin";
  }

  // Verificar si el usuario es Admin
  public async isAdmin(roleId: string): Promise<boolean> {
    const role = await this.roleRepository.getRoleById(roleId);
    if (!role) throw new AppError("El rol no existe", 404);
    return role.name === "Administrador" || role.name === "administrador";
  }

  // Validar la existencia de la empresa
  public async validateCompanyExists(companyId?: string): Promise<void> {
    if (!this.isSuperAdmin) {
      if (!companyId) throw new AppError("La empresa no existe", 400);
      await this.companyRepository.getCompanyById(companyId);
    }
  }

  public async hasPermission(
    userRoleId: string,
    requiredPermission: string,
    companyId?: string | null
  ): Promise<boolean> {
    const isSuperAdmin = await this.isSuperAdmin(userRoleId);

    // Si es Superadmin, tiene todos los permisos
    if (isSuperAdmin) return true;

    // Obtener los permisos del usuario dentro de su empresa
    const userPermissions = await this.permissionRepository.getUserPermissions(
      userRoleId,
      companyId
    );

    // Verificar si el usuario tiene el permiso requerido
    if (!userPermissions.includes(requiredPermission)) {
      throw new AppError("No tienes permiso para realizar esta acción", 403);
    }

    return true;
  }

  // Verificar si el usuario tiene permiso para acceder a una empresa específica
  public async canAccessCompany(
    userRoleId: string,
    userCompanyId: string | undefined,
    targetCompanyId: string
  ): Promise<boolean> {
    const isSuperAdmin = await this.isSuperAdmin(userRoleId);

    // Si es Superadmin, puede acceder a cualquier empresa
    if (isSuperAdmin) return true;

    // Si no es Superadmin, solo puede acceder a su propia empresa
    if (userCompanyId && userCompanyId === targetCompanyId) {
      return true;
    }

    throw new AppError("No tienes permiso para acceder a esta empresa", 403);
  }

  // Verificar si el usuario puede crear empresas
  public async canCreateCompany(roleId: string): Promise<boolean> {
    const isSuperAdmin = await this.isSuperAdmin(roleId);

    if (!isSuperAdmin) {
      throw new AppError("No tienes permiso para crear empresas", 403);
    }

    return true;
  }

  // Verificar si el usuario puede actualizar una empresa
  public async canUpdateCompany(
    roleId: string,
    userCompanyId: string | undefined,
    targetCompanyId: string
  ): Promise<boolean> {
    const isSuperAdmin = await this.isSuperAdmin(roleId);

    // Si es Superadmin, puede actualizar cualquier empresa
    if (isSuperAdmin) return true;

    // Si no es Superadmin, solo puede actualizar su propia empresa
    if (userCompanyId && userCompanyId === targetCompanyId) {
      return true;
    }

    throw new AppError("No tienes permiso para actualizar esta empresa", 403);
  }

  // Verificar si el usuario puede eliminar una empresa
  public async canDeleteCompany(roleId: string): Promise<boolean> {
    const isSuperAdmin = await this.isSuperAdmin(roleId);

    if (!isSuperAdmin) {
      throw new AppError("No tienes permiso para eliminar empresas", 403);
    }

    return true;
  }
}
