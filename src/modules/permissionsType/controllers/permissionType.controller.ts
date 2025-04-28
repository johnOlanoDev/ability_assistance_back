import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { PermissionTypeService } from "../services/permissionType.service";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";

@injectable()
export class PermissionTypeController {
  constructor(
    @inject("PermissionTypeService") private permissionTypeService: PermissionTypeService
  ) {}

  getAllPermissionsTypes = async (req: Request, res: Response, next: NextFunction) =>{
    try {
      const user = req.user;
      const permissionsTypes = await this.permissionTypeService.getAllPermissionsTypes(user);
      return sendResponseSuccess(res, 200, "Tipos de permisos obtenidos", permissionsTypes, true);
    } catch (error) {
      next(error);
    }
  }

  getPermissionTypeById = async (req: Request, res: Response, next: NextFunction)=> {
    try {
      const { id } = req.params;
      const user = req.user;
      const permissionType = await this.permissionTypeService.getPermissionTypeById(id, user);
      return sendResponseSuccess(res, 200, "Tipo de permiso obtenido", permissionType, true);
    } catch (error) {
      next(error);
    }

  }

  getPermissionTypeByName = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;
      const user = req.user;
      const permissionTypes = await this.permissionTypeService.getPermissionTypeByName(name, user);
      return sendResponseSuccess(res, 200, "Tipos de permisos obtenidos", permissionTypes, true);
    } catch (error) {
      next(error);
    }
  }

  createPermissionType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const permissionTypeData = req.body;
      const permissionType = await this.permissionTypeService.createPermissionType(permissionTypeData, user);
      return sendResponseSuccess(res, 201, "Tipo de permiso creado", permissionType, true);
    } catch (error) {
      next(error);
    }
  }

  updatePermissionType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const permissionTypeData = req.body;
      const permissionType = await this.permissionTypeService.updatePermissionType(id, permissionTypeData, user);
      return sendResponseSuccess(res, 200, "Tipo de permiso actualizado", permissionType, true);
    } catch (error) {
      next(error);
    }
  }

  deletePermissionType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const permissionType = await this.permissionTypeService.softDeletePermissionType(id, user);
      return sendResponseSuccess(res, 200, "Tipo de permiso eliminado", permissionType, true);
    } catch (error) {
      next(error);
    }
  }


 
}
