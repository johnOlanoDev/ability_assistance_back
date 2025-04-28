import {CreateUserDTO, UpdateUserDTO, UserResponse} from "../types/user.types";


export interface IUserRepository {
  // Obtener todos los usuarios (con filtro opcional por companyId)
  getAllUsers(take: number, cursorId?: string, companyId?: string): Promise<{ users: UserResponse[]; total: number }>;

  // Obtener un usuario por ID
  getUserById(id: string, companyId?: string): Promise<UserResponse | null>;

  // Crear un nuevo usuario
  createUser(data: CreateUserDTO): Promise<UserResponse>;

  // Actualizar un usuario
  updateUser(id: string, data: UpdateUserDTO, companyId?: string): Promise<UserResponse>;

  // Eliminar (soft delete) un usuario
  softDeleteUser(id: string, companyId?: string): Promise<UserResponse>;

  // Validar si el email o número de documento ya existen (excluyendo el ID actual)
  findByEmailOrDocument(email: string, numberDocument: string, excludeId?: string, companyId?: string): Promise<boolean>;
}