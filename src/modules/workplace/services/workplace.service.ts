import { inject, injectable } from "tsyringe";
import { WorkplaceRepository } from "../repository/workplace.repository";
import {
  CreateWorkPlacesDTO,
  UpdateWorkPlacesDTO,
  WorkPlacesResponse,
} from "../types/workplace.types";
import { AppError } from "@/middleware/errors/AppError";
import { PermissionUtils } from "@/utils/helper/permissions.helper";

@injectable()
export class WorkplaceService {
  constructor(
    @inject("WorkplaceRepository")
    private workPlaceRepository: WorkplaceRepository,
    @inject("PermissionUtils") private permissionUtils: PermissionUtils
  ) {}

  // Obtener todas las áreas de trabajo con caché
  async getAllWorkPlaces(
    take: number,
    user: { userId: string; roleId: string; companyId?: string },
    cursorId?: string
  ): Promise<{ workPlaces: WorkPlacesResponse[]; total: number }> {
    // 1. Determinar el rol del usuario
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const isAdmin = await this.permissionUtils.isAdmin(user.roleId);
    const isRegularUser = !isSuperAdmin && !isAdmin;

    try {
      // 2. Según el rol, determinar cómo filtrar
      if (isSuperAdmin) {
        // Superadmin: ve todas las áreas
        return await this.workPlaceRepository.getAllWorkPlaces(take, cursorId);
      } else if (isAdmin && user.companyId) {
        // Admin: ve todas las áreas de su compañía
        return await this.workPlaceRepository.getAllWorkPlaces(
          take,
          cursorId,
          user.companyId
        );
      } else if (isRegularUser) {
        // Usuario regular: solo ve su área

        // Primero obtenemos el área del usuario
        const userData = await this.workPlaceRepository.getWorkplaceByUser(
          user.userId
        );

        if (!userData?.workplaceId) {
          return { workPlaces: [], total: 0 }; // Usuario no tiene área asignada
        }

        // Obtenemos solo el área específica del usuario
        const userWorkplace = await this.workPlaceRepository.getWorkPlaceById(
          userData.workplaceId,
          user.companyId
        );

        return {
          workPlaces: userWorkplace ? [userWorkplace] : [],
          total: userWorkplace ? 1 : 0,
        };
      } else {
        throw new AppError("No tienes permisos para realizar esta acción", 403);
      }
    } catch (error: any) {
      throw new AppError(
        error.message || "Error al obtener las áreas de trabajo",
        error.statusCode || 500,
        error
      );
    }
  }

  // Obtener un área de trabajo por ID con caché
  async getWorkPlaceById(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<WorkPlacesResponse | null> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    const workPlace = await this.workPlaceRepository.getWorkPlaceById(
      id,
      companyId
    );
    if (!workPlace) throw new AppError("El área de trabajo no existe", 404);

    return workPlace;
  }

  // Crear una nueva área de trabajo (invalidate)
  async createWorkPlace(
    workPlaceData: CreateWorkPlacesDTO,
    user: { roleId: string; companyId?: string }
  ): Promise<WorkPlacesResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    let companyId: string;

    if (isSuperAdmin) {
      if (!workPlaceData.companyId) {
        throw new AppError("Debe proporcionar el ID de la empresa", 400);
      }
      companyId = workPlaceData.companyId;
    } else {
      if (!user.companyId) {
        throw new AppError("No tienes una empresa asignada", 401);
      }
      companyId = user.companyId;
    }

    await this.validateNameWorkplace(workPlaceData.name, companyId);

    await this.permissionUtils.validateCompanyExists(companyId);

    const newWorkPlace = await this.workPlaceRepository.createWorkPlace({
      ...workPlaceData,
      companyId,
    });

    return newWorkPlace;
  }

  // Actualizar un área de trabajo (invalidate)
  async updateWorkPlace(
    id: string,
    workPlaceDataUpdated: UpdateWorkPlacesDTO,
    _user: { roleId: string; companyId?: string }
  ): Promise<WorkPlacesResponse> {
    const existingWorkplace = await this.workPlaceRepository.getWorkPlaceById(
      id
    );
    if (!existingWorkplace) {
      throw new AppError("El área de trabajo no existe", 404);
    }

    if (
      workPlaceDataUpdated.companyId &&
      workPlaceDataUpdated.companyId !== existingWorkplace.companyId
    ) {
      throw new AppError(
        "No puedes cambiar la empresa de un área de trabajo existente",
        400
      );
    }

    if (workPlaceDataUpdated.name) {
      if (workPlaceDataUpdated.name !== existingWorkplace.name) {
        const duplicateWorkplace = await this.workPlaceRepository.findByName(
          workPlaceDataUpdated.name,
          existingWorkplace.companyId,
          existingWorkplace.id
        );
        if (duplicateWorkplace.length > 0) {
          throw new AppError(
            "El área de trabajo con el mismo nombre en la misma empresa ya existe",
            400
          );
        }
      }
    }

    const targetCompanyId = existingWorkplace.companyId;

    const updatedWorkplace = await this.workPlaceRepository.updateWorkPlace(
      id,
      workPlaceDataUpdated,
      targetCompanyId
    );

    return updatedWorkplace;
  }

  // Eliminar un área de trabajo (invalidate)
  async deleteWorkPlace(
    id: string,
    user: { roleId: string; companyId?: string }
  ): Promise<WorkPlacesResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    const existingWorkplace = isSuperAdmin
      ? await this.workPlaceRepository.getWorkPlaceById(id)
      : await this.workPlaceRepository.getWorkPlaceById(id, user.companyId);

    if (!existingWorkplace) {
      throw new AppError("El área de trabajo no existe", 404);
    }

    if (!isSuperAdmin && existingWorkplace.companyId !== user.companyId) {
      throw new AppError(
        "No puedes eliminar un área de trabajo que no es de tu empresa",
        403
      );
    }

    const deletedWorkplace = await this.workPlaceRepository.softDeleteWorkPlace(
      id,
      existingWorkplace.companyId
    );

    return deletedWorkplace;
  }

  async validateWorkplaceExistingInCompany(
    name: string,
    companyId: string,
    id?: string
  ): Promise<void> {
    const existingWorkplace = await this.workPlaceRepository.findByName(
      name,
      companyId,
      id
    );
    if (existingWorkplace.length > 0)
      throw new AppError(`El área '${name}' ya existe en la empresa`, 400);
  }

  async validateNameWorkplace(name: string, companyId: string) {
    const existingName =
      await this.workPlaceRepository.validateWorkplaceExistingInCompany(
        name,
        companyId
      );
    if (existingName) {
      throw new AppError(
        "Ya existe un área de trabajo con este nombre en esta empresa",
        400
      );
    }
  }
}
