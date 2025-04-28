import { PermissionResponse } from "@/modules/permissions/types/permission.types";
import { RoleResponse } from "@/modules/roles/types/roles.types";

export interface RolePermissionResponse {
  roleId: string;
  permissionId: string;
  role?: RoleResponse | null;
  permission?: PermissionResponse | null;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deleteAt?: Date | null
}

export interface RolePermissionsRequest {
  roleId: string;
  permissionId: string;
  status?: boolean;
}

export type RolePermissionsUpdateRequest = Partial<RolePermissionsRequest>;