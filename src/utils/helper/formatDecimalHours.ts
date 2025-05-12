/**
 * Convierte un número decimal de horas a un formato legible: "Xh Ym"
 * Ej: 0.38 → "0h 23m"
 */
export function formatDecimalHours(decimal: number): string {
    const totalMinutes = Math.round(decimal * 60); // 1 hora = 60 minutos
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
  
    return `${hours}h ${minutes}m`;
  }
  