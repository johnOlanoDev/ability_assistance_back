// src/modules/scheduleException/infrastructure/scheduleExceptionController.ts

import { NextFunction, Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { ScheduleExceptionService } from "../services/scheduleException.service";

@injectable()
export class ScheduleExceptionController {
  constructor(
    @inject("ScheduleExceptionService")
    private scheduleExceptionService: ScheduleExceptionService
  ) {}

  /**
   * Crear una nueva excepción de horario
   */
  createScheduleException = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const exceptionData = req.body;
      const user = req.user; // Asumiendo que tienes middleware de autenticación

      const newException =
        await this.scheduleExceptionService.createScheduleException(
          exceptionData,
          user
        );

       res.status(201).json({
        message: "Excepción de horario creada correctamente",
        data: { exception: newException },
        success: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualizar una excepción de horario
   */
  updateScheduleException = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const exceptionData = req.body;
      const user = req.user;

      const updatedException =
        await this.scheduleExceptionService.updateScheduleException(
          id,
          exceptionData,
          user
        );

       res.status(200).json({
        message: "Excepción de horario actualizada correctamente",
        data: { exception: updatedException },
        success: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Eliminar una excepción de horario
   */
  deleteScheduleException = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const user = req.user;

      await this.scheduleExceptionService.deleteScheduleException(id, user);

       res.status(200).json({
        message: "Excepción de horario eliminada correctamente",
        success: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener una excepción de horario por ID
   */
  getScheduleExceptionById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const exception =
        await this.scheduleExceptionService.getScheduleExceptionById(id, user);

       res.status(200).json({
        message: "Excepción de horario obtenida correctamente",
        data: { exception },
        success: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Listar excepciones de horario con filtros
   */
  getScheduleExceptions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const filters = req.query;
      const user = req.user;

      const { exceptions, total } =
        await this.scheduleExceptionService.getScheduleExceptions(
          filters as any,
          user
        );

       res.status(200).json({
        message: "Excepciones de horario obtenidas correctamente",
        data: { exceptions, total },
        success: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Configurar feriados nacionales para un año
   */
  configureNationalHolidays = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { year, companyId } = req.body;
      const user = req.user;
  
      if (!year) {
         res.status(400).json({
          message: "Se requiere el año y el ID de la empresa",
          success: false,
        });
      }
  
      // Validar que el año sea un número válido
      const yearNumber = parseInt(year);
      if (isNaN(yearNumber) || yearNumber < 2020 || yearNumber > 2050) {
         res.status(400).json({
          message: "El año debe ser un número válido entre 2020 y 2050",
          success: false,
        });
      }
  
      const result = await this.scheduleExceptionService.configureNationalHolidays(
        yearNumber,
        user,
        companyId,
      );
  
       res.status(200).json({
        message: `Feriados nacionales configurados para el año ${year}`,
        data: { 
          created: result.created,
          skipped: result.skipped,
          total: result.created + result.skipped
        },
        success: true,
      });
    } catch (error) {
      next(error);
    }
  };

  
}
