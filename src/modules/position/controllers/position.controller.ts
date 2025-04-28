import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { PositionService } from "../services/position.service";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";

@injectable()
export class PositionController {
  constructor(
    @inject("PositionService") private readonly positionService: PositionService
  ) {}

  // Obtener todas las posiciones
  getAllPositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { take = 10, cursorId } = req.query;
      const user = req.user;

      console.log(user)

      const positions = await this.positionService.getAllPositions(
        parseInt(take as string, 10),
        user,
        cursorId as string
      );

      sendResponseSuccess(
        res,
        200,
        "Posiciones obtenidas exitosamente.",
        positions,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Obtener todas las posiciones eliminadas
  getAllPositionsDeleted = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { take = 10, cursorId } = req.query;
      const user = req.user;

      const positions = await this.positionService.getAllPositionsDeleted(
        parseInt(take as string, 10),
        user,
        cursorId as string
      );

      sendResponseSuccess(
        res,
        200,
        "Posiciones eliminadas obtenidas exitosamente.",
        positions,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Obtener una posición por ID
  getPositionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const position = await this.positionService.getPositionById(id, user);

      sendResponseSuccess(
        res,
        200,
        "Posición obtenida exitosamente.",
        position,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Crear una nueva posición
  createPosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const user = req.user;

      const newPosition = await this.positionService.createPosition(data, user);

      sendResponseSuccess(
        res,
        201,
        "Posición creada exitosamente.",
        newPosition,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Actualizar una posición
  updatePosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const positionDataUpdated = req.body;
      const user = req.user;

      const updatedPosition = await this.positionService.updatePosition(
        id,
        positionDataUpdated,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Posición actualizada exitosamente.",
        updatedPosition,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Eliminar una posición
  deletePosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const deletedPosition = await this.positionService.deletePosition(
        id,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Posición eliminada exitosamente.",
        deletedPosition,
        true
      );
    } catch (error) {
      next(error);
    }
  };
}
