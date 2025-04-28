import express from "express";
import { DependencyContainer } from "@/core/di/container";
import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";
import { validate } from "@/middleware/errors/validate";
import { MenuController } from "@/modules/menu/controller/menu.controller";
import { createMenuValidation } from "@/modules/menu/validation/menuValidation";

const router = express.Router();
const menuController = DependencyContainer.resolve(MenuController);
const {
  createMenu,
  deleteMenu,
  getMenuById,
  getMenus,
  updateMenu,
  getMenusByRole,
} = menuController;

const requirePermission = (permissions: string[]) =>
  validateCompanyPermission(permissions);

// Crear menú (requiere permiso "menus:crear")
router.post(
  "/save",
  authenticate,
  requirePermission(["menu:manage"]),
  createMenuValidation,
  validate,
  createMenu
);

// Listar menús (requiere permiso "menus:leer")
router.get(
  "/all",
  authenticate,
  requirePermission(["menu:read", "menu:self"]),
  getMenus
);

// Obtener menú por ID (requiere permiso "menus:leer")
router.get(
  "/menuId/:id",
  authenticate,
  requirePermission(["menu:read"]),
  validate,
  getMenuById
);

// Obtener menús por rol (requiere permiso "menus:leer")
router.get(
  "/roleMenu",
  authenticate,
  requirePermission([
    "menu:read",
    "role:read",
    "role:self",
    "menu:self",
    "company:self",
  ]),
  validate,
  getMenusByRole
);

// Actualizar menú (requiere permiso "menus:editar")
router.put(
  "/update/:id",
  authenticate,
  requirePermission(["menu:update"]),
  validate,
  updateMenu
);

// Eliminar menú (soft delete, requiere "menus:eliminar")
router.delete(
  "softDelete/:id",
  authenticate,
  requirePermission(["menu:delete"]),
  validate,
  deleteMenu
);

export default router;
