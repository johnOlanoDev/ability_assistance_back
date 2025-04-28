
import { DocumentTypeResponse, CreateDocumentType, UpdateDocumentType } from "../types/documentType.types";

export interface DocumentTypeRepository {
  // Obtener todos los tipos de documentos (con filtro opcional por companyId)
  getAllDocumentTypes(take: number, cursorId?: string, companyId?: string): Promise<{ documentTypes: DocumentTypeResponse[]; total: number }>;

  // Obtener un tipo de documento por ID
  getDocumentTypeById(id: string, companyId?: string): Promise<DocumentTypeResponse | null>;

  // Crear un nuevo tipo de documento
  createDocumentType(data: CreateDocumentType): Promise<DocumentTypeResponse>;

  // Actualizar un tipo de documento
  updateDocumentType(id: string, data: UpdateDocumentType, companyId?: string): Promise<DocumentTypeResponse>;

  // Eliminar (soft delete) un tipo de documento
  softDeleteDocumentType(id: string, companyId?: string): Promise<DocumentTypeResponse>;

  // Validar si el nombre del tipo de documento ya existe (excluyendo el ID actual)
  findByName(name: string, excludeId?: string, companyId?: string): Promise<boolean>;
}