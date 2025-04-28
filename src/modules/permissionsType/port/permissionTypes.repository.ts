import {
  CreatePermissionType,
  PermissionTypeResponse,
  UpdatePermissionTypeDto,
} from "../types/permissionTypes.types";

export interface IPermissionTypeRepository {
  getAllPermissionsTypes(companyId?: string): Promise<PermissionTypeResponse[]>;

  getPermissionById(
    id: string,
    companyId?: string
  ): Promise<PermissionTypeResponse | null>;

  getPermissionByName(
    name: string,
    companyId?: string
  ): Promise<PermissionTypeResponse[] | null>;

  createPermission(
    permissionData: CreatePermissionType
  ): Promise<PermissionTypeResponse>;

  updatePermission(
    id: string,
    permissionDataUpdated: UpdatePermissionTypeDto,
    companyId?: string
  ): Promise<PermissionTypeResponse>;

  softDeletePermission(
    id: string,
    companyId?: string
  ): Promise<PermissionTypeResponse>;
}
