import { AppError } from "@/middleware/errors/AppError";
import { PermissionRepository } from "@/modules/permissions/repository/permission.repository";
import { RoleRepository } from "@/modules/roles/repository/role.repository";
import { PermissionUtils } from "@/utils/helper/permissions.helper";
import { inject } from "tsyringe";
import { injectable } from "tsyringe";
import { RolesPermissionsRepository } from "../repository/rolesPermissions.repository";

export type RolePermission = {
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  permissionId: string;
  roleId: string;
};

@injectable()
export class RolePermissionService {
  constructor(
    @inject("RolesPermissionsRepository")
    private rolePermissionRepository: RolesPermissionsRepository,
    @inject("RoleRepository") private roleRepository: RoleRepository,
    @inject("PermissionRepository")
    private permissionRepository: PermissionRepository,
    @inject("PermissionUtils") private permissionUtils: PermissionUtils
  ) {}

  // ✅ Obtener todas las asignaciones Role-Permission (solo para superadmin)
  async getAllRolePermissions(user: {
    roleId: string;
    companyId?: string;
  }): Promise<RolePermission[]> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    if (!isSuperAdmin) {
      throw new AppError(
        "Solo el superadmin puede acceder a esta información",
        403
      );
    }

    const rolePermissions = await this.rolePermissionRepository.findAll();
    return rolePermissions;
  }

  // ✅ Buscar una asignación específica Role-Permission
  async findByRoleAndPermission(
    roleId: string,
    permissionId: string,
    user: { roleId: string; companyId?: string }
  ) {
    const rolePermission =
      await this.rolePermissionRepository.findByRoleAndPermission(
        roleId,
        permissionId
      );
    if (!rolePermission) throw new AppError("Relación no encontrada", 404);

    return rolePermission;
  }

  // ✅ Asignar un permiso a un rol
  async assignPermissionToRole(
    roleId: string,
    permissionId: string,
    user: { roleId: string; companyId?: string }
  ) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    const role = await this.roleRepository.getRoleById(roleId);
    const permission = await this.permissionRepository.getPermissionById(
      permissionId
    );
    if (!role || !permission)
      throw new AppError("Rol o permiso no encontrado", 404);

    if (!isSuperAdmin && role.companyId !== user.companyId) {
      throw new AppError(
        "El rol/permiso no pertenece a tu empresa asignada",
        403
      );
    }

    const existing =
      await this.rolePermissionRepository.findByRoleAndPermission(
        roleId,
        permissionId
      );
    if (existing) throw new AppError("La asignación ya existe", 409);

    const createdData = await this.rolePermissionRepository.create({
      roleId,
      permissionId,
    });
    return createdData;
  }

  // ✅ Asignar múltiples permisos a un rol
  async assignMultiplePermissions(
    roleId: string,
    permissionIds: string[],
    user: { roleId: string; companyId?: string }
  ) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const role = await this.roleRepository.getRoleById(roleId);
    if (!role) throw new AppError("Rol no encontrado", 404);

    if (!isSuperAdmin && role.companyId !== user.companyId) {
      throw new AppError("No tienes acceso a esta empresa", 403);
    }

    await this.rolePermissionRepository.assignPermissionsToRole(
      roleId,
      permissionIds
    );
  }

  // ✅ Actualizar una asignación Role-Permission
  async updateRolePermission(
    roleId: string,
    permissionId: string,
    data: Partial<RolePermission>,
    user: { roleId: string; companyId?: string }
  ) {
    const existing =
      await this.rolePermissionRepository.findByRoleAndPermission(
        roleId,
        permissionId
      );
    if (!existing) throw new AppError("Relación no encontrada", 404);

    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    if (!isSuperAdmin && existing.roleId !== user.roleId) {
      throw new AppError("El rol/permiso no pertenece a tu empresa", 403);
    }

    const updatedData = await this.rolePermissionRepository.update(
      roleId,
      permissionId,
      data
    );

    return updatedData;
  }

  // ✅ Eliminar una asignación Role-Permission
  async deleteRolePermission(
    roleId: string,
    permissionId: string,
    user: { roleId: string; companyId?: string }
  ) {
    const existing =
      await this.rolePermissionRepository.findByRoleAndPermission(
        roleId,
        permissionId
      );
    if (!existing) throw new AppError("Relación no encontrada", 404);

    await this.rolePermissionRepository.delete(roleId, permissionId);
  }

  // ✅ Eliminar todos los permisos de un rol
  async deletePermissionsByRole(
    roleId: string,
    user: { roleId: string; companyId?: string }
  ) {
    const role = await this.roleRepository.getRoleById(roleId);
    if (!role) throw new AppError("Rol no encontrado", 404);

    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    if (!isSuperAdmin && role.companyId !== user.companyId) {
      throw new AppError("No tienes acceso a esta empresa", 403);
    }

    await this.rolePermissionRepository.deletePermissionsByRole(roleId);
  }
}
