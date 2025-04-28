import { inject, injectable } from "tsyringe";
import { CompanyService } from "../services/company.service";
import { NextFunction, Request, Response } from "express";
import { AppError } from "@/middleware/errors/AppError";
import { sendResponseSuccess } from "@/utils/helper/sendResponse.helper";
import { CloudinaryService } from "@/modules/cloudinary/services/cloudinary.service";
@injectable()
export class CompanyController {
  constructor(
    @inject("CompanyService") private companyService: CompanyService,
    @inject("CloudinaryService") private cloudinaryService: CloudinaryService
  ) {}

  // Obtener todas las empresas
  getAllCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { take = 10, cursorId } = req.query;
      const user = req.user;
      const cursor = cursorId as string;

      if (!user) {
        console.log("Usuario no autenticado.");
        throw new AppError("Usuario no autenticado.", 401);
      }
      const company = await this.companyService.getAllCompanies(
        parseInt(take as string, 10),
        user,
        cursor
      );
      sendResponseSuccess(
        res,
        200,
        "Empresas obtenidas exitosamente",
        company,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Obtener empresas eliminadas
  getAllCompaniesByDeleted = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;

      if (!user) {
        console.log("Usuario no autenticado.");
        throw new AppError("Usuario no autenticado.", 401);
      }
      const companies = await this.companyService.getAllCompaniesByDeleted(
        user
      );
      sendResponseSuccess(
        res,
        200,
        "Empresas eliminadas obtenidas exitosamente",
        companies,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Obtener una empresa por ID
  getCompanyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const company = await this.companyService.getCompanyById(id, user);

      sendResponseSuccess(
        res,
        200,
        "Empresa obtenida correctamente",
        company,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Crear una nueva empresa
  createCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const user = req.user;

      if (req.file) {
        const publicId = await this.cloudinaryService.uploadBuffer(
          req.file.buffer,
          "company-logo"
        );
        data.logo = publicId;
      }

      const newCompany = await this.companyService.createCompany(data, user);

      sendResponseSuccess(
        res,
        201,
        "Empresa creada exitosamente",
        newCompany,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Actualizar una empresa
  updateCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyDataUpdated = req.body;
      const user = req.user;

      if (req.file) {
        const existingCompany = await this.companyService.getCompanyById(
          id,
          user
        );

        if (existingCompany.logo) {
          await this.cloudinaryService.deleteFile(existingCompany.logo);
        }

        const publicId = await this.cloudinaryService.uploadBuffer(
          req.file.buffer,
          "company-logo"
        );
        companyDataUpdated.logo = publicId;
      }

      const updatedCompany = await this.companyService.updateCompany(
        id,
        companyDataUpdated,
        user
      );

      sendResponseSuccess(
        res,
        200,
        "Empresa actualizada exitosamente",
        updatedCompany,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  // Eliminar una empresa
  deleteCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const companyToDelete = await this.companyService.getCompanyById(
        id,
        user
      );

      const deletedCompany = await this.companyService.deleteCompany(id, user);

      if (companyToDelete.logo) {
        await this.cloudinaryService.deleteFile(companyToDelete.logo);
      }

      sendResponseSuccess(
        res,
        200,
        "Empresa eliminada exitosamente",
        deletedCompany,
        true
      );
    } catch (error) {
      next(error);
    }
  };

  getLogoUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const company = await this.companyService.getCompanyById(id, user);

      if (!company || !company.logo) {
        throw new AppError("No se encontró la empresa o no tiene logo", 404);
      }

      const logoUrl = this.cloudinaryService.getImageUrl(company.logo);

      sendResponseSuccess(
        res,
        200,
        "Logo obtenido correctamente",
        logoUrl,
        true
      );
    } catch (error) {
      next(error);
    }
  };
}
