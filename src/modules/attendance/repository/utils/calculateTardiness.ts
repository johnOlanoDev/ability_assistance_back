import { enumToNumber, ReportAttendance } from "@/types";
import { formatMinutesToTime } from "@/utils"; // o donde esté tu nueva función

export function calculateTardiness(attendance: ReportAttendance): string {
  if (
    !attendance.checkIn ||
    !attendance.schedule ||
    !attendance.schedule.scheduleRanges
  ) {
    return "0 min";
  }


  const attendanceDate = new Date(attendance.date);
  const dayOfWeek = attendanceDate.getDay();

  const applicableRange = attendance.schedule.scheduleRanges.find((range) => {
    const startDayNum = enumToNumber[range.startDay];
    const endDayNum = enumToNumber[range.endDay];

    if (startDayNum > endDayNum) {
      return dayOfWeek >= startDayNum || dayOfWeek <= endDayNum;
    }

    return dayOfWeek >= startDayNum && dayOfWeek <= endDayNum;
  });

  if (!applicableRange) {
    return "0 min";
  }

  const scheduledTime = applicableRange.checkIn;
  const actualCheckInTime = new Date(attendance.checkIn);

  const [scheduledHours, scheduledMinutes] = scheduledTime
    .split(":")
    .map(Number);
  const actualHours = actualCheckInTime.getUTCHours();
  const actualMinutes = actualCheckInTime.getUTCMinutes();

  const scheduledTotalMinutes = scheduledHours * 60 + scheduledMinutes;
  const actualTotalMinutes = actualHours * 60 + actualMinutes;

  const tardiness = actualTotalMinutes - scheduledTotalMinutes;

  const totalMinutes = Math.max(0, tardiness);

  return formatMinutesToTime(totalMinutes); // Ejemplo: "1h 17min"
}