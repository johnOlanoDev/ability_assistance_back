import {
  RolePermissionsRequest,
  RolePermissionResponse,
  RolePermissionsUpdateRequest,
} from "../types/rolePermissions.types";

export interface IRolePermissionRepository {
  // interfaces/role-permission.port.ts
  create(data: RolePermissionsRequest): Promise<RolePermissionResponse>;
  update(
    roleId: string,
    permissionId: string,
    data: RolePermissionsUpdateRequest
  ): Promise<RolePermissionResponse>;
  delete(roleId: string, permissionId: string): Promise<void>;
  findByRoleAndPermission(
    roleId: string,
    permissionId: string
  ): Promise<RolePermissionResponse | null>;
}
