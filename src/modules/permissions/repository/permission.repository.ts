import { inject, injectable } from "tsyringe";
import { PRISMA_TOKEN, PrismaType } from "@/prisma";
import {
  CreatePermissionDTO,
  PermissionResponse,
} from "../types/permission.types";
import { IPermissionRepository } from "../port/permission.repository";
import { AppError } from "@/middleware/errors/AppError";

@injectable()
export class PermissionRepository implements IPermissionRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaType) {}

  // Obtener todos los permisos
  async getAllPermissions(
    companyId?: string
  ): Promise<{ permissions: PermissionResponse[]; total: number }> {
    const permissionResults = await this.prisma.$transaction([
      this.prisma.permission.findMany({
        where: {
          companyId: companyId || undefined,
          deletedAt: null,
          status: true,
        },
        orderBy: { createdAt: "desc" },
        include: { company: true },
      }),
    ]);

    // Extract the actual permissions from the results array
    const permissions = permissionResults[0] as PermissionResponse[];

    const total = await this.prisma.permission.count({
      where: { companyId, status: true },
    });

    return { permissions, total };
  }

  // Obtener un permiso por ID
  async getPermissionById(
    id: string,
    companyId?: string
  ): Promise<PermissionResponse | null> {
    return this.prisma.permission.findFirst({
      where: { id, companyId, status: true },
      include: { company: true },
    });
  }

  getPermissionByName(
    name: string,
    companyId?: string
  ): Promise<PermissionResponse[]> {
    return this.prisma.permission.findMany({
      where: {
        OR: [{ name: { contains: name }, companyId: companyId || undefined }],
      },
      include: { company: true },
    });
  }

  createPermission(
    permissionData: CreatePermissionDTO
  ): Promise<PermissionResponse> {
    return this.prisma.permission.create({
      data: {
        ...permissionData,
        status: true,
      },
      include: { company: true },
    });
  }

  updatePermission(
    id: string,
    permissionDataUpdated: Partial<CreatePermissionDTO>,
    companyId?: string
  ): Promise<PermissionResponse> {
    return this.prisma.permission.update({
      where: { id, companyId: companyId || undefined },
      data: {
        ...permissionDataUpdated,
        updatedAt: new Date(),
      },
    });
  }

  softDeletePermission(
    id: string,
    companyId?: string
  ): Promise<PermissionResponse> {
    return this.prisma.permission.update({
      where: { id, companyId: companyId || undefined },
      data: { status: false, deletedAt: new Date() },
    });
  }

  async findByName(
    name: string,
    companyId?: string,
    excludeId?: string
  ): Promise<PermissionResponse[]> {
    return await this.prisma.permission.findMany({
      where: {
        name: {
          contains: name.toLowerCase(),
        },
        companyId: companyId || undefined,
        id: { not: excludeId },
      },
      include: {
        company: true,
      },
    });
  }

  async getUserPermissions(
    roleId: string,
    companyId?: string | null
  ): Promise<string[]> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        RolePermission: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) throw new AppError("El rol no existe.");

    // Filtrar permisos basados en la empresa del rol
    const filteredPermissions = role.RolePermission.filter(
      (rp) =>
        rp.permission.companyId === null || // Permisos globales
        rp.permission.companyId === companyId // Permisos específicos de la empresa
    );

    return filteredPermissions.map((rp) => rp.permission.name);
  }

  async getPermissionName(
    name: string,
    companyId?: string
  ): Promise<PermissionResponse | null> {
    return this.prisma.permission.findFirst({ where: { name, companyId } });
  }
}
