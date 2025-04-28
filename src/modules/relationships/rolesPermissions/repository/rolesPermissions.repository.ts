import { inject, injectable } from "tsyringe";
import { PrismaClient, RolePermission } from "@prisma/client";

@injectable()
export class RolesPermissionsRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  // ✅ Obtener todas las relaciones Role-Permission
  async findAll(): Promise<RolePermission[]> {
    return await this.prisma.rolePermission.findMany({
      include: {
        permission: true,
        role: true,
      },
    });
  }

  // ✅ Buscar una relación Role-Permission específica
  async findByRoleAndPermission(
    roleId: string,
    permissionId: string
  ): Promise<RolePermission | null> {
    return await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
  }

  // ✅ Asignar un permiso a un rol (evita duplicados)
  async create(data: { roleId: string; permissionId: string }): Promise<RolePermission> {
    return await this.prisma.rolePermission.create({ data });
  }

  // ✅ Asignar múltiples permisos a un rol (evita duplicados)
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });
  }

  // ✅ Obtener permisos asignados a un rol
  async getPermissionsByRole(roleId: string): Promise<RolePermission[]> {
    return await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true }, // Trae los datos completos del permiso
    });
  }

  // ✅ Actualizar una relación Role-Permission
  async update(
    roleId: string,
    permissionId: string,
    data: Partial<RolePermission>
  ): Promise<RolePermission> {
    return await this.prisma.rolePermission.update({
      where: { roleId_permissionId: { roleId, permissionId } },
      data,
      include: {
        permission: true,
        role: true,
      },
    });
  }

  // ✅ Eliminar una relación Role-Permission
  async delete(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
  }

  // ✅ Eliminar todos los permisos de un rol
  async deletePermissionsByRole(roleId: string): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });
  }
}
