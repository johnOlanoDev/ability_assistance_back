import jwt from "jsonwebtoken";
import { AppError } from "@/middleware/errors/AppError";

export class JwtHelper {
  private static readonly SECRET = process.env.JWT_SECRET || "secretOrPrivateKemust";
  private static readonly EXPIRES_IN = "30m"; // Tiempo de expiración del token
  private static readonly REFRESH_TOKEN_EXPIRES_IN = "1d";

  /**
   * Genera un token JWT.
   * @param payload Datos a incluir en el token.
   * @returns Token JWT firmado.
   */
  public static generateToken(payload: {
    userId: string;
    roleId: string;
    companyId: string | undefined;
  }): string {
    const jsonPayload = JSON.stringify(payload, (key, value) =>
      value === undefined ? null : value
    );
    const parsedPayload = JSON.parse(jsonPayload);

    // Firmar el token JWT
    return jwt.sign(parsedPayload, JwtHelper.SECRET, {
      expiresIn: JwtHelper.EXPIRES_IN,
    });
  }

  /**
   * Genera un refresh token.
   * @param payload Datos a incluir en el token.
   * @returns Refresh token firmado.
   */
  public static generateRefreshToken(payload: {
    userId: string;
    roleId: string;
    companyId: string | undefined;
  }): string {
    const jsonPayload = JSON.stringify(payload, (key, value) =>
      value === undefined ? null : value
    );
    const parsedPayload = JSON.parse(jsonPayload);

    // Firmar el refresh token
    return jwt.sign(parsedPayload, JwtHelper.SECRET, {
      expiresIn: JwtHelper.REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  /**
   * Verifica y decodifica un token JWT.
   * @param token Token JWT.
   * @returns Payload del token.
   */
  public static verifyToken(token: string): {
    userId: string;
    roleId: string;
    companyId?: string;
  } {
    try {
      return jwt.verify(token, JwtHelper.SECRET) as {
        userId: string;
        roleId: string;
        companyId?: string;
      };
    } catch (error) {
      throw new AppError("Token inválido o expirado.");
    }
  }

  /**
   * Verifica un refresh token.
   * @param refreshToken Refresh token a verificar.
   * @returns Payload del refresh token.
   */
  public static verifyRefreshToken(refreshToken: string): {
    userId: string;
    roleId: string;
    companyId?: string;
  } {
    try {
      return jwt.verify(refreshToken, JwtHelper.SECRET) as {
        userId: string;
        roleId: string;
        companyId?: string;
      };
    } catch (error) {
      throw new AppError("Refresh token inválido o expirado.");
    }
  }
}
