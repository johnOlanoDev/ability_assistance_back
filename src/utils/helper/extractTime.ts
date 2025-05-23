// Función auxiliar para extraer la hora
/* export const extractTime = (timestamp: string | null): string => {
  if (!timestamp) return ""; // Si es nulo o vacío, retornar ""
  try {
    const timeOnly = new Date(timestamp)
      .toISOString()
      .split("T")[1]
      .split(".")[0]; // Extraer "HH:mm:ss"
    return timeOnly.split(":").slice(0, 2).join(":"); // Formatear como "HH:mm"
  } catch (e) {
    console.error(`Error extracting time from timestamp: ${timestamp}`, e);
    return ""; // Retornar "" si hay un error
  }
}; */


export const extractTime = (timestamp: string | Date | null): string => {
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