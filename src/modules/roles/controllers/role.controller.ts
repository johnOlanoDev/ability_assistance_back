import { inject, injectable } from "tsyringe";
import { NextFunction, Request, Response } from "express";
import { RolesService } from "../services/roles.service";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";

@injectable()
export class RoleController {
  constructor(
    @inject("RolesService") private readonly rolesService: RolesService
  ) {}

  // 1. Obtener todos los roles
  getAllRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { take = 10, cursorId } = req.query;
      const cursor = cursorId as string;
      const user = req.user;

      const roles = await this.rolesService.getAllRoles(
        parseInt(take as string, 10),
        user,
        cursor
      );

      sendResponseSuccess(res, 200, "Roles obtenidos exitosamente", roles, true);
    } catch (error) {
      next(error);
    }
  };

  // 1. Obtener todos los roles eliminados
  getAllRolesByDeleted = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { take = 10, cursorId } = req.query;
      const cursor = cursorId as string;
      const user = req.user;

      const roles = await this.rolesService.getAllRolesByDeleted(
        parseInt(take as string, 10),
        user,
        cursor
      );

      sendResponseSuccess(res, 200, "Roles eliminados obtenidos exitosamente", roles, true);
    } catch (error) {
      next(error);
    }
  };

  // 2. Obtener un rol por ID
  getRoleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const role = await this.rolesService.getRoleById(id, user);

      sendResponseSuccess(res, 200, "Rol obtenido correctamente", role, true);
    } catch (error) {
      next(error);
    }
  };

  // Buscar un rol por nombre
  findRoleByName = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;
      const user = req.user;

      // Buscar el rol por nombre y companyId
      const role = await this.rolesService.getRoleByName(name, user);

      sendResponseSuccess(res, 200, "Rol obtenido correctamente", role, true);
    } catch (error) {
      next(error);
    }
  };

  // 3. Crear un nuevo rol
  createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.body;
      const user = req.user;

      const newRole = await this.rolesService.createRole(role, user);

      sendResponseSuccess(res, 201, "Rol creado exitosamente", newRole, true);
    } catch (error) {
      next(error);
    }
  };

  // Actualizar un rol
  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const roleDataUpdated = req.body;
      const user = req.user;

      const updatedRole = await this.rolesService.updateRole(
        id,
        roleDataUpdated,
        user
      );

      sendResponseSuccess(res, 200, "Rol actualizado exitosamente", updatedRole, true);
    } catch (error) {
      next(error);
    }
  };

  // Eliminar un rol
  deleteRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const deletedRole = await this.rolesService.deleteRole(id, user);

      sendResponseSuccess(res, 200, "Rol eliminado exitosamente", deletedRole, true);
    } catch (error) {
      next(error);
    }
  };
}
