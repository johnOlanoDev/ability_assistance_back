import {
  CreateWorkPlacesDTO,
  UpdateWorkPlacesDTO,
  WorkPlacesResponse,
} from "../types/workplace.types";

export interface IWorkPlaceRepository {
  // Obtener todas las áreas de trabajo (con filtro opcional por companyId)
  getAllWorkPlaces(take: number, cursorId?: string, companyId?: string): Promise<{ workPlaces: WorkPlacesResponse[]; total: number }>;

  // Obtener una área de trabajo por ID
  getWorkPlaceById(id: string, companyId?: string): Promise<WorkPlacesResponse | null>;

  // Crear una nueva área de trabajo
  createWorkPlace(data: CreateWorkPlacesDTO): Promise<WorkPlacesResponse>;

  // Actualizar una área de trabajo
  updateWorkPlace(id: string, data: UpdateWorkPlacesDTO, companyId?: string): Promise<WorkPlacesResponse>;

  // Eliminar (soft delete) una área de trabajo
  softDeleteWorkPlace(id: string, companyId?: string): Promise<WorkPlacesResponse>;

  // Validar si el nombre del área de trabajo ya existe (excluyendo el ID actual)
  findByName(name: string,companyId: string, excludeId?: string) : Promise<WorkPlacesResponse[]>;
}
