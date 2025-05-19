import {format } from 'date-fns';

// Función para formatear la hora en formato 12 horas con AM/PM
export const formatTimeTo12Hour = (timeString: string | null): string | null => {
  if (!timeString) return null;

  // Parsear la cadena de tiempo (HH:mm:ss o HH:mm)
  const timeParts = timeString.split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);

  // Crear un objeto Date temporal (ignoramos la fecha real)
  const date = new Date(0, 0, 0, hours, minutes);

  // Formatear la hora en formato 12 horas con AM/PM
  return format(date, 'h:mm a'); // Ejemplo: "10:00 AM"
};