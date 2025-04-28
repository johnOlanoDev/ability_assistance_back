import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { DocumentTypeService } from "../services/documentType.service";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";

@injectable()
export class DocumentTypeController {
  constructor(
    @inject("DocumentTypeService")
    private documentTypeService: DocumentTypeService
  ) {}

  // Obtener todos los tipos de documentos
  getAllDocumentTypes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { take = 10, cursorId } = req.query;
      const cursor = cursorId as string;
      const user = req.user;

      const documentTypes = await this.documentTypeService.getAllDocumentTypes(
        parseInt(take as string, 10),
        user,
        cursor
      );

      sendResponseSuccess(
        res,
        200,
        "Tipos de documentos obtenidos exitosamente",
        documentTypes,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Obtener todos los tipos de documentos eliminados
  getAllDocumentsDeleted = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { take = 10, cursorId } = req.query;
      const cursor = cursorId as string;
      const user = req.user;

      const documentTypes =
        await this.documentTypeService.getAllDocumentsDeleted(
          parseInt(take as string, 10),
          user,
          cursor
        );

      sendResponseSuccess(
        res,
        200,
        "Tipos de documentos eliminados obtenidos exitosamente",
        documentTypes,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Obtener un tipo de documento por ID
  getDocumentTypeById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const documentType = await this.documentTypeService.getDocumentTypeById(
        id,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Tipo de documento obtenido correctamente",
        documentType,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Crear un nuevo tipo de documento
  createDocumentType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const document = req.body;
      const user = req.user;

      const newDocumentType = await this.documentTypeService.createDocumentType(
        document,
        user
      );

      sendResponseSuccess(
        res,
        201,
        "Tipo de documento creado exitosamente",
        newDocumentType,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Actualizar un tipo de documento
  updateDocumentType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const documentTypeDataUpdated = req.body;
      const user = req.user;

      const updatedDocumentType =
        await this.documentTypeService.updateDocumentType(
          id,
          documentTypeDataUpdated,
          user
        );

      sendResponseSuccess(
        res,
        200,
        "Tipo de documento actualizado exitosamente",
        updatedDocumentType,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Eliminar un tipo de documento
  deleteDocumentType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const deletedDocumentType =
        await this.documentTypeService.deleteDocumentType(id, user);

      sendResponseSuccess(
        res,
        200,
        "Tipo de documento eliminado exitosamente",
        deletedDocumentType,
        true
      );
    } catch (error) {
      next(error);
    }
  };
}
