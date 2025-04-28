import { inject, injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import {
  UserResponse,
  CreateUserDTO,
  UpdateUserDTO,
  UpdateProfileDTO,
} from "../types/user.types";
import { BcryptHelper } from "@/utils/helper/bcrypt.helper";

@injectable()
export class UserRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  // Obtener todos los usuarios (con filtro opcional por companyId)
  async getAllUsers(companyId?: string) {
    return await this.prisma.user.findMany({
      where: {
        companyId: companyId || undefined, // Solo filtra por companyId si es proporcionado
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
  async getUserById(
    id: string,
    companyId?: string
  ): Promise<UserResponse | null> {
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

  async findUserByEmail(
    email: string,
    companyId?: string
  ): Promise<UserResponse | null> {
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

  // Crear un nuevo usuario
  async createUser(data: CreateUserDTO): Promise<UserResponse> {
    // Extraer los IDs de las relaciones
    const {
      roleId,
      workplaceId,
      positionId,
      documentTypeId,
      companyId,
      ...restData
    } = data;

    return await this.prisma.user.create({
      data: {
        ...restData,
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
        // Manejar el avatar si es necesario
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
  async updateUser(
    id: string,
    data: UpdateUserDTO,
    companyId?: string
  ): Promise<UserResponse> {
    return this.prisma.user.update({
      where: { id },
      data: { ...data, companyId, lastLogin: new Date() },
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
  async updateProfile(
    id: string,
    data: UpdateProfileDTO,
    companyId?: string
  ): Promise<UserResponse> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        companyId,
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
  async softDeleteUser(id: string, companyId?: string): Promise<UserResponse> {
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
  public async findRolesByUserId(
    userId: string,
    companyId?: string
  ): Promise<UserResponse | null> {
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
