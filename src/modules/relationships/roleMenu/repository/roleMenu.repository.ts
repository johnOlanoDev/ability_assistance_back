import { inject, injectable } from "tsyringe";
import { PrismaClient, RoleMenu, Menu } from "@prisma/client";

@injectable()
export class RoleMenuRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  // ✅ Obtener todos los menús asignados a un rol
  async assignedMenus(roleId: string): Promise<RoleMenu[]> {
    return await this.prisma.roleMenu.findMany({
      where: { roleId },
    });
  }

  // ✅ Asignar múltiples menús a un rol (evitando duplicados)
  async assignMenusToRole(roleId: string, menuIds: string[]): Promise<void> {
    await this.prisma.roleMenu.createMany({
      data: menuIds.map((menuId) => ({
        roleId,
        menuId,
      })),
      skipDuplicates: true, // Evita duplicados automáticamente
    });
  }

  // ✅ Obtener los menús asignados a un rol con datos completos del menú
  async getMenusByRole(roleId: string): Promise<Menu[]> {
    return await this.prisma.menu.findMany({
      where: {
        roles: {
          some: { roleId },
        },
      },
    });
  }

  // ✅ Obtener los menús no asignados a un rol (consulta más eficiente)
  async getUnassignedMenus(roleId: string): Promise<Menu[]> {
    return await this.prisma.menu.findMany({
      where: {
        NOT: {
          roles: { some: { roleId } },
        },
        status: true,
      },
    });
  }

  // ✅ Eliminar un menú de un rol
  async removeMenuFromRole(roleId: string, menuId: string): Promise<void> {
    await this.prisma.roleMenu.deleteMany({
      where: {
        roleId,
        menuId,
      },
    });
  }
}
