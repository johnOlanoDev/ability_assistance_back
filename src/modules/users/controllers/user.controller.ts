import { inject, injectable } from "tsyringe";
import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/user.service";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";
import { CloudinaryService } from "@/modules/cloudinary/services/cloudinary.service";
import { AppError } from "@/middleware/errors/AppError";

@injectable()
export class UserController {
  constructor(
    @inject("UserService") private userService: UserService,
    @inject("CloudinaryService") private cloudinaryService: CloudinaryService
  ) {}

  // Obtener todos los usuarios
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      const users = await this.userService.getAllUsers(user);

      sendResponseSuccess(
        res,
        200,
        "Usuarios obtenidos exitosamente.",
        users,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Obtener un usuario por ID
  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const userFound = await this.userService.getUserById(id, user);

      sendResponseSuccess(
        res,
        200,
        "Usuario obtenido exitosamente.",
        userFound,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getAvatarUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const userAvatar = await this.userService.getUserById(id, user);

      if (!userAvatar) {
        res.status(400).json("No se encontró al usuario");
      } else if (!userAvatar?.avatarUrl) {
        res.status(400).json("No se encontró el avatar del usuario");
      }

      const avatar = this.cloudinaryService.getImageUrl(
        userAvatar?.avatarUrl || ""
      );

      sendResponseSuccess(
        res,
        200,
        "Logo obtenido correctamente",
        avatar,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Crear un nuevo usuario
  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData = req.body;
      const user = req.user;

      if (req.file) {
        const publicId = await this.cloudinaryService.uploadBuffer(
          req.file.buffer,
          "user-avatar"
        );
        userData.avatarUrl = publicId;
      }

      const newUser = await this.userService.createUser(userData, user);

      sendResponseSuccess(
        res,
        201,
        "Usuario creado exitosamente",
        newUser,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Actualizar un usuario
  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userDataUpdated = { ...req.body };
      const user = req.user;

      // IMPORTANTE: Eliminar avatarUrl si es un objeto vacío
      if (
        userDataUpdated.avatarUrl &&
        typeof userDataUpdated.avatarUrl === "object" &&
        Object.keys(userDataUpdated.avatarUrl).length === 0
      ) {
        delete userDataUpdated.avatarUrl;
      }

      if (req.file) {
        const existingUser = await this.userService.getUserById(id, user);

        if (existingUser?.avatarUrl) {
          await this.cloudinaryService.deleteFile(existingUser.avatarUrl);
        }

        const publicId = await this.cloudinaryService.uploadBuffer(
          req.file.buffer,
          "user-avatar"
        );
        userDataUpdated.avatarUrl = publicId;
        userDataUpdated.avatarUrl =
          this.cloudinaryService.getImageUrl(publicId);
      }

      const updatedUser = await this.userService.updateUser(
        id,
        userDataUpdated,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Usuario actualizado exitosamente.",
        updatedUser,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const validatedData = { ...req.body };

      // IMPORTANTE: Eliminar avatarUrl si es un objeto vacío
      if (
        validatedData.avatarUrl &&
        typeof validatedData.avatarUrl === "object" &&
        Object.keys(validatedData.avatarUrl).length === 0
      ) {
        delete validatedData.avatarUrl;
      }

      if (req.file) {
        try {
          const publicId = await this.cloudinaryService.uploadBuffer(
            req.file.buffer,
            "user-avatar"
          );

          // Generar URL y asignar ambos campos
          validatedData.avatarPublicId = publicId;
          validatedData.avatarUrl =
            this.cloudinaryService.getImageUrl(publicId);
        } catch (error) {
          throw new AppError("Error al subir imagen", 500);
        }
      }

      // Actualizar perfil con datos fusionados
      const updatedUser = await this.userService.updateProfile(
        id,
        validatedData,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Usuario actualizado exitosamente",
        updatedUser,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Eliminar un usuario
  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const userId = await this.userService.getUserById(id, user);

      const deletedUser = await this.userService.deleteUser(id, user);

      if (userId?.avatarUrl) {
        await this.cloudinaryService.deleteFile(userId.avatarUrl);
      }

      sendResponseSuccess(
        res,
        200,
        "Usuario eliminado exitosamente.",
        deletedUser,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  avatarProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const userId = await this.userService.getUserById(id, user);

      if (!userId || !userId.avatarUrl) {
        res.status(400).json("No se encontró al usuario");
      }

      const userUrl = this.cloudinaryService.getImageUrl(
        userId?.avatarUrl || ""
      );

      sendResponseSuccess(
        res,
        200,
        "Avatar obtenido correctamente",
        { avatarUrl: userUrl },
        true
      );
    } catch (error) {
      next(error);
    }
  };
}
