import express from "express";
import { DependencyContainer } from "@/core/di/container";
import {
  authenticate,
  validateCompanyPermission,
} from "@/middleware/auth/authenticate.auth";
import { validate } from "@/middleware/errors/validate";
import { DocumentTypeController } from "@/modules/documentType/controller/documentType.controller";
import {
  createDocumentValidation,
  idParamValidation,
  paginationValidation,
} from "@/modules/documentType/validations/documentType.validations";

const router = express.Router();
const documentController = DependencyContainer.resolve(DocumentTypeController);
const {
  createDocumentType,
  deleteDocumentType,
  getAllDocumentTypes,
  getAllDocumentsDeleted,
  getDocumentTypeById,
  updateDocumentType,
} = documentController;

const requiredPermissions = (permissions: string[]) =>
  validateCompanyPermission(permissions);

router.get(
  "/all",
  authenticate,
  requiredPermissions(["document:read"]),
  paginationValidation,
  validate,
  getAllDocumentTypes
);

router.get(
  "/deleted",
  authenticate,
  requiredPermissions(["document:read"]),
  paginationValidation,
  validate,
  getAllDocumentsDeleted
);

router.get(
  "/id/:id",
  authenticate,
  requiredPermissions(["document:read"]),
  idParamValidation,
  validate,
  getDocumentTypeById
);
router.post(
  "/save",
  authenticate,
  requiredPermissions(["document:manage"]),
  createDocumentValidation,
  validate,
  createDocumentType
);
router.put(
  "/update/:id",
  authenticate,
  requiredPermissions(["document:update"]),
  idParamValidation,
  createDocumentValidation,
  validate,
  updateDocumentType
);
router.delete(
  "/delete/:id",
  authenticate,
  requiredPermissions(["document:delete"]),
  idParamValidation,
  validate,
  deleteDocumentType
);

export default router;
