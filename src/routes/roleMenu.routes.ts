import express from "express";
import { validate } from "../middleware/errors/validate";
import { DependencyContainer } from "../core/di/container";

import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";
import { RoleMenuController } from "@/modules/relationships/roleMenu/controller/roleMenu.controller";
import { assignMenusValidation } from "@/modules/menu/validation/menuValidation";

const router = express.Router();

const roleMenuController = DependencyContainer.resolve(RoleMenuController);

const { assignMenus, getUnassignedMenus, getMenusByRole, removeMenu } = roleMenuController;

const requirePermission = (permissions: string[]) =>
  validateCompanyPermission(permissions);

// Asignar menús a un rol (requiere "roles:asignar_menus")
router.post(
  "/roles/:roleId/menus",
  authenticate,
  requirePermission(["menu:manage", "role:reads"]),
  assignMenusValidation,
  validate,
  assignMenus
);

// Obtener menús de un rol (requiere "roles:leer")
router.get(
  "/roles/:roleId/menus",
  authenticate,
  requirePermission(["menu:read", "role:read", "role:self", "menu:self", "company:self"]),
  validate,
  getMenusByRole
);

// @/modules/roles/routes/roleMenu.routes.ts
router.get(
  "/roles/:roleId/unassigned-menus",
  authenticate,
  requirePermission(["menu:read", "role:read", "role:self", "menu:self", "company:self"]),
  validate,
  getUnassignedMenus
);

// Remover un menú de un rol (requiere "roles:eliminar_menus")
router.delete(
  "/roles/:roleId/menus/:menuId",
  authenticate,
  requirePermission(["menu:delete", "role:delete"]),
  validate,
  removeMenu
);

export default router;
