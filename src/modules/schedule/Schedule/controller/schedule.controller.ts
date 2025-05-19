import { ScheduleService } from "../service/schedule.service";
import { inject, injectable } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";

@injectable()
export class ScheduleController {
  constructor(
    @inject(ScheduleService) private scheduleService: ScheduleService
  ) {}

  getAllSchedules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      const schedules = await this.scheduleService.getAllSchedules(user);

      sendResponseSuccess(
        res,
        200,
        "Horarios obtenidos correctamente",
        schedules,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getAllSchedulesWithDisabled = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      const schedules = await this.scheduleService.getAllSchedulesWithDisabled(user);

      sendResponseSuccess(
        res,
        200,
        "Horarios desactivados obtenidos correctamente",
        schedules,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getAllScheduleById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const schedule = await this.scheduleService.getScheduleById(id, user);

      sendResponseSuccess(
        res,
        200,
        "Horario obtenido correctamente",
        schedule,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  createSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schedule = req.body;
      const user = req.user;

      const newSchedule = await this.scheduleService.createSchedule(
        schedule,
        user
      );

      sendResponseSuccess(
        res,
        201,
        "Horario creado correctamente",
        newSchedule,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const scheduleDataUpdated = req.body;
      const user = req.user;

      const updatedSchedule = await this.scheduleService.updateSchedule(
        id,
        scheduleDataUpdated,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Horario actualizado correctamente",
        updatedSchedule,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  deleteSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const deleteSchedule = await this.scheduleService.deleteSchedule(
        id,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Horario eliminado correctamente",
        deleteSchedule,
        true
      );
    } catch (error) {
      next(error);
    }
  };
}
