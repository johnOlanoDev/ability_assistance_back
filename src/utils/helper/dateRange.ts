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
    const start = new Date(now);
    start.setHours(0, 0, 0, 0); // Inicio del día: 00:00:00

    const end = new Date(now);
    end.setHours(23, 59, 59, 999); // Fin del día: 23:59:59.999

    console.log(start, end)
    return { start, end };
  }

  if (filter === "week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setDate(diff + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  if (filter === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  if (filter === "custom" && customRange) {
    const start = new Date(customRange.startDate);
    const end = new Date(customRange.endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  // Si es 'all' o cualquier otro
  return {};
}
