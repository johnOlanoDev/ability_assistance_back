import { AppError } from "@/middleware/errors/AppError";
import { Prisma, PrismaClient } from "@prisma/client";
import { AttendanceRepository } from "@/modules/attendance/repository/attendance.repository";
import { UserRepository } from "@/modules/users/repository/user.repository";
import cron from "node-cron";

export async function markAbsentUsersForToday() {

  const prisma = new PrismaClient();
  const attendanceRepository = new AttendanceRepository(prisma);
  const userRepository = new UserRepository(prisma);

    try {
      // Obtener la fecha actual (medianoche)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      // Obtener todos los usuarios activos
      const activeUsers = await userRepository.getAllActiveUsers(); 
  
      // Para cada usuario, verificar si tiene un registro de asistencia para hoy
      for (const user of activeUsers) {
        const attendanceRecord = await attendanceRepository.findToday(user.id);
  
        if (!attendanceRecord) {
          // Si no tiene un registro, crear uno con estado ABSENT
          await attendanceRepository.createReportAttendance({
            userId: user.id,
            companyId: user.companyId || "",
            scheduleId: null, // Sin horario asociado porque no marcó asistencia
            date: today.toISOString(),
            checkIn: null, // Sin hora de entrada
            checkOut: null, // Sin hora de salida
            locationLatitude: null,
            locationLongitude: null,
            locationAddress: null,
            typeAssistanceId: "ABSENT", // Estado ausente
            hoursWorked: new Prisma.Decimal(0),
            overtimeHours: new Prisma.Decimal(0),
            status: false, // Marcar como inactivo
          });
        }
      }
  
      console.log("Ausencias marcadas correctamente.");
    } catch (error) {
      console.error("Error al marcar ausencias:", error);
      throw new AppError("Error al marcar ausencias", 500);
    }
  }

cron.schedule("0 0 * * *", () => {
  markAbsentUsersForToday();
});
