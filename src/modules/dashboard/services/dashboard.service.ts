import { inject, injectable } from "tsyringe";
import { DashboardRepository } from "../repository/dashboard.repository";
import { PermissionUtils } from "@/utils/helper/permissions.helper";
import { AppError } from "@/middleware/errors/AppError";
import { DateRangeFilter, getDateRange } from "@/utils/helper/dateRange";

@injectable()
export class DashboardService {
  constructor(
    @inject(DashboardRepository)
    private dashboardRepository: DashboardRepository,
    @inject(PermissionUtils) private permissionUtils: PermissionUtils
  ) {}

  private async validateCompany(user: { roleId: string; companyId?: string }) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

    if (!isSuperAdmin && !user.companyId) {
      throw new AppError("La compañía es requerida para este usuario", 400);
    }
  }

  async countPresentToday(user: { roleId: string; companyId?: string }) {
    try {
      await this.validateCompany(user);
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      if (isSuperAdmin) {
        return this.dashboardRepository.countPresentToday();
      } else {
        return this.dashboardRepository.countPresentToday(user.companyId);
      }
    } catch (error) {
      throw new AppError("Error al obtener el conteo de asistencias", 500);
    }
  }

  async countAbsencesToday(user: { roleId: string; companyId?: string }) {
    try {
      await this.validateCompany(user);
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      if (isSuperAdmin) {
        return this.dashboardRepository.countAbsencesToday();
      } else {
        return this.dashboardRepository.countAbsencesToday(user.companyId);
      }
    } catch (error) {
      throw new AppError("Error al obtener el conteo de ausencias", 500);
    }
  }

  async countLateArrivalsToday(user: { roleId: string; companyId?: string }) {
    try {
      await this.validateCompany(user);
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      if (isSuperAdmin) {
        return this.dashboardRepository.countLateArrivalsToday();
      } else {
        return this.dashboardRepository.countLateArrivalsToday(user.companyId);
      }
    } catch (error) {
      throw new AppError("Error al obtener el conteo de retrasos", 500);
    }
  }

  async countApprovedLeavesToday(user: { roleId: string; companyId?: string }) {
    try {
      await this.validateCompany(user);
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      if (isSuperAdmin) {
        return this.dashboardRepository.countApprovedLeavesToday();
      } else {
        return this.dashboardRepository.countApprovedLeavesToday(
          user.companyId
        );
      }
    } catch (error) {
      throw new AppError(
        "Error al obtener el conteo de permisos aprobados",
        500
      );
    }
  }

  async getAttendanceTrend(user: { roleId: string; companyId?: string }) {
    try {
      await this.validateCompany(user);
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      if (isSuperAdmin) {
        return this.dashboardRepository.getAttendanceTrend();
      } else {
        return this.dashboardRepository.getAttendanceTrend(user.companyId);
      }
    } catch (error) {
      throw new AppError("Error al obtener la tendencia de asistencias", 500);
    }
  }

  async getRecentAttendanceRecords(
    limit: number = 10,
    user: {
      roleId: string;
      companyId?: string;
    }
  ) {
    try {
      await this.validateCompany(user);
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      if (isSuperAdmin) {
        return this.dashboardRepository.getRecentAttendanceRecords();
      } else {
        return this.dashboardRepository.getRecentAttendanceRecords(
          limit,
          user?.companyId
        );
      }
    } catch (error) {
      throw new AppError(
        "Error al obtener los registros recientes de asistencias",
        500
      );
    }
  }

  async countDashboardMetrics(
    filter: DateRangeFilter,
    user: { roleId: string; companyId?: string }
  ) {
    try {
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
      const { start, end } = getDateRange(filter);
      const companyId = isSuperAdmin ? undefined : user.companyId;
  
      // Construir las condiciones de fecha solo si start y end están definidos
      const dateCondition = start && end ? { gte: start, lte: end } : undefined;
  
      const [total, presences, lates, absences] = await Promise.all([
        this.dashboardRepository.countTotalRecordsBetween(dateCondition, companyId),
        this.dashboardRepository.countPresencesBetween(dateCondition, companyId),
        this.dashboardRepository.countLatesBetween(dateCondition, companyId),
        this.dashboardRepository.countAbsencesBetween(dateCondition, companyId),
      ]);
  
      console.log(dateCondition)

      return {
        totalRecords: total,
        present: presences,
        late: lates,
        absent: absences,
      };
    } catch (error) {
      throw new AppError("Error al obtener las métricas del dashboard", 500);
    }
  }
}
