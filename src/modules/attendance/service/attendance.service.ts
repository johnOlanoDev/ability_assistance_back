import { inject, injectable } from "tsyringe";
import {
  ReportAttendanceResponse,
  CreateReportAttendance,
  UpdateReportAttendance,
  AsistentType,
} from "../types/attendance.types";
import { UserService } from "@/modules/users/services/user.service";
import { ScheduleService } from "@/modules/schedule/Schedule/service/schedule.service";
import { CompanyService } from "@/modules/companies/services/company.service";
import { PermissionUtils } from "@/utils/helper/permissions.helper";
import { AppError } from "@/middleware/errors/AppError";
import { AttendanceRepository } from "../repository/attendance.repository";
import {
  getDistance,
  getReadableAddress,
  validateCoordinates,
} from "@/utils/helper/coordinate";
import { PermissionTypeRepository } from "@/modules/permissionsType/repository/permissionType.repository";
import { PermissionTypeResponse } from "@/modules/permissionsType/types/permissionTypes.types";
import { Decimal, PrismaClientKnownRequestError } from "@/prisma";
import { startOfDay } from "date-fns";

@injectable()
export class AttendanceService {
  constructor(
    @inject("AttendanceRepository")
    private attendanceRepository: AttendanceRepository,
    @inject("PermissionTypeRepository")
    private permissionTypeRepository: PermissionTypeRepository,
    @inject(UserService) private userService: UserService,
    @inject(CompanyService) private companyService: CompanyService,
    @inject(ScheduleService) private scheduleService: ScheduleService,
    @inject("PermissionUtils") private permissionUtils: PermissionUtils
  ) {}

  async getReportUserByDate(
    date: Date,
    user: { roleId: string; companyId?: string }
  ): Promise<ReportAttendanceResponse[]> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    await this.validateCompanyExists(user, companyId);

    const data = await this.attendanceRepository.getReportUserByDate(
      date,
      companyId
    );

    const transformedData = data.map(transformAttendanceResponse);

