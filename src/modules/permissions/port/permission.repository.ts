import {
  CreatePermissionDTO,
  PermissionResponse,
  UpdatePermissionDto,
} from "../types/permission.types";

export interface IPermissionRepository {
  getAllPermissions(
    companyId?: string
  ): Promise<{ permissions: PermissionResponse[]; total: number }>;

  getPermissionById(
    id: string,
    companyId?: string
  ): Promise<PermissionResponse | null>;

  getPermissionByName(
    name: string,
    companyId?: string
  ): Promise<PermissionResponse[] | null>;

  createPermission(
    permissionData: CreatePermissionDTO
  ): Promise<PermissionResponse>;

  updatePermission(
    id: string,
    permissionDataUpdated: UpdatePermissionDto,
    companyId?: string
  ): Promise<PermissionResponse>;

  softDeletePermission(
    id: string,
    companyId?: string
  ): Promise<PermissionResponse>;
}
