export const permissions = [
  // Usuarios
  {
    name: "user:manage",
    description: "Gestión completa de usuarios",
    module: "Usuarios",
  },
  { name: "user:read", description: "Ver usuarios", module: "Usuarios" },
  {
    name: "user:self",
    description: "Ver su propio usuario",
    module: "Usuarios",
  },
  {
    name: "user:update",
    description: "Actualizar usuario",
    module: "Usuarios",
  },
  { name: "user:delete", description: "Eliminar usuario", module: "Usuarios" },

  // Profile
  {
    name: "user:profile",
    description: "Ver perfil de usuario",
    module: "Usuarios",
  },

  // Permissions
  {
    name: "permission:manage",
    description: "Gestión completa de permisos",
    module: "Permisos",
  },
  { name: "permission:read", description: "Ver permisos", module: "Permisos" },
  {
    name: "permission:self",
    description: "Ver su propio permiso",
    module: "Permisos",
  },
  {
    name: "permission:update",
    description: "Actualizar permiso",
    module: "Permisos",
  },
  {
    name: "permission:delete",
    description: "Eliminar permiso",
    module: "Permisos",
  },

  // Roles
  {
    name: "role:manage",
    description: "Gestión completa de roles",
    module: "Roles",
  },
  { name: "role:read", description: "Ver roles", module: "Roles" },
  {
    name: "role:self",
    description: "Ver su propio rol",
    module: "Roles",
  },
  { name: "role:update", description: "Actualizar rol", module: "Roles" },
  { name: "role:delete", description: "Eliminar rol", module: "Roles" },

  // Menús
  {
    name: "menu:manage",
    description: "Gestión completa de menús",
    module: "Menús",
  },
  { name: "menu:read", description: "Ver menús", module: "Menús" },
  { name: "menu:update", description: "Actualizar menú", module: "Menús" },
  { name: "menu:delete", description: "Eliminar menú", module: "Menús" },
  {
    name: "menu:self",
    description: "Ver su propio menú",
    module: "Menús",
  },

  // Empresas
  {
    name: "company:manage",
    description: "Gestión completa de empresas",
    module: "Empresas",
  },
  { name: "company:read", description: "Ver empresas", module: "Empresas" },
  {
    name: "company:self",
    description: "Ver su propia empresa",
    module: "Empresas",
  },
  {
    name: "company:update",
    description: "Actualizar empresa",
    module: "Empresas",
  },
  {
    name: "company:delete",
    description: "Eliminar empresa",
    module: "Empresas",
  },

  // Áreas de Trabajo (Workplace)
  {
    name: "workplace:manage",
    description: "Gestión completa de áreas de trabajo",
    module: "Áreas de Trabajo",
  },
  {
    name: "workplace:read",
    description: "Ver áreas de trabajo",
    module: "Áreas de Trabajo",
  },
  {
    name: "workplace:self",
    description: "Ver su propia área de trabajo",
    module: "Áreas de Trabajo",
  },
  {
    name: "workplace:update",
    description: "Actualizar área de trabajo",
    module: "Áreas de Trabajo",
  },
  {
    name: "workplace:delete",
    description: "Eliminar área de trabajo",
    module: "Áreas de Trabajo",
  },

  // Posiciones (Position)
  {
    name: "position:manage",
    description: "Gestión completa de posiciones",
    module: "Posiciones",
  },
  {
    name: "position:read",
    description: "Ver posiciones",
    module: "Posiciones",
  },
  {
    name: "position:self",
    description: "Ver su propia posición",
    module: "Posiciones",
  },
  {
    name: "position:update",
    description: "Actualizar posición",
    module: "Posiciones",
  },
  {
    name: "position:delete",
    description: "Eliminar posición",
    module: "Posiciones",
  },

  // Horarios (Schedule)
  {
    name: "schedule:manage",
    description: "Gestión completa de horarios",
    module: "Horarios",
  },
  { name: "schedule:read", description: "Ver horarios", module: "Horarios" },
  {
    name: "schedule:self",
    description: "Ver su propio horario",
    module: "Horarios",
  },
  {
    name: "schedule:update",
    description: "Actualizar horario",
    module: "Horarios",
  },
  {
    name: "schedule:delete",
    description: "Eliminar horario",
    module: "Horarios",
  },

  // Rangos de Horarios (ScheduleRange)
  {
    name: "schedulerange:manage",
    description: "Gestión completa de rangos de horarios",
    module: "Rangos de Horarios",
  },
  {
    name: "schedulerange:read",
    description: "Ver rangos de horarios",
    module: "Rangos de Horarios",
  },
  {
    name: "schedulerange:self",
    description: "Ver su propio rango de horario",
    module: "Rangos de Horarios",
  },
  {
    name: "schedulerange:update",
    description: "Actualizar rango de horario",
    module: "Rangos de Horarios",
  },
  {
    name: "schedulerange:delete",
    description: "Eliminar rango de horario",
    module: "Rangos de Horarios",
  },

  // Excepciones de Horarios (ScheduleException)
  {
    name: "scheduleexception:manage",
    description: "Gestión completa de excepciones de horarios",
    module: "Excepciones de Horarios",
  },
  {
    name: "scheduleexception:read",
    description: "Ver excepciones de horarios",
    module: "Excepciones de Horarios",
  },
  {
    name: "scheduleexception:self",
    description: "Ver su propia excepción de horario",
    module: "Excepciones de Horarios",
  },
  {
    name: "scheduleexception:update",
    description: "Actualizar excepción de horario",
    module: "Excepciones de Horarios",
  },
  {
    name: "scheduleexception:delete",
    description: "Eliminar excepción de horario",
    module: "Excepciones de Horarios",
  },

  // Cambios de Horarios (ScheduleChange)
  {
    name: "schedulechange:manage",
    description: "Gestión completa de cambios de horarios",
    module: "Cambios de Horarios",
  },
  {
    name: "schedulechange:read",
    description: "Ver cambios de horarios",
    module: "Cambios de Horarios",
  },
  {
    name: "schedulechange:self",
    description: "Ver su propio cambio de horario",
    module: "Cambios de Horarios",
  },
  {
    name: "schedulechange:update",
    description: "Actualizar cambio de horario",
    module: "Cambios de Horarios",
  },
  {
    name: "schedulechange:delete",
    description: "Eliminar cambio de horario",
    module: "Cambios de Horarios",
  },

  // Asistencia
  {
    name: "attendance:manage",
    description: "Gestión completa de asistencias",
    module: "Asistencia",
  },
  {
    name: "attendance:self",
    description: "Ver su propia asistencia",
    module: "Asistencia",
  },
  {
    name: "attendance:read",
    description: "Ver asistencias",
    module: "Asistencia",
  },
  {
    name: "attendance:update",
    description: "Actualizar asistencia",
    module: "Asistencia",
  },

  // Documentos
  {
    name: "document:manage",
    description: "Gestión completa de documentos",
    module: "Documentos",
  },
  {
    name: "document:read",
    description: "Ver documentos",
    module: "Documentos",
  },
  {
    name: "document:self",
    description: "Ver su propio documento",
    module: "Documentos",
  },
  {
    name: "document:update",
    description: "Actualizar documento",
    module: "Documentos",
  },
  {
    name: "document:delete",
    description: "Eliminar documento",
    module: "Documentos",
  },

  // Reportes
  {
    name: "report:generate",
    description: "Generar reportes",
    module: "Reportes",
  },
  { name: "report:read", description: "Ver reportes", module: "Reportes" },

  // Configuración Global
  {
    name: "global:settings",
    description: "Acceder a configuración global",
    module: "Configuración",
  },

  // Dashboard
  {
    name: "dashboard:read",
    description: "Ver dashboard",
    module: "Dashboard",
  },
];

export const ROLE_PERMISSIONS = {
  SUPERADMIN: permissions.map((p) => p.name), // Todos los permisos
  ADMIN: [
    "user:read",
    "user:update",
    "user:profile",
    "user:manage",
    "user:delete",
    "role:self",
    "permission:self",
    "company:read",
    "company:update",
    "company:self",
    "dashboard:read",
    "document:read",
    "document:manage",
    "document:update",
    "document:delete",
    "document:self",
    "position:read",
    "position:manage",
    "position:update",
    "position:delete",
    "position:self",
    "workplace:read",
    "workplace:manage",
    "workplace:update",
    "workplace:delete",
    "workplace:self",
    "menu:read",
    "schedule:read",
    "schedule:manage",
    "schedule:update",
    "schedule:self",
    "attendance:read",
    "attendance:manage",
    "attendance:update",
    "attendance:self",
    "report:read",
    "report:manage",
    "report:update",
    "profile:read",
    "profile:manage",
    "profile:update",
    "profile:self",
  ],
  USER: [
    // Perfil de Usuario
    "user:profile",

    // Empresa (solo ver su propia empresa)
    "company:self",

    // Menu
    "menu:self", // Solo sus propios menús

    // Roles(solo ver su propio rol)
    "role:self",

    // Horarios(solo ver su propio horario)
    "schedule:self",

    // Asistencia (solo su propia asistencia)
    "attendance:self",
    "attendance:update",
    "attendance:manage",

    // Dashboard
    "dashboard:read",
  ],
};