    return transformedData;
  }

  async getAttendanceByScheduleId(
    scheduleId: string,
    user: { roleId: string; companyId?: string }
  ) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const isAdmin = await this.permissionUtils.isAdmin(user.roleId);

    const companyId = isSuperAdmin ? undefined : user.companyId;

    if (!isSuperAdmin && !isAdmin) {
      throw new AppError("No tienes permiso para obtener asistencias", 403);
    }

    if (isSuperAdmin) {
      return await this.attendanceRepository.findReportByScheduleId(scheduleId);
    }

    return await this.attendanceRepository.findReportByScheduleId(
      scheduleId,
      companyId
    );
  }

  async findScheduleReportByUserId(
    userId: string,
    scheduleId: string,
    user: { roleId: string; companyId?: string }
  ): Promise<ReportAttendanceResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    if (isSuperAdmin) {
      return await this.attendanceRepository.findScheduleReportByUserId(
        userId,
        scheduleId
      );
    }

    return await this.attendanceRepository.findScheduleReportByUserId(
      userId,
      scheduleId,
      companyId
    );
  }

  async getUserAttendance(user: {
    roleId: string;
    companyId?: string;
    userId: string;
  }) {
    // Validar permisos
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    if (!isSuperAdmin && !companyId) {
      throw new AppError("La empresa no existe", 400);
    }

    // Obtener datos de asistencia del repositorio
    const data = await this.attendanceRepository.getUserAttendance(
      user.userId,
      companyId
    );

    return data;
  }

  async getAllUsersWithAttendance(user: {
    roleId: string;
    companyId?: string;
  }): Promise<any[]> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    // Validar que la empresa exista
    if (!isSuperAdmin && !companyId) {
      throw new AppError("La empresa no existe", 400);
    }

    const data = await this.attendanceRepository.getAllUsersWithAttendance(
      companyId
    );

    const transformedData = data.map(transformAttendanceResponse);

    return transformedData;
  }

  async getReportAttendanceByUserId(
    userId: string,
    user: { roleId: string; companyId?: string }
  ): Promise<ReportAttendanceResponse[]> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    await this.validateCompanyExists(user, companyId);

    const data = await this.attendanceRepository.getReportAttendanceByUserId(
      userId,
      companyId
    );

    return data;
  }

  async getAttendanceHistory(user: {
    userId: string;
    roleId: string;
    companyId?: string;
  }) {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    // 1. Validar que el usuario pertenezca a la empresa
    if (user.companyId) {
      await this.companyService.validateUserInCompany(user, user.companyId);
    }

    // 2. Obtener el área de trabajo y cargo del usuario
    const userData = await this.userService.getUserAreaAndPosition(user.userId);
    const workplaceId = userData.workplaceId;
    const positionId = userData.positionId;

    // 3. Verificar si hay un horario activo para el área y cargo
    const activeSchedule = await this.scheduleService.getActiveScheduleForUser(
      workplaceId,
      positionId,
      user,
      companyId
    );

    if (!isSuperAdmin && !activeSchedule) {
      throw new AppError(
        "No hay un horario activo para este área y cargo",
        400
      );
    }

    if (!isSuperAdmin) {
      if (!workplaceId || !positionId) {
        throw new AppError(
          "El usuario no tiene asignado un área de trabajo o cargo",
          400
        );
      }
    }
    // 5. Obtener el historial de asistencia desde el repositorio
    const data = await this.attendanceRepository.getAttendanceHistory(user);

    // 6. Filtrar los datos según el rol del usuario
    const filteredHistory = data.filter((record) => {
      // Solo mostrar registros relacionados con la empresa del usuario
      if (!isSuperAdmin) {
        if (companyId && record.companyId !== companyId) {
          return false;
        }
      }
      return true;
    });

    return filteredHistory.map((record) => ({
      ...record,
      hoursWorked:
        record.checkIn && record.checkOut
          ? calculateHoursWorked(record.checkIn, record.checkOut)
          : null,
    }));
  }

  async registerCheckinAttendance(
    data: Partial<CreateReportAttendance>,
    user: { userId: string; roleId: string; companyId?: string }
  ): Promise<ReportAttendanceResponse> {
    try {
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
      const companyId = isSuperAdmin ? undefined : user.companyId;

      if (!isSuperAdmin && !companyId) {
        throw new AppError("Usuario o compañía no válidos", 401);
      }

      const existingUser = await this.userService.getUserById(
        user.userId,
        user
      );
      await this.companyService.validateUserInCompany(user, companyId);

      if (!existingUser) {
        throw new AppError("Usuario no encontrado", 404);
      }

      if (!isSuperAdmin) {
        if (!existingUser.workplace || !existingUser.position) {
          throw new AppError(
            "El usuario no tiene asignado un puesto o lugar de trabajo",
            400
          );
        }
      }

      const workplaceId = existingUser.workplace?.id;
      const positionId = existingUser.position?.id;

      let readableAddress: string | null = null;
      if (data.locationLatitude && data.locationLongitude) {
        const latitude = parseFloat(data.locationLatitude.toString());
        const longitude = parseFloat(data.locationLongitude.toString());

        validateCoordinates(latitude, longitude);

        // Calcular distancia desde la ubicación de referencia
        /* const distance = getDistance(
          REFERENCE_LOCATION.latitude,
          REFERENCE_LOCATION.longitude,
          latitude,
          longitude
        );

        const MAX_DISTANCE_ALLOWED_KM = 0.1; // 100 metros

        if (distance > MAX_DISTANCE_ALLOWED_KM) {
          throw new AppError(
            `Estás a ${distance.toFixed(
              2
            )} km del lugar autorizado. Debes estar a menos de ${MAX_DISTANCE_ALLOWED_KM} km para registrar tu asistencia.`,
            400
          );
        } */

        readableAddress = await getReadableAddress(latitude, longitude);
      }

      // Obtener horario activo
      const schedule = await this.scheduleService.getActiveScheduleForUser(
        workplaceId!,
        positionId!,
        user,
        companyId
      );

      if (!schedule || !schedule.id)
        throw new AppError("No hay horario activo para este usuario", 404);

      // Mapear días de la semana a números
      const DayOfWeekMap: Record<string, number> = {
        SUNDAY: 0,
        MONDAY: 1,
        TUESDAY: 2,
        WEDNESDAY: 3,
        THURSDAY: 4,
        FRIDAY: 5,
        SATURDAY: 6,
      };

      const today = new Date().getDay();
      if (!schedule.scheduleRanges || schedule.scheduleRanges.length === 0)
        throw new AppError("No hay rangos de horario definidos", 400);

      const scheduleRange = schedule.scheduleRanges.find((range) => {
        const startDay = DayOfWeekMap[range.startDay];
        const endDay = DayOfWeekMap[range.endDay];
        return (
          startDay !== undefined &&
          endDay !== undefined &&
          startDay <= today &&
          today <= endDay
        );
      });

      if (!scheduleRange)
        throw new AppError("No hay horario definido para hoy", 404);

      // Verificar si ya existe un registro de asistencia para el día actual
      const todayAttendance = await this.attendanceRepository.findToday(
        user.userId
      );
      if (todayAttendance) {
        throw new AppError(
          "Ya registraste tu entrada hoy. No puedes registrarla nuevamente.",
          400
        );
      }

      // Fecha de asistencia (sin hora)
      const attendanceDate = startOfDay(new Date());

      if (isNaN(attendanceDate.getTime()))
        throw new AppError("Fecha de registro inválida", 400);

      // Hora real del check-in
      const actualCheckIn = new Date();

      if (isNaN(actualCheckIn.getTime()))
        throw new AppError("Fecha de check-in inválida", 400);

      // Convertir la hora local a UTC
      const utcCheckIn = new Date(
        actualCheckIn.getTime() - actualCheckIn.getTimezoneOffset() * 60000
      );

      // 📌 **Corrección aquí**: Convertir `scheduleRange.checkIn` a `Date`
      const [hours, minutes, seconds] = scheduleRange.checkIn
        .split(":")
        .map(Number);
      const expectedCheckIn = new Date();
      expectedCheckIn.setHours(hours, minutes, seconds || 0, 0); // Establecer la hora y minutos

      const diffMinutes =
        (actualCheckIn.getTime() - expectedCheckIn.getTime()) / (1000 * 60);

      const typeAssistanceId =
        diffMinutes > 5 ? AsistentType.LATE : AsistentType.PRESENT;

      // Guardar el registro de asistencia
      const dataCreate = await this.attendanceRepository.createReportAttendance(
        {
          userId: user.userId,
          companyId: companyId ? companyId : "",
          scheduleId: schedule.id,
          date: attendanceDate,
          checkIn: utcCheckIn.toISOString(), // Hora convertida a UTC
          locationLatitude: data.locationLatitude
            ? new Decimal(data.locationLatitude)
            : null,
          locationLongitude: data.locationLongitude
            ? new Decimal(data.locationLongitude)
            : null,
          locationAddress: readableAddress || null,
          typeAssistanceId,
          hoursWorked: new Decimal(0),
          overtimeHours: new Decimal(0),
          status: true,
        }
      );

      const permissionDuration = calculatePermissionDuration(dataCreate); // Función para calcular duración del permiso
      const adjustedHoursWorked = calculateAdjustedHoursWorked(dataCreate); // Función para calcular horas ajustadas

      // Agregar campos visuales al objeto de respuesta
      const responseData = {
        ...dataCreate,
        permissionDuration: permissionDuration || 0, // Valor predeterminado si no hay permisos
        adjustedHoursWorked: adjustedHoursWorked || 0, // Valor predeterminado si no hay horas ajustadas
      };

      console.log("🚀 responseData:", responseData);

      return transformAttendanceResponse(responseData);
    } catch (error: any) {
      // Verificar si el error es por violación de restricción de unicidad
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          // Error de clave única duplicada
          throw new AppError(
            "Ya existe un registro de asistencia para este usuario, horario y fecha.",
            400
          );
        }
      }
      if (error instanceof AppError) {
        console.warn("AppError:", error.message);
        throw error; // Vuelve al controlador con status code correcto
      }
      // Para otros errores, lanzar un mensaje genérico
      console.error("Error creating report attendance:", error.message);
      throw new AppError(`Error interno del servidor ${error.message}`, 500);
    }
  }

  async registerCheckOut(
    data: Partial<UpdateReportAttendance>,
    user: { userId: string; roleId: string; companyId?: string }
  ): Promise<ReportAttendanceResponse> {
    try {
      const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
      const companyId = isSuperAdmin ? undefined : user.companyId;
      const userId = user.userId;

      if (!isSuperAdmin && !companyId) {
        throw new AppError("Usuario o compañía no válidos", 401);
      }

      // Verificar si existe un registro de entrada para el día actual
      const todayAttendance = await this.attendanceRepository.findToday(userId);
      if (!todayAttendance) {
        throw new AppError(
          "No hay registro de entrada para hoy. Debes registrar tu entrada primero.",
          400
        );
      }

      if (todayAttendance.checkOut) {
        throw new AppError(
          "Ya registraste tu salida hoy. No puedes registrarla nuevamente.",
          400
        );
      }

      let readableAddress: string | null = null;

      if (data.locationLatitude && data.locationLongitude) {
        const latitude = parseFloat(data.locationLatitude.toString());
        const longitude = parseFloat(data.locationLongitude.toString());

        validateCoordinates(latitude, longitude);

        // Calcular distancia desde la ubicación de referencia
        /* const distance = getDistance(
          REFERENCE_LOCATION.latitude,
          REFERENCE_LOCATION.longitude,
          latitude,
          longitude
        );

        const MAX_DISTANCE_ALLOWED_KM = 0.1; // 100 metros

        if (distance > MAX_DISTANCE_ALLOWED_KM) {
          throw new AppError(
            `Estás a ${distance.toFixed(
              2
            )} km del lugar autorizado. Debes estar a menos de ${MAX_DISTANCE_ALLOWED_KM} km para registrar tu asistencia.`,
            400
          );
        } */

        readableAddress = await getReadableAddress(latitude, longitude);
      }

      // Hora real del check-out
      const actualCheckOut = new Date();
      if (isNaN(actualCheckOut.getTime())) {
        throw new AppError("Fecha de check-out inválida", 400);
      }

      // Convertir la hora local a UTC
      const utcCheckOut = new Date(
        actualCheckOut.getTime() - actualCheckOut.getTimezoneOffset() * 60000
      );

      // Validar que checkIn esté definido
      if (!todayAttendance.checkIn) {
        throw new AppError(
          "La hora de entrada (checkIn) no está definida",
          400
        );
      }

      // Convertir checkIn y checkOut a objetos Date válidos
      const checkInTime = parseTimeToDate(todayAttendance.checkIn);
      const checkOutTime = utcCheckOut;

      const checkInTimeString = formatTime(checkInTime);
      const checkOutTimeString = formatTime(checkOutTime);

      // Calcular las horas trabajadas reales
      const hoursWorked = calculateHoursWorked(
        checkInTimeString,
        checkOutTimeString
      );

      const updatedAttendance =
        await this.attendanceRepository.updateReportAttendance(
          todayAttendance.id || "",
          {
            checkOut: utcCheckOut.toISOString(),
            locationLatitude: data.locationLatitude
              ? new Decimal(data.locationLatitude)
              : todayAttendance.locationLatitude,
            locationLongitude: data.locationLongitude
              ? new Decimal(data.locationLongitude)
              : todayAttendance.locationLongitude,
            locationAddress: readableAddress || todayAttendance.locationAddress,
            notes: data.notes || todayAttendance.notes,
            hoursWorked: new Decimal(timeToDecimal(hoursWorked)),
          }
        );

      // Transformar la respuesta para incluir el análisis
      const transformedAttendance =
        transformAttendanceResponse(updatedAttendance);

      return transformedAttendance;
    } catch (error) {
      console.error("Error registering check-out:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Error interno del servidor", 500);
    }
  }

  async updateCheckIn(
    attendanceId: string,
    updatedData: Partial<CreateReportAttendance>,
    user: { roleId: string; companyId?: string }
  ): Promise<ReportAttendanceResponse> {
    const isSuperAdmin = await this.permissionUtils.isSuperAdmin(user.roleId);
    const companyId = isSuperAdmin ? undefined : user.companyId;

    // Validar que el registro de asistencia exista
    const attendance = await this.attendanceRepository.findById(attendanceId);

    if (!attendance)
      throw new AppError("Registro de asistencia no encontrado", 404);

    // Validar permisos del usuario
    await this.validateCompanyExists(user, companyId);

    // Actualizar solo los campos relacionados con la entrada
    const updatedCheckIn = updatedData.checkIn
      ? new Date(updatedData.checkIn)
      : null;
    if (updatedCheckIn && isNaN(updatedCheckIn.getTime())) {
      throw new AppError("Fecha de check-in inválida", 400);
    }

    const overtimeHours = updatedData.overtimeHours
      ? new Decimal(updatedData.overtimeHours)
      : attendance.overtimeHours;

    const hoursWorked = updatedData.hoursWorked
      ? new Decimal(updatedData.hoursWorked)
      : attendance.hoursWorked;

    const notes = updatedData.notes || attendance.notes;

    // Actualizar el registro de asistencia
    return this.attendanceRepository.updateReportAttendance(attendanceId, {
      ...attendance,
      checkIn: updatedCheckIn?.toISOString() || attendance.checkIn,
      overtimeHours,
      hoursWorked,
      notes,
      locationLatitude: updatedData.locationLatitude
        ? new Decimal(updatedData.locationLatitude)
        : attendance.locationLatitude,
      locationLongitude: updatedData.locationLongitude
        ? new Decimal(updatedData.locationLongitude)
        : attendance.locationLongitude,
      locationAddress:
        updatedData.locationAddress || attendance.locationAddress,
    });
  }

  // Validar la existencia de la empresa
  async validateCompanyExists(
    user: { roleId: string; companyId?: string },
    companyId?: string
  ): Promise<void> {
    if (!companyId) throw new AppError("La empresa no existe", 400);
    await this.companyService.getCompanyById(companyId, user);
  }

  async validateScheduleExists(
    scheduleId: string,
    user: { roleId: string; companyId?: string }
  ): Promise<void> {
    await this.scheduleService.getScheduleById(scheduleId, user);
  }

  async validateUserExists(
    userId: string,
    user: { roleId: string; companyId?: string }
  ): Promise<void> {
    await this.userService.getUserById(userId, user);
  }
}

