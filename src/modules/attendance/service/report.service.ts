import { inject, injectable } from "tsyringe";
import { Buffer } from "buffer";
import { ReportAttendanceRepository } from "../repository/report.repository";
import { PermissionUtils } from "@/utils/helper/permissions.helper";

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



    return await this.reportAttendanceRepository.exportToExcel(companyId, filters);
  }
}
