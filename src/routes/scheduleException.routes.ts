import express from "express";
import { validate } from "../middleware/errors/validate";
import { DependencyContainer } from "../core/di/container";
import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";
import { ScheduleExceptionController } from "@/modules/schedule/scheduleException/controller/scheduleException.controller";

const router = express.Router();
const scheduleExceptionController = DependencyContainer.resolve(
  ScheduleExceptionController
);
const {
  createScheduleException,
  deleteScheduleException,
  getScheduleExceptionById,
  getScheduleExceptions,
  updateScheduleException,
  checkOverlappingExceptions,
  getScheduleExceptionByDate,
  findUsersByTarget,
  createHoliday,
  checkIsHoliday,
  getHolidays,
  importHolidays,
} = scheduleExceptionController;

// Middleware para validar permisos específicos
const requirePermission = (permissions: string[]) =>
  validateCompanyPermission(permissions);

router.get(
  "/:id/users",
  authenticate,
  requirePermission(["schedule:read", "schedule:self"]),
  validate,
  findUsersByTarget
);

router.get(
  "/all",
  authenticate,
  requirePermission(["schedule:read", "schedule:self"]),
  validate,
  getScheduleExceptions
);

router.get(
  "/id/:id",
  authenticate,
  requirePermission(["schedule:read"]),
  validate,
  getScheduleExceptionById
);

router.post(
  "/save",
  authenticate,
  requirePermission(["schedule:manage"]),
  validate,
  createScheduleException
);

router.put(
  "/update/:id",
  authenticate,
  requirePermission(["schedule:manage"]),
  validate,
  updateScheduleException
);

router.delete(
  "/delete/:id",
  authenticate,
  requirePermission(["schedule:manage"]),
  validate,
  deleteScheduleException
);

router.post(
  "/check-overlaps",
  authenticate,
  requirePermission(["schedule:read"]),
  validate,
  checkOverlappingExceptions
);

router.get(
  "/date/check",
  authenticate,
  requirePermission(["schedule:read"]),
  validate,
  getScheduleExceptionByDate
);

router.post(
  "/holiday/create",
  authenticate,
  requirePermission(["schedule:manage"]),
  validate,
  createHoliday
);

router.get(
  "/holiday/check",
  authenticate,
  requirePermission(["schedule:read"]),
  validate,
  checkIsHoliday
);

router.get(
  "/holiday/all",
  authenticate,
  requirePermission(["schedule:read"]),
  validate,
  getHolidays
);

router.post(
  "/holiday/import",
  authenticate,
  requirePermission(["schedule:manage"]),
  validate,
  importHolidays
);

export default router;
