import { inject, injectable } from "tsyringe";
import { Response, Request, NextFunction } from "express";
import { RolePermissionService } from "../services/rolesPermissions.service";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";

@injectable()
export class RolePermissionController {
  constructor(
    @inject("RolePermissionService")
    private rolePermissionService: RolePermissionService
  ) {}

  //Obtener todo los permisos
  getRolePermissions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;

      const rolePermissions =
        await this.rolePermissionService.getAllRolePermissions(user);

      sendResponseSuccess(
        res,
        200,
        "Roles con Permisos obtenido exitosamente",
        rolePermissions,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Obtener todos los permisos asignados a un rol
  getPermissionsByRoleId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { roleId, permissionId } = req.params;
      const user = req.user;
      const rolePermissions =
        await this.rolePermissionService.findByRoleAndPermission(
          roleId,
          permissionId,
          user
        );

      sendResponseSuccess(res, 200, "Permisos encontrados.", rolePermissions, true);
    } catch (error) {
      next(error);
    }
  };

  // Asignar un permiso a un rol
  assignPermissionToRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { roleId, permissionId } = req.body;
      const user = req.user;

      const rolePermissions =
        await this.rolePermissionService.assignPermissionToRole(roleId, permissionId, user);

      sendResponseSuccess(
        res,
        201,
        "Permiso asignado exitosamente.",
        rolePermissions,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Actualizar la relación entre un rol y un permiso
  updateRolePermission = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { roleId, permissionId } = req.params;
      const updateUser = req.body;
      const user = req.user;

      const rolePermissions =
        await this.rolePermissionService.updateRolePermission(
          roleId,
          permissionId,
          updateUser,
          user
        );

      sendResponseSuccess(
        res,
        200,
        "Relación actualizada exitosamente.",
        rolePermissions,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Eliminar la relación entre un rol y un permiso
  deleteRolePermission = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { roleId, permissionId } = req.params;
      const user = req.user;

      await this.rolePermissionService.deleteRolePermission(
        roleId,
        permissionId,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Asignación eliminada exitosamente",
        null,
        true
      );
    } catch (error) {
      next(error);
    }
  };
}
