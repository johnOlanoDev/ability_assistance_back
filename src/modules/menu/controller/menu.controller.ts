import { inject, injectable } from "tsyringe";
import { NextFunction, Request, Response } from "express";
import { MenuService } from "../services/menu.service";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";

@injectable()
export class MenuController {
  constructor(@inject("MenuService") private menuService: MenuService) {}

  createMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { label, path, icon } = req.body;
      const menu = await this.menuService.createMenu(
        label,
        path,
        icon,
      );
      sendResponseSuccess(res, 201, "Menú creado", menu, true);
    } catch (error) {
      next(error);
    }
  };

  getMenusByRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const menus = await this.menuService.getMenusByRole(user);
      sendResponseSuccess(res, 200, "Menús obtenidos", menus, true);
    } catch (error) {
      next(error);
    }
  };

  getMenus = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const menus = await this.menuService.getMenus();
      sendResponseSuccess(res, 200, "Menús obtenidos", menus, true);
    } catch (error) {
      next(error);
    }
  };

  getMenuById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const menu = await this.menuService.getMenuById(id);
      sendResponseSuccess(res, 200, "Menú encontrado", menu, true);
    } catch (error) {
      next(error);
    }
  };

  updateMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const menu = await this.menuService.updateMenu(id, req.body);
      sendResponseSuccess(res, 200, "Menú actualizado", menu, true);
    } catch (error) {
      next(error);
    }
  };

  deleteMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.menuService.deleteMenu(id);
      sendResponseSuccess(res, 200, "Menú eliminado", null, true);
    } catch (error) {
      next(error);
    }
  };
}
