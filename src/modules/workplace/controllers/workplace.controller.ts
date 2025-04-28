import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { WorkplaceService } from "../services/workplace.service";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";

@injectable()
export class WorkplaceController {
  constructor(
    @inject("WorkplaceService") private workPlaceService: WorkplaceService
  ) {}

  // Obtener todas las áreas de trabajo
  getAllWorkPlaces = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { take = 10, cursorId } = req.query;
      const user = req.user;

      const workPlaces = await this.workPlaceService.getAllWorkPlaces(
        parseInt(take as string, 10),
        user,
        cursorId as string
      );

      sendResponseSuccess(
        res,
        200,
        "áreas obtenidas exitosamente",
        workPlaces,
        true
      );
    } catch (error) {
      next(error);
    }
  }

  // Obtener una área de trabajo por ID
  getWorkPlaceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const workPlace = await this.workPlaceService.getWorkPlaceById(id, user);

     sendResponseSuccess(res, 200, "Área de trabajo obtenida exitosamente", workPlace, true);
    } catch (error) {
      next(error);
    }
  }

  // Crear una nueva área de trabajo
  createWorkPlace = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, status, companyId } = req.body;
      const user = req.user;

      const newWorkPlace = await this.workPlaceService.createWorkPlace(
        { name, status, companyId },
        user
      );

      sendResponseSuccess(res, 201, "Area de trabajo creado exitosamente", newWorkPlace, true)
    } catch (error) {
      next(error);
    }
  }

  // Actualizar una área de trabajo
  updateWorkPlace = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const workPlaceDataUpdated = req.body;
      const user = req.user;

      const updatedWorkPlace = await this.workPlaceService.updateWorkPlace(
        id,
        workPlaceDataUpdated,
        user
      );

      res
        .status(200)
        .json({
          message: "Área de trabajo actualizada exitosamente.",
          workPlace: updatedWorkPlace,
        });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar una área de trabajo
  deleteWorkPlace = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const deletedWorkPlace = await this.workPlaceService.deleteWorkPlace(
        id,
        user
      );

      res
        .status(200)
        .json({
          message: "Área de trabajo eliminada exitosamente.",
          workPlace: deletedWorkPlace,
        });
    } catch (error) {
      next(error);
    }
  }
}
