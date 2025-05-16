import express from "express";
import { DependencyContainer } from "@/core/di/container";
import { PositionController } from "@/modules/position/controllers/position.controller";
import { validate } from "@/middleware/errors/validate";
import {
  createPositionValidation,
  idParamValidation,
  paginationValidation,
} from "@/modules/position/validations/positionValidation";
import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";

const router = express.Router();
const positionController = DependencyContainer.resolve(PositionController);

const {
  getAllPositions,
  getPositionById,
  getAllPositionsDeleted,
  createPosition,
  updatePosition,
  deletePosition,
  getPositionsByWorkplace,
} = positionController;

const requiredPermissions = (permissions: string[]) =>
  validateCompanyPermission(permissions);

router.get(
  "/all",
  authenticate,
  requiredPermissions(["position:read", "position:self"]),
  paginationValidation,
  validate,
  getAllPositions
);
router.get(
  "/deleted",
  authenticate,
  requiredPermissions(["position:delete"]),
  paginationValidation,
  validate,
  getAllPositionsDeleted
);
router.get(
  "/id/:id",
  authenticate,
  requiredPermissions(["position:read", "position:self"]),
  idParamValidation,
  validate,
  getPositionById
);
router.get(
  "/workplace/:id",
  authenticate,
  requiredPermissions(["position:read", "position:self"]),
  idParamValidation,
  validate,
  getPositionsByWorkplace
);
router.post(
  "/save",
  authenticate,
  requiredPermissions(["position:manage"]),
  createPositionValidation,
  validate,
  createPosition
);
router.put(
  "/update/:id",
  authenticate,
  requiredPermissions(["position:manage", "position:update", "position:self"]),
  idParamValidation,
  validate,
  updatePosition
);
router.delete(
  "/delete/:id",
  authenticate,
  requiredPermissions(["position:delete"]),
  idParamValidation,
  validate,
  deletePosition
);

export default router;
