import { inject, injectable } from "tsyringe";
import {
  CreateRoleDTO,
  RoleResponse,
  UpdateRoleDTO,
} from "../types/roles.types";
import { RoleRepository } from "../repository/role.repository";
import { AppError } from "@/middleware/errors/AppError";
import { CompanyService } from "@/modules/companies/services/company.service";
import { PermissionUtils } from "@/utils/helper/permissions.helper";

@injectable()
export class RolesService {
  constructor(
    @inject("RoleRepository") private roleRepository: RoleRepository,
    @inject("CompanyService") private companyService: CompanyService,
    @inject("PermissionUtils") private permissionUtils: PermissionUtils
  ) {}

  async getAllRoles(
    take: number,
    user: { roleId: string; companyId?: string },
    cursorId?: string
  ): Promise<{ roles: RoleResponse[]; total: number }> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    let companyId = user.companyId;

    // Si es Superadmin, no se filtra por companyId (puede ver todos los roles)
    if (isSuperAdmin) {
      companyId = undefined;
    }

    // Obtener todos los roles, tanto globales como los asignados a empresas
    const data = await this.roleRepository.getAllRoles(
      take,
      cursorId,
      companyId
    );

    const filteredRoles = data.roles.filter((role) => {
      // Excluir el rol Superadmin para usuarios no Superadmin
      if (role.name === "Superadmin" && !isSuperAdmin) {
        return false;
      }

      // Lógica existente para companyId
      if (!role.companyId) {
        return true; // Roles globales (excepto Superadmin)
      }
      if (role.companyId === companyId) {
        return true; // Roles de la empresa del usuario
      }
      return false;
    });

    return { roles: filteredRoles, total: filteredRoles.length };
  }

  // Obtener todos los roles eliminados
  async getAllRolesByDeleted(
    take: number,
    user: { roleId: string; companyId?: string },
    cursorId?: string
  ): Promise<{ roles: RoleResponse[]; total: number }> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    const data = await this.roleRepository.getAllRolesByDeleted(
      take,
      cursorId,
      companyId
    );

    return data;
  }

  // Obtener un rol por ID
  async getRoleById(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<RoleResponse | null> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    if (isSuperAdmin) return await this.roleRepository.getRoleById(id);

    // Si no es SuperAdmin, verificamos si el rol tiene companyId o no
    const role = await this.roleRepository.getRoleById(id);

    // Permitir acceso si:
    // - El rol pertenece a su empresa
    // - O si el rol es global (companyId es NULL)
    if (role?.companyId === null || role?.companyId === user.companyId) {
      return role;
    }

    if (!role) throw new AppError("El rol no existe", 404);

    return role;
  }

  // Busca un rol por nombre
  async getRoleByName(
    name: string,
    user: { roleId: string; companyId?: string }
  ): Promise<RoleResponse[]> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    const role = await this.roleRepository.findByNameRole(name, companyId);

    if (role.length === 0) {
      throw new AppError("El rol no existe", 404);
    }

    return role;
  }

  // Crear un nuevo rol
  async createRole(
    roleData: CreateRoleDTO,
    user: { roleId: string; companyId?: string }
  ): Promise<RoleResponse> {
    // Determinar si el usuario es superadmin.
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    let companyId: string | null = null;

    if (isSuperAdmin) {
      // Si el superadmin no envía una empresa, se permite que sea null
      companyId = roleData.companyId ?? null;
    } else {
      // Para usuarios normales, se toma el companyId del usuario si existe.
      if (!user.companyId) {
        throw new AppError("No tienes empresa asignada.", 400);
      }
      companyId = user.companyId;
    }

    const trimmedName = roleData.name.trim();

    // Validar que el nombre no sea reservado.
    const isReserved = await this.roleRepository.isReservedRoleName(
      trimmedName
    );

    if (isReserved) {
      throw new AppError("Nombre no permitido.", 400);
    }

    // Validar que no exista ya un rol con ese nombre en la empresa si companyId no es null.
    if (companyId) {
      await this.validateRoleExistingInCompany(trimmedName, companyId);
    }

    // Validar que la empresa exista solo si se proporcionó un companyId.
    if (companyId) {
      await this.validateCompanyExists(user, companyId);
    }

    // Crear el rol con companyId nulo permitido.
    const createRole = await this.roleRepository.createRole({
      ...roleData,
      name: trimmedName,
      companyId,
    });

    return createRole;
  }

  async updateRole(
    id: string,
    roleDataUpdated: UpdateRoleDTO,
    user: { roleId: string; companyId?: string }
  ): Promise<RoleResponse> {
    const existingRole = await this.roleRepository.getRoleById(id);
    if (!existingRole) throw new AppError("El rol no existe", 404);

    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    if (!isSuperAdmin && existingRole.companyId !== user.companyId) {
      throw new AppError("No tienes permiso para actualizar este rol", 403);
    }

    // Prevenir cambios de companyId
    if (
      roleDataUpdated.companyId &&
      roleDataUpdated.companyId !== existingRole.companyId
    ) {
      throw new AppError("No se puede cambiar la empresa del rol", 400);
    }

    // Validar nombre del rol si se actualiza
    if (roleDataUpdated.name) {
      const trimmedName = roleDataUpdated.name.trim();
      if (trimmedName !== existingRole.name) {
        // Validar nombre reservado
        const isReserved = await this.roleRepository.isReservedRoleName(
          trimmedName
        );
        if (isReserved) throw new AppError("Nombre no permitido", 400);

        // Validar duplicados
        const isDuplicate = await this.roleRepository.findByName(
          trimmedName,
          existingRole.companyId ?? undefined,
          existingRole.id
        );
        if (isDuplicate) {
          throw new AppError(
            `El rol "${trimmedName}" ya existe en esta empresa`,
            400
          );
        }
        roleDataUpdated.name = trimmedName;
      }
    }

    const updatedRole = await this.roleRepository.updateRole(
      id,
      roleDataUpdated
    );

    return updatedRole;
  }

  // Eliminar un rol
  async deleteRole(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<RoleResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    // Para usuarios normales, se busca el rol filtrado por su companyId.
    const existingRole = isSuperAdmin
      ? await this.roleRepository.getRoleById(id)
      : await this.roleRepository.getRoleById(id, user.companyId);

    if (!existingRole) throw new AppError("El rol no existe", 404);

    // Si no es superadmin, validar que el rol pertenezca a su empresa.
    if (!isSuperAdmin && existingRole.companyId !== user.companyId) {
      throw new AppError("No tienes permiso para eliminar este rol", 403);
    }

    const deletedRole = await this.roleRepository.softDeleteRole(
      id,
      existingRole.companyId ?? undefined
    );

    return deletedRole;
  }

  // Validar que no exista otro rol con el mismo nombre en la misma empresa
  async validateRoleExistingInCompany(
    name: string,
    companyId?: string,
    id?: string
  ): Promise<void> {
    const existingRole = await this.roleRepository.findByName(
      name,
      companyId,
      id
    );
    if (existingRole)
      throw new AppError(`El rol "${name}" ya existe en esta empresa`, 400);
  }

  // Validar la existencia de la empresa
  async validateCompanyExists(
    user: { roleId: string; companyId?: string },
    companyId?: string
  ): Promise<void> {
    if (!companyId) throw new AppError("La empresa no existe", 400);
    await this.companyService.getCompanyById(companyId, user);
  }
}
