import { injectable, inject } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";

@injectable()
export class AuthController {
  constructor(
    @inject("AuthService") private readonly authService: AuthService
  ) {}

  /**
   * Inicia sesión de un usuario.
   */

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const token = await this.authService.login(email, password);
      sendResponseSuccess(res, 200, "Inicio de sesión exitoso", token, true )
    } catch (error) {
      next(error);
    }
  };
}
