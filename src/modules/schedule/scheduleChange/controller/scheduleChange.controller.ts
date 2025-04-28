// src/modules/scheduleChange/controller/scheduleChange.controller.ts
import { inject, injectable } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import {
  sendResponseSuccess,
  sendResponseError,
} from "@/utils/helper/sendResponse.helper";
import { ScheduleChangeService } from "../services/scheduleChange.service";

@injectable()
export class ScheduleChangeController {
  constructor(
    @inject("ScheduleChangeService")
    private scheduleChangeService: ScheduleChangeService
  ) {}

  /**
   * Crear un nuevo cambio de horario
   */
  createScheduleChange = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;

      const newChange = await this.scheduleChangeService.createScheduleChange(
        req.body,
        user
      );

      sendResponseSuccess(
        res,
        201,
        "Cambio de horario creado exitosamente",
        newChange,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualizar un cambio de horario existente
   */
  updateScheduleChange = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const updatedChange =
        await this.scheduleChangeService.updateScheduleChange(
          id,
          req.body,
          user
        );

      sendResponseSuccess(
        res,
        200,
        "Cambio de horario actualizado exitosamente",
        updatedChange,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Eliminar un cambio de horario
   */
  deleteScheduleChange = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const user = req.user;
      await this.scheduleChangeService.deleteScheduleChange(id, user);

      sendResponseSuccess(
        res,
        200,
        "Cambio de horario eliminado exitosamente",
        { deleted: true },
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener un cambio de horario por su ID
   */
  getScheduleChangeById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const change = await this.scheduleChangeService.getScheduleChangeById(
        id,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Cambio de horario recuperado exitosamente",
        change,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener cambios de horario según filtros
   */
  getScheduleChanges = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const filters = req.query;
      const user = req.user;

      const { changes, total } =
        await this.scheduleChangeService.getScheduleChanges(filters, user);

      sendResponseSuccess(
        res,
        200,
        "Cambios de horario recuperados exitosamente",
        { changes, total, pagination: { total } },
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verificar cambio de horario para una fecha específica
   */
  checkScheduleChangeForDate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { date, scheduleId, workplaceId, positionId, companyId } =
        req.query;

      if (!date) {
        return sendResponseError(res, 400, "La fecha es requerida");
      }

      const change =
        await this.scheduleChangeService.checkScheduleChangeForDate(
          date as string,
          scheduleId as string | undefined,
          workplaceId as string | undefined,
          positionId as string | undefined,
          companyId as string | undefined
        );

      sendResponseSuccess(
        res,
        200,
        change
          ? "Cambio de horario encontrado"
          : "No hay cambios para esta fecha",
        change,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener horario efectivo para una fecha específica
   */
  getEffectiveScheduleChange = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { date, scheduleId, workplaceId, positionId, companyId } =
        req.query;

      if (!date) {
        return sendResponseError(res, 400, "La fecha es requerida");
      }

      const effectiveChange =
        await this.scheduleChangeService.getEffectiveScheduleChangeForDate(
          date as string,
          scheduleId as string | undefined,
          workplaceId as string | undefined,
          positionId as string | undefined,
          companyId as string | undefined
        );

      sendResponseSuccess(
        res,
        200,
        effectiveChange
          ? "Horario modificado encontrado"
          : "No hay modificaciones para este horario",
        effectiveChange,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Programar cambios masivos de horario
   */
  scheduleBulkChanges = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { startDate, endDate, ...changeData } = req.body;

      if (!startDate || !endDate) {
        return sendResponseError(
          res,
          400,
          "Las fechas de inicio y fin son requeridas"
        );
      }

      const user = req.user;

      const result = await this.scheduleChangeService.scheduleBulkChanges(
        startDate,
        endDate,
        changeData,
        user
      );

      sendResponseSuccess(
        res,
        200,
        `Cambios masivos programados: ${result.created} creados, ${result.skipped} omitidos`,
        result,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener resumen de cambios de horario para un rango de fechas
   */
  getScheduleChangeSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        startDate,
        endDate,
        scheduleId,
        workplaceId,
        positionId,
        companyId,
      } = req.query;

      if (!startDate || !endDate) {
        return sendResponseError(
          res,
          400,
          "Las fechas de inicio y fin son requeridas"
        );
      }

      const user = req.user;

      const filters = {
        scheduleId: scheduleId as string | undefined,
        workplaceId: workplaceId as string | undefined,
        positionId: positionId as string | undefined,
        companyId: companyId as string | undefined,
      };

      const summary = await this.scheduleChangeService.getScheduleChangeSummary(
        startDate as string,
        endDate as string,
        filters,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Resumen de cambios de horario recuperado exitosamente",
        summary,
        true
      );
    } catch (error) {
      next(error);
    }
  };
}
