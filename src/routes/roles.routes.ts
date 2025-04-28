import express from "express";

import { RoleController } from "@/modules/roles/controllers/role.controller";
import { validate } from "../middleware/errors/validate";
import { DependencyContainer } from "../core/di/container";
import { authenticate, validateCompanyPermission } from "@/middleware/auth/authenticate.auth";
import {
  createRoleValidation,
  idParamValidation,
  nameParamValidation,
  paginationValidation,
} from "@/modules/roles/validation/role.validations";

const router = express.Router();
const roleController = DependencyContainer.resolve(RoleController);
const {
  createRole,
  deleteRole,
  findRoleByName,
  getAllRoles,
  getAllRolesByDeleted,
  getRoleById,
  updateRole,
} = roleController;

// Middleware para validar permisos específicos
const requirePermission = (permissions: string[]) => validateCompanyPermission(permissions);


router.post("/save", authenticate, requirePermission(["role:manage"]) ,createRoleValidation, validate, createRole);

router.get("/all",authenticate,requirePermission(["role:read", "role:self"]), paginationValidation, validate, getAllRoles);

router.get("/allDeleted",authenticate,requirePermission(["role:read"]), paginationValidation, validate, getAllRolesByDeleted);

router.get("/id/:id", authenticate,requirePermission(["role:read", "role:self"]), idParamValidation, validate, getRoleById);

router.get("/name/:name", authenticate,requirePermission(["role:read"]),nameParamValidation, validate, findRoleByName);

router.put("/update/:id", authenticate,requirePermission(["role:update",]), idParamValidation, validate, updateRole);

router.put("/softDelete/:id", authenticate,requirePermission(["role:delete", "role:self"]), idParamValidation, validate, deleteRole);

export default router;
