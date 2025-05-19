import express from "express";
import { validate } from "@/middleware/errors/validate";
import { DependencyContainer } from "@/core/di/container";
import { UserController } from "@/modules/users/controllers/user.controller";
import {
  createUserValidation,
  paginationValidation,
  idParamValidation,
  updateProfileValidation,
} from "@/modules/users/validations/userValidations";

import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";
import { uploadAvatar } from "@/config/multer";

const router = express.Router();
const userController = DependencyContainer.resolve(UserController);

const requirePermission = (permissions: string[]) =>
  validateCompanyPermission(permissions);

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateProfile,
  deleteUser,
  getAvatarUrl
} = userController;

// Obtener todos los usuarios
router.get(
  "/all",
  authenticate,
  requirePermission(["user:read", "user:self"]),
  paginationValidation,
  validate,
  getAllUsers
);

// Obtener un usuario por ID
router.get(
  "/id/:id",
  authenticate,
  requirePermission(["user:read", "user:profile", "user:self"]),
  idParamValidation,
  validate,
  getUserById
);

// Crear un nuevo usuario
router.post(
  "/save",
  authenticate,
  requirePermission(["user:manage"]),
  uploadAvatar,
  createUserValidation,
  validate,
  createUser
);

// Actualizar un usuario
router.put(
  "/update/:id",
  authenticate,
  requirePermission(["user:update"]),
  uploadAvatar,
  idParamValidation,
  updateUser
);

/* router.put("update/:id",authenticate,idParamValidation, updateUser); */

// Actualizar perfil
router.put(
  "/update/profile/:id",
  authenticate,
  requirePermission(["user:update", "user:self", "user:profile"]),
  uploadAvatar,
  idParamValidation,
  validate,
  updateProfile
);


router.get(
  "/profile/avatar/:id",
  authenticate,
  requirePermission(["user:read","user:profile"]) ,
  idParamValidation,
  validate,
  getAvatarUrl
)

// Eliminar un usuario
router.delete(
  "/softDelete/:id",
  authenticate,
  requirePermission(["user:delete"]),
  idParamValidation,
  deleteUser
);

export default router;
