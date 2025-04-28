import { injectable, inject } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import {
  CreateRoleDTO,
  RoleResponse,
  UpdateRoleDTO,
} from "../types/roles.types";
import { IRoleRepository } from "../port/RoleRepository";

@injectable()
export class RoleRepository implements IRoleRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async getAllRoles(
    take: number = 10,
    cursorId?: string,
    companyId?: string | null
  ): Promise<{ roles: RoleResponse[]; total: number }> {
    const cursor = cursorId ? { id: cursorId } : undefined;
  
    let whereCondition: any = {
      deletedAt: null,
    };
  
    // Si hay companyId, agrega condición OR para incluir roles de la empresa y globales
    if (companyId !== undefined) {
      whereCondition.OR = [
        { companyId: companyId }, // Roles de la empresa
        { companyId: null }       // Roles globales
      ];
    }
  
    const roles = await this.prisma.role.findMany({
      take,
      cursor,
      skip: cursor ? 1 : 0,
      where: whereCondition,
      include: {
        company: true,
      },
      orderBy: { createdAt: "desc" },
    });
  
    const total = await this.prisma.role.count({
      where: whereCondition,
    });
  
    return { roles, total };
  }

  async getAllRolesByDeleted(
    take: number = 10,
    cursorId?: string,
    companyId?: string
  ): Promise<{ roles: RoleResponse[]; total: number }> {
    const cursor = cursorId ? { id: cursorId } : undefined;
    const roles = await this.prisma.role.findMany({
      take,
      cursor,
      skip: cursor ? 1 : 0,
      where: {
        companyId: companyId || undefined,
        status: false,
      },
      include: {
        company: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const total = await this.prisma.role.count({
      where: {
        companyId: companyId || undefined,
        status: false,
      },
    });
    return { roles, total };
  }

  getRoleById(id: string, companyId?: string): Promise<RoleResponse | null> {
    return this.prisma.role.findUnique({
      where: {
        id,
        companyId: companyId || undefined,
        deletedAt: null,
      },
      include: {
        company: true,
      },
    });
  }

  findByNameRole(
    name: string,
    companyId?: string,
    roleIdToExclude?: string
  ): Promise<RoleResponse[]> {
    return this.prisma.role.findMany({
      where: {
        name: {
          contains: name.toLowerCase(),
        },
        companyId: companyId || undefined,
        id: roleIdToExclude ? { not: roleIdToExclude } : undefined,
        deletedAt: null,
      },
      include: { company: true },
    });
  }

  createRole(roleData: CreateRoleDTO): Promise<RoleResponse> {
    return this.prisma.role.create({
      data: { ...roleData, status: true },
      include: { company: true },
    });
  }

  updateRole(
    id: string,
    roleDataUpdated: UpdateRoleDTO,
    companyId?: string
  ): Promise<RoleResponse> {
    return this.prisma.role.update({
      where: { id, companyId: companyId || undefined },
      data: {
        ...roleDataUpdated,
        updatedAt: new Date(),
      },
    });
  }

  softDeleteRole(id: string, companyId?: string): Promise<RoleResponse> {
    return this.prisma.role.update({
      where: { id, companyId },
      data: { status: false, deletedAt: new Date() },
    });
  }

  async getPermissionsByRoleId(roleId: string) {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      select: { permission: { select: { name: true } } },
    });

    // Extraer los nombres de los permisos
    return rolePermissions.map((rp) => rp.permission.name);
  }

  async isReservedRoleName(name: string): Promise<boolean> {
    return ["Superadmin", "superadmin"].includes(name.toLocaleLowerCase());
  }

  async findByName(
    name: string,
    companyId?: string,
    excludeId?: string
  ): Promise<boolean> {
    const role = await this.prisma.role.findFirst({
      where: {
        name: name,
        companyId: companyId || undefined,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    return !!role; // Si existe retorna true, si no existe retorna false
  }
}
