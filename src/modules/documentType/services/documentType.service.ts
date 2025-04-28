import { inject, injectable } from "tsyringe";
import { DocumentTypeRepository } from "../repository/documentType.repository";
import {
  CreateDocumentType,
  DocumentTypeResponse,
  UpdateDocumentType,
} from "../types/documentType.types";
import { AppError } from "@/middleware/errors/AppError";
import { PermissionUtils } from "@/utils/helper/permissions.helper";

@injectable()
export class DocumentTypeService {
  constructor(
    @inject("DocumentTypeRepository")
    private documentTypeRepository: DocumentTypeRepository,
    @inject("PermissionUtils") private permissionUtils: PermissionUtils
  ) {}

  async getAllDocumentTypes(
    take: number,
    user: { roleId: string; companyId?: string },
    cursorId?: string
  ): Promise<{ documents: DocumentTypeResponse[]; total: number }> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    return this.documentTypeRepository.getAllDocumentTypes(
      take,
      cursorId,
      companyId
    );
  }

  async getAllDocumentsDeleted(
    take: number,
    user: { roleId: string; companyId?: string },
    cursorId?: string
  ): Promise<{ documents: DocumentTypeResponse[]; total: number }> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    return this.documentTypeRepository.getAllDocumentsDeleted(
      take,
      cursorId,
      companyId
    );
  }

  async getDocumentTypeById(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<DocumentTypeResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    const documentType = await this.documentTypeRepository.getDocumentTypeById(
      id,
      companyId
    );
    if (!documentType)
      throw new AppError("El tipo de documento no existe", 404);

    return documentType;
  }

  async createDocumentType(
    documentTypeData: CreateDocumentType,
    user: { roleId: string; companyId?: string }
  ): Promise<DocumentTypeResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    let companyId: string;

    const trimmedName = documentTypeData.name.trim();

    if (isSuperAdmin) {
      if (!documentTypeData.companyId) {
        throw new AppError("Debes seleccionar una empresa", 400);
      }
      companyId = documentTypeData.companyId;
    } else {
      if (!user.companyId) {
        throw new AppError("No tienes permisos para realizar esta acción", 403);
      }
      companyId = user.companyId;
    }

    if (trimmedName.length > 30) {
      throw new AppError("El nombre no puede exceder 30 caracteres", 400);
    }

    await this.validateDocumentTypeExistingInCompany(trimmedName, companyId);

    await this.permissionUtils.validateCompanyExists(user, companyId);

    return this.documentTypeRepository.createDocumentType({
      ...documentTypeData,
      name: trimmedName,
      companyId,
    });
  }

  async updateDocumentType(
    id: string,
    documentTypeDataUpdated: UpdateDocumentType,
    user: { roleId: string; companyId?: string }
  ): Promise<DocumentTypeResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    
    const existingDocumentType =
      await this.documentTypeRepository.getDocumentTypeById(id);
    
      if (!existingDocumentType) {
        throw new AppError("El tipo de documento no existe", 404);
      }
      
      if (!isSuperAdmin && user.companyId !== existingDocumentType.companyId) {
        throw new AppError(
          "No tienes permiso para actualizar este tipo de documento",
          403
        );
      }
      

    if (
      documentTypeDataUpdated.companyId &&
      documentTypeDataUpdated.companyId !== existingDocumentType.companyId
    ) {
      throw new AppError(
        "No puedes cambiar la empresa del tipo de documento",
        400
      );
    }

    if (documentTypeDataUpdated.name) {
      const trimmedName = documentTypeDataUpdated.name.trim();
      if (trimmedName !== existingDocumentType.name) {
        const duplicateDocumentType =
          await this.documentTypeRepository.getDocumentTypeByName(
            trimmedName,
            existingDocumentType.companyId
          );
          if (duplicateDocumentType && duplicateDocumentType.id !== id) {
            throw new AppError(
              `El tipo de documento "${trimmedName}" ya existe en esta empresa`,
              400
            );
          }
          
        documentTypeDataUpdated.name = trimmedName;
      }
    }

    return this.documentTypeRepository.updateDocumentType(
      id,
      documentTypeDataUpdated,
      existingDocumentType.companyId
    );
  }

  async deleteDocumentType(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<DocumentTypeResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    const existingDocumentType = isSuperAdmin
      ? await this.documentTypeRepository.getDocumentTypeById(id)
      : await this.documentTypeRepository.getDocumentTypeById(
          id,
          user.companyId
        );

    if (!existingDocumentType)
      throw new AppError("El tipo de documento no existe", 404);

    if (!isSuperAdmin && existingDocumentType.companyId !== user.companyId) {
      throw new AppError(
        "No tienes permiso para eliminar este tipo de documento",
        403
      );
    }

    return this.documentTypeRepository.softDeleteDocumentType(
      id,
      existingDocumentType.companyId
    );
  }

  async validateDocumentTypeExistingInCompany(
    name: string,
    companyId: string,
    id?: string
  ): Promise<void> {
    const existingDocumentType = await this.documentTypeRepository.findByName(
      name,
      id,
      companyId
    );
    if (existingDocumentType) {
      throw new AppError(
        `El tipo de documento "${name}" ya existe en esta empresa`,
        400
      );
    }
  }
}
