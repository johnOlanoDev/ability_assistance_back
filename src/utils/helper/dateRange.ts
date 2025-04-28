export type DateRangeFilter = 'today' | 'week' | 'month' | 'all';

export function getDateRange(filter: DateRangeFilter): { start?: Date; end?: Date } {
  const now = new Date();

  if (filter === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  } else if (filter === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(diff + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  } else if (filter === 'month') {
    const start = new Date(now);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  } else if (filter === 'all') {
    // No aplicar rango de fechas
    return {};
  }

  throw new Error(`Filtro no válido: ${filter}`);
}