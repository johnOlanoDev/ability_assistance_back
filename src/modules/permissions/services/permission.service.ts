import { inject, injectable } from "tsyringe";
import { AppError } from "@/middleware/errors/AppError";
import { PermissionRepository } from "../repository/permission.repository";
import {
  CreatePermissionDTO,
  PermissionResponse,
  UpdatePermissionDto,
} from "../types/permission.types";
import { CompanyService } from "@/modules/companies/services/company.service";
import { PermissionUtils } from "@/utils/helper/permissions.helper";

@injectable()
export class PermissionService {
  constructor(
    @inject("PermissionRepository")
    private permissionRepository: PermissionRepository,
    @inject("CompanyService") private companyService: CompanyService,
    @inject("PermissionUtils") private permissionUtils: PermissionUtils
  ) {}

 
  async getAllPermissions(user: {
    roleId: string;
    companyId?: string;
  }): Promise<{ permissions: PermissionResponse[]; total: number }> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    return await this.permissionRepository.getAllPermissions(companyId);
  }

  async getPermissionById(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<PermissionResponse | null> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    const permission = await this.permissionRepository.getPermissionById(
      id,
      companyId
    );

    if (!permission) throw new AppError("El permiso no existe", 404);

    return permission;
  }

  async getPermissionByName(
    name: string,
    user: { roleId: string; companyId?: string }
  ): Promise<PermissionResponse[]> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    const permissions = await this.permissionRepository.getPermissionByName(
      name,
      companyId
    );

    if (permissions.length === 0) {
      throw new AppError("El permiso no existe", 404);
    }

    return permissions;
  }

  async createPermission(
    permissionData: CreatePermissionDTO,
    user: { roleId: string; companyId?: string }
  ): Promise<PermissionResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    let companyId: string;

    if (isSuperAdmin) {
      if (!permissionData.companyId) {
        throw new AppError(
          "Se requiere asignar una empresa al crear el permiso.",
          400
        );
      }
      companyId = permissionData.companyId;
    } else {
      if (!user.companyId) {
        throw new AppError("No tienes empresa asignada.", 400);
      }
      companyId = user.companyId;
    }

    await this.validatePermissionNameInCompany(permissionData.name, companyId);

    await this.validateCompanyExists(user, companyId);

    const createdPermission = await this.permissionRepository.createPermission({
      ...permissionData,
      companyId,
    });

    return createdPermission;
  }

  async updatePermission(
    id: string,
    permissionDataUpdated: UpdatePermissionDto,
    _user: { roleId: string; companyId?: string }
  ): Promise<PermissionResponse> {
    const existingPermission =
      await this.permissionRepository.getPermissionById(id, undefined);

    if (!existingPermission) {
      throw new AppError("El permiso no existe.", 404);
    }

    // No permitir cambiar la empresa del permiso
    if (existingPermission.companyId !== permissionDataUpdated.companyId) {
      if (existingPermission.companyId !== null) {
        throw new AppError(
          "No se puede cambiar la empresa de un permiso existente.",
          400
        );
      }
      if (permissionDataUpdated.companyId) {
        throw new AppError(
          "No se puede asignar una empresa a un permiso global.",
          400
        );
      }
    }

    // Validar duplicidad del nombre en la misma empresa (o global)
    if (
      permissionDataUpdated.name &&
      permissionDataUpdated.name !== existingPermission.name
    ) {
      const duplicatePermission =
        await this.permissionRepository.getPermissionName(
          permissionDataUpdated.name,
          existingPermission.companyId ?? undefined
        );

      if (duplicatePermission && duplicatePermission.id !== id) {
        throw new AppError(
          `Ya existe un permiso con el nombre "${permissionDataUpdated.name}" en la empresa asignada.`,
          400
        );
      }
    }

    const updatedPermission = await this.permissionRepository.updatePermission(
      id,
      permissionDataUpdated,
      existingPermission.companyId ?? undefined
    );

    return updatedPermission;
  }

  async deletePermission(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<PermissionResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    const existingPermission = isSuperAdmin
      ? await this.permissionRepository.getPermissionById(id)
      : await this.permissionRepository.getPermissionById(id, user.companyId);

    if (!existingPermission) throw new AppError("El permiso no existe", 404);

    if (!isSuperAdmin && existingPermission.companyId !== user.companyId) {
      throw new AppError("No tienes permiso para eliminar este permiso", 403);
    }

    const deletedPermission =
      await this.permissionRepository.softDeletePermission(id, user.companyId);
    return deletedPermission;
  }

  async validatePermissionNameInCompany(
    name: string,
    companyId: string,
    existingPermissionId?: string
  ): Promise<void> {
    const existingPermission = await this.permissionRepository.findByName(
      name,
      companyId,
      existingPermissionId
    );
    if (existingPermission.length > 0) {
      throw new AppError("El permiso ya existe en la empresa", 400);
    }
  }

  async validateCompanyExists(
    user: { roleId: string; companyId?: string },
    companyId?: string
  ): Promise<void> {
    if (!companyId) throw new AppError("La empresa no existe", 400);
    await this.companyService.getCompanyById(companyId, user);
  }
}
