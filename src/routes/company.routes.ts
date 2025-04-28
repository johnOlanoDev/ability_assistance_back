import express from "express";
import { validate } from "../middleware/errors/validate";
import { DependencyContainer } from "../core/di/container";
import { CompanyController } from "@/modules/companies/controllers/company.controller";
import {
  createCompanyValidation,
  idParamValidation,
} from "@/modules/companies/validations/company.validations";
import {
  authenticate,
  validateCompanyPermission,
} from "../middleware/auth/authenticate.auth";
import { uploadlogo } from "@/config/multer";

const router = express.Router();
const companyController = DependencyContainer.resolve(CompanyController);
const {
  getAllCompanies,
  getAllCompaniesByDeleted,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getLogoUrl,
} = companyController;

const requirePermission = (permissions: string[]) =>
  validateCompanyPermission(permissions);

router.get(
  "/all",
  authenticate,
  requirePermission(["company:read", "company:self"]),
  getAllCompanies
);
router.get(
  "/deleted",
  authenticate,
  requirePermission(["company:read", "company:self"]),
  getAllCompaniesByDeleted
);
router.get(
  "/id/:id",
  authenticate,
  requirePermission(["company:read", "company:self"]),
  idParamValidation,
  validate,
  getCompanyById
);
router.post(
  "/save",
  authenticate,
  requirePermission(["company:manage"]),
  uploadlogo,
  createCompanyValidation,
  validate,
  createCompany
);
router.put(
  "/update/:id",
  authenticate,
  requirePermission(["company:update", "company:self"]),
  uploadlogo,
  idParamValidation,
  validate,
  updateCompany
);


router.put(
  "/softDelete/:id",
  idParamValidation,
  authenticate,
  requirePermission(["company:delete", "company:self"]),
  uploadlogo,
  idParamValidation,
  deleteCompany
);
router.get(
  "/logo/:id",
  authenticate,
  requirePermission(["company:read", "company:self"]),
  idParamValidation,
  validate,
  getLogoUrl
);

export default router;
