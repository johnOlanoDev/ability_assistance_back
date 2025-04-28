import { UpdateReportAttendance } from "../types/attendance.types";
import { CreateReportAttendance } from "../types/attendance.types";
import { ReportAttendanceResponse } from "../types/attendance.types";


export interface IAttendancePort {
  createReportAttendance(data: CreateReportAttendance): Promise<ReportAttendanceResponse>;
  updateReportAttendance(id: string, data: UpdateReportAttendance,companyId?:string): Promise<ReportAttendanceResponse>;
  bulkUpdateReportAttendance(updates: { id: string; typeAssistanceId: string }[]): Promise<void>;
  deleteReportAttendance(id: string,companyId?:string): Promise<void>;
  getReportUserByDate(date: Date,companyId?:string): Promise<ReportAttendanceResponse[]>;
  getReportAttendanceByUserId(userId: string,companyId?:string): Promise<ReportAttendanceResponse[]>;
}
    