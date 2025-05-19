import express from "express";
import { validate } from "../middleware/errors/validate";
import { DependencyContainer } from "../core/di/container";
import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";
import { ScheduleController } from "@/modules/schedule/Schedule/controller/schedule.controller";
import {
  createScheduleValidation,
  idScheduleParamValidation,
} from "@/modules/schedule/Schedule/validations/schedule.validation";

const router = express.Router();
const scheduleController = DependencyContainer.resolve(ScheduleController);
const {
  getAllSchedules,
  getAllSchedulesWithDisabled,
  getAllScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} = scheduleController;

// Middleware para validar permisos específicos
const requirePermission = (permissions: string[]) =>
  validateCompanyPermission(permissions);

router.get(
  "/all",
  authenticate,
  requirePermission(["schedule:read", "schedule:self"]),
  validate,
  getAllSchedules
);

router.get(
  "/disable/all",
  authenticate,
  requirePermission(["schedule:read", "schedule:self"]),
  validate,
  getAllSchedulesWithDisabled
);

router.get(
  "/id/:id",
  authenticate,
  requirePermission(["schedule:read"]),
  idScheduleParamValidation,
  validate,
  getAllScheduleById
);

router.post(
  "/save",
  authenticate,
  requirePermission(["schedule:manage"]),
  createScheduleValidation,
  validate,
  createSchedule
);

router.put(
  "/update/:id",
  authenticate,
  requirePermission(["schedule:manage"]),
  idScheduleParamValidation,
  validate,
  updateSchedule
);

router.delete(
  "/delete/:id",
  authenticate,
  requirePermission(["schedule:manage"]),
  idScheduleParamValidation,
  validate,
  deleteSchedule
);

export default router;
