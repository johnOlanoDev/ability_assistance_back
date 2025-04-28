import express from "express";
import { validate } from "../middleware/errors/validate";
import { DependencyContainer } from "../core/di/container";
import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";
import { PermissionTypeController } from "@/modules/permissionsType/controllers/permissionType.controller";

const router = express.Router();
const permissionTypeController = DependencyContainer.resolve(
  PermissionTypeController
);
const {
  createPermissionType,
  deletePermissionType,
  getAllPermissionsTypes,
  getPermissionTypeById,
  getPermissionTypeByName,
  updatePermissionType,
} = permissionTypeController;

const requirePermission = (permissions: string[]) =>
  validateCompanyPermission(permissions);

router.get(
  "/all",
  authenticate,
  requirePermission(["permission:read"]),
  getAllPermissionsTypes
);
router.get(
  "/id/:id",
  authenticate,
  requirePermission(["permission:read"]),
  validate,
  getPermissionTypeById
);
router.get(
  "/name/:name",
  authenticate,
  requirePermission(["permission:read"]),
  validate,
  getPermissionTypeByName
);
router.post(
  "/save",
  authenticate,
  requirePermission(["permission:manage"]),
  validate,
  createPermissionType
);
router.put(
  "/update/:id",
  authenticate,
  requirePermission(["permission:update"]),
  validate,
  updatePermissionType
);
router.delete(
  "/softDelete/:id",
  authenticate,
  requirePermission(["permission:delete"]),
  validate,
  deletePermissionType
);

export default router;
