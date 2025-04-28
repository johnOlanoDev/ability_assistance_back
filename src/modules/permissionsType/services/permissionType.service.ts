import { inject, injectable } from "tsyringe";
import { AppError } from "@/middleware/errors/AppError";
import {
  CreatePermissionType,
  PermissionTypeResponse,
  UpdatePermissionTypeDto,
} from "../types/permissionTypes.types";
import { CompanyService } from "@/modules/companies/services/company.service";
import { RoleRepository } from "@/modules/roles/repository/role.repository";
import { PermissionTypeRepository } from "../repository/permissionType.repository";
import { PermissionUtils } from "@/utils/helper/permissions.helper";

@injectable()
export class PermissionTypeService {
  constructor(
    @inject("PermissionTypeRepository")
    private permissionTypeRepository: PermissionTypeRepository,
    @inject("RoleRepository") private rolePermissionRepository: RoleRepository,
    @inject("CompanyService") private companyService: CompanyService,
    @inject("PermissionUtils") private permissionUtils: PermissionUtils
  ) {}

  async getAllPermissionsTypes(user: {
    roleId: string;
    companyId?: string;
  }): Promise<PermissionTypeResponse[]> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    return this.permissionTypeRepository.getAllPermissionsTypes(companyId);
  }

  async getPermissionTypeById(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<PermissionTypeResponse | null> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    const permissionType =
      await this.permissionTypeRepository.getPermissionById(id, companyId);

    if (!permissionType)
      throw new AppError("El tipo de permiso no existe", 404);

    return permissionType;
  }

  async getPermissionTypeByName(
    name: string,
    user: { roleId: string; companyId?: string }
  ): Promise<PermissionTypeResponse[]> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    const permissionTypes =
      await this.permissionTypeRepository.getPermissionByName(name, companyId);

    if (!permissionTypes)
      throw new AppError("El tipo de permiso no existe", 404);

    return permissionTypes;
  }

  async createPermissionType(
    data: CreatePermissionType,
    user: { roleId: string; companyId?: string }
  ): Promise<PermissionTypeResponse> {
    try {
      // Validar si el usuario es superadministrador
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
      const companyId = isSuperAdmin ? undefined : user.companyId;

      // Validar que el nombre sea único dentro de la compañía
      const existingPermission = await this.permissionTypeRepository.findByName(
        data.name,
        companyId
      );
      if (existingPermission) {
        throw new AppError(
          "Ya existe un tipo de permiso con este nombre en la compañía",
          400
        );
      }

      // Validar la duración del permiso
      if (data.duration < 1 || data.duration > 30) {
        throw new AppError(
          "La duración del permiso debe estar entre 1 y 30 días",
          400
        );
      }

      // Validar la longitud de la descripción
      if (data.description && data.description.length > 50) {
        throw new AppError(
          "La descripción no debe exceder los 50 caracteres",
          400
        );
      }

      // Validar la existencia de la compañía (si se proporciona)
      if (data.companyId) {
        const companyExists = await this.companyService.getCompanyById(
          data.companyId,
          user
        );
        if (!companyExists) {
          throw new AppError("La compañía especificada no existe", 404);
        }
      }

      // Crear el tipo de permiso
      const permissionType =
        await this.permissionTypeRepository.createPermission({
          ...data,
          companyId: companyId || null, // Compañía opcional
          status: true, // Estado por defecto activo
        });

      return permissionType;
    } catch (error) {
      console.error("Error creating permission type:", error);
      throw new AppError("Error interno del servidor", 500);
    }
  }

  async updatePermissionType(
    id: string,
    data: UpdatePermissionTypeDto,
    user: { roleId: string; companyId?: string }
  ): Promise<PermissionTypeResponse> {
    try {
      // Validar si el usuario es superadministrador
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
      const companyId = isSuperAdmin ? undefined : user.companyId;

      // Verificar si el tipo de permiso existe
      const existingPermission =
        await this.permissionTypeRepository.getPermissionById(id, companyId);
      if (!existingPermission) {
        throw new AppError("El tipo de permiso no existe", 404);
      }

      // Validar que no haya registros de asistencia activos asociados
      const hasActiveRecords =
        await this.permissionTypeRepository.hasActiveAttendanceRecords(id);
      if (hasActiveRecords) {
        throw new AppError(
          "No se puede actualizar un tipo de permiso asociado a registros de asistencia activos",
          400
        );
      }

      // Validar que el nombre sea único dentro de la compañía
      if (data.name && data.name !== existingPermission.name) {
        const duplicatePermission =
          await this.permissionTypeRepository.findByName(data.name, companyId);
        if (duplicatePermission) {
          throw new AppError(
            "Ya existe un tipo de permiso con este nombre en la compañía",
            400
          );
        }
      }

      // Validar la duración del permiso
      if (
        data.duration !== undefined &&
        (data.duration < 1 || data.duration > 30)
      ) {
        throw new AppError(
          "La duración del permiso debe estar entre 1 y 30 días",
          400
        );
      }

      // Validar la longitud de la descripción
      if (data.description && data.description.length > 50) {
        throw new AppError(
          "La descripción no debe exceder los 50 caracteres",
          400
        );
      }

      // Validar la existencia de la compañía (si se proporciona)
      if (data.companyId) {
        const companyExists = await this.companyService.getCompanyById(
          data.companyId,
          user
        );
        if (!companyExists) {
          throw new AppError("La compañía especificada no existe", 404);
        }
      }

      // Actualizar el tipo de permiso
      const updatedPermission =
        await this.permissionTypeRepository.updatePermission(id, {
          ...data,
          companyId: data.companyId || existingPermission.companyId, // Mantener el valor anterior si no se proporciona
        });

      return updatedPermission;
    } catch (error) {
      console.error("Error updating permission type:", error);
      throw new AppError("Error interno del servidor", 500);
    }
  }

  async softDeletePermissionType(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<void> {
    try {
      // Verificar si el usuario es superadministrador
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
      const companyId = isSuperAdmin ? undefined : user.companyId;

      // Verificar si el tipo de permiso existe
      const existingPermission =
        await this.permissionTypeRepository.getPermissionById(id, companyId);
      if (!existingPermission) {
        throw new AppError("El tipo de permiso no existe", 404);
      }

      // Validar que no haya registros de asistencia activos asociados
      const hasActiveRecords =
        await this.permissionTypeRepository.hasActiveAttendanceRecords(id);
      if (hasActiveRecords) {
        throw new AppError(
          "No se puede eliminar o desactivar un tipo de permiso asociado a registros de asistencia activos",
          400
        );
      }

      // Realizar la eliminación lógica o desactivación
      await this.permissionTypeRepository.softDeletePermission(id);
    } catch (error) {
      console.error("Error deleting permission type:", error);
      throw new AppError("Error interno del servidor", 500);
    }
  }
}
