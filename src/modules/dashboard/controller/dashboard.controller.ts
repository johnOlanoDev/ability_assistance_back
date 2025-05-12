import { inject, injectable } from "tsyringe";
import { DashboardService } from "../services/dashboard.service";
import { NextFunction, Request, Response } from "express";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";
import { CustomDateRange, DateRangeFilter } from "@/utils/helper/dateRange";

@injectable()
export class DashboardController {
  constructor(
    @inject(DashboardService) private dashboardService: DashboardService
  ) {}

  countPresentToday = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;

      const count = await this.dashboardService.countPresentToday(user);

      sendResponseSuccess(
        res,
        200,
        "Conteo de asistencias obtenido exitosamente",
        count,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getAttendanceMetricsByDepartment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { workplaceName, positionName } = req.query;
      const user = req.user;

      const chartData =
        await this.dashboardService.getAttendanceMetricsByDepartment(
          user,
          workplaceName as string,
          positionName as string
        );

      res.status(200).json({
        success: true,
        message: "Datos de asistencia obtenidos correctamente",
        data: chartData,
      });
    } catch (error) {
      next(error);
    }
  };

  countAbsencesToday = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;

      const count = await this.dashboardService.countAbsencesToday(user);

      sendResponseSuccess(
        res,
        200,
        "Conteo de ausencias obtenido exitosamente",
        count,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  countLateArrivalsToday = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;

      const count = await this.dashboardService.countLateArrivalsToday(user);

      sendResponseSuccess(
        res,
        200,
        "Conteo de tardanzas obtenido exitosamente",
        count,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  countApprovedLeavesToday = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;

      const count = await this.dashboardService.countApprovedLeavesToday(user);

      sendResponseSuccess(
        res,
        200,
        "Conteo de permisos aprobados obtenido exitosamente",
        count,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getAttendanceTrend = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;

      const trend = await this.dashboardService.getAttendanceTrend(user);

      sendResponseSuccess(
        res,
        200,
        "Tendencia de asistencias obtenida exitosamente",
        trend,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getRecentAttendanceRecords = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { limit = 10 } = req.query;
      const user = req.user;
      const records = await this.dashboardService.getRecentAttendanceRecords(
        parseInt(limit as string, 10),
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Registros recientes de asistencias obtenidos exitosamente",
        records,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getDashboardMetrics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const filter =
        (req.query.filter as "today" | "week" | "month") || "today";

      // Suponemos que ya tienes middleware que mete estos datos en req.user
      const user = req.user;

      const result = await this.dashboardService.countDashboardMetrics(
        filter,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Métricas del dashboard obtenidas exitosamente",
        result,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getMonthlyAttendanceRate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;

      const rate = await this.dashboardService.getMonthlyAttendanceRate(user);

      sendResponseSuccess(
        res,
        200,
        "Tasa de asistencia mensual obtenida exitosamente",
        rate,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getMonthlyLateRate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;

      const rate = await this.dashboardService.getMonthlyLateRate(user);

      sendResponseSuccess(
        res,
        200,
        "Tasa de tardanzas mensual obtenida exitosamente",
        rate,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getMonthlyAbsenceRate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;

      const rate = await this.dashboardService.getMonthlyAbsenceRate(user);

      sendResponseSuccess(
        res,
        200,
        "Tasa de ausencias mensual obtenida exitosamente",
        rate,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getMonthlyWorkedHours = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;

      const rate = await this.dashboardService.getMonthlyWorkedHours(user);

      sendResponseSuccess(
        res,
        200,
        "Tasa de horas trabajadas mensual obtenida exitosamente",
        rate,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getLateAttendancesThisDate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { filter, startDate, endDate } = req.query as {
        filter?: DateRangeFilter;
        startDate?: string;
        endDate?: string;
      };

      const user = req.user;

      const filterType =
        filter === "custom" && startDate && endDate ? "custom" : "preset";

      const customRange: CustomDateRange | undefined =
        filterType === "custom" && startDate && endDate
          ? { startDate, endDate }
          : undefined;

      const data = await this.dashboardService.getLateAttendancesThisMonth(
        user,
        (filter as DateRangeFilter) || "month",
        customRange
      );

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getPermissionsAttendancesThisDate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { filter, startDate, endDate } = req.query as {
        filter?: DateRangeFilter;
        startDate?: string;
        endDate?: string;
      };

      const user = req.user;

      const filterType =
        filter === "custom" && startDate && endDate ? "custom" : "preset";

      const customRange: CustomDateRange | undefined =
        filterType === "custom" && startDate && endDate
          ? { startDate, endDate }
          : undefined;

      const data =
        await this.dashboardService.getPermissionsAttendancesThisMonth(
          user,
          (filter as DateRangeFilter) || "month",
          customRange
        );

      sendResponseSuccess(
        res,
        200,
        "Tasa de permisos obtenida exitosamente",
        data,
        true
      );
    } catch (error) {
      next(error);
    }
  };
}
