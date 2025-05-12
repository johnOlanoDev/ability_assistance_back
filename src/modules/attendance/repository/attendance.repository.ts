import { inject, injectable } from "tsyringe";
import { IAttendancePort } from "../port/attendance.port";
import { PRISMA_TOKEN, PrismaType } from "@/prisma";
import { Prisma } from "@prisma/client";
import {
  AsistentType,
  AttendanceHistory,
  CreateReportAttendance,
  ReportAttendanceResponse,
  UpdateReportAttendance,
} from "../types/attendance.types";
import dayjs from "dayjs";

const extractTime = (timestamp: string | Date | null): string => {
  if (!timestamp) return ""; // Si el valor es nulo, retornar una cadena vacía
  try {
    const date =
      typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    if (isNaN(date.getTime())) return ""; // Validar que sea una fecha válida
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`; // Formato HH:mm:ss
  } catch (error) {
    console.error("Error al extraer la hora:", error);
    return ""; // Retornar una cadena vacía en caso de error
  }
};

const toISOString = (input: Date | string | number[] | null): string => {
  try {
    let date: Date;

    if (!input) {
      throw new Error("Fecha inválida: el valor es nulo o indefinido");
    }

    // Si es una cadena, intentar convertirla a Date
    if (typeof input === "string") {
      date = new Date(input);
    }
    // Si es un array, construir la fecha manualmente
    else if (Array.isArray(input)) {
      const [year, month, day, hours = 0, minutes = 0, seconds = 0] = input;
      date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    }
    // Si es un objeto Date, usarlo directamente
    else if (input instanceof Date) {
      date = input;
    } else {
      throw new Error("Tipo de entrada no soportado");
    }

    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) {
      throw new Error("Fecha inválida: no se pudo parsear");
    }

    // Convertir a ISO-8601 en UTC
    return date.toISOString();
  } catch (error) {
    console.error("Error al convertir a ISO-8601:", error);
    return ""; // Retornar una cadena vacía en caso de error
  }
};

const transformAttendanceData = (data: any) => {
  const {
    id,
    createdAt,
    updatedAt,
    deletedAt,
    userId,
    companyId,
    scheduleId,
    user,
    schedule,
    company,
    locationLatitude,
    locationLongitude,
    locationAddress,
    hoursWorked,
    overtimeHours,
    notes,
    typePermission,
    ...rest
  } = data;

  return {
    ...rest,
    checkIn: toISOString(data.checkIn),
    checkOut: toISOString(data.checkOut),
  };
};

const transformAttendanceResponse = (data: any): ReportAttendanceResponse => {
  return {
    ...data,
    checkIn: extractTime(data.checkIn),
    checkOut: extractTime(data.checkOut),
  };
};

@injectable()
export class AttendanceRepository implements IAttendancePort {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaType) {}

  async getReportUserByDate(
    date: Date,
    companyId?: string
  ): Promise<ReportAttendanceResponse[]> {
    const results = await this.prisma.reportAttendance.findMany({
      where: {
        date: date,
        companyId: companyId,
      },
      include: {
        user: true,
        company: true,
        schedule: true,
        typePermission: true,
      },
    });
    return results.map(transformAttendanceResponse);
  }

  async getAllUsersWithAttendance(
    companyId?: string
  ): Promise<ReportAttendanceResponse[]> {
    const results = await this.prisma.reportAttendance.findMany({
      where: {
        companyId: companyId,
        deletedAt: null,
        status: true,
      },
      include: {
        user: true,
        company: true,
        schedule: {
          include: {
            scheduleRanges: true,
            scheduleChanges: true,
          },
        },
        typePermission: true,
      },
    });
    return results.map(transformAttendanceResponse);
  }

  async getUserAttendance(userId: string, companyId?: string): Promise<any[]> {
    const results = await this.prisma.reportAttendance.findMany({
      where: {
        userId: userId,
        companyId: companyId || undefined,
        deletedAt: null,
        status: true,
      },
      include: {
        user: true,
        company: true,
        schedule: true,
        typePermission: true,
      },
    });
    return results.map(transformAttendanceResponse);
  }

  async getReportAttendanceByUserId(
    userId: string,
    companyId?: string
  ): Promise<ReportAttendanceResponse[]> {
    const results = await this.prisma.reportAttendance.findMany({
      where: {
        userId: userId,
        companyId: companyId,
      },
      include: {
        user: true,
        company: true,
        schedule: true,
        typePermission: true,
      },
    });
    return results.map(transformAttendanceResponse);
  }

  async getAttendanceHistory(user: {
    userId: string;
    roleId: string;
    companyId?: string;
  }): Promise<AttendanceHistory[]> {
    const { userId, companyId } = user;
    const query = {
      where: { userId, companyId: companyId || undefined },
    };

    const records = await this.prisma.reportAttendance.findMany({
      ...query,
      select: {
        id: true,
        userId: true,
        companyId: true,
        date: true,
        checkIn: true,
        checkOut: true,
        locationLatitude: true,
        locationLongitude: true,
        locationAddress: true,
        hoursWorked: true,
        overtimeHours: true,
        typeAssistanceId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        company: true,
        user: true,
        schedule: true,
        typePermission: true,
      },
    });

    // Procesar los registros
    const attendanceHistory = records.map((record) => {
      const checkInDate = new Date(record.date).toISOString().split("T")[0]; // Extraer YYYY-MM-DD

      // Función auxiliar para extraer la hora
      const extractTime = (timestamp: string | null): string => {
        if (!timestamp) return ""; // Si es nulo o vacío, retornar ""
        try {
          const timeOnly = new Date(timestamp)
            .toISOString()
            .split("T")[1]
            .split(".")[0]; // Extraer "HH:mm:ss"
          return timeOnly.split(":").slice(0, 2).join(":"); // Formatear como "HH:mm"
        } catch (e) {
          console.error(
            `Error extracting time from timestamp: ${timestamp}`,
            e
          );
          return ""; // Retornar "" si hay un error
        }
      };

      // Procesar checkIn y checkOut usando la función auxiliar
      const checkIn = extractTime(record.checkIn?.toISOString() || null);
      const checkOut = extractTime(record.checkOut?.toISOString() || null);

      return {
        id: record.id,
        userId: record.userId,
        companyId: record.companyId,
        company: record.company,
        user: record.user,
        schedule: record.schedule,
        typePermission: record.typePermission,
        checkInDate: checkInDate,
        checkIn: checkIn, // Solo la hora (HH:mm)
        checkOutDate: checkInDate, // Usar la misma fecha
        checkOut: checkOut, // Solo la hora (HH:mm)
        hoursWorked: record.hoursWorked,
        overtimeHours: record.overtimeHours,
        locationLatitude: record.locationLatitude
          ? Number(record.locationLatitude)
          : null,
        locationLongitude: record.locationLongitude
          ? Number(record.locationLongitude)
          : null,
        locationAddress: record.locationAddress || null,
        typeAssistanceId: record.typeAssistanceId,
        status: record.status,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    });

    return attendanceHistory;
  }

  async createReportAttendance(
    data: CreateReportAttendance
  ): Promise<ReportAttendanceResponse> {
    const result = await this.prisma.reportAttendance.create({
      data: {
        ...transformAttendanceData(data),
        status: true,
        user: { connect: { id: data.userId } },
        company: data.companyId
          ? { connect: { id: data.companyId } }
          : undefined,
        locationLatitude: data.locationLatitude,
        locationLongitude: data.locationLongitude,
        locationAddress: data.locationAddress,
        schedule: { connect: { id: data.scheduleId } },
        typePermission: data.typePermissionId
          ? { connect: { id: data.typePermissionId } }
          : undefined,
        checkOut: null,
      },
      include: {
        user: true,
        company: true,
        schedule: true,
        typePermission: true,
      },
    });

    return transformAttendanceResponse(result);
  }

  async updateReportAttendance(
    id: string,
    data: Partial<ReportAttendanceResponse> | UpdateReportAttendance,
    companyId?: string
  ): Promise<ReportAttendanceResponse> {
    // Extraer los campos de ID de relaciones
    const {
      schedule,
      company,
      user,
      typePermission,
      scheduleId,
      userId,
      companyId: dataCompanyId,
      typePermissionId,
      ...baseFields
    } = data as any;

    // Crear un objeto que cumpla con los requisitos de tipo de Prisma
    const prismaUpdateData: Prisma.ReportAttendanceUpdateInput = {
      // Añadir los campos básicos que no son relaciones
      ...baseFields,
      updatedAt: new Date(),
    };

    // Añadir relaciones si existen los IDs
    if (scheduleId) {
      prismaUpdateData.schedule = { connect: { id: scheduleId } };
    }

    if (userId) {
      prismaUpdateData.user = { connect: { id: userId } };
    }

    if (dataCompanyId || companyId) {
      prismaUpdateData.company = {
        connect: { id: dataCompanyId || companyId },
      };
    }

    if (typePermissionId) {
      prismaUpdateData.typePermission = { connect: { id: typePermissionId } };
    }

    const result = await this.prisma.reportAttendance.update({
      where: {
        id: id,
      },
      data: prismaUpdateData,
      include: {
        user: true,
        company: true,
        schedule: true,
        typePermission: true,
      },
    });

    return transformAttendanceResponse(result);
  }

  async bulkUpdateReportAttendance(
    updates: { id: string; typeAssistanceId: AsistentType }[]
  ): Promise<void> {
    // Actualizar cada registro individualmente usando Promise.all
    await Promise.all(
      updates.map((update) =>
        this.prisma.reportAttendance.update({
          where: { id: update.id },
          data: { typeAssistanceId: update.typeAssistanceId },
        })
      )
    );
  }

  async deleteReportAttendance(id: string, companyId?: string): Promise<void> {
    await this.prisma.reportAttendance.delete({
      where: { id: id, companyId: companyId },
    });
  }

  async findAllByCompanyAndDateRange(
    companyId: string,
    startDate: Date,
    endDate: Date,
    userId?: string | null
  ): Promise<ReportAttendanceResponse[]> {
    // Ajustar fechas según la zona horaria local (ejemplo: GMT-5)
    const parsedStartDate = dayjs(startDate)
      .startOf("day")
      .add(-5, "hour")
      .toDate();
    const parsedEndDate = dayjs(endDate).endOf("day").add(-5, "hour").toDate();

    // Crear filtro
    const filter: any = {
      companyId,
      date: {
        gte: parsedStartDate,
        lte: parsedEndDate,
      },
      status: true,
      deletedAt: null,
    };

    if (userId) {
      filter.userId = userId;
    }

    // Obtener datos de Prisma
    const attendances = await this.prisma.reportAttendance.findMany({
      where: filter,
      include: {
        schedule: true,
        user: {
          include: {
            position: true,
            workplace: true,
            documentType: true,
          },
        },
        company: true,
        typePermission: true,
      },
      orderBy: [{ date: "asc" }, { userId: "asc" }],
    });

    // Transformar a tu tipo personalizado
    return attendances.map((record) => ({
      id: record.id,
      scheduleId: record.scheduleId,
      schedule: record.schedule as any,
      companyId: record.companyId,
      company: record.company as any,
      date: record.date.toISOString(),
      checkIn: record.checkIn
        ? new Date(record.checkIn).toISOString()
        : undefined,
      checkOut: record.checkOut
        ? new Date(record.checkOut).toISOString()
        : undefined,
      locationLatitude: record.locationLatitude,
      locationLongitude: record.locationLongitude,
      locationAddress: record.locationAddress,
      hoursWorked: record.hoursWorked,
      overtimeHours: record.overtimeHours,
      notes: record.notes,
      userId: record.userId,
      user: record.user as any,
      typePermissionId: record.typePermissionId || undefined,
      typeAssistanceId: record.typeAssistanceId as any,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    }));
  }

  async findByUserAndDate(userId: string, date: Date) {
    return this.prisma.reportAttendance.findFirst({
      where: {
        userId,
        date,
        status: true,
        deletedAt: null,
      },
      include: {
        schedule: true,
        user: true,
        typePermission: true,
      },
    });
  }

  async findToday(userId: string): Promise<ReportAttendanceResponse | null> {
    // Obtener la fecha actual en formato 'YYYY-MM-DD'
    const today = new Date().toISOString().split("T")[0];

    const result = await this.prisma.reportAttendance.findFirst({
      where: {
        userId,
        date: {
          equals: new Date(today),
        },
      },
    });

    return result ? transformAttendanceResponse(result) : null;
  }

  async findById(
    attendanceId: string
  ): Promise<ReportAttendanceResponse | null> {
    const result = await this.prisma.reportAttendance.findUnique({
      where: { id: attendanceId },
    });
    return result ? transformAttendanceResponse(result) : null;
  }

  async findAttendanceByDateAndSchedule(
    date: Date,
    scheduleId: string
  ): Promise<ReportAttendanceResponse[]> {
    // Formatear la fecha para coincidir con el formato en la base de datos
    const formattedDate = new Date(date.toISOString().split("T")[0]);

    // Obtener registros de asistencia para esa fecha y horario
    const results = await this.prisma.reportAttendance.findMany({
      where: {
        date: {
          equals: formattedDate,
        },
        scheduleId: scheduleId,
        status: true,
      },
      include: {
        // Incluir las relaciones necesarias
        user: true,
        company: true,
        schedule: {
          include: {
            scheduleRanges: true,
            scheduleChanges: true,
          },
        },
        typePermission: true,
      },
    });

    return results.map(transformAttendanceResponse);
  }
}
