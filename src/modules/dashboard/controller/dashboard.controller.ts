import { inject, injectable } from "tsyringe";
import { DashboardService } from "../services/dashboard.service";
import { NextFunction, Request, Response } from "express";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";

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

  getDashboardMetrics = async (req: Request, res: Response, next: NextFunction) => {
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
  }
}
