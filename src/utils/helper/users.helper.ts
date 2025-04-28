import { AppError } from "@/middleware/errors/AppError";
import { PermissionRepository } from "@/modules/permissions/repository/permission.repository";
import { RoleRepository } from "@/modules/roles/repository/role.repository";
import { inject, injectable } from "tsyringe";

@injectable()
export class UserUtils {
  constructor(
    @inject("RoleRepository") private roleRepository: RoleRepository,
    @inject("PermissionRepository") private permissionRepository: PermissionRepository
  ) {}

  // Verificar si el usuario es Superadmin
  public async isSuperAdmin(roleId: string): Promise<boolean> {
    const role = await this.roleRepository.getRoleById(roleId);
    if (!role) throw new AppError("El rol no existe", 404);
    return role.name.toLowerCase().includes("superadmin");
  }

  // Verificar si el usuario tiene un permiso específico
  public async hasPermission(
    roleId: string,
    requiredPermission: string,
    companyId?: string | null
  ): Promise<boolean> {
    const isSuperAdmin = await this.isSuperAdmin(roleId);

    // Si es Superadmin, tiene todos los permisos
    if (isSuperAdmin) return true;

    // Obtener los permisos del usuario dentro de su empresa
    const userPermissions = await this.permissionRepository.getUserPermissions(roleId, companyId);

    // Verificar si el usuario tiene el permiso requerido
    if (!userPermissions.includes(requiredPermission)) {
      throw new AppError("No tienes permiso para realizar esta acción", 403);
    }

    return true;
  }

  // Verificar si el usuario tiene acceso a una empresa específica
  public async canAccessCompany(
    roleId: string,
    userCompanyId: string | null,
    targetCompanyId: string | null
  ): Promise<boolean> {
    const isSuperAdmin = await this.isSuperAdmin(roleId);

    // Si es Superadmin, puede acceder a cualquier empresa
    if (isSuperAdmin) return true;

    // Si no es Superadmin, solo puede acceder a su propia empresa
    if (userCompanyId && userCompanyId === targetCompanyId) {
      return true;
    }

    throw new AppError("No tienes permiso para acceder a esta empresa", 403);
  }

  // Validar si el usuario pertenece a una empresa
  public async validateUserCompany(
    userCompanyId: string | null,
    targetCompanyId: string
  ): Promise<void> {
    if (!userCompanyId || userCompanyId !== targetCompanyId) {
      throw new AppError("El usuario no pertenece a esta empresa", 403);
    }
  }

  // Validar si el usuario tiene un rol asignado
  public async validateUserRole(roleId: string): Promise<void> {
    const role = await this.roleRepository.getRoleById(roleId);
    if (!role) throw new AppError("El rol del usuario no existe", 404);
    if (!role.status) throw new AppError("El rol del usuario está deshabilitado", 403);
  }
}