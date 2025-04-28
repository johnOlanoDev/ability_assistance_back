import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { RoleMenuService } from "../service/roleMenu.service";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";

@injectable()
export class RoleMenuController {
  constructor(
    @inject("RoleMenuService") private roleMenuService: RoleMenuService
  ) {}

  assignMenus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId } = req.params;
      const { menuIds } = req.body;
      await this.roleMenuService.assignMenusToRole(roleId, menuIds);
      sendResponseSuccess(res, 200, "Menús asignados al rol", null, true);
    } catch (error) {
      next(error);
    }
  };

  getMenusByRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId } = req.params;
      const menus = await this.roleMenuService.getMenusByRole(roleId);
      sendResponseSuccess(res, 200, "Menús del rol", menus, true);
    } catch (error) {
      next(error);
    }
  };

  getUnassignedMenus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { roleId } = req.params;
      const unassignedMenus = await this.roleMenuService.getUnnassignedMenus(
        roleId
      );
      sendResponseSuccess(
        res,
        200,
        "Menús no asignados al rol",
        unassignedMenus,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  removeMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId, menuId } = req.params;
      await this.roleMenuService.removeMenuFromRole(roleId, menuId);
      sendResponseSuccess(res, 200, "Menú removido del rol", null, true);
    } catch (error) {
      next(error);
    }
  };
}
