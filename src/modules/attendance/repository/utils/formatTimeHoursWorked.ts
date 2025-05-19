import { format, parse } from "date-fns";

export const formatTimeHoursWorked = (time: string): string => {
  // Convertimos el string a número
  const decimalHours = parseFloat(time);

  // Si no es un número válido o es 0
  if (isNaN(decimalHours) || decimalHours <= 0) {
    return "Sin tiempo transcurrido";
  }

  // Separamos la parte entera y decimal
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);

  const parts = [];

  if (hours > 0) {
    parts.push(`${hours} hora${hours !== 1 ? "s" : ""}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} minuto${minutes !== 1 ? "s" : ""}`);
  }

  if (parts.length === 0) {
    return "Menos de un minuto";
  }

  return parts.join(" y ");
};

export const formatTimePeriod = (time: string) => {
  const date = parse(time, "HH:mm", new Date());
  const ampm = format(date, "aa").toLowerCase(); // "am" or "pm"

  return `${format(date, "HH:mm")} ${ampm}`;
};

export const extractTime = (timeString: string): string => {
  const [hours, minutes] = timeString.slice(11, 16).split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  const formattedHours = hours % 12 || 12;

  return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};


export const formatMinutesToTime = (minutes: number): string => {
  if (minutes <= 0) return "0 min";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  let result = "";

  if (hours > 0) {
    result += `${hours}h`;
  }

  if (remainingMinutes > 0) {
    if (result) result += " ";
    result += `${remainingMinutes}min`;
  }

  return result;
};