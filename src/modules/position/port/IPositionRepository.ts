import {CreatePositionDTO, PositionResponse, UpdatePositionDTO} from "../types/position.types";

export interface IPositionRepository {
   
    // Obtener todas las posiciones (con filtro opcional por companyId)
  getAllPositions(take: number, cursorId?: string, companyId?: string): Promise<{ positions: PositionResponse[]; total: number }>;

  // Obtener una posición por ID
  getPositionById(id: string, companyId?: string): Promise<PositionResponse | null>;

  // Crear una nueva posición
  createPosition(data: CreatePositionDTO): Promise<PositionResponse>;

  // Actualizar una posición
  updatePosition(id: string, data: UpdatePositionDTO, companyId?: string): Promise<PositionResponse>;

  // Eliminar (soft delete) una posición
  softDeletePosition(id: string, companyId?: string): Promise<PositionResponse>;

  // Validar si el nombre de la posición ya existe (excluyendo el ID actual)
  findByName(name: string, excludeId?: string, companyId?: string): Promise<boolean>;
}