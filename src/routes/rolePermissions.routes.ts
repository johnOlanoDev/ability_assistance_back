import express from "express";
import { DependencyContainer } from "@/core/di/container";
import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";
import { validate } from "@/middleware/errors/validate";
import { RolePermissionController } from "@/modules/relationships/rolesPermissions/controller/rolePermissions.controller";

const router = express.Router();
const rolePermissionController = DependencyContainer.resolve(
  RolePermissionController
);

// Middleware para validar permisos específicos
const requirePermission = (permissions: string[]) =>
  validateCompanyPermission(permissions);

const {
  getPermissionsByRoleId,
  assignPermissionToRole,
  updateRolePermission,
  deleteRolePermission,
  getRolePermissions,
} = rolePermissionController;

router.get(
  "/all",
  authenticate,
  requirePermission(["role:manage", "permission:manage"]),
  validate,
  getRolePermissions
);

// Obtener todos los permisos asignados a un rol
router.get(
  "/role/:roleId/permission/:permissionId",
  authenticate,
  requirePermission(["role:manage", "permission:manage"]),
  validate,
  getPermissionsByRoleId
);

// Asignar un permiso a un rol
router.post(
  "/save",
  authenticate,
  requirePermission(["role:manage", "permission:manage"]),
  validate,
  assignPermissionToRole
);

// Actualizar la relación entre un rol y un permiso
router.put(
  "/role/:roleId/permissions/:permissionId",
  authenticate,
  requirePermission(["role:manage", "permission:manage"]),
  validate,
  updateRolePermission
);

// Eliminar la relación entre un rol y un permiso
router.delete(
  "/role/:roleId/permissions/:permissionId",
  authenticate,
  requirePermission(["role:manage", "permission:manage"]),
  validate,
  deleteRolePermission
);

export default router;