const calculateHoursWorked = (
  checkIn: string, // Hora de entrada en formato "HH:mm"
  scheduleEnd: string // Fin del horario laboral en formato "HH:mm"
): string => {
  try {
    // Convertir las horas a objetos Date
    const [checkInHours, checkInMinutes] = checkIn.split(":").map(Number);
    const [scheduleEndHours, scheduleEndMinutes] = scheduleEnd
      .split(":")
      .map(Number);

    // Calcular los minutos totales para cada hora
    const checkInTotalMinutes = checkInHours * 60 + checkInMinutes;
    const scheduleEndTotalMinutes = scheduleEndHours * 60 + scheduleEndMinutes;

    // Calcular la diferencia en minutos
    const differenceMinutes = scheduleEndTotalMinutes - checkInTotalMinutes;

    // Validar que la diferencia sea positiva
    if (differenceMinutes <= 0) return "00:00"; // No hay horas trabajadas

    // Convertir la diferencia a formato HH:mm
    const hours = Math.floor(differenceMinutes / 60);
    const minutes = differenceMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  } catch (error) {
    console.error("Error al calcular las horas trabajadas:", error);
    return "00:00";
  }
};

const timeToDecimal = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours + minutes / 60;
};

const formatHoursDecimalToTime = (decimalHours: number): string => {
  const totalSeconds = Math.floor(decimalHours * 3600); // Convertir a segundos totales
  const hours = Math.floor(totalSeconds / 3600); // Extraer horas
  const minutes = Math.floor((totalSeconds % 3600) / 60); // Extraer minutos
  const seconds = totalSeconds % 60; // Extraer segundos

  // Formatear cada componente con dos dígitos
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};

