import { AppError } from "@/middleware/errors/AppError";
import { inject, injectable } from "tsyringe";
import { ScheduleRepository } from "../repository/schedule.repository";
import { WorkplaceRepository } from "@/modules/workplace/repository/workplace.repository";
import { PositionRepository } from "@/modules/position/repository/position.repository";
import { CompanyRepository } from "@/modules/companies/repository/company.repository";
import { PermissionUtils } from "@/utils/helper/permissions.helper";

@injectable()
export class ScheduleValidator {
  constructor(
    @inject("ScheduleRepository")
    private scheduleRepository: ScheduleRepository,
    @inject("WorkplaceRepository")
    private workplaceRepository: WorkplaceRepository,
    @inject("PositionRepository")
    private positionRepository: PositionRepository,
    @inject("CompanyRepository")
    private companyRepository: CompanyRepository,
    @inject("PermissionUtils")
    private permissionUtils: PermissionUtils
  ) {}

  async validateCompanyExists(
    user: { roleId: string; companyId?: string },
    companyId?: string
  ) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    if (isSuperAdmin) {
      return;
    }
    if (!companyId) {
      throw new AppError("El id de la empresa es requerido", 400);
    }
    if (!user.companyId) {
      throw new AppError("No tienes permiso para ver empresas", 403);
    }
    if (user.companyId !== companyId) {
      throw new AppError("No tienes permiso para ver esta empresa", 403);
    }
    if (user.companyId === companyId) {
      const company = await this.companyRepository.findCompanyById(
        companyId,
        user
      );
      if (!company) {
        throw new AppError("La empresa no existe", 404);
      }
    }
  }

  async validateCompanyActive(
    user: { roleId: string; companyId?: string },
    companyId?: string
  ) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    if (isSuperAdmin) {
      return;
    }
    if (!companyId) {
      throw new AppError("El id de la empresa es requerido", 400);
    }
    if (!user.companyId) {
      throw new AppError("No tienes permiso para ver empresas", 403);
    }
    if (user.companyId !== companyId) {
      throw new AppError("No tienes permiso para ver esta empresa", 403);
    }
    if (user.companyId === companyId) {
      const company = await this.companyRepository.findCompanyById(
        companyId,
        user
      );
      if (!company) {
        throw new AppError("La empresa no existe", 404);
      }
    }
  }

  async validateWorkplaceExists(
    user: { roleId: string; companyId?: string },
    workplaceId?: string
  ) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    if (isSuperAdmin) {
      return;
    }
    if (!workplaceId) {
      throw new AppError("El id del área de trabajo es requerido", 400);
    }
    if (!user.companyId) {
      throw new AppError("No tienes permiso para ver áreas de trabajo", 403);
    }

    if (user.companyId !== workplaceId) {
      throw new AppError(
        "No tienes permiso para ver esta área de trabajo",
        403
      );
    }
    if (user.companyId === workplaceId) {
      const workplace = await this.workplaceRepository.findWorkplaceById(
        workplaceId,
        user
      );
      if (!workplace) {
        throw new AppError("El área de trabajo no existe", 404);
      }
    }
  }

  async validateWorkplaceActive(
    user: { roleId: string; companyId?: string },
    workplaceId?: string
  ) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    if (isSuperAdmin) {
      return;
    }
    if (!workplaceId) {
      throw new AppError("El id del área de trabajo es requerido", 400);
    }

    if (!user.companyId) {
      throw new AppError("No tienes permiso para ver áreas de trabajo", 403);
    }

    if (user.companyId !== workplaceId) {
      throw new AppError(
        "No tienes permiso para ver esta área de trabajo",
        403
      );
    }

    if (user.companyId === workplaceId) {
      const workplace = await this.workplaceRepository.findWorkplaceById(
        workplaceId,
        user
      );
      if (!workplace) {
        throw new AppError("El área de trabajo no existe", 404);
      }
    }
  }

  async validatePositionExists(
    user: { roleId: string; companyId?: string },
    positionId?: string
  ) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    if (isSuperAdmin) {
      return;
    }
    if (!positionId) {
      throw new AppError("El id de la posición es requerido", 400);
    }

    if (!user.companyId) {
      throw new AppError("No tienes permiso para ver posiciones", 403);
    }

    if (user.companyId !== positionId) {
      throw new AppError("No tienes permiso para ver esta posición", 403);
    }

    if (user.companyId === positionId) {
      const position = await this.positionRepository.findPositionById(
        positionId,
        user
      );
      if (!position) {
        throw new AppError("La posición no existe", 404);
      }
    }
  }

  async validatePositionActive(
    user: { roleId: string; companyId?: string },
    positionId?: string
  ) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    if (isSuperAdmin) {
      return;
    }
    if (!positionId) {
      throw new AppError("El id de la posición es requerido", 400);
    }

    if (!user.companyId) {
      throw new AppError("No tienes permiso para ver posiciones", 403);
    }

    if (user.companyId !== positionId) {
      throw new AppError("No tienes permiso para ver esta posición", 403);
    }

    if (user.companyId === positionId) {
      const position = await this.positionRepository.findPositionById(
        positionId,
        user
      );
      if (!position) {
        throw new AppError("La posición no existe", 404);
      }
    }
  }

  async validateWorkplaceAndPositionBelongToCompany(
    user: { roleId: string; companyId?: string },
    workplaceId?: string,
    positionId?: string,
    companyId?: string
  ) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    if (isSuperAdmin) {
      return;
    }
    if (!workplaceId) {
      throw new AppError("El id del área de trabajo es requerido", 400);
    }

    if (!positionId) {
      throw new AppError("El id de la posición es requerido", 400);
    }

    if (!user.companyId) {
      throw new AppError("No tienes permiso para ver áreas de trabajo", 403);
    }

    if (!companyId) {
      throw new AppError("El id de la empresa es requerido", 400);
    }

    if (user.companyId !== companyId) {
      throw new AppError("No tienes permiso para ver esta empresa", 403);
    }

    if (user.companyId === companyId) {
      const company = await this.companyRepository.findCompanyById(
        companyId,
        user
      );
      if (!company) {
        throw new AppError("La empresa no existe", 404);
      }
    }
    const workplace = await this.workplaceRepository.findWorkplaceById(
      workplaceId,
      user
    );
    if (workplace?.companyId !== companyId) {
      throw new AppError("El área de trabajo no pertenece a la empresa", 400);
    }

    const position = await this.positionRepository.findPositionById(
      positionId,
      user
    );
    if (position?.companyId !== companyId) {
      throw new AppError("La posición no pertenece a la empresa", 400);
    }
  }

  async validatePositionBelongsToCompany(
    user: { roleId: string; companyId?: string },
    positionId?: string,
    companyId?: string
  ) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    if (isSuperAdmin) {
      return;
    }
    if (!positionId) {
      throw new AppError("El id de la posición es requerido", 400);
    }

    if (!user.companyId) {
      throw new AppError("No tienes permiso para ver posiciones", 403);
    }

    if (!companyId) {
      throw new AppError("El id de la empresa es requerido", 400);
    }

    if (user.companyId !== companyId) {
      throw new AppError("No tienes permiso para ver esta empresa", 403);
    }

    if (user.companyId === companyId) {
      const company = await this.companyRepository.findCompanyById(
        companyId,
        user
      );
      if (!company) {
        throw new AppError("La empresa no existe", 404);
      }
    }
  }

  async validateScheduleExists(
    user: { roleId: string; companyId?: string },
    workplaceId?: string,
    positionId?: string
  ) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    if (isSuperAdmin) {
      return;
    }
    if (!workplaceId) {
      throw new AppError("El id del área de trabajo es requerido", 400);
    }

    if (!positionId) {
      throw new AppError("El id de la posición es requerido", 400);
    }

    if (!user.companyId) {
      throw new AppError("No tienes permiso para ver horarios", 403);
    }
    if (user.companyId !== workplaceId) {
      throw new AppError("No tienes permiso para ver este horario", 403);
    }
    if (user.companyId === workplaceId) {
      const schedule =
        await this.scheduleRepository.findScheduleByWorkplaceAndPosition(
          workplaceId,
          positionId,
          user
        );
      if (!schedule) {
        throw new AppError("El horario no existe", 404);
      }
    }
  }

  async formatHour(time: string): Promise<Date> {
    if (!time || typeof time !== "string") {
      throw new Error(
        "La hora proporcionada es nula o no es una cadena de texto."
      );
    }

    const [hours, minutes, seconds] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      throw new Error("Formato de hora inválido. Use el formato HH:mm:ss");
    }

    const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
    if (isNaN(date.getTime())) {
      throw new Error("Error al crear el objeto Date.");
    }
    return date;
  }
}
