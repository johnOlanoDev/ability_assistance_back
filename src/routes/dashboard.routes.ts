import express from "express";
import { validate } from "@/middleware/errors/validate";
import { DependencyContainer } from "@/core/di/container";
import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";
import { DashboardController } from "@/modules/dashboard/controller/dashboard.controller";

const router = express.Router();
const dashboardController = DependencyContainer.resolve(DashboardController);

const requiredPermission = (permissions: string[]) =>
  validateCompanyPermission(permissions);

const {
  getMonthlyWorkedHours,
  countAbsencesToday,
  countApprovedLeavesToday,
  countLateArrivalsToday,
  countPresentToday,
  getAttendanceTrend,
  getRecentAttendanceRecords,
  getDashboardMetrics,
  getAttendanceMetricsByDepartment,
  getMonthlyAttendanceRate,
  getMonthlyLateRate,
  getMonthlyAbsenceRate,
  getLateAttendancesThisDate,
  getPermissionsAttendancesThisDate
} = dashboardController;

router.get(
  "/count/absences-today",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  countAbsencesToday
);

router.get(
  "/attendance/metrics-workplace",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  getAttendanceMetricsByDepartment
);

router.get(
  "/count/approved-leaves-today",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  countApprovedLeavesToday
);

router.get(
  "/count/late-arrivals-today",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  countLateArrivalsToday
);

router.get(
  "/count/present-today",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  countPresentToday
);

router.get(
  "/attendance/trend",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  getAttendanceTrend
);

router.get(
  "/attendance/recent",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  getRecentAttendanceRecords
);

router.get(
  "/metrics",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  getDashboardMetrics
);

router.get(
  "/attendance/monthly/present",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  getMonthlyAttendanceRate
);

router.get(
  "/attendance/monthly/late",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  getMonthlyLateRate
);

router.get(
  "/attendance/monthly/absent",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  getMonthlyAbsenceRate
);

router.get(
  "/attendance/monthly/worked-hours",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  getMonthlyWorkedHours
);

router.get(
  "/attendance/late-month",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  getLateAttendancesThisDate
);

router.get(
  "/attendance/permissions-date",
  authenticate,
  requiredPermission(["dashboard:read"]),
  validate,
  getPermissionsAttendancesThisDate
);

export default router;
