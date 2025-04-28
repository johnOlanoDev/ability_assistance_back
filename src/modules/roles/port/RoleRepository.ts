import {
  CreateRoleDTO,
  RoleResponse,
  UpdateRoleDTO,
} from "../types/roles.types";

export interface IRoleRepository {
  getAllRoles(
    take: number,
    cursorId?: string,
    companyId?: string
  ): Promise<{ roles: RoleResponse[]; total: number }>;

  getRoleById(id: string, companyId?: string): Promise<RoleResponse | null>;

  findByNameRole(name: string, companyId?: string): Promise<RoleResponse[]>;

  createRole(roleData: CreateRoleDTO): Promise<RoleResponse>;

  updateRole(
    id: string,
    roleDataUpdated: UpdateRoleDTO,
    companyId?: string
  ): Promise<RoleResponse>;

  softDeleteRole(id: string, companyId?: string): Promise<RoleResponse>;

  isReservedRoleName(name: string): Promise<boolean>;
}
