import { MenuItem } from "@/types";

export const detectCategory = (item: MenuItem) => {
  const path = item.path.toLowerCase();

  // Patrones para categorías
  if (
    path.includes("dashboard") ||
    path.includes("report") ||
    path.includes("attendance")
  ) {
    return "Gestión de Asistencias y Reportes";
  }
  if (
    path.includes("company") ||
    path.includes("workplace") ||
    path.includes("position") ||
    path.includes("schedule") ||
    path.includes("document") ||
    path.includes("users")
  ) {
    return "Gestión General de Empresas y Clientes";
  }
  if (
    path.includes("role") ||
    path.includes("assign/rolePermissions") ||
    path.includes("permission") ||
    path.includes("profile")
  ) {
    return "Configuraciones Internas";
  }

  // Si no coincide con ninguna categoría, usa "Otros"
  return "Otros";
};

type CategoryMap = Record<string, MenuItem[]>;

export const groupMenuByCategory = (menuItems: MenuItem[]): CategoryMap => {
  return menuItems.reduce((acc, item) => {
    const category = detectCategory(item);

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(item);
    return acc;
  }, {} as CategoryMap);
};

export const categoryPriorities: any = {
  "Gestión de Asistencias y Reportes": 1,
  "Gestión General de Empresas y Clientes": 2,
  "Configuraciones Internas": 3,
};


export const getItemPriority = (item: MenuItem): number => {
  const path = item.path.toLowerCase();

  if (path.includes("dashboard")) return 1;
  if (path.includes("report")) return 2;
  if (path.includes("attendance")) return 3;

  if (path.includes("company")) return 4;
  if (path.includes("workplace")) return 5;
  if (path.includes("position")) return 6;
  if (path.includes("schedule")) return 7;
  if (path.includes("document")) return 8;
  if (path.includes("user")) return 9;

  if (path.includes("role") && !path.includes("assign")) return 10;
  if (path.includes("assign/rolePermissions")) return 11;
  if (path.includes("permission")) return 12;
  if (path.includes("profile")) return 13;

  // Otros al final
  return Infinity;
};