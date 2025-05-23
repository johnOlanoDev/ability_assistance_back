import { inject, injectable } from "tsyringe";
import {
  CreateUserDTO,
  UpdateUserDTO,
  UpdateProfileDTO,
  UserResponse,
} from "../types/user.types";
import { BcryptHelper } from "@/utils/helper/bcrypt.helper";
import { PrismaType, DecimalType, PRISMA_TOKEN, Decimal } from "@/prisma";
import { ExceptionType } from "@/modules/schedule/scheduleException/types/scheduleException.types";

@injectable()
export class UserRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaType) {}

  // Obtener todos los usuarios (con filtro opcional por companyId)
  async getAllUsers(companyId?: string, userId?: string) {
    return await this.prisma.user.findMany({
      where: {
        companyId: companyId || undefined, // Solo filtra por companyId si es proporcionado
        status: true,
      },
      include: {
        role: true,
        company: true,
        workplace: true,
        position: true,
        documentType: true,
      },
    });
  }

  async getAllActiveUsers() {
    return await this.prisma.user.findMany({
      where: { status: true }, // Solo usuarios activos
      select: {
        id: true,
        companyId: true, // Incluye el companyId si es necesario
      },
    });
  }

  async getUserAreaAndPosition(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        workplaceId: true,
        positionId: true,
      },
    });

    if (!user) throw new Error("Usuario no encontrado");
    return user;
  }

  async getUserByCode(code: string, companyId?: string) {
    return this.prisma.user.findFirst({
      where: {
        companyId,
        code,
      },
    });
  }

  // Obtener un usuario por ID
  async getUserById(id: string, companyId?: string) {
    return this.prisma.user.findFirst({
      where: {
        id,
        companyId: companyId || undefined,
        status: true,
        deletedAt: null,
      },
      include: {
        role: true,
        company: true,
        workplace: true,
        position: true,
        documentType: true,
      },
    });
  }

  async findUserByEmail(email: string, companyId?: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        companyId: companyId || undefined,
        status: true,
        deletedAt: null,
      },
      include: {
        role: true,
        company: true,
        workplace: true,
        position: true,
        documentType: true,
      },
    });
  }

  async findUserByNumberDocumentAndCompanyId(
    numberDocument: string,
    companyId: string
  ) {
    return this.prisma.user.findFirst({
      where: { companyId, numberDocument },
    });
  }

  async findUsersByTarget(
    exceptionType: ExceptionType,
    entityId: string,
    companyId?: string
  ): Promise<UserResponse[]> {
    let whereClause = {};

    switch (exceptionType) {
      case "INDIVIDUAL":
        whereClause = { id: entityId, companyId: companyId || undefined };
        break;
      case "WORKPLACE":
        whereClause = { workplaceId: entityId, companyId: companyId || undefined };
        break;
      case "POSITION":
        whereClause = { positionId: entityId, companyId: companyId || undefined };
        break;
      case "COMPANY":
      case "HOLIDAY":
        whereClause = { companyId: entityId || undefined };
        break;
      default:
        throw new Error("Tipo de excepción no válido");
    }

    return this.prisma.user.findMany({
      where: whereClause,
      include: {
        company: true,
        workplace: true,
        position: true,
      },
    });
  }

  async createUser(data: CreateUserDTO) {
    // Extraer los IDs de las relaciones
    const {
      roleId,
      workplaceId,
      positionId,
      documentTypeId,
      companyId,
      salary,
      ...restData
    } = data;
    type DecimalInstance = InstanceType<typeof Decimal>;
    // Procesar el campo salary correctamente si existe
    const processedSalary: DecimalInstance | undefined =
      salary != null ? new Decimal(String(salary)) : undefined;

    return await this.prisma.user.create({
      data: {
        ...restData,
        salary: processedSalary,
        status: true,
        deletedAt: null,
        // Transformar IDs en relaciones
        role: roleId ? { connect: { id: roleId } } : undefined,
        workplace: workplaceId ? { connect: { id: workplaceId } } : undefined,
        position: positionId ? { connect: { id: positionId } } : undefined,
        documentType: documentTypeId
          ? { connect: { id: documentTypeId } }
          : undefined,
        company: companyId ? { connect: { id: companyId } } : undefined,
      },
      include: {
        role: true,
        company: true,
        workplace: true,
        position: true,
        documentType: true,
      },
    });
  }

  // Actualizar un usuario
  async updateUser(id: string, dataUser: UpdateUserDTO, companyId?: string) {
    const { companyId: _, ...updateData } = dataUser as any;

    return this.prisma.user.update({
      where: companyId ? { id, companyId } : { id },
      data: {
        ...updateData,
        lastLogin: new Date(),
      },
      include: {
        role: true,
        company: true,
        workplace: true,
        position: true,
        documentType: true,
      },
    });
  }

  // Actualizar perfil
  async updateProfile(id: string, data: UpdateProfileDTO, companyId?: string) {
    const { companyId: _, ...updateData } = data as any;

    return this.prisma.user.update({
      where: { id, companyId: companyId || undefined },
      data: {
        ...updateData,
        lastLogin: new Date(),
        updatedAt: new Date(),
      },
      include: {
        role: true,
        company: true,
        workplace: true,
        position: true,
        documentType: true,
      },
    });
  }

  // Eliminar (soft delete) un usuario
  async softDeleteUser(id: string, companyId?: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: false, companyId, deletedAt: new Date() },
    });
  }

  // Validar si el email o número de documento ya existen (excluyendo el ID actual)
  async findByEmail(
    email: string,
    excludeId?: string,
    companyId?: string
  ): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email, companyId: companyId || undefined, status: true }],
        id: excludeId ? { not: excludeId } : undefined, // Excluir el ID actual
      },
    });

    return !!user;
  }

  // Obtener los roles asignados a un usuario
  public async findRolesByUserId(userId: string, companyId?: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
        companyId: companyId || undefined, // Filtra por companyId
        status: true,
        deletedAt: null,
      },
      include: {
        role: true,
      },
    });
  }

  // Verificar la contraseña de un usuario
  public async verifyPassword(
    user: any,
    plainPassword: string
  ): Promise<boolean> {
    return await BcryptHelper.comparePassword(plainPassword, user.password);
  }

  /**
   * Actualiza el refresh token de un usuario.
   * @param userId ID del usuario.
   * @param refreshToken Refresh token a almacenar.
   */
  public async updateUserRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }
}
