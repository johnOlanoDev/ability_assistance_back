import express from "express";

import { validate } from "../middleware/errors/validate";
import { DependencyContainer } from "../core/di/container";
import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";
import { AttendanceController } from "@/modules/attendance/controller/attendance.controller";

const router = express.Router();
const attendanceController = DependencyContainer.resolve(AttendanceController);

const {
  registerCheckinAttendance,
  updateCheckinAttendance,
  getAttendanceHistory,
  getAllUsersWithAttendance,
  getReportUserByDate,
  getUserAttendance,
  registerCheckoutAttendance,
  getAttendanceByScheduleId,
  findScheduleReportByUserId
} = attendanceController;

// Middleware para validar permisos específicos
const requirePermission = (permissions: string[]) =>
  validateCompanyPermission(permissions);

router.post(
  "/save/checkin",
  authenticate,
  requirePermission(["attendance:manage"]),
  validate,
  registerCheckinAttendance
);

router.put(
  "/save/checkout",
  authenticate,
  requirePermission(["attendance:manage"]),
  validate,
  registerCheckoutAttendance
);

router.get(
  "/history",
  authenticate,
  requirePermission(["attendance:self", "attendance:read"]),
  validate,
  getAttendanceHistory
);

router.get(
  "/user/active",
  authenticate,
  requirePermission(["attendance:self", "attendance:read"]),
  validate,
  getUserAttendance
);

router.get(
  "/report/user/date",
  authenticate,
  requirePermission(["attendance:self", "attendance:read"]),
  validate,
  getReportUserByDate
);

router.get(
  "/report/all/users",
  authenticate,
  requirePermission(["attendance:read", "attendance:manage"]),
  validate,
  getAllUsersWithAttendance
);

router.put(
  "/update/checkin/:id",
  authenticate,
  requirePermission(["attendance:manage", "attendance:update"]),
  validate,
  updateCheckinAttendance
);

router.get(
  "/schedule/:id",
  authenticate,
  requirePermission(["attendance:manage", "attendance:self"]),
  validate,
  getAttendanceByScheduleId
);

router.get(
  "/schedule/user/:userId/:scheduleId",
  authenticate,
  requirePermission(["attendance:manage", "attendance:self"]),
  validate,
  findScheduleReportByUserId
);


export default router;
