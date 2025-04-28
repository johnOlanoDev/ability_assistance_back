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
  configureNationalHolidays,
  createScheduleException,
  deleteScheduleException,
  getScheduleExceptionById,
  getScheduleExceptions,
  updateScheduleException,
} = scheduleExceptionController;

// Middleware para validar permisos específicos
const requirePermission = (permissions: string[]) =>
  validateCompanyPermission(permissions);

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

router.post(
  "/national-holidays",
  authenticate,
  requirePermission(["schedule:manage"]),
  validate,
  configureNationalHolidays
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

export default router;
