import { inject, injectable } from "tsyringe";
import { DashboardRepository } from "../repository/dashboard.repository";
import { PermissionUtils } from "@/utils/helper/permissions.helper";
import { AppError } from "@/middleware/errors/AppError";
import {
  CustomDateRange,
  DateRangeFilter,
  getDateRange,
} from "@/utils/helper/dateRange";

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

  async getAttendanceMetricsByDepartment(
    user: { userId: string; roleId: string; companyId?: string },
    workplaceName?: string,
    positionName?: string
  ) {
    try {
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
      const isAdmin = await this.permissionUtils.isAdmin(user.roleId);
      const isUser = !isSuperAdmin && !isAdmin;

      if (!isSuperAdmin && !user.companyId) {
        throw new AppError(
          "Se requiere una compañía para usuarios que no son superadmin",
          400
        );
      }

      const companyId = isSuperAdmin ? undefined : user.companyId;
      const userId = isUser ? user.userId : undefined;

      if (isSuperAdmin) {
        return this.dashboardRepository.getAttendanceMetricsByDepartment(
          workplaceName,
          positionName
        );
      } else if (isAdmin) {
        return this.dashboardRepository.getAttendanceMetricsByDepartment(
          workplaceName,
          positionName,
          companyId
        );
      }

      return this.dashboardRepository.getAttendanceMetricsByDepartment(
        workplaceName,
        positionName,
        companyId,
        userId
      );
    } catch (error: any) {
      throw new AppError(
        "Error al obtener el gráfico de asistencias por departamento",
        500,
        error
      );
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
    limit: number = 20,
    user: {
      userId: string;
      roleId: string;
      companyId?: string;
    }
  ) {
    try {
      await this.validateCompany(user);
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
      const isAdmin = await this.permissionUtils.isAdmin(user.roleId);
      const isUser = !isSuperAdmin && !isAdmin;

      if (isSuperAdmin) {
        return this.dashboardRepository.getRecentAttendanceRecords();
      } else if (isAdmin) {
        return this.dashboardRepository.getRecentAttendanceRecords(
          limit,
          user?.companyId
        );
      } else {
        return this.dashboardRepository.getRecentAttendanceRecords(
          limit,
          user?.companyId,
          user.userId
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
        this.dashboardRepository.countTotalRecordsBetween(
          dateCondition,
          companyId
        ),
        this.dashboardRepository.countPresencesBetween(
          dateCondition,
          companyId
        ),
        this.dashboardRepository.countLatesBetween(dateCondition, companyId),
        this.dashboardRepository.countAbsencesBetween(dateCondition, companyId),
      ]);

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

  async getMonthlyAttendanceRate(user: { roleId: string; companyId?: string }) {
    try {
      await this.validateCompany(user);
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      return this.dashboardRepository.getMonthlyAttendanceRate(
        isSuperAdmin ? undefined : user.companyId
      );
    } catch (error) {
      throw new AppError("Error al obtener tasa de asistencia", 500);
    }
  }

  async getMonthlyLateRate(user: { roleId: string; companyId?: string }) {
    try {
      await this.validateCompany(user);
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      return this.dashboardRepository.getMonthlyLateRate(
        isSuperAdmin ? undefined : user.companyId
      );
    } catch (error) {
      throw new AppError("Error al obtener tasa de tardanzas", 500);
    }
  }

  async getMonthlyAbsenceRate(user: { roleId: string; companyId?: string }) {
    try {
      await this.validateCompany(user);
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      return this.dashboardRepository.getMonthlyAbsenceRate(
        isSuperAdmin ? undefined : user.companyId
      );
    } catch (error) {
      throw new AppError("Error al obtener tasa de ausencias", 500);
    }
  }

  async getMonthlyWorkedHours(user: { roleId: string; companyId?: string }) {
    try {
      await this.validateCompany(user);
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      return this.dashboardRepository.getMonthlyWorkedHours(
        isSuperAdmin ? undefined : user.companyId
      );
    } catch (error) {
      throw new AppError("Error al obtener horas trabajadas", 500);
    }
  }

  async getLateAttendancesThisMonth(
    user: {
      userId: string;
      roleId: string;
      companyId?: string;
    },
    filterRange: DateRangeFilter = "month",
    customRange?: CustomDateRange
  ) {
    try {
      await this.validateCompany(user);
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
      const isAdmin = await this.permissionUtils.isAdmin(user.roleId);
      const isUser = !isSuperAdmin && !isAdmin;

      const range = getDateRange(filterRange, customRange);

      if (isUser) {
        return this.dashboardRepository.getLateAttendancesThisMonth(
          range,
          user.companyId,
          user.userId
        );
      } else if (isAdmin) {
        return this.dashboardRepository.getLateAttendancesThisMonth(
          range,
          user.companyId
        );
      }

      return this.dashboardRepository.getLateAttendancesThisMonth(range);
    } catch (error) {
      throw new AppError("Error al obtener asistencias tardías", 500);
    }
  }

  async getPermissionsAttendancesThisMonth(
    user: {
      roleId: string;
      companyId?: string;
    },
    filterRange: DateRangeFilter = "month",
    customRange?: CustomDateRange
  ) {
    try {
      await this.validateCompany(user);
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      const range = getDateRange(filterRange, customRange);

      return this.dashboardRepository.getPermissionsAttendancesThisMonth(
        range,
        isSuperAdmin ? undefined : user.companyId
      );
    } catch (error) {
      throw new AppError("Error al obtener asistencias tardías", 500);
    }
  }
}
