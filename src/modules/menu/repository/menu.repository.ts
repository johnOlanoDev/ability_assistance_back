import { inject, injectable } from "tsyringe";
import { Menu, PrismaClient, Role } from "@prisma/client";

@injectable()
export class MenuRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async createMenu(data: { label: string; path: string; icon: string}): Promise<Menu> {
    return await this.prisma.menu.create({
      data: {
        label: data.label,
        path: data.path,
        icon: data.icon,
      },
    });
  }

  async getMenusByRole(roleId: string) {
    return await this.prisma.menu.findMany({
      where: {
        roles: { 
          some: { roleId },
        },
      },
    });
  }
  
  async getRolesByMenuId(id: string): Promise<Role[]> {
    return await this.prisma.role.findMany({
      where: {
        RoleMenu: {
          some: { menuId: id },
        },
      },
    });
  }

  async getAllMenus(): Promise<Menu[]> {
    return await this.prisma.menu.findMany({ where: { status: true } });
  }

  async getMenuByPath(path: string): Promise<Menu | null> {
    return await this.prisma.menu.findUnique({ where: { path } });
  }

  async getMenuById(id: string): Promise<Menu | null> {
    return await this.prisma.menu.findUnique({ where: { id } });
  }

  async updateMenu(id: string, data: { label?: string; path?: string; icon?: string; status?: boolean }): Promise<Menu> {
    return await this.prisma.menu.update({
      where: { id },
      data,
    });
  }

  async deleteMenu(id: string): Promise<void> {
    await this.prisma.menu.update({
      where: { id },
      data: { status: false }, // Soft delete
    });
  }
}

