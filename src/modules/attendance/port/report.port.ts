export interface IReportAttendanceRepository {
  getAttendanceReports(
    take: number,
    companyId?: string,
    cursorId?: string,
    filters?: any
  ): Promise<{ reports: any[]; total: number }>;

  exportToExcel(companyId?: string, filters?: any): Promise<Buffer>;
}
