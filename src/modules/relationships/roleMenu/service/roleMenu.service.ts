import { inject, injectable } from "tsyringe";
import { Menu, RoleMenuRepository } from "../repository/roleMenu.repository";

@injectable()
export class RoleMenuService {
  constructor(
    @inject("RoleMenuRepository")
    private roleMenuRepository: RoleMenuRepository,
  ) {}

  // Asignar menús a un rol evitando duplicados
  async assignMenusToRole(roleId: string, menuIds: string[]): Promise<void> {
    const existingAssignments = await this.roleMenuRepository.assignedMenus(
      roleId
    );
    const existingMenuIds = new Set(existingAssignments.map((rm) => rm.menuId));

    const newMenus = menuIds.filter((menuId) => !existingMenuIds.has(menuId));
    if (newMenus.length === 0) return;

    await this.roleMenuRepository.assignMenusToRole(roleId, newMenus);
  }

  // Obtener menús no asignados a un rol de forma eficiente
  async getUnnassignedMenus(roleId: string): Promise<Menu[]> {
    return await this.roleMenuRepository.getUnassignedMenus(roleId);
  }

  // Obtener los menús asignados a un rol
  async getMenusByRole(roleId: string): Promise<Menu[]> {
    return this.roleMenuRepository.getMenusByRole(roleId);
  }

  // Remover un menú de un rol e invalidar caché
  async removeMenuFromRole(roleId: string, menuId: string): Promise<void> {
    await this.roleMenuRepository.removeMenuFromRole(roleId, menuId);
  }
}
