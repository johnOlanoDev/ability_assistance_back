import { inject, injectable } from "tsyringe";
import { MenuRepository } from "../repository/menu.repository";
import { AppError } from "@/middleware/errors/AppError";

@injectable()
export class MenuService {
  constructor(
    @inject("MenuRepository") private menuRepository: MenuRepository
  ) {}

  async createMenu(label: string, path: string, icon: string) {
    const trimmedPath = path.trim().toLowerCase();

    const existingMenu = await this.menuRepository.getMenuByPath(trimmedPath);
    if (existingMenu) throw new AppError("El path ya existe", 400);

    const newMenu = await this.menuRepository.createMenu({
      label,
      path: trimmedPath,
      icon,
    });

    return newMenu;
  }

  async getMenus() {
    const menus = await this.menuRepository.getAllMenus();
    return menus;
  }

  async getMenusByRole(user: { roleId: string }) {
    const menus = await this.menuRepository.getMenusByRole(user.roleId);
    return menus;
  }

  async getMenuById(id: string) {
    const menu = await this.menuRepository.getMenuById(id);
    if (!menu) throw new AppError("Menú no encontrado", 404);

    return menu;
  }

  async updateMenu(
    id: string,
    data: { label?: string; path?: string; icon?: string; status?: boolean }
  ) {
    const menu = await this.menuRepository.getMenuById(id);
    if (!menu) throw new AppError("Menú no encontrado", 404);

    if (data.path) {
      const trimmedPath = data.path.trim().toLowerCase();
      if (trimmedPath !== menu.path) {
        const existingPath = await this.menuRepository.getMenuByPath(
          trimmedPath
        );
        if (existingPath) throw new AppError("El path ya existe", 400);
        data.path = trimmedPath;
      }
    }

    const updatedMenu = await this.menuRepository.updateMenu(id, data);
    return updatedMenu;
  }

  async deleteMenu(id: string) {
    const menu = await this.menuRepository.getMenuById(id);
    if (!menu) throw new AppError("Menú no encontrado", 404);

    const assignedRoles = await this.menuRepository.getRolesByMenuId(id);
    if (assignedRoles.length > 0) {
      throw new AppError("No puedes eliminar un menú asignado a roles.", 400);
    }

    await this.menuRepository.deleteMenu(id);
  }
}
