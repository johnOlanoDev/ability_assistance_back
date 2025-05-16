import { inject, injectable } from "tsyringe";
import { AppError } from "../../../middleware/errors/AppError";
import { PositionRepository } from "../repository/position.repository";
import {
  CreatePositionDTO,
  PositionResponse,
  UpdatePositionDTO,
} from "../types/position.types";
import { CompanyService } from "@/modules/companies/services/company.service";
import { WorkplaceRepository } from "@/modules/workplace/repository/workplace.repository";
import { PermissionUtils } from "@/utils/helper/permissions.helper";

@injectable()
export class PositionService {
  constructor(
    @inject("PositionRepository")
    private positionRepository: PositionRepository,
    @inject("WorkplaceRepository")
    private workplaceRepository: WorkplaceRepository,
    @inject("CompanyService") private companyService: CompanyService,
    @inject("PermissionUtils") private permissionUtils: PermissionUtils
  ) {}

  // Obtener todas las posiciones
  async getAllPositions(
    take: number,
    user: { userId?: string; roleId: string; companyId?: string },
    cursorId?: string
  ): Promise<{ positions: PositionResponse[]; total: number }> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    const isAdmin = await this.permissionUtils.isAdmin(user.roleId);

    const isRegularUser = !isSuperAdmin && !isAdmin;

