import { inject, injectable } from "tsyringe";
import { PRISMA_TOKEN, PrismaType } from "@/prisma";
import {
  CompanyResponse,
  CreateCompanyDTO,
  UpdateCompanyDto,
} from "../types/company.types";
import { ICompanyRepository } from "../port/ICompanyRepository";

@injectable()
export class CompanyRepository implements ICompanyRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaType) {}

  // Obtener todas las empresas
  async getAllCompanies(
    take: number,
    cursorId?: string,
    companyId?: string
  ): Promise<{ companies: CompanyResponse[]; total: number }> {
    const [companies, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        take,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { id: cursorId } : undefined,
        where: { id: companyId, status: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.company.count({ where: { status: true } }),
    ]);

    return { companies, total };
  }

  async getAllCompanieByDeleted(
    companyId?: string
  ): Promise<CompanyResponse[] | null> {
    return this.prisma.company.findMany({
      where: { id: companyId, status: false },
    });
  }

  // Obtener una empresa por ID
  async getCompanyById(id: string): Promise<CompanyResponse | null> {
    return this.prisma.company.findUnique({
      where: { id, status: true },
    });
  }

  // Obtener una empresa por nombre
  getCompanyByName(name: string): Promise<CompanyResponse[] | null> {
    return this.prisma.company.findMany({
      where: {
        name: { contains: name },
        status: true,
      },
    });
  }

  // Obtener una empresa por nombre de la empresa
  async getCompanyByCompanyName(
    companyName: string
  ): Promise<CompanyResponse[] | null> {
    return this.prisma.company.findMany({
      where: {
        companyName: { contains: companyName },
        status: true,
      },
    });
  }

  // Obtener una empresa por RUC de la empresa
  async getCompanyByCompanyRuc(ruc: string): Promise<CompanyResponse[] | null> {
    return this.prisma.company.findMany({
      where: {
        ruc: { contains: ruc },
        status: true,
      },
    });
  }

  // Crear una nueva empresa
  async createCompany(data: CreateCompanyDTO): Promise<CompanyResponse> {
    return this.prisma.company.create({
      data: { ...data, status: true },
    });
  }

  // Actualizar una empresa
  async updateCompany(
    id: string,
    data: UpdateCompanyDto
  ): Promise<CompanyResponse> {
    return this.prisma.company.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  // Eliminar (soft delete) una empresa
  async softDeleteCompany(id: string): Promise<CompanyResponse> {
    return this.prisma.company.update({
      where: { id },
      data: { status: false, deletedAt: new Date() },
    });
  }

  async findByName(name: string, excludeId?: string): Promise<boolean> {
    const company = await this.prisma.company.findFirst({
      where: {
        name: name,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    return !!company; // Si existe retorna true, si no existe retorna false
  }

  async findByRuc(ruc: string, excludeId?: string): Promise<boolean> {
    const company = await this.prisma.company.findFirst({
      where: {
        ruc: ruc,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    return !!company; // Si existe retorna true, si no existe retorna false
  }

  async findByCompanyName(
    companyName: string,
    excludeId?: string
  ): Promise<boolean> {
    const company = await this.prisma.company.findFirst({
      where: {
        companyName: companyName,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    return !!company; // Si existe retorna true, si no existe retorna false
  }

  async findCompanyById(id: string, user: { roleId: string; companyId?: string }): Promise<CompanyResponse | null> {
    const company = await this.prisma.company.findUnique({
      where: { id, deletedAt: null },
    });
    return company;
  }
}
