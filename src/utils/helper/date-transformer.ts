import { DayOfWeek } from "@/modules/schedule/scheduleRange/types/scheduleRange.types";

export const transformScheduleChangeDate = (change: any) => {
  return {
    ...change,
    changeDate: change?.changeDate.toISOString().split("T")[0], // Formato fecha
    newCheckIn: change?.newCheckIn ? formatTime(change.newCheckIn) : null,
    newCheckOut: change?.newCheckOut ? formatTime(change.newCheckOut) : null,
  };
};

const formatTime = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

export const getDayOfWeek = (date: Date) => {
  const days = [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];

  const dayIndex = date.getDay();
  return days[dayIndex];
};

/**
 * Función auxiliar para convertir una hora (string) en minutos desde medianoche.
 */
export const parseTime = (time: string): number => {
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return hours * 60 + minutes + seconds / 60;
};
