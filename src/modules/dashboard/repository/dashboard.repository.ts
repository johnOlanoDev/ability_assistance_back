import { AsistentType } from "@/modules/attendance/types/attendance.types";
import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";

@injectable()
export class DashboardRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  // Helper para obtener la fecha de hoy sin la parte horaria
  private getToday(): Date {
    return new Date(new Date().setHours(0, 0, 0, 0));
  }

  async countPresentToday(companyId?: string) {
    const today = this.getToday();
    return this.prisma.reportAttendance.count({
      where: {
        date: today,
        typeAssistanceId: AsistentType.PRESENT,
        companyId: companyId || undefined,
      },
    });
  }

  async countAbsencesToday(companyId?: string) {
    const today = this.getToday();
    return this.prisma.reportAttendance.count({
      where: {
        date: today,
        typeAssistanceId: AsistentType.ABSENT,
        companyId: companyId || undefined,
      },
    });
  }

  async countLateArrivalsToday(companyId?: string) {
    const today = this.getToday();
    return this.prisma.reportAttendance.count({
      where: {
        date: today,
        typeAssistanceId: AsistentType.LATE,
        companyId: companyId || undefined,
      },
    });
  }

  async countApprovedLeavesToday(companyId?: string) {
    const today = this.getToday();
    return this.prisma.reportAttendance.count({
      where: {
        date: today,
        // Se asume que los permisos aprobados tienen un valor en typePermissionId
        typePermissionId: { not: null },
        companyId: companyId || undefined,
      },
    });
  }

  async getAttendanceTrend(companyId?: string) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Ejemplo: agrupar por fecha. Para agrupar mensualmente, se recomienda usar una consulta cruda o procesar el resultado.
    return this.prisma.reportAttendance.groupBy({
      by: ["date"],
      where: {
        date: {
          gte: oneYearAgo,
        },
        companyId: companyId || undefined,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        date: "asc",
      },
    });
  }

  async getRecentAttendanceRecords(limit: number = 10, companyId?: string) {
    return this.prisma.reportAttendance.findMany({
      orderBy: {
        checkIn: "desc",
      },
      where: {
        companyId: companyId || undefined,
      },
      take: limit,
      include: {
        user: true,
        schedule: true,
        company: true,
        typePermission: true,
      },
    });
  }

  async countTotalRecordsBetween(
    dateCondition?: { gte: Date; lte: Date },
    companyId?: string
  ) {
    return this.prisma.reportAttendance.count({
      where: {
        ...(dateCondition && { date: dateCondition }),
        companyId: companyId || undefined,
      },
    });
  }

  async countPresencesBetween(
    dateCondition?: { gte: Date; lte: Date },
    companyId?: string
  ) {
    return this.prisma.reportAttendance.count({
      where: {
        ...(dateCondition && { date: dateCondition }),
        typeAssistanceId: AsistentType.PRESENT,
        companyId: companyId || undefined,
      },
    });
  }

  async countAbsencesBetween(
    dateCondition?: { gte: Date; lte: Date },
    companyId?: string
  ) {
    return this.prisma.reportAttendance.count({
      where: {
        ...(dateCondition && { date: dateCondition }),
        typeAssistanceId: AsistentType.ABSENT,
        companyId: companyId || undefined,
      },
    });
  }

  async countLatesBetween(
    dateCondition?: { gte: Date; lte: Date },
    companyId?: string
  ) {
    return this.prisma.reportAttendance.count({
      where: {
        ...(dateCondition && { date: dateCondition }),
        typeAssistanceId: "LATE",
        ...(companyId && { companyId }),
      },
    });
  }
}
