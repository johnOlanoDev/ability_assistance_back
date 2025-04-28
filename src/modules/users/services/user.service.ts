import { inject, injectable } from "tsyringe";
import {
  CreateUserDTO,
  UpdateProfileDTO,
  UpdateUserDTO,
  UserResponse,
} from "../types/user.types";
import { UserRepository } from "../repository/user.repository";
import { AppError } from "@/middleware/errors/AppError";
import { PermissionUtils } from "@/utils/helper/permissions.helper";
import { CompanyService } from "@/modules/companies/services/company.service";
import { DocumentTypeService } from "@/modules/documentType/services/documentType.service";
import { DocumentTypeResponse } from "@/modules/documentType/types/documentType.types";
import { PositionService } from "@/modules/position/services/position.service";
import { PositionResponse } from "@/modules/position/types/position.types";
import { WorkplaceService } from "@/modules/workplace/services/workplace.service";
import { randomBytes } from "crypto";
import { RolesService } from "@/modules/roles/services/roles.service";
import bcryptjs from "bcryptjs";

@injectable()
export class UserService {
  constructor(
    @inject("UserRepository") private userRepository: UserRepository,
    @inject("CompanyService") private companyService: CompanyService,
    @inject("DocumentTypeService")
    private documentTypeService: DocumentTypeService,
    @inject("PositionService") private positionService: PositionService,
    @inject("WorkplaceService") private workplaceService: WorkplaceService,
    @inject("RolesService") private roleService: RolesService,
    @inject("PermissionUtils") private permissionUtils: PermissionUtils
  ) {}

  // Obtener todos los usuarios
  async getAllUsers(user: {
    roleId: string;
    companyId?: string;
  }): Promise<UserResponse[]> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    if (isSuperAdmin) {
      return this.userRepository.getAllUsers();
    } else {
      if (!user.companyId) {
        throw new AppError("No tienes una empresa asignada", 403);
      }

      return this.userRepository.getAllUsers(user.companyId);
    }
  }

  async getAllActiveUsers() {
    return this.userRepository.getAllActiveUsers();
  }

  async getUserAreaAndPosition(
    userId: string
  ): Promise<{ workplaceId: string; positionId: string }> {
    const user = await this.userRepository.getUserAreaAndPosition(userId);
    if (!user) throw new AppError("El usuario no existe", 404);
    return {
      workplaceId: user.workplaceId || "",
      positionId: user.positionId || "",
    };
  }

  // Obtener un usuario por ID
  async getUserById(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<UserResponse | null> {
    // 1. Obtener el usuario objetivo (para saber su companyId)

    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    const targetUser = await this.userRepository.getUserById(id, companyId);
    if (!targetUser) throw new AppError("El usuario no existe", 404);

    return targetUser;
  }

  // Crear un nuevo usuario
  async createUser(
    userData: CreateUserDTO,
    user: { roleId: string; companyId?: string }
  ): Promise<UserResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    let companyId: string;

    // Validar companyId
    if (isSuperAdmin) {
      if (!userData.companyId)
        throw new AppError("Se requiere la empresa", 400);
      companyId = userData.companyId;
    } else {
      if (!user.companyId)
        throw new AppError("No tienes una empresa asignada", 403);
      companyId = user.companyId;
    }

    // 🔹 Validar company, workplace, phoneNumber y role
    if (userData.companyId) await this.validateCompanyExists(user, companyId);

    // 🔹 Validar que el roleId pertenezca a la misma empresa
    if (userData.roleId) {
      const role = await this.roleService.getRoleById(userData.roleId, user);
      if (!role) throw new AppError("El rol asignado no existe.", 400);

      // Verifica que el rol pertenezca a la empresa
      if (role.companyId && role.companyId !== companyId) {
        throw new AppError("El rol no pertenece a esta empresa.", 400);
      }
    }

    // 🔹 Validar que la positionId pertenezca a la empresa
    if (userData.positionId) {
      const position = await this.positionService.getPositionById(
        userData.positionId,
        user
      );
      if (!position) throw new AppError("El cargo no existe.", 400);

      if (position.companyId !== companyId) {
        throw new AppError("El cargo no pertenece a esta empresa.", 400);
      }
    }

    // 🔹 Validar que workplaceId pertenezca a la empresa
    if (userData.workplaceId) {
      const workplace = await this.workplaceService.getWorkPlaceById(
        userData.workplaceId,
        user
      );
      if (!workplace) throw new AppError("El área de trabajo no existe.", 400);

      if (workplace.companyId !== companyId) {
        throw new AppError(
          "El área de trabajo no pertenece a esta empresa.",
          400
        );
      }
    }

    // Validar tipo de documento
    if (userData.documentTypeId) {
      const documentType = await this.validateDocumentTypeExists(
        user,
        userData.documentTypeId,
        companyId
      );
      const { regexPattern, errorMessage } = this.getDocumentValidationRules(
        documentType.name
      );
      if (!userData.numberDocument.match(regexPattern))
        throw new AppError(errorMessage, 400);
    }

    // Validar que workplaceId y positionId sean obligatorios
    if (!userData.workplaceId) {
      throw new AppError("El campo 'workplaceId' es obligatorio", 400);
    }
    if (!userData.positionId) {
      throw new AppError("El campo 'positionId' es obligatorio", 400);
    }

    // Validar position y workplace
    if (userData.positionId) {
      const position = await this.validatePositionExists(
        user,
        userData.positionId,
        companyId
      );
      if (
        userData.workplaceId &&
        position.workplace?.id !== userData.workplaceId
      ) {
        throw new AppError(
          `El cargo '${position.name}' pertenece al área '${position.workplace?.name}'`,
          400
        );
      }
      if (!userData.workplaceId) userData.workplaceId = position.workplace?.id;
    }

    // Validar company, workplace, phoneNumber y role
    if (userData.companyId) await this.validateCompanyExists(user, companyId);
    if (userData.workplaceId)
      await this.validateWorkplaceExists(user, userData.workplaceId, companyId);
    if (userData.roleId) {
      const role = await this.roleService.getRoleById(userData.roleId, user);

      if (!role) {
        throw new AppError("El rol asignado no existe.", 400);
      }

      // Verificar si el rol tiene una compañía asociada o es global
      const isGlobalRole = !role.companyId; // Si companyId es NULL, es global

      if (!isGlobalRole && role.companyId !== companyId) {
        throw new AppError("El rol no pertenece a esta empresa.", 400);
      }
    }

    if (userData.phoneNumber) {
      await this.validatePhoneNumber(user, userData.phoneNumber);
    }

    // Validar unicidad de email
    const existingEmail = await this.userRepository.findUserByEmail(
      userData.email,
      companyId
    );
    if (existingEmail && !existingEmail.deletedAt) {
      throw new AppError("El email ya está registrado en esta empresa", 400);
    }

    // 🔹 Validar unicidad de numberDocument dentro de la empresa
    const existingNumberDocument =
      await this.userRepository.findUserByNumberDocumentAndCompanyId(
        userData.numberDocument,
        companyId
      );
    if (existingNumberDocument && !existingNumberDocument.deletedAt) {
      throw new AppError(
        "El número de documento ya está registrado en esta empresa",
        400
      );
    }

    // Generar código único
    const code = await this.generateUniqueCode(companyId);

    // Validar fecha de nacimiento
    if (new Date(userData.birthDate) > new Date()) {
      throw new AppError("La fecha de nacimiento no puede ser futura", 400);
    }

    // Hash password
    userData.password = await bcryptjs.hash(userData.password, 10);

    // Sanitizar datos
    userData.numberDocument = userData.numberDocument.replace(/\s+/g, "");
    userData.email = userData.email.trim().toLowerCase();

    // Crear usuario
    return this.userRepository.createUser({
      ...userData,
      code,
      status: true,
    });
  }

  // Actualizar un usuario
  async updateUser(
    id: string,
    userDataUpdated: UpdateUserDTO,
    user: { roleId: string; companyId?: string }
  ): Promise<UserResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    let companyId: string | null = null;

    // Validar companyId solo si no es un rol "global"
    if (!isSuperAdmin) {
      if (!user.companyId)
        throw new AppError("No tienes una empresa asignada", 403);
      companyId = user.companyId;
    } else {
      // No forzamos `companyId`, puede ser `NULL`
      companyId = userDataUpdated.companyId ?? null;
    }

    // Obtener usuario
    const existingUser = isSuperAdmin
      ? await this.userRepository.getUserById(id)
      : await this.userRepository.getUserById(id, user.companyId);

    if (!existingUser || !existingUser.status)
      throw new AppError("El usuario no existe", 404);

    if (!isSuperAdmin && existingUser.companyId !== user.companyId) {
      throw new AppError("No puedes editar usuarios de otra empresa");
    }

    // Validar email único
    if (userDataUpdated.email) {
      const existingEmail = await this.userRepository.findUserByEmail(
        userDataUpdated.email,
        companyId ?? undefined
      );
      if (existingEmail && existingEmail.id !== id) {
        throw new AppError("El email ya está registrado", 400);
      }
    }

    // 🔹 Validar campos opcionales para SuperAdmin
    if (!isSuperAdmin) {
      // Validar empresa si se actualiza
      if (userDataUpdated.companyId) {
        await this.validateCompanyExists(user, userDataUpdated.companyId);
      }

      // Validar rol sin filtrar por empresa
      if (userDataUpdated.roleId) {
        await this.validateRoleExists(user, userDataUpdated.roleId);
      }

      // Validar positionId (si se actualiza)
      if (userDataUpdated.positionId) {
        const position = await this.validatePositionExists(
          user,
          userDataUpdated.positionId,
          companyId ?? undefined
        );

        // La posición debe pertenecer a la misma empresa, solo si el usuario no es global
        if (!isSuperAdmin && position.companyId !== user.companyId)
          throw new AppError("El cargo no pertenece a tu empresa", 403);

        if (
          userDataUpdated.workplaceId &&
          position.workplace?.id !== userDataUpdated.workplaceId
        ) {
          throw new AppError(
            `El cargo pertenece al área '${position.workplace?.name}'`,
            400
          );
        }
      }

      // Validar workplaceId (si se actualiza)
      if (userDataUpdated.workplaceId) {
        await this.validateWorkplaceExists(
          user,
          userDataUpdated.workplaceId,
          companyId ?? undefined
        );
      }
    }

    return this.userRepository.updateUser(id, userDataUpdated);
  }

  async updateProfile(
    id: string,
    userData: UpdateProfileDTO,
    user: { userId: string; roleId: string; companyId?: string }
  ): Promise<UserResponse> {
    const existingUser = await this.userRepository.getUserById(
      id,
      user.companyId
    );
    if (!existingUser) throw new AppError("Usuario no encontrado", 404);

    // Actualizar solo campos permitidos
    return this.userRepository.updateProfile(user.userId, userData);
  }

  // Eliminar un usuario
  async deleteUser(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<UserResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const existingUser = isSuperAdmin
      ? await this.userRepository.getUserById(id)
      : await this.userRepository.getUserById(id, user.companyId);

    if (!existingUser) throw new AppError("El usuario no existe", 404);

    if (!isSuperAdmin && existingUser.companyId !== user.companyId) {
      throw new AppError("No tienes permisos para eliminar este usuario", 403);
    }

    if (existingUser.roleId === user.roleId) {
      throw new AppError("No puedes eliminarte a ti mismo", 403);
    }

    if (existingUser.deletedAt) {
      throw new AppError("El usuario ya fue eliminado", 400);
    }

    // Soft delete en la base de datos
    return this.userRepository.softDeleteUser(id);
  }

  async generateUniqueCode(companyId: string): Promise<string> {
    let code = await this.generateCodeUser();
    let existingUserCode = await this.userRepository.getUserByCode(
      code,
      companyId
    );
    let retries = 0;

    while (existingUserCode && retries < 3) {
      code = await this.generateCodeUser();
      existingUserCode = await this.userRepository.getUserByCode(
        code,
        companyId
      );
      retries++;
    }

    if (retries >= 3) {
      throw new AppError("No se pudo generar un código único", 500);
    }

    return code;
  }

  generateCodeUser = (): Promise<string> => {
    // Generar un código aleatorio para el usuario
    return new Promise((resolve, reject) => {
      randomBytes(5, (err, buffer) => {
        if (err) reject(err);
        const code = buffer.toString("hex").toUpperCase();
        resolve(code);
      });
    });
  };

  getDocumentValidationRules(documentTypeName: string) {
    const rules: {
      [key: string]: { regexPattern: RegExp; errorMessage: string };
    } = {
      // DNI Peruano (8 dígitos)
      DNI: {
        regexPattern: /^\d{8}$/,
        errorMessage: "El DNI debe tener 8 dígitos numéricos (ej: 12345678)",
      },
      // RUC Genérico (11 dígitos, empieza con 10 o 20)
      RUC: {
        regexPattern: /^(10|20)\d{9}$/,
        errorMessage:
          "El RUC debe empezar con 10 o 20 y tener 11 dígitos (ej: 10123456789 o 20123456789)",
      },
      // Carnet de Extranjería (CE) - Solo números (9 dígitos)
      CE: {
        regexPattern: /^\d{9}$/,
        errorMessage: "El CE debe tener 9 dígitos numéricos (ej: 123456789)",
      },
    };

    // Normalizar nombre del documento (ej: "ruc" -> "RUC", "C.E." -> "CE")
    const normalizedName = documentTypeName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ""); // Elimina caracteres no alfanuméricos

    // Buscar regla específica o usar default
    const rule = rules[normalizedName];

    if (!rule) {
      throw new AppError(
        `Tipo de documento '${documentTypeName}' no soportado`,
        400
      );
    }

    return rule;
  }

  // Validar la existencia de la empresa
  async validateCompanyExists(
    user: { roleId: string; companyId?: string },
    companyId?: string
  ): Promise<void> {
    if (!companyId) throw new AppError("La empresa no existe", 400);
    await this.companyService.getCompanyById(companyId, user);
  }

  async validateRoleExists(
    user: { roleId: string; companyId?: string },
    roleId?: string,
    targetCompanyId?: string
  ): Promise<void> {
    if (!roleId) throw new AppError("El rol es requerido", 400);

    const role = await this.roleService.getRoleById(roleId, user);

    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    if (!isSuperAdmin && role?.companyId !== user.companyId) {
      throw new AppError("El rol no pertenece a tu empresa", 403);
    }

    if (isSuperAdmin && role?.companyId !== targetCompanyId) {
      throw new AppError("El rol no pertenece a la empresa", 403);
    }

    if (!role || !role.status)
      throw new AppError("El rol no existe o está deshabilitado", 403);
  }

  async validateWorkplaceExists(
    user: { roleId: string; companyId?: string },
    workplaceId?: string,
    targetCompanyId?: string
  ): Promise<void> {
    if (!workplaceId) throw new AppError("El área es requerida", 400);

    const workplace = await this.workplaceService.getWorkPlaceById(
      workplaceId,
      user
    );

    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    if (!isSuperAdmin && workplace?.companyId !== user.companyId) {
      throw new AppError("El área no pertenece a tu empresa", 403);
    }

    if (isSuperAdmin && workplace?.companyId !== targetCompanyId) {
      throw new AppError("El área no pertenece a la empresa", 403);
    }

    if (!workplace || !workplace.status)
      throw new AppError("El área no existe", 404);
  }

  async validatePositionExists(
    user: { roleId: string; companyId?: string },
    positionId?: string,
    targetCompanyId?: string
  ): Promise<PositionResponse> {
    if (!positionId) throw new AppError("El cargo es requerido", 400);

    const position = await this.positionService.getPositionById(
      positionId,
      user
    );

    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    if (!isSuperAdmin && position?.companyId !== user.companyId) {
      throw new AppError("El cargo no pertenece a tu empresa ", 403);
    }

    if (isSuperAdmin && position?.companyId !== targetCompanyId) {
      throw new AppError("El cargo no pertenece a la empresa", 403);
    }

    if (!position || !position.status)
      throw new AppError("El cargo no existe", 404);

    return position;
  }

  async validatePhoneNumber(
    user: { roleId: string; companyId?: string },
    phoneNumber: string
  ): Promise<void> {
    if (!phoneNumber)
      throw new AppError("El número de teléfono es requerido", 400);

    const phoneRegex = /^9\d{8}$/;
    if (!phoneNumber.match(phoneRegex))
      throw new AppError("El número de teléfono no es válido", 400);
  }

  async validateDocumentTypeExists(
    user: { roleId: string; companyId?: string },
    documentTypeId?: string,
    targetCompanyId?: string
  ): Promise<DocumentTypeResponse> {
    if (!documentTypeId) {
      throw new AppError("El tipo de documento es requerido", 400);
    }

    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    const documentType = await this.documentTypeService.getDocumentTypeById(
      documentTypeId,
      user
    );

    if (!isSuperAdmin && documentType?.companyId !== user.companyId) {
      throw new AppError("El tipo de documento no pertenece a tu empresa", 403);
    }

    if (isSuperAdmin && documentType?.companyId !== targetCompanyId) {
      throw new AppError("El tipo de documento no pertenece a la empresa", 403);
    }

    if (!documentType || !documentType.status)
      throw new AppError("El tipo de documento no existe", 404);

    return documentType;
  }
}