const transformAttendanceResponse = (data: any): ReportAttendanceResponse => {
  const { permissionDuration, hoursWorked, adjustedHoursWorked, ...rest } =
    data;

  const permissionDurations = calculatePermissionDuration(data);
  const adjustedHoursWorkeds = calculateAdjustedHoursWorked(data);
  const hoursWorkeds = formatHoursDecimalToTime(Number(hoursWorked));

  return {
    ...rest,
    hoursWorked: hoursWorkeds,
    permissionDuration: formatHours(permissionDurations || 0), // Horas de permiso
    adjustedHoursWorked: adjustedHoursWorkeds || 0, // Horas trabajadas totales
  };
};

// Convertir una hora ("HH:mm:ss") en un objeto Date válido
const parseTimeToDate = (timeString: string): Date => {
  if (!timeString) {
    throw new AppError("La hora no está definida", 400);
  }
  const [hours, minutes, seconds] = timeString.split(":").map(Number);
  const today = new Date();
  today.setUTCHours(hours, minutes, seconds || 0, 0); // Establecer la hora actual
  return today;
};

// Calcular la duración del permiso (en horas)
const calculatePermissionDuration = (data: any): number => {
  if (!data.typePermission || !data.typePermission.duration) return 0;
  return parseFloat(data.typePermission.duration);
};

