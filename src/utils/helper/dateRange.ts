export type DateRangeFilter = "today" | "week" | "month" | "all" | "custom";

// types.ts o utils.ts
export type DateFilterType = "preset" | "custom";

export interface CustomDateRange {
  startDate: string; // formato ISO: "YYYY-MM-DD"
  endDate: string;
}
export function getDateRange(filter: DateRangeFilter, customRange?: CustomDateRange) {
  
  const now = new Date();
  
  if (filter === "today") {
    // Calculamos el inicio del día actual en UTC (00:00:00)
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0); // Establecer a 00:00:00 en UTC
    
    // Calculamos el final del día actual en UTC (23:59:59.999)
    const end = new Date(now);
    end.setUTCHours(23, 59, 59, 999); // Establecer a 23:59:59.999 en UTC
    
    console.log('Rango corregido "today" en UTC:', {
      start: start.toISOString(),
      end: end.toISOString(),
    });
    
    return { start, end };
  }
  
  if (filter === "week") {
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
    
    const start = new Date(now);
    start.setUTCDate(diff);
    start.setUTCHours(0, 0, 0, 0);
    
    const end = new Date(now);
    end.setUTCDate(diff + 6);
    end.setUTCHours(23, 59, 59, 999);
    
    return { start, end };
  }
  
  if (filter === "month") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    
    return { start, end };
  }
  
  if (filter === "custom" && customRange) {
    // Convertir fechas de string a Date y ajustar a UTC
    const start = new Date(customRange.startDate);
    start.setUTCHours(0, 0, 0, 0);
    
    const end = new Date(customRange.endDate);
    end.setUTCHours(23, 59, 59, 999);
    
    return { start, end };
  }
  
  // Si es 'all' o cualquier otro
  return {};
}
