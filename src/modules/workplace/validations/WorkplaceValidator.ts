import {inject, injectable} from "tsyringe";
import {CompanyService} from "../../companies/services/company.service";
import {AppError} from "../../../middleware/errors/AppError";
import {WorkplaceRepository} from "../repository/workplace.repository";


@injectable()
export class WorkplaceValidator {
    constructor(@inject("CompanyService") private companyService: CompanyService,
                @inject("WorkplaceRepository") private workplaceRepository: WorkplaceRepository) {
    }

}