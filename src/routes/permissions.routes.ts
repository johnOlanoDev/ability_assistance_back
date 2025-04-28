import express from "express";
import { validate } from "../middleware/errors/validate";
import { DependencyContainer } from "../core/di/container";

import { PermissionController } from "@/modules/permissions/controllers/permission.controller";
import {
  createPermissionValidation,
  idParamPermissionValidation,
  nameParamPermissionValidation,
} from "@/modules/permissions/validations/permissions.validations";
import { authenticate, validateCompanyPermission } from "@/middleware/auth/authenticate.auth";

const router = express.Router();
const permissionController = DependencyContainer.resolve(PermissionController);
const {
  getAllPermissions,
  getPermissionById,
  getPermissionByName,
  createPermission,
  updatePermission,
  deletePermission,
} = permissionController;

const requirePermission = (permissions: string[]) => validateCompanyPermission(permissions);

router.get("/all",authenticate,requirePermission(["permission:read"]), getAllPermissions);
router.get("/id/:id",authenticate,requirePermission(["permission:read"]), idParamPermissionValidation, validate, getPermissionById);
router.get("/name/:name",authenticate,requirePermission(["permission:read"]), nameParamPermissionValidation,validate,getPermissionByName);
router.post("/save",authenticate,requirePermission(["permission:manage"]), createPermissionValidation, validate, createPermission);
router.put("/update/:id",authenticate,requirePermission(["permission:update"]), idParamPermissionValidation, validate, updatePermission);
router.delete("/softDelete/:id",authenticate,requirePermission(["permission:delete"]), idParamPermissionValidation, deletePermission);


export default router;
