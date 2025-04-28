import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { PermissionService } from "../services/permission.service";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";

@injectable()
export class PermissionController {
  constructor(
    @inject("PermissionService") private permissionService: PermissionService
  ) {}

  // Obtener todos los permisos
  getAllPermissions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;
      const permissions = await this.permissionService.getAllPermissions(user);

      sendResponseSuccess(
        res,
        200,
        "Permisos obtenidos exitosamente",
        permissions,
        true
      );
    } catch (error) {
      next(error);
    }
  };
  // Obtener un permiso por ID
  getPermissionById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const permission = await this.permissionService.getPermissionById(
        id,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Permiso obtenido correctamente",
        permission,
        true
      );
      return;
    } catch (error) {
      next(error);
    }
  };

  // Obtener permisos por nombre
  getPermissionByName = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { name } = req.query;
      const user = req.user;
      const permissionName = name as string;

      const permissions = await this.permissionService.getPermissionByName(
        permissionName,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Permisos obtenidos exitosamente",
        permissions,
        true
      );
      return;
    } catch (error) {
      next(error);
    }
  };

  // Crear un nuevo permiso
  createPermission = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { name, description, status, companyId } = req.body;
      const user = req.user;

      const newPermission = await this.permissionService.createPermission(
        { name, description, status, companyId },
        user
      );

      sendResponseSuccess(
        res,
        201,
        "Permiso creado exitosamente",
        newPermission,
        true
      );
      return;
    } catch (error) {
      next(error);
    }
  };

  // Actualizar un permiso
  updatePermission = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const permissionDataUpdated = req.body;
      const user = req.user;

      const updatedPermission = await this.permissionService.updatePermission(
        id,
        permissionDataUpdated,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Permisos actualizado exitosamente",
        updatedPermission,
        true
      );
      return;
    } catch (error) {
      next(error);
    }
  };

  // Eliminar un permiso
  deletePermission = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const deletedPermission = await this.permissionService.deletePermission(
        id,
        user
      );
      sendResponseSuccess(
        res,
        200,
        "Permisos eliminado exitosamente",
        deletedPermission,
        true
      );
      return;
    } catch (error) {
      next(error);
    }
  };
}
