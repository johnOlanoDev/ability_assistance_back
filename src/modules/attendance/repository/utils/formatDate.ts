import { format } from "date-fns";
import { es } from "date-fns/locale";

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Fecha no disponible";

  // Fuerza interpretación en hora local
  const parts = dateString.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Los meses empiezan en 0
  const day = parseInt(parts[2]);

  const date = new Date(year, month, day); // Esto crea la fecha en hora local

  if (isNaN(date.getTime())) {
    console.warn("Fecha inválida:", dateString);
    return "Fecha inválida";
  }

  return format(date, "d 'de' MMMM yyyy", { locale: es });
};