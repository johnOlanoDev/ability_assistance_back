import { inject, injectable } from "tsyringe";
import { Buffer } from "buffer";
import { ReportAttendanceRepository } from "../repository/report.repository";
import { PermissionUtils } from "@/utils/helper/permissions.helper";
import {
  CustomDateRange,
  DateRangeFilter,
  getDateRange,
} from "@/utils/helper/dateRange";
import { AppError } from "@/middleware/errors/AppError";
import { CompanyService } from "@/modules/companies/services/company.service";

export interface IReportAttendanceService {
  getAttendanceReports(
    take: number,
    user: any,
    cursorId?: string,
    filters?: any
  ): Promise<{ reports: any[]; total: number }>;

  exportToExcel(user: any, filters?: any): Promise<Buffer>;
}

@injectable()
export class ReportAttendanceService implements IReportAttendanceService {
  constructor(
    @inject("ReportAttendanceRepository")
    private readonly reportAttendanceRepository: ReportAttendanceRepository,
    @inject("PermissionUtils") private permissionUtils: PermissionUtils,
    @inject("CompanyService") private companyService: CompanyService
  ) {}

  async getAttendanceReports(
    take: number,
    user: any,
    cursorId?: string,
    filters?: any
  ): Promise<{ reports: any[]; total: number }> {
    return await this.reportAttendanceRepository.getAttendanceReports(
      take,
      user,
      cursorId,
      filters
    );
  }

  async exportToExcel(
    user: { roleId: string; companyId?: string },
    filters?: any
  ): Promise<Buffer> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    return await this.reportAttendanceRepository.exportToExcel(
      companyId,
      filters
    );
  }

  async getReportAttendanceByAssistanceType(
    user: { roleId: string; companyId?: string },
    filterRange: DateRangeFilter = "month",
    customRange?: CustomDateRange,
    type?: string
  ) {
    try {
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);

      const companyId = isSuperAdmin ? undefined : user.companyId;

      if (!isSuperAdmin) {
        await this.validateCompanyExists(user, companyId);
      }

      const range = getDateRange(filterRange, customRange);

      if (isSuperAdmin) {
        return this.reportAttendanceRepository.getReportAttendanceByAssistanceType(
          range,
          type
        );
      }

      return this.reportAttendanceRepository.getReportAttendanceByAssistanceType(
        range,
        type,
        companyId,
      );
    } catch (error: any) {
      console.log(error);
      throw new AppError(
        "Error al obtener los reportes de asistencias por su tipos"
      );
    }
  }

  async validateCompanyExists(
    user: { roleId: string; companyId?: string },
    companyId?: string
  ): Promise<void> {
    if (!companyId) throw new AppError("La empresa no existe", 400);
    await this.companyService.getCompanyById(companyId, user);
  }
}
