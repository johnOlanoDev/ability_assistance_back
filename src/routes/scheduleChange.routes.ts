import express from "express";
import { validate } from "../middleware/errors/validate";
import { DependencyContainer } from "../core/di/container";
import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";
import {
  idScheduleParamValidation,
} from "@/modules/schedule/Schedule/validations/schedule.validation";
import { ScheduleChangeController } from "@/modules/schedule/scheduleChange/controller/scheduleChange.controller";

const router = express.Router();
const scheduleChangeController = DependencyContainer.resolve(
  ScheduleChangeController
);
const {
  checkScheduleChangeForDate,
  createScheduleChange,
  deleteScheduleChange,
  getEffectiveScheduleChange,
  getScheduleChangeById,
  getScheduleChangeSummary,
  getScheduleChanges,
  scheduleBulkChanges,
  updateScheduleChange,
} = scheduleChangeController;

// Middleware para validar permisos específicos
const requirePermission = (permissions: string[]) =>
  validateCompanyPermission(permissions);

router.get(
  "/all",
  authenticate,
  requirePermission(["schedule:read", "schedule:self"]),
  validate,
  getScheduleChanges
);

router.get(
  "/check",
  authenticate,
  requirePermission(["schedule:read", "schedule:self"]),
  validate,
  checkScheduleChangeForDate
);

router.get(
  "/effective",
  authenticate,
  requirePermission(["schedule:read"]),
  validate,
  getEffectiveScheduleChange
);

router.get(
  "/summary",
  authenticate,
  requirePermission(["schedule:read"]),
  validate,
  getScheduleChangeSummary
);

router.get(
  "/id/:id",
  authenticate,
  requirePermission(["schedule:read"]),
  validate,
  getScheduleChangeById
);

router.post(
  "/save",
  authenticate,
  requirePermission(["schedule:manage"]),
  validate,
  createScheduleChange
);

router.post(
  "/bulk",
  authenticate,
  requirePermission(["schedule:manage"]),
  validate,
  scheduleBulkChanges
);

router.put(
  "/update/:id",
  authenticate,
  requirePermission(["schedule:manage"]),
  idScheduleParamValidation,
  validate,
  updateScheduleChange
);

router.delete(
  "/delete/:id",
  authenticate,
  requirePermission(["schedule:manage"]),
  idScheduleParamValidation,
  validate,
  deleteScheduleChange
);

export default router;
