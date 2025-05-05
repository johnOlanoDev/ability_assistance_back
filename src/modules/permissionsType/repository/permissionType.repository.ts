import { PRISMA_TOKEN, PrismaType } from "@/prisma";
import { inject, injectable } from "tsyringe";
import {
  CreatePermissionType,
  PermissionTypeResponse,
  UpdatePermissionTypeDto
} from "../types/permissionTypes.types";
import { IPermissionTypeRepository } from "../port/permissionTypes.repository";

@injectable()
export class PermissionTypeRepository implements IPermissionTypeRepository {

  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaType) {}
  
  
  getAllPermissionsTypes(companyId?: string): Promise<PermissionTypeResponse[]> {
    return this.prisma.permissionType.findMany({
      where: {
        companyId: companyId || undefined,
        deletedAt: null,
        status: true,
      },
      include : { company: true },
      orderBy: { createdAt: "desc" },
    })
  }
  getPermissionById(id: string, companyId?: string): Promise<PermissionTypeResponse | null> {
    return this.prisma.permissionType.findUnique({
      where: { 
        id, 
        companyId: companyId || undefined,
        status: true 
      },
      include: { 
        company: true 
      },
    });
  }
  getPermissionByName(name: string, companyId?: string): Promise<PermissionTypeResponse[] | null> {
    return this.prisma.permissionType.findMany({
      where: {
        OR: [{ name: { contains: name }, companyId: companyId || undefined }],
      },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    })
  }
  createPermission(permissionData: CreatePermissionType): Promise<PermissionTypeResponse> {
    return this.prisma.permissionType.create({
      data: {
        ...permissionData,
        companyId: permissionData.companyId || undefined,
        status: true,
      },
      include: { company: true },
    })
  }
  updatePermission(id: string, permissionDataUpdated: UpdatePermissionTypeDto, companyId?: string): Promise<PermissionTypeResponse> {
    return this.prisma.permissionType.update({
      where: { id, companyId: companyId || undefined },
      data: {
        ...permissionDataUpdated,
        status: true,
      },
      include: { company: true },
    })
  }

  softDeletePermission(id: string, companyId?: string): Promise<PermissionTypeResponse> {
    return this.prisma.permissionType.update({
      where: { id, companyId: companyId || undefined },
      data: {
        deletedAt: new Date(),
        status: false,
      },
      include: { company: true },
    })
  }
  async findByName(name: string, companyId?: string): Promise<PermissionTypeResponse | null> {
    return await this.prisma.permissionType.findFirst({
      where: {
        name,
        companyId: companyId || undefined,
        deletedAt: null,
        status: true,
      },
    })
  }
  
  async hasActiveAttendanceRecords(permissionTypeId: string): Promise<boolean> {
    const activeRecords = await this.prisma.reportAttendance.findFirst({
      where: {
        typePermissionId: permissionTypeId,
        status: true,
        deletedAt: null,
      },
    });
  
    return !!activeRecords;
  }
}

