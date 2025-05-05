import { inject, injectable } from "tsyringe";
import {
  CreateDocumentType,
  DocumentTypeResponse,
  UpdateDocumentType,
} from "../types/documentType.types";
import { PRISMA_TOKEN, PrismaType } from "@/prisma";

@injectable()
export class DocumentTypeRepository implements DocumentTypeRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaType) {}

  // Obtener todos los tipos de documentos (con filtro opcional por companyId)
  async getAllDocumentTypes(
    take: number,
    cursorId?: string,
    companyId?: string
  ): Promise<{ documents: DocumentTypeResponse[]; total: number }> {
    const cursor = cursorId ? { id: cursorId } : undefined;
    const documents = await this.prisma.documentType.findMany({
      take,
      skip: cursorId ? 1 : 0,
      cursor,
      where: { companyId, status: true, deletedAt: null },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    });

    const total = await this.prisma.documentType.count({
      where: { companyId, status: true, deletedAt: null },
    });

    return { documents, total };
  }

  // Obtener los documentos eliminados
  async getAllDocumentsDeleted(
    take: number,
    cursorId?: string,
    companyId?: string
  ): Promise<{ documents: DocumentTypeResponse[]; total: number }> {
    const cursor = cursorId ? { id: cursorId } : undefined;
    const documents = await this.prisma.documentType.findMany({
      take,
      skip: cursorId ? 1 : 0,
      cursor,
      where: { companyId, status: false },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    });

    const total = await this.prisma.documentType.count({
      where: { companyId, status: false },
    });

    return { documents, total };
  }

  // Obtener un tipo de documento por ID
  async getDocumentTypeById(
    id: string,
    companyId?: string
  ): Promise<DocumentTypeResponse | null> {
    return this.prisma.documentType.findFirst({
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

  // Crear un nuevo tipo de documento
  async createDocumentType(
    data: CreateDocumentType
  ): Promise<DocumentTypeResponse> {
    return this.prisma.documentType.create({
      data: {
        ...data,
        status: true,
        deletedAt: null,
      },
      include: {
        company: true,
      },
    });
  }

  // Actualizar un tipo de documento
  async updateDocumentType(
    id: string,
    data: UpdateDocumentType,
    companyId?: string
  ): Promise<DocumentTypeResponse> {
    return this.prisma.documentType.update({
      where: { id, companyId },
      data: { ...data, updatedAt: new Date() },
    });
  }

  // Eliminar (soft delete) un tipo de documento
  async softDeleteDocumentType(
    id: string,
    companyId?: string
  ): Promise<DocumentTypeResponse> {
    return this.prisma.documentType.update({
      where: { id, companyId },
      data: { status: false, deletedAt: new Date() },
    });
  }

  async getDocumentTypeByName(
    name: string,
    companyId?: string
  ): Promise<DocumentTypeResponse | null> {
    return this.prisma.documentType.findFirst({ where: { name, companyId } });
  }

  // Validar si el nombre del tipo de documento ya existe (excluyendo el ID actual)
  async findByName(
    name: string,
    excludeId?: string,
    companyId?: string
  ): Promise<boolean> {
    const documentType = await this.prisma.documentType.findFirst({
      where: {
        name: name.toLowerCase(),
        companyId,
        status: true,
        id: excludeId ? { not: excludeId } : undefined, // Excluir el ID actual
      },
    });

    return !!documentType;
  }
}
