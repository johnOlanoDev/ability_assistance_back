import express from "express";
import { validate } from "@/middleware/errors/validate";
import { DependencyContainer } from "@/core/di/container";
import {
  idParamValidation,
  createWorkplaceValidation,
} from "@/modules/workplace/validations/workplaceValidation";
import { WorkplaceController } from "@/modules/workplace/controllers/workplace.controller";
import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";

const router = express.Router();
const workplaceController = DependencyContainer.resolve(WorkplaceController);
const {
  createWorkPlace,
  deleteWorkPlace,
  getAllWorkPlaces,
  getWorkPlaceById,
  updateWorkPlace,
} = workplaceController;

const requiredPermissions = (permissions: string[]) =>
  validateCompanyPermission(permissions);

router.get(
  "/all",
  authenticate,
  requiredPermissions(["workplace:read", "workplace:self"]),
  validate,
  getAllWorkPlaces
);
router.get(
  "/id/:id",
  authenticate,
  requiredPermissions(["workplace:read", "workplace:self"]),
  idParamValidation,
  validate,
  getWorkPlaceById
);
router.post(
  "/save",
  authenticate,
  requiredPermissions(["workplace:manage"]),
  createWorkplaceValidation,
  validate,
  createWorkPlace
);
router.put(
  "/update/:id",
  authenticate,
  requiredPermissions([
    "workplace:manage",
    "workplace:update",
    "workplace:self",
  ]),
  idParamValidation,
  validate,
  updateWorkPlace
);
router.put(
  "/delete/:id",
  authenticate,
  requiredPermissions(["workplace:delete"]),
  idParamValidation,
  deleteWorkPlace
);

export default router;
