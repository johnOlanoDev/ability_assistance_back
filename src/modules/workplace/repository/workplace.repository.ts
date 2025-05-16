import {
  CreateWorkPlacesDTO,
  UpdateWorkPlacesDTO,
  WorkPlacesResponse,
} from "../types/workplace.types";
import { inject, injectable } from "tsyringe";
import { IWorkPlaceRepository } from "../port/workplace.repository";
import { PRISMA_TOKEN, PrismaType } from "@/prisma";

@injectable()
export class WorkplaceRepository implements IWorkPlaceRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaType) {}

  // Obtener todas las áreas de trabajo (con filtro opcional por companyId)
  async getAllWorkPlaces(
    take: number,
    cursorId?: string,
    companyId?: string
  ): Promise<{ workPlaces: WorkPlacesResponse[]; total: number }> {
    const [workPlaces, total] = await this.prisma.$transaction([
      this.prisma.workplace.findMany({
        take,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { id: cursorId } : undefined,
        where: { companyId, status: true },
        orderBy: { createdAt: "desc" },
        include: { company: true },
      }),
      this.prisma.workplace.count({ where: { companyId, status: true } }),
    ]);

    return { workPlaces, total };
  }

  // Obtener una área de trabajo por ID
  async getWorkPlaceById(
    id: string,
    companyId?: string
  ): Promise<WorkPlacesResponse | null> {
    return this.prisma.workplace.findFirst({
      where: { id, companyId, status: true },
      include: { company: true },
    });
  }

  async getWorkplaceByUser(userId: string) {
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { workplaceId: true },
    });
    return userData;
  }

  // Crear una nueva área de trabajo
  async createWorkPlace(
    data: CreateWorkPlacesDTO
  ): Promise<WorkPlacesResponse> {
    return this.prisma.workplace.create({
      data: {
        ...data,
        status: true,
      },
      include: { company: true },
    });
  }

  // Actualizar una área de trabajo
  async updateWorkPlace(
    id: string,
    data: UpdateWorkPlacesDTO,
    companyId?: string
  ): Promise<WorkPlacesResponse> {
    return this.prisma.workplace.update({
      where: { id, companyId: companyId || undefined },
      data: { ...data, updatedAt: new Date() },
    });
  }

  // Eliminar (soft delete) una área de trabajo
  async softDeleteWorkPlace(
    id: string,
    companyId?: string
  ): Promise<WorkPlacesResponse> {
    return this.prisma.workplace.update({
      where: { id, companyId },
      data: { status: false, deletedAt: new Date() },
    });
  }

  // Validar si el nombre del área de trabajo ya existe (excluyendo el ID actual)
  async findByName(
    name: string,
    excludeId?: string,
    companyId?: string
  ): Promise<WorkPlacesResponse[]> {
    return await this.prisma.workplace.findMany({
      where: {
        name,
        companyId,
        status: true,
        id: excludeId ? { not: excludeId } : undefined, // Excluir el ID actual
      },
      include: { company: true },
    });
  }

  async validateWorkplaceExistingInCompany(name: string, companyId: string) {
    return await this.prisma.workplace.findFirst({
      where: { name, companyId },
    });
  }

  async findWorkplaceById(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<WorkPlacesResponse | null> {
    const workplace = await this.prisma.workplace.findUnique({
      where: { id, deletedAt: null },
    });
    return workplace;
  }
}
