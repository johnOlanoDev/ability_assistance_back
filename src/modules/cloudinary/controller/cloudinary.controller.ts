import { inject, injectable } from "tsyringe";
import { CloudinaryService } from "../services/cloudinary.service";
import { Request, Response, NextFunction } from 'express';
import { CreateCompanyDTO } from "@/modules/companies/types/company.types";
import { CompanyService } from "@/modules/companies/services/company.service";


@injectable()
export class CloudinaryController {
  constructor(
    @inject("CloudinaryService") private cloudinaryService: CloudinaryService,
    @inject("CompanyService") private companyService: CompanyService
  ) {}

  create = async (req: Request, res: Response, next: NextFunction) => {

    try {

        const companyData: CreateCompanyDTO = req.body;
        const user = req.user;

        if(req.file) {
            const publicId = await this.cloudinaryService.uploadBuffer(
                req.file.buffer,
                "company-logo"
            )
            companyData.logo = publicId;
        }

        const company = await this.companyService.createCompany(companyData, user);

        return res.status(201).json(company);

    } catch (error) {
      next(error);
    }

  }



}