    try {
      if (isSuperAdmin) {
        return await this.positionRepository.getAllPositions(take, cursorId);
      } else if (isAdmin && user.companyId) {
        return await this.positionRepository.getAllPositions(
          take,
          cursorId,
          user.companyId
        );
      } else if (isRegularUser) {
        const userData = await this.positionRepository.getPositionByUser(
          user.userId
        );

        if (!userData?.positionId) {
          return { positions: [], total: 0 };
        }

        const userPosition = await this.positionRepository.getPositionById(
          userData.positionId,
          user.companyId
        );

        return {
          positions: userPosition ? [userPosition] : [],
          total: userPosition ? 1 : 0,
        };
      } else {
        throw new AppError(
          "No tienes permisos para acceder a esta información"
        );
      }
    } catch (error: any) {
      throw new AppError(
        error.message || "Error al obtener las áreas de trabajo",
        error.statusCode || 500,
        error
      );
    }
  }

  async getAllPositionsDeleted(
    take: number,
    user: { roleId: string; companyId?: string },
    cursorId?: string
  ): Promise<{ positions: PositionResponse[]; total: number }> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    return this.positionRepository.getAllPositionsDeleted(
      take,
      cursorId,
      companyId
    );
  }

  // Obtener una posición por ID
  async getPositionById(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<PositionResponse | null> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    const position = await this.positionRepository.getPositionById(
      id,
      companyId
    );
    if (!position) throw new AppError("El cargo no existe", 404);

    return position;
  }

  async getPositionsByWorkplace(
    workplaceId: string,
    user: { userId: string; roleId: string; companyId?: string }
  ) {
    try {
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      if (isSuperAdmin) {
        return this.positionRepository.getPositionsByWorkplace(workplaceId);
      } else if (user.companyId) {
        return this.positionRepository.getPositionsByWorkplace(
          workplaceId,
          user.companyId
        );
      } else {
        throw new AppError("No tienes permisos para realizar esta acción", 403);
      }
    } catch (error: any) {
      throw new AppError(error.message);
    }
  }

  // Crear una nueva posición
  async createPosition(
    positionData: CreatePositionDTO,
    user: { roleId: string; companyId?: string }
  ): Promise<PositionResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    let companyId;

    const trimmedName = positionData.name.trim();

    if (isSuperAdmin) {
      if (!positionData.companyId) {
        throw new AppError("Debe proporcionar el ID de la empresa", 400);
      }
      companyId = positionData.companyId;
    } else {
      if (!user.companyId) {
        throw new AppError("No tienes una empresa asignada", 401);
      }
      companyId = user.companyId;
    }

    const workplace = await this.workplaceRepository.getWorkPlaceById(
      positionData.workplaceId
    );
    if (!workplace || workplace.companyId !== companyId) {
      throw new AppError(
        "El área de trabajo seleccionada no pertenece a la empresa",
        400
      );
    }

    await this.validatePositionExistingInCompany(trimmedName, companyId);

    await this.validateCompanyExists(user, companyId);

    await this.validateWorkplaceExists(user, positionData.workplaceId);

    return this.positionRepository.createPosition({
      ...positionData,
      name: trimmedName,
      companyId,
    });
  }

  // Actualizar una posición
  async updatePosition(
    id: string,
    positionDataUpdated: UpdatePositionDTO,
    _user: { roleId: string; companyId?: string }
  ): Promise<PositionResponse> {
    const existingPosition = await this.positionRepository.getPositionById(id);

    if (!existingPosition) throw new AppError("El cargo no existe", 404);

    if (!positionDataUpdated.workplaceId)
      throw new AppError("Debe proporcionar el ID del área de trabajo", 400);

    const existingWorkplace = await this.workplaceRepository.getWorkPlaceById(
      positionDataUpdated.workplaceId
    );

    if (!existingWorkplace) {
      throw new AppError("El área de trabajo seleccionada no existe", 400);
    }

    if (existingWorkplace.companyId !== existingPosition.companyId) {
      throw new AppError(
        "El área de trabajo seleccionada no pertenece a la misma empresa del cargo",
        400
      );
    }

    if (
      positionDataUpdated.companyId &&
      positionDataUpdated.companyId !== existingPosition.companyId
    ) {
      throw new AppError("No puedes cambiar la empresa a un cargo", 400);
    }

    if (positionDataUpdated.name) {
      const trimmedName = positionDataUpdated.name?.trim();
      if (trimmedName !== existingPosition.name) {
        const duplicatePosition =
          await this.positionRepository.findByNamePosition(
            trimmedName,
            existingPosition.companyId,
            id
          );
        if (duplicatePosition.length > 0) {
          throw new AppError(
            "El nombre del cargo ya está en uso en esta empresa",
            400
          );
        }
      }

      positionDataUpdated.name = trimmedName;
    }
    const targetPositionId = existingPosition.companyId;

    return this.positionRepository.updatePosition(
      id,
      positionDataUpdated,
      targetPositionId
    );
  }

  // Eliminar una posición
  async deletePosition(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<PositionResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    const existingRole = isSuperAdmin
      ? await this.positionRepository.getPositionById(id)
      : await this.positionRepository.getPositionById(id, user.companyId);

    if (!existingRole) throw new AppError("El rol no existe", 404);

    if (!isSuperAdmin && existingRole.companyId !== user.companyId) {
      throw new AppError("No tienes permiso para eliminar este cargo", 403);
    }

    return this.positionRepository.softDeletePosition(
      id,
      existingRole.companyId ?? undefined
    );
  }

  async validatePositionExistingInCompany(
    name: string,
    companyId?: string,
    id?: string
  ): Promise<boolean> {
    const existingPosition = await this.positionRepository.findByName(
      name,
      companyId,
      id
    );

    if (existingPosition) {
      throw new AppError(
        "El nombre del cargo ya está en uso en esta empresa",
        400
      );
    }

    return false;
  }
  // Validar la existencia de la empresa
  async validateCompanyExists(
    user: { roleId: string; companyId?: string },
    companyId?: string
  ): Promise<void> {
    if (!companyId) throw new AppError("La empresa no existe", 400);
    await this.companyService.getCompanyById(companyId, user);
  }

  async validateWorkplaceExists(
    user: { roleId: string; companyId?: string },
    workplaceId: string
  ): Promise<void> {
    const workplace = await this.workplaceRepository.getWorkPlaceById(
      workplaceId,
      user.companyId ?? undefined
    );
    if (!workplace) throw new AppError("El área de trabajo no existe", 400);
  }
}
