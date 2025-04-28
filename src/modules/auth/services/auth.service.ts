import { inject, injectable } from "tsyringe";
import { UserRepository } from "@/modules/users/repository/user.repository";
import { JwtHelper } from "@/utils/helper/jwt.helper";
import { AppError } from "@/middleware/errors/AppError";
import { CompanyService } from "@/modules/companies/services/company.service";
import { RoleRepository } from "../../roles/repository/role.repository";

@injectable()
export class AuthService {
  constructor(
    @inject("UserRepository") private userRepository: UserRepository,
    @inject("RoleRepository") private roleRepository: RoleRepository,
    @inject("CompanyService") private companyService: CompanyService
  ) {}

  /**
   * Inicia sesión de un usuario.
   * @param email Email del usuario.
   * @param password Contraseña en texto plano.
   * @returns Token JWT si las credenciales son válidas.
   */
  public async login(email: string, password: string) {
    // Buscar el usuario por email
    const user = await this.userRepository.findUserByEmail(email);
    if (!user) throw new AppError("Usuario no encontrado.");

    // Verificar la contraseña
    const isPasswordValid = await this.userRepository.verifyPassword(
      user,
      password
    );

    await this.updateLastLogin(user.id);
    
    if (!isPasswordValid)
      throw new AppError("Credenciales inválidas. Inténtelo nuevamente.");

    // Obtener el rol del usuario
    const role =
      user.roleId && (await this.userRepository.findRolesByUserId(user.id));
    if (!role) throw new AppError("El usuario no tiene roles asignados.");
    const roleId = role.roleId;
    if (!roleId) throw new AppError("El usuario no tiene roles asignados.");

    // Validar el rol
    const validateRole = await this.roleRepository.getRoleById(roleId);
    if (!validateRole) throw new AppError("El rol del usuario no existe.");
    if (!validateRole.status)
      throw new AppError("El rol del usuario está deshabilitado.");

    // Verificar si el usuario es Superadmin
    const isSuperadmin =
      validateRole.name.toLowerCase().includes("superadmin") ||
      validateRole.name.includes("Superadmin");

    // Validar la empresa solo para usuarios que no son Superadmin
    let companyId: string | undefined;
    if (!isSuperadmin) {
      if (!user.companyId)
        throw new AppError("El usuario no tiene una empresa asociada.");
      const company = await this.companyService.getCompanyById(user.companyId, {
        roleId,
        companyId: user.companyId,
      });
      if (!company)
        throw new AppError("La empresa asociada al usuario no existe.");
      companyId = company.id;
    } else {
      companyId = undefined; // El Superadmin no tiene empresa asociada
    }
    // Generar el token JWT
    const accessToken = JwtHelper.generateToken({
      userId: user.id,
      roleId,
      companyId: companyId || undefined,
    });

    const refreshToken = JwtHelper.generateRefreshToken({
      userId: user.id,
      roleId,
      companyId: companyId || undefined,
    });

    await this.userRepository.updateUserRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.updateUser(userId, { lastLogin: new Date() });
  }
}
