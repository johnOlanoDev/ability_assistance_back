import { inject, injectable } from "tsyringe";
import { AttendanceService } from "../service/attendance.service";
import { NextFunction, Request, Response } from "express";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";

@injectable()
export class AttendanceController {
  constructor(
    @inject("AttendanceService") private attendanceService: AttendanceService
  ) {}

  // attendance.controller.ts
  getAttendanceHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user; 

      // Obtener el historial de asistencia
      const data = await this.attendanceService.getAttendanceHistory(user);

      sendResponseSuccess(
        res,
        200,
        "Historial de asistencia obtenido correctamente",
        data,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getUserAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;

      const attendance = await this.attendanceService.getUserAttendance(user);

      sendResponseSuccess(
        res,
        200,
        "Asistencia del usuario obtenida correctamente",
        attendance,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  registerCheckinAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const checkinAttendance = req.body;
      const user = req.user;

      const attendance = await this.attendanceService.registerCheckinAttendance(
        checkinAttendance,
        user
      );

      sendResponseSuccess(
        res,
        201,
        "Asistencia registrada correctamente",
        attendance,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  registerCheckoutAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const checkoutAttendance = req.body;
      const user = req.user;

      const attendance = await this.attendanceService.registerCheckOut(
        checkoutAttendance,
        user
      );

      sendResponseSuccess(
        res,
        201,
        "Asistencia registrada correctamente",
        attendance,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  updateCheckinAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const checkinAttendance = req.body;
      const user = req.user;

      const attendance = await this.attendanceService.updateCheckIn(
        id,
        checkinAttendance,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Asistencia actualizada correctamente",
        attendance,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  assignPermissionToAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { permissionId } = req.body;
      const user = req.user;

      const attendance =
        await this.attendanceService.assignPermissionToAttendance(
          id,
          permissionId,
          user
        );

      sendResponseSuccess(
        res,
        200,
        "Asistencia actualizada correctamente",
        attendance,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getReportUserByDate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { date } = req.query;
      const user = req.user;

      if (!date) {
        res.status(400).json({ error: "La fecha es obligatoria" });
      }

      const parsedDate = new Date(date as string);
      if (isNaN(parsedDate.getTime())) {
        res
          .status(400)
          .json({ error: "Formato de fecha inválido. Usa YYYY-MM-DD" });
      }

      const attendance = await this.attendanceService.getReportUserByDate(
        parsedDate,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Asistencia registrada correctamente",
        attendance,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getAllUsersWithAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;
      const attendance = await this.attendanceService.getAllUsersWithAttendance(
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Asistencia de horarios obtenidos satisfactoriamente.",
        attendance,
        true
      );
    } catch (error) {
      next(error);
    }
  };
}
