import { Request, Response, NextFunction } from "express";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";
import { inject, injectable } from "tsyringe";
import { ReportAttendanceService } from "../service/report.service";
import { CustomDateRange, DateRangeFilter } from "@/utils/helper/dateRange";

@injectable()
export class ReportAttendanceController {
  constructor(
    @inject("ReportAttendanceService")
    private readonly reportAttendanceService: ReportAttendanceService
  ) {}

  // Obtener reportes de asistencia
  getAttendanceReports = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { take = 10, cursorId } = req.query;
      const user = req.user;

      // Extraer filtros de la solicitud
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        userId: req.query.userId as string,
        scheduleId: req.query.scheduleId as string,
      };

      const reports = await this.reportAttendanceService.getAttendanceReports(
        parseInt(take as string, 10),
        user,
        cursorId as string,
        filters
      );

      sendResponseSuccess(
        res,
        200,
        "Reportes de asistencia obtenidos satisfactoriamente",
        reports,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Exportar reportes a Excel
  exportToExcel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      // Extraer filtros de la solicitud
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        userId: req.query.userId as string,
        scheduleId: req.query.scheduleId as string,
      };

      const excelBuffer = await this.reportAttendanceService.exportToExcel(
        user,
        filters
      );

      // Configurar encabezados de respuesta para descarga de archivo
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=reporte-asistencia-${Date.now()}.xlsx`
      );

      // Enviar el buffer como respuesta
      res.send(excelBuffer);
    } catch (error) {
      next(error);
    }
  };

  getReportAttendanceByAssistanceType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { filter, startDate, endDate, type } = req.query as {
        filter?: DateRangeFilter;
        startDate?: string;
        endDate?: string;
        type?: string;
      };

      const user = req.user;

      const filterType =
        filter === "custom" && startDate && endDate ? "custom" : "preset";

      const customRange: CustomDateRange | undefined =
        filterType === "custom" && startDate && endDate
          ? { startDate, endDate }
          : undefined;

      const data =
        await this.reportAttendanceService.getReportAttendanceByAssistanceType(
          user,
          (filter as DateRangeFilter) || "month",
          customRange,
          type
        );

      sendResponseSuccess(
        res,
        200,
        "Reporte por tipo de asistencias obtenidas",
        data,
        true
      );
    } catch (error) {
      next(error);
    }
  };
}