const calculateAdjustedHoursWorked = (data: any): string => {
  // Validar que los datos necesarios estén presentes
  if (!data.checkIn || !data.checkOut || !data.schedule?.scheduleRanges) {
    console.warn("Datos incompletos para calcular horas trabajadas ajustadas.");
    return "00:00:00"; // Retorna "00:00:00" si faltan datos críticos
  }

  // Obtener el rango de horario correspondiente al día actual
  const DayOfWeekMap: Record<string, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  const today = new Date().getDay();

  const scheduleRange = data.schedule.scheduleRanges.find((range: any) => {
    const startDay = DayOfWeekMap[range.startDay];
    const endDay = DayOfWeekMap[range.endDay];
    return (
      startDay !== undefined &&
      endDay !== undefined &&
      startDay <= today &&
      today <= endDay
    );
  });

  if (!scheduleRange) {
    console.warn("No hay rango de horario definido para hoy.");
    return "00:00:00"; // Retorna "00:00:00" si no hay un rango de horario válido
  }

  // Extraer los valores de checkIn y checkOut del rango de horario
  const [startHours, startMinutes, startSeconds] = scheduleRange.checkIn
    .split(":")
    .map(Number);
  const [endHours, endMinutes, endSeconds] = scheduleRange.checkOut
    .split(":")
    .map(Number);

  // Crear objetos Date para scheduleStart y scheduleEnd
  const todayDate = new Date();
  const scheduleStart = new Date(todayDate);
  scheduleStart.setHours(startHours, startMinutes, startSeconds || 0, 0);

  const scheduleEnd = new Date(todayDate);
  scheduleEnd.setHours(endHours, endMinutes, endSeconds || 0, 0);

  // Convertir checkIn y checkOut a objetos Date combinando con la fecha actual
  const parseTimeToDate = (timeString: string): Date | null => {
    if (!timeString) return null;
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    const date = new Date(todayDate);
    date.setHours(hours, minutes, seconds || 0, 0);
    return date;
  };

  const checkIn = parseTimeToDate(data.checkIn);
  const checkOut = parseTimeToDate(data.checkOut);

  // Validar que checkIn y checkOut sean fechas válidas
  if (!checkIn || !checkOut) {
    console.warn("Formato de hora inválido para checkIn o checkOut.");
    return "00:00:00"; // Retorna "00:00:00" si las horas no son válidas
  }

  // Calcular el tiempo total programado para trabajar (en milisegundos)
  const scheduledTimeMs = scheduleEnd.getTime() - scheduleStart.getTime();

  // Calcular el retraso (diferencia entre checkIn y scheduleStart)
  const delayMs = Math.max(0, checkIn.getTime() - scheduleStart.getTime());

  // Tiempo disponible para trabajar después del retraso
  const timeAvailableMs = scheduledTimeMs - delayMs;

  // Calcular el tiempo realmente trabajado (diferencia entre checkIn y checkOut)
  const workedTimeMs = Math.max(0, checkOut.getTime() - checkIn.getTime());

  // Determinar si el usuario cumplió con su jornada laboral
  const adjustedTimeMs = Math.min(workedTimeMs, timeAvailableMs);

  // Restar el permiso injustificado si existe
  let adjustedTimeWithPermissionMs = adjustedTimeMs;
  if (
    data.typeAssistanceId === "INJUSTIFIED_ABSENCE" &&
    data.permissionDuration
  ) {
    const permissionDurationMs =
      parseFloat(data.permissionDuration) * 60 * 60 * 1000; // Convertir a milisegundos
    adjustedTimeWithPermissionMs = Math.max(
      0,
      adjustedTimeMs - permissionDurationMs
    );
  }

  // Convertir el tiempo ajustado a formato HH:mm:ss
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedHours = String(hours).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  return formatTime(adjustedTimeWithPermissionMs);
};

const formatHours = (hours: number | undefined): string => {
  if (typeof hours !== "number" || isNaN(hours)) return "00:00";

  const isNegative = hours < 0; // Verificar si el valor es negativo
  const absoluteHours = Math.abs(hours); // Trabajar con el valor absoluto
  const totalMinutes = Math.round(absoluteHours * 60); // Convertir a minutos
  const formattedHours = Math.floor(totalMinutes / 60); // Horas completas
  const formattedMinutes = totalMinutes % 60; // Minutos restantes

  const formattedTime = `${String(formattedHours).padStart(2, "0")}:${String(
    formattedMinutes
  ).padStart(2, "0")}`;
  return isNegative ? `-${formattedTime}` : formattedTime; // Agregar signo negativo si aplica
};

const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};
