import express from "express";
import { DependencyContainer } from "@/core/di/container";
import { validate } from "@/middleware/errors/validate";
import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";
import { ReportAttendanceController } from "@/modules/attendance/controller/report.controller";

const router = express.Router();
const reportController = DependencyContainer.resolve(
  ReportAttendanceController
);

const {
  exportToExcel,
  getAttendanceReports,
  getReportAttendanceByAssistanceType,
} = reportController;

const requiredPermissions = (permissions: string[]) =>
  validateCompanyPermission(permissions);

router.get(
  "/attendance/reports",
  authenticate,
  requiredPermissions(["attendance:read", "attendance:self"]),
  validate,
  getAttendanceReports
);

// Ruta para exportar reportes a Excel
router.get(
  "/attendance/export-excel",
  authenticate,
  requiredPermissions(["attendance:manage"]),
  exportToExcel
);

router.get(
  "/attendance/assistance-type",
  authenticate,
  requiredPermissions(["attendance:manage"]),
  getReportAttendanceByAssistanceType
);
export default router;
