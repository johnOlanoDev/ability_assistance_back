import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { inject, injectable } from "tsyringe";
import { Buffer } from "buffer";
import { ReportAttendanceResponse } from "../types/attendance.types";
import { IReportAttendanceRepository } from "../port/report.port";


const safeToISOString = (value: any): string | null => {
  if (!value) return null; // ✅ Si el valor es null, devolver null en lugar de la fecha actual
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const dateObj = new Date(value);
    if (!isNaN(dateObj.getTime())) return dateObj.toISOString();
  }
  return null; // ✅ Devolver null en vez de la fecha actual si no es una fecha válida
};

const transformAttendanceResponse = (data: any): ReportAttendanceResponse => {
  return {
    ...data,
    date: safeToISOString(data.date),
    checkIn: safeToISOString(data.checkIn),
    checkOut: safeToISOString(data.checkOut), // ✅ Si es null en la BD, se mantiene null
  };
};

@injectable()
export class ReportAttendanceRepository implements IReportAttendanceRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async getAttendanceReports(
    take: number,
    companyId?: string,
    cursorId?: string,
    filters?: any
  ): Promise<{ reports: any[]; total: number }> {
    const where: any = {
      companyId: companyId || undefined,
      status: true,
      deletedAt: null,
    };

    // Aplicar filtros adicionales si existen
    if (filters) {
      if (filters.startDate && filters.endDate) {
        where.date = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        };
      }

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.scheduleId) {
        where.scheduleId = filters.scheduleId;
      }
    }

    // Configuración de paginación con cursor
    let cursor = undefined;
    if (cursorId) {
      cursor = {
        id: cursorId,
      };
    }

    // Obtener el conteo total
    const total = await this.prisma.reportAttendance.count({
      where: {
        status: true,
        deletedAt: null,
        date: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        },
      },
    });
    // Obtener los reportes
    const reports = await this.prisma.reportAttendance.findMany({
      where: {
        companyId, // Aquí debe estar el valor correcto de companyId
        status: true,
        deletedAt: null,
        date: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        },
      },
      take,
      cursor,
      skip: cursor ? 1 : 0,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        company: true,
        schedule: true,
        typePermission: true,
      },
    });

    return {
      reports,
      total,
    };
  }

  async getAllUsersWithAttendance(
    companyId?: string,
    filters?: any
  ): Promise<any[]> {
    const where: any = {
      companyId: companyId,
      deletedAt: null,
      status: true,
    };
  
    if (filters) {
      if (filters.startDate && filters.endDate) {
        where.date = {
          gte: new Date(new Date(filters.startDate).setHours(0, 0, 0, 0)), // Inicio del día
          lte: new Date(new Date(filters.endDate).setHours(23, 59, 59, 999)), // Fin del día
        };
      }
    }
  
    const results = await this.prisma.reportAttendance.findMany({
      where,
      include: {
        user: true,
        company: true,
        schedule: true,
        typePermission: true,
      },
    });
  
    return results.map(transformAttendanceResponse);
  }

  async exportToExcel(companyId?: string, filters?: any): Promise<Buffer> {
    // Obtener todos los reportes de asistencia para la compañía
    const allReports = await this.getAllUsersWithAttendance(companyId);
  
    // Filtrar los reportes según los filtros proporcionados
    const filteredReports = allReports.filter((report) => {
      // Verificar si report.date existe
      const reportDate = report.date ? new Date(report.date) : null;
  
      // Filtrar por rango de fechas
      if (filters.startDate && filters.endDate && reportDate) {
        const startDate = new Date(new Date(filters.startDate).setHours(0, 0, 0, 0));
        const endDate = new Date(new Date(filters.endDate).setHours(23, 59, 59, 999));
  
        if (!(reportDate >= startDate && reportDate <= endDate)) {
          return false;
        }
      }
  
      // Verificar si report.user existe
      if (!report.user) {
        return false;
      }
  
      return true;
    });
  
    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte de Asistencia");
  
    // Definir encabezados del reporte
    worksheet.columns = [
      { header: "Fecha", key: "date", width: 15 },
      { header: "Empleado", key: "employee", width: 30 },
      { header: "Documento", key: "document", width: 15 },
      { header: "Horario", key: "schedule", width: 20 },
      { header: "Entrada", key: "checkIn", width: 12 },
      { header: "Salida", key: "checkOut", width: 12 },
      { header: "Horas Trabajadas", key: "hoursWorked", width: 18 },
      { header: "Horas Extra", key: "overtimeHours", width: 15 },
      { header: "Tipo de Asistencia", key: "typeAssistance", width: 20 },
      { header: "Ubicación", key: "location", width: 30 },
      { header: "Notas", key: "notes", width: 25 },
    ];
  
    // Estilo para la cabecera
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" },
    };
    worksheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };
  
    // Agregar datos al reporte
    filteredReports.forEach((report) => {
      const reportDate = report.date ? new Date(report.date) : null;
      const formattedDate = reportDate
        ? format(reportDate, "dd/MM/yyyy")
        : "N/A";
  
      const employeeName = report.user
        ? `${report.user.name || ""} ${report.user.lastName || ""}`
        : "Sin empleado";
  
      worksheet.addRow({
        date: formattedDate,
        employee: employeeName,
        document: report.user?.numberDocument || "N/A",
        schedule: report.schedule?.name || "N/A",
        checkIn: report.checkIn
          ? format(new Date(report.checkIn), "HH:mm:ss")
          : "N/A",
        checkOut: report.checkOut
          ? format(new Date(report.checkOut), "HH:mm:ss")
          : "N/A",
        hoursWorked: report.hoursWorked || "0",
        overtimeHours: report.overtimeHours || "0",
        typeAssistance: report.typeAssistanceId || "N/A",
        location: report.locationAddress || "N/A",
        notes: report.notes || "",
      });
    });
  
    // Generar el buffer del Excel
    const buffer = (await workbook.xlsx.writeBuffer()) as Buffer;
    return buffer;
  }
}
