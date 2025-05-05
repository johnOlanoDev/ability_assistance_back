import { injectable, inject } from "tsyringe";
import { PRISMA_TOKEN, PrismaType } from "@/prisma";
import {
  CreatePositionDTO,
  PositionResponse,
  UpdatePositionDTO,
} from "../types/position.types";
import { IPositionRepository } from "../port/IPositionRepository";

@injectable()
export class PositionRepository implements IPositionRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaType) {}

  // Obtener todas las posiciones (con filtro opcional por companyId)
  async getAllPositions(
    take: number,
    cursorId?: string,
    companyId?: string
  ): Promise<{ positions: PositionResponse[]; total: number }> {
    const cursor = cursorId ? { id: cursorId } : undefined;

    const positions = await this.prisma.position.findMany({
      take,
      cursor,
      skip: cursor ? 1 : 0,
      where: {
        companyId: companyId || undefined,
        deletedAt: null,
      },
      include: { company: true, workplace: true },
      orderBy: { createdAt: "desc" },
    });

    const total = await this.prisma.position.count();
    return { positions, total };
  }

  async getAllPositionsDeleted(
    take: number,
    cursorId?: string,
    companyId?: string
  ): Promise<{ positions: PositionResponse[]; total: number }> {
    const cursor = cursorId ? { id: cursorId } : undefined;

    const positions = await this.prisma.position.findMany({
      take,
      cursor,
      skip: cursor ? 1 : 0,
      where: {
        companyId: companyId || undefined,
      },
      include: { company: true, workplace: true },
      orderBy: { createdAt: "desc" },
    });

    const total = await this.prisma.position.count({
      where: {
        companyId: companyId || undefined,
      },
    });
    return { positions, total };
  }

  findByNamePosition(
    name: string,
    companyId?: string,
    positionIdToExclude?: string
  ): Promise<PositionResponse[]> {
    return this.prisma.position.findMany({
      where: {
        name: {
          contains: name.toLowerCase(),
        },
        companyId: companyId || undefined,
        id: { not: positionIdToExclude },
      },
      include: {
        company: true,
        workplace: true,
      },
    });
  }

  // Obtener una posición por ID
  async getPositionById(
    id: string,
    companyId?: string
  ): Promise<PositionResponse | null> {
    return this.prisma.position.findUnique({
      where: { id, companyId, status: true, deletedAt: null },
      include: { company: true, workplace: true },
    });
  }

  // Crear una nueva posición
  async createPosition(data: CreatePositionDTO): Promise<PositionResponse> {
    return this.prisma.position.create({
      data: { ...data, status: true },
      include: {
        workplace: true,
        company: true,
      },
    });
  }

  // Actualizar una posición
  async updatePosition(
    id: string,
    positionUpdate: UpdatePositionDTO,
    companyId?: string
  ): Promise<PositionResponse> {
    return this.prisma.position.update({
      where: { id, companyId },
      data: { ...positionUpdate, updatedAt: new Date() },
    });
  }

  // Eliminar (soft delete) una posición
  async softDeletePosition(
    id: string,
    companyId?: string
  ): Promise<PositionResponse> {
    return this.prisma.position.update({
      where: { id, companyId },
      data: { status: false, deletedAt: new Date() },
    });
  }

  // Validar si el nombre de la posición ya existe (excluyendo el ID actual)
  async findByName(
    name: string,
    excludeId?: string,
    companyId?: string
  ): Promise<boolean> {
    const position = await this.prisma.position.findFirst({
      where: {
        name: name.trim(),
        companyId,
        status: true,
        id: excludeId ? { not: excludeId } : undefined, // Excluir el ID actual
      },
    });

    return !!position;
  }

  async findPositionById(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<PositionResponse | null> {
    const position = await this.prisma.position.findUnique({
      where: { id, deletedAt: null },
    });
    return position;
  }
}
