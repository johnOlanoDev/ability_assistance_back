import {
  AsistentType,
  PermissionType,
} from "@/modules/attendance/types/attendance.types";
import { inject, injectable } from "tsyringe";
import { PRISMA_TOKEN, PrismaType } from "@/prisma";
import { formatDecimalHours } from "@/utils/helper/formatDecimalHours";

@injectable()
export class DashboardRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaType) {}

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

  async getAttendanceMetricsByDepartment(
    workplaceName?: string,
    positionName?: string,
    companyId?: string,
    userId?: string
  ) {
    const result: any = [];

    if (!workplaceName) return [];

    const workplace = await this.prisma.workplace.findFirst({
      where: {
        name: workplaceName,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        positions: {
          where: {
            status: true,
            ...(positionName ? { name: positionName } : {}),
          },
          include: {
            users: {
              ...(userId ? { where: { id: userId } } : {}),
            },
          },
        },
      },
    });

    if (!workplace || workplace.positions.length === 0) return [];

    // Si NO se especifica un cargo, devolver métricas consolidadas de toda el área
    if (!positionName) {
      // Obtener todos los usuarios del área (todos los cargos)
      const allUserIds = workplace.positions.flatMap((pos) =>
        pos.users.map((u) => u.id)
      );

      if (allUserIds.length === 0) {
        return [
          {
            name: `Área: ${workplace.name}`,
            workplaceName: workplace.name,
            count: 0,
            onTime: 0,
            late: 0,
            absent: 0,
            withPermission: 0,
            totalEmployees: 0,
            attendanceData: [
              { type: "A tiempo", percentage: 0, count: 0 },
              { type: "Tardanzas", percentage: 0, count: 0 },
              { type: "Ausentes", percentage: 0, count: 0 },
              { type: "Permiso", percentage: 0, count: 0 },
            ],
          },
        ];
      }

      const consolidatedStats = await this.calculateAttendanceStats(
        allUserIds,
        companyId
      );

      return [
        {
          name: `Área: ${workplace.name}`,
          workplaceName: workplace.name,
          count: allUserIds.length,
          isConsolidated: true, // Flag para identificar que es consolidado
          positions: workplace.positions.map((pos) => ({
            name: pos.name,
            userCount: pos.users.length,
          })),
          ...consolidatedStats,
        },
      ];
    }

    // Si SÍ se especifica un cargo, devolver métricas específicas del cargo
    for (const position of workplace.positions) {
      const userIds = position.users.map((u) => u.id);

      if (userIds.length === 0) continue;

      const stats = await this.calculateAttendanceStats(userIds, companyId);

      result.push({
        name: position.name,
        workplaceName: workplace.name,
        count: userIds.length,
        isConsolidated: false,
        ...stats,
      });
    }

    return result;
  }

  private async calculateAttendanceStats(
    userIds: string[],
    companyId?: string
  ) {
    const [onTime, late, absent, withPermission] = await Promise.all([
      this.prisma.reportAttendance.count({
        where: {
          typeAssistanceId: AsistentType.PRESENT,
          userId: { in: userIds },
          ...(companyId !== undefined ? { companyId } : {}),
        },
      }),
      this.prisma.reportAttendance.count({
        where: {
          typeAssistanceId: AsistentType.LATE,
          userId: { in: userIds },
          ...(companyId !== undefined ? { companyId } : {}),
        },
      }),
      this.prisma.reportAttendance.count({
        where: {
          typeAssistanceId: AsistentType.ABSENT,
          userId: { in: userIds },
          ...(companyId !== undefined ? { companyId } : {}),
        },
      }),
      this.prisma.reportAttendance.count({
        where: {
          typePermissionId: { not: null },
          userId: { in: userIds },
          ...(companyId !== undefined ? { companyId } : {}),
        },
      }),
    ]);

    const total = onTime + late + absent + withPermission;
    const calcPercentage = (count: number) => Math.round((count / total) * 100);

    return {
      onTime,
      late,
      absent,
      withPermission,
      totalEmployees: userIds.length,
      attendanceData: [
        { type: "A tiempo", percentage: calcPercentage(onTime), count: onTime },
        { type: "Tardanzas", percentage: calcPercentage(late), count: late },
        { type: "Ausentes", percentage: calcPercentage(absent), count: absent },
        {
          type: "Permiso",
          percentage: calcPercentage(withPermission),
          count: withPermission,
        },
      ],
    };
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

  async getRecentAttendanceRecords(
    limit: number = 10,
    companyId?: string,
    userId?: string
  ) {
    return this.prisma.reportAttendance.findMany({
      orderBy: {
        checkIn: "desc",
      },
      where: {
        companyId: companyId || undefined,
        userId: userId,
      },
      take: limit,
      include: {
        user: true,
        schedule: {
          include: {
            scheduleChanges: true,
            scheduleRanges: true,
            scheduleExceptions: true,
          },
        },
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

  async getMonthlyAttendanceRate(companyId?: string) {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );

    const startOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const filterCompany = companyId ? { companyId } : {};

    const [presentCurrent, totalCurrent] = await Promise.all([
      this.prisma.reportAttendance.count({
        where: {
          typeAssistanceId: AsistentType.PRESENT,
          date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
          ...filterCompany,
        },
      }),
      this.prisma.reportAttendance.count({
        where: {
          date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
          ...filterCompany,
        },
      }),
    ]);

    const [presentPrevious, totalPrevious] = await Promise.all([
      this.prisma.reportAttendance.count({
        where: {
          typeAssistanceId: AsistentType.PRESENT,
          date: { gte: startOfPreviousMonth, lte: endOfPreviousMonth },
          ...filterCompany,
        },
      }),
      this.prisma.reportAttendance.count({
        where: {
          date: { gte: startOfPreviousMonth, lte: endOfPreviousMonth },
          ...filterCompany,
        },
      }),
    ]);

    const currentRate =
      totalCurrent > 0 ? (presentCurrent / totalCurrent) * 100 : 0;
    const previousRate =
      totalPrevious > 0 ? (presentPrevious / totalPrevious) * 100 : 0;
    const difference = currentRate - previousRate;

    return {
      currentRate: Number(currentRate.toFixed(2)), // 85.00
      difference: Number(difference.toFixed(2)), // +2.5
    };
  }

  async getMonthlyLateRate(companyId?: string) {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );

    const startOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const filterCompany = companyId ? { companyId } : {};

    const [lateCurrent, totalCurrent] = await Promise.all([
      this.prisma.reportAttendance.count({
        where: {
          typeAssistanceId: AsistentType.LATE,
          date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
          ...filterCompany,
        },
      }),
      this.prisma.reportAttendance.count({
        where: {
          date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
          ...filterCompany,
        },
      }),
    ]);

    const [latePrevious, totalPrevious] = await Promise.all([
      this.prisma.reportAttendance.count({
        where: {
          typeAssistanceId: AsistentType.LATE,
          date: { gte: startOfPreviousMonth, lte: endOfPreviousMonth },
          ...filterCompany,
        },
      }),
      this.prisma.reportAttendance.count({
        where: {
          date: { gte: startOfPreviousMonth, lte: endOfPreviousMonth },
          ...filterCompany,
        },
      }),
    ]);

    const currentRate =
      totalCurrent > 0 ? (lateCurrent / totalCurrent) * 100 : 0;
    const previousRate =
      totalPrevious > 0 ? (latePrevious / totalPrevious) * 100 : 0;
    const difference = currentRate - previousRate;

    return {
      currentRate: Number(currentRate.toFixed(2)), // ej. 12.3
      difference: Number(difference.toFixed(2)), // ej. -1.8
    };
  }

  async getMonthlyAbsenceRate(companyId?: string) {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );

    const startOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const filterCompany = companyId ? { companyId } : {};

    const absenceTypes = [AsistentType.ABSENT];

    const [absenceCurrent, totalCurrent] = await Promise.all([
      this.prisma.reportAttendance.count({
        where: {
          typeAssistanceId: { in: absenceTypes },
          date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
          ...filterCompany,
        },
      }),
      this.prisma.reportAttendance.count({
        where: {
          date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
          ...filterCompany,
        },
      }),
    ]);

    const [absencePrevious, totalPrevious] = await Promise.all([
      this.prisma.reportAttendance.count({
        where: {
          typeAssistanceId: { in: absenceTypes },
          date: { gte: startOfPreviousMonth, lte: endOfPreviousMonth },
          ...filterCompany,
        },
      }),
      this.prisma.reportAttendance.count({
        where: {
          date: { gte: startOfPreviousMonth, lte: endOfPreviousMonth },
          ...filterCompany,
        },
      }),
    ]);

    const currentRate =
      totalCurrent > 0 ? (absenceCurrent / totalCurrent) * 100 : 0;
    const previousRate =
      totalPrevious > 0 ? (absencePrevious / totalPrevious) * 100 : 0;
    const difference = currentRate - previousRate;

    return {
      currentRate: Number(currentRate.toFixed(2)),
      difference: Number(difference.toFixed(2)),
    };
  }

  async getMonthlyWorkedHours(companyId?: string) {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );

    const startOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const filterCompany = companyId ? { companyId } : {};

    const [currentTotal, previousTotal] = await Promise.all([
      this.prisma.reportAttendance.aggregate({
        _sum: {
          hoursWorked: true,
        },
        where: {
          date: {
            gte: startOfCurrentMonth,
            lte: endOfCurrentMonth,
          },
          ...filterCompany,
        },
      }),
      this.prisma.reportAttendance.aggregate({
        _sum: {
          hoursWorked: true,
        },
        where: {
          date: {
            gte: startOfPreviousMonth,
            lte: endOfPreviousMonth,
          },
          ...filterCompany,
        },
      }),
    ]);

    const currentHours = currentTotal._sum.hoursWorked?.toNumber() ?? 0;
    const previousHours = previousTotal._sum.hoursWorked?.toNumber() ?? 0;
    const difference = currentHours - previousHours;

    return {
      currentHours: formatDecimalHours(currentHours),
      difference: formatDecimalHours(difference),
    };
  }

  async getLateAttendancesThisMonth(
    dateRange: { start?: Date; end?: Date },
    companyId?: string,
    userId?: string
  ) {
    const filter: any = {
      typeAssistanceId: AsistentType.LATE,
      ...(dateRange.start &&
        dateRange.end && {
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        }),
      ...(companyId ? { companyId } : {}),
      userId: userId,
    };

    const attendances = await this.prisma.reportAttendance.findMany({
      where: filter,
      include: {
        user: {
          include: {
            workplace: true,
            position: true,
            role: true,
            documentType: true,
          },
        },
        company: true,
        schedule: {
          include: {
            scheduleRanges: true,
          },
        },
      },
    });

    return attendances;
  }

  async getPermissionsAttendancesThisMonth(
    dateRange: { start?: Date; end?: Date },
    companyId?: string
  ) {
    const filter: any = {
      OR: [
        { typeAssistanceId: PermissionType.PERMISSION_HOURS },
        { typeAssistanceId: PermissionType.MEDICAL_LEAVE },
        { typeAssistanceId: PermissionType.JUSTIFIED_ABSENCE },
      ],
      ...(dateRange.start &&
        dateRange.end && {
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        }),
      ...(companyId ? { companyId } : {}),
    };

    const attendances = await this.prisma.reportAttendance.findMany({
      where: filter,
      include: {
        user: {
          include: {
            workplace: true,
            position: true,
            documentType: true,
            role: true,
          },
        },
        schedule: {
          include: {
            scheduleRanges: true,
          },
        },
        company: true,
      },
      orderBy: {
        checkIn: "asc",
      },
    });

    return attendances;
  }
}
