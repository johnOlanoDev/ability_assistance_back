// src/modules/scheduleException/infrastructure/http/scheduleExceptionController.ts

import { NextFunction, Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";
import {
  CreateScheduleExceptionDTO,
  ScheduleExceptionFilters,
  UpdateScheduleExceptionDTO,
} from "../types/scheduleException.types";
import { ScheduleExceptionService } from "../services/scheduleException.service";

@injectable()
export class ScheduleExceptionController {
  constructor(
    @inject("ScheduleExceptionService")
    private scheduleExceptionService: ScheduleExceptionService
  ) {}

  findUsersByTarget = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const users = await this.scheduleExceptionService.findUsersByTarget(
        id,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Usuarios afectados obtenidos correctamente",
        users,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Crea una nueva excepción de horario
   */
  createScheduleException = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const exceptionData: CreateScheduleExceptionDTO = req.body;
      const user = req.user;

      const newException =
        await this.scheduleExceptionService.createScheduleException(
          exceptionData,
          user
        );

      sendResponseSuccess(
        res,
        201,
        "Permiso de horario creado correctamente",
        newException,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualiza una excepción de horario existente
   */
  updateScheduleException = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const exceptionData: Partial<UpdateScheduleExceptionDTO> = req.body;

      // Combinar ID de la ruta con los datos del cuerpo
      const updateData: UpdateScheduleExceptionDTO = {
        ...exceptionData,
        id,
      };

      const updatedException =
        await this.scheduleExceptionService.updateScheduleException(updateData);

      sendResponseSuccess(
        res,
        200,
        "Excepción de horario actualizada correctamente",
        updatedException,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Elimina una excepción de horario
   */
  deleteScheduleException = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      await this.scheduleExceptionService.deleteScheduleException(id);

      sendResponseSuccess(
        res,
        200,
        "Excepción de horario eliminada correctamente",
        null,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene una excepción de horario por su ID
   */
  getScheduleExceptionById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const exception =
        await this.scheduleExceptionService.findScheduleExceptionById(id);

      sendResponseSuccess(
        res,
        200,
        "Excepción de horario obtenida correctamente",
        exception,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene excepciones de horario según filtros y paginación
   */
  getScheduleExceptions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Extraer filtros de la consulta
      const {
        userId,
        workplaceId,
        positionId,
        companyId,
        scheduleId,
        startDateFrom,
        startDateTo,
        endDateFrom,
        endDateTo,
        page = 1,
        limit = 10,
      } = req.query;

      // Preparar filtros
      const filters: ScheduleExceptionFilters = {};

      if (userId) filters.userId = userId as string;
      if (workplaceId) filters.workplaceId = workplaceId as string;
      if (positionId) filters.positionId = positionId as string;
      if (companyId) filters.companyId = companyId as string;
      if (scheduleId) filters.scheduleId = scheduleId as string;

      // Convertir fechas
      if (startDateFrom)
        filters.startDateFrom = new Date(startDateFrom as string);
      if (startDateTo) filters.startDateTo = new Date(startDateTo as string);
      if (endDateFrom) filters.endDateFrom = new Date(endDateFrom as string);
      if (endDateTo) filters.endDateTo = new Date(endDateTo as string);

      // Convertir página y límite a números
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      const data = await this.scheduleExceptionService.findScheduleExceptions(
        filters,
        pageNumber,
        limitNumber
      );

      sendResponseSuccess(
        res,
        200,
        "Excepciones de horario obtenidas correctamente",
        data,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verifica si hay excepciones para una fecha específica
   */
  getScheduleExceptionByDate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { date, userId, scheduleId, workplaceId, positionId, companyId } =
        req.query;

      if (!date) {
        return sendResponseSuccess(
          res,
          400,
          "La fecha es requerida",
          null,
          false
        );
      }

      const exception =
        await this.scheduleExceptionService.findScheduleExceptionByDate(
          date as string,
          userId as string | undefined,
          scheduleId as string | undefined,
          workplaceId as string | undefined,
          positionId as string | undefined,
          companyId as string | undefined
        );

      sendResponseSuccess(
        res,
        200,
        exception
          ? "Excepción de horario encontrada"
          : "No hay excepciones para la fecha indicada",
        exception,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verifica si hay excepciones solapadas
   */
  checkOverlappingExceptions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        exceptionType,
        entityId,
        startDate,
        endDate,
        excludeExceptionId,
      } = req.body;

      if (!exceptionType || !entityId || !startDate || !endDate) {
        return sendResponseSuccess(
          res,
          400,
          "Se requieren tipo de excepción, ID de entidad, fecha de inicio y fecha de fin",
          null,
          false
        );
      }

      const overlappingExceptions =
        await this.scheduleExceptionService.checkOverlappingExceptions(
          exceptionType,
          entityId,
          new Date(startDate),
          new Date(endDate),
          excludeExceptionId
        );

      sendResponseSuccess(
        res,
        200,
        overlappingExceptions.length > 0
          ? "Se encontraron excepciones solapadas"
          : "No hay excepciones solapadas",
        {
          hasOverlaps: overlappingExceptions.length > 0,
          exceptions: overlappingExceptions,
        },
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Nuevo método para crear un feriado
  createHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date, description, isDayOff, companyId, checkIn, checkOut } =
        req.body;

      const user = req.user;

      const holiday =
        await this.scheduleExceptionService.createHolidayException(
          user,
          new Date(date),
          description,
          isDayOff,
          companyId,
          checkIn,
          checkOut
        );

      sendResponseSuccess(
        res,
        201,
        "Feriado creado correctamente",
        holiday,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Verificar si una fecha es un feriado
  checkIsHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date } = req.query;
      const user = req.user;

      const isHoliday = await this.scheduleExceptionService.isHoliday(
        new Date(date as string),
        user.companyId
      );

      sendResponseSuccess(
        res,
        200,
        isHoliday ? "La fecha es un feriado" : "La fecha no es un feriado",
        { isHoliday },
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Obtener feriados en un rango de fechas
  getHolidays = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;
      const user = req.user;

      const holidays = await this.scheduleExceptionService.getHolidays(
        new Date(startDate as string),
        new Date(endDate as string),
        user.companyId
      );

      sendResponseSuccess(
        res,
        200,
        "Feriados obtenidos correctamente",
        holidays,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Importar múltiples feriados
  importHolidays = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const holidays = req.body.holidays;
      const user = req.user;

      await this.scheduleExceptionService.importHolidays(
        user,
        holidays.map((h: any) => ({
          date: new Date(h.date),
          description: h.description,
          isDayOff: h.isDayOff,
        }))
      );

      sendResponseSuccess(
        res,
        200,
        "Feriados importados correctamente",
        {},
        true
      );
    } catch (error) {
      next(error);
    }
  };
}
