import { container, inject, injectable } from "tsyringe";
import bcrypt from "bcryptjs";
import { AppError } from "@/middleware/errors/AppError";
import { logger } from "@/logger/logger";
import { allMenus, menuAssignments, permissions } from "../data/index";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
container.registerInstance(PrismaClient, prisma);
@injectable()
export class InitializationService {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async initialize() {
    console.log("Inicializando base de datos...");
    logger.info("Inicializando base de datos...");
    await this.prisma.$connect();
    console.log("Base de datos inicializada");
    logger.info("Base de datos inicializada");

    // Crear permisos
    await this.createPermissions();
    logger.info("Permisos por defecto creados");

    // Asegurarse de que los roles existan
    const { superAdminRole, adminRole, userRole } =
      await this.ensureRolesExist();

    if (!superAdminRole || !adminRole || !userRole) {
      throw new AppError("No se pudieron crear los roles necesarios", 404);
    }

    const DEFAULT_USERS = [
      {
        email: "superadmin@gmail.com",
        name: "Superadmin",
        document: "71212918",
        roleId: superAdminRole.id,
      },
    ];

    await Promise.all(
      DEFAULT_USERS.map((user) =>
        this.createUserIfNotExists(
          user.roleId,
          user.email,
          user.name,
          user.document
        )
      )
    );

    if (!permissions || permissions.length === 0)
      throw new AppError("No se encontraron permisos predeterminados", 404);

    await this.initializeRolePermissions();
    // Asignación
    await this.initializeMenusAndRoles();

    console.log(`Permisos de superadmin asignados ${superAdminRole.id}`);
    logger.info(`Permisos de superadmin asignados ${superAdminRole.id}`);

    console.log(`Permisos de administrador asignados ${adminRole.id}`);
    logger.info(`Permisos de administrador asignados ${adminRole.id}`);

    console.log(`Permisos de usuario asignados ${userRole.id}`);
    logger.info(`Permisos de usuario asignados ${userRole.id}`);

    console.log("Inicialización completada");
    logger.info("Inicialización completada");
  }

  async close() {
    console.log("Closing database...");
    await this.prisma.$disconnect();
    console.log("Database closed");
  }

  async createPermissions() {
    console.log("Creando permisos");
    // Contar cuántos permisos ya existen
    const permissionsCount = await this.prisma.permission.count();
    if (permissionsCount === 0) {
      // Crear todos los permisos definidos en InitializationService.permissions
      await this.prisma.permission.createMany({
        data: permissions,
      });
      console.log(`${permissions.length} permisos creados.`);
      logger.info(`${permissions.length} permisos creados.`);
    } else {
      console.log("Los permisos ya existen en la base de datos.");
      logger.info("Los permisos ya existen en la base de datos.");
    }
  }

  private async ensureRolesExist() {
    console.log("Verificando roles...");
    const rolesCount = await this.prisma.role.count();
    if (rolesCount === 0) {
      await this.prisma.role.createMany({
        data: [
          {
            name: "Superadmin",
            description: "Superadmin",
            companyId: null,
            status: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
          {
            name: "Administrador",
            description: "Administrador",
            companyId: null,
            status: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
          {
            name: "Usuario",
            description: "Usuario",
            companyId: null,
            status: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
      });
    }

    return {
      superAdminRole: await this.prisma.role.findFirst({
        where: { name: "Superadmin" },
      }),
      adminRole: await this.prisma.role.findFirst({
        where: { name: "Administrador" },
      }),
      userRole: await this.prisma.role.findFirst({
        where: { name: "Usuario" },
      }),
    };
  }

  private async createUserIfNotExists(
    roleId: string,
    email: string,
    name: string,
    numberDocument: string
  ) {
    const userCount = await this.prisma.user.count({ where: { email } });
    if (userCount > 0) {
      console.log(`El usuario ${email} ya existe en la base de datos.`);
      logger.info(`El usuario ${email} ya existe en la base de datos.`);
      return;
    }

    const hashedPassword = await this.hashedPassword();
    const code = await this.generateCodeUser();

    await this.prisma.user.create({
      data: {
        name,
        lastName: name,
        email,
        password: hashedPassword,
        numberDocument,
        gender: "MALE",
        salary: 20000, // Salario diferente para superadmin
        birthDate: new Date(),
        roleId,
        code,
        status: true,
        companyId: null,
        workplaceId: null,
        positionId: null,
        documentTypeId: null,
        createdAt: new Date(),
      },
    });

    console.log(`Usuario ${email} creado exitosamente.`);
    logger.info(`Usuario ${email} creado exitosamente.`);
  }

  private async hashedPassword(): Promise<string> {
    return bcrypt.hashSync("superadmin123456", 10);
  }

  private async generateCodeUser(): Promise<string> {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  async createSuperAdminPermissions(roleId: string) {
    try {
      // Obtener TODOS los permisos
      const allPermissions = await this.prisma.permission.findMany({
        select: { id: true, name: true },
      });

      // Eliminar permisos antiguos
      await this.prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      // Crear permisos para SuperAdmin (todos los permisos)
      const newRolePermissions = allPermissions.map((permission) => ({
        roleId,
        permissionId: permission.id,
        status: true,
      }));

      // Crear permisos individualmente para evitar problemas
      for (const rolePermission of newRolePermissions) {
        await this.prisma.rolePermission.create({
          data: rolePermission,
        });
      }
    } catch (error: any) {
      console.error("❌ Error al crear permisos de Superadmin:", error.message);
      throw error;
    }
  }

  async createAdminPermissions(roleId: string) {
    try {
      // Obtener todos los permisos disponibles
      const allPermissions = await this.prisma.permission.findMany({
        select: { id: true, name: true },
      });

      // Definir los permisos específicos del rol ADMIN
      const specificAdminPermissions = [
        "user:manage",
        "user:read",
        "user:update",
        "user:profile",
        "user:delete",
        "role:self",
        "permission:self",
        "company:update",
        "company:self",
        "dashboard:read",
        "document:read",
        "document:manage",
        "document:update",
        "document:delete",
        "document:self",
        "position:manage",
        "position:read",
        "position:self",
        "position:update",
        "position:delete",
        "workplace:manage",
        "workplace:read",
        "workplace:self",
        "workplace:update",
        "workplace:delete",
        "menu:read",
        "schedule:manage",
        "schedule:read",
        "schedule:self",
        "schedule:update",
        "schedule:delete",
        "attendance:manage",
        "attendance:self",
        "attendance:read",
        "attendance:update",
        "report:generate",
        "report:read",
      ];

      // Filtrar los permisos disponibles según los permisos específicos
      const adminPermissions = allPermissions.filter((p) =>
        specificAdminPermissions.includes(p.name.trim())
      );

      // Obtener los permisos actuales del rol
      const currentRolePermissions = await this.prisma.rolePermission.findMany({
        where: { roleId },
        select: { permissionId: true },
      });

      // Convertir los permisos actuales y nuevos a sets para facilitar la comparación
      const currentPermissionIds = new Set(
        currentRolePermissions.map((p) => p.permissionId)
      );
      const newPermissionIds = new Set(adminPermissions.map((p) => p.id));

      // Permisos a agregar
      const permissionsToAdd = adminPermissions.filter(
        (p) => !currentPermissionIds.has(p.id)
      );

      // Permisos a eliminar
      const permissionsToRemove = currentRolePermissions.filter(
        (p) => !newPermissionIds.has(p.permissionId)
      );

      // Agregar permisos que faltan
      if (permissionsToAdd.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: permissionsToAdd.map((p) => ({
            roleId,
            permissionId: p.id,
            status: true,
          })),
        });
        console.log(`Se agregaron ${permissionsToAdd.length} permisos.`);
      }

      // Eliminar permisos que sobran
      if (permissionsToRemove.length > 0) {
        const permissionIdsToRemove = permissionsToRemove.map(
          (p) => p.permissionId
        );
        await this.prisma.rolePermission.deleteMany({
          where: {
            roleId,
            permissionId: { in: permissionIdsToRemove },
          },
        });
        console.log(`Se eliminaron ${permissionsToRemove.length} permisos.`);
      }

      console.log("Asignación de permisos completada.");
    } catch (error: any) {
      console.error("Error al asignar permisos:", error.message);
      throw error;
    }
  }

  async createUserPermissions(roleId: string) {
    try {
      // Obtener todos los permisos disponibles
      const allPermissions = await this.prisma.permission.findMany({
        select: { id: true, name: true },
      });

      // Definir los permisos exactos para el usuario
      const specificUserPermissions = [
        "user:profile",
        "user:self",
        "company:self",
        "workplace:self",
        "position:self",
        "menu:self",
        "role:self",
        "schedule:self",
        "attendance:self",
        "attendance:update",
        "attendance:manage",
        "dashboard:read",
      ];

      // Normalizar los nombres de los permisos específicos
      const normalizedSpecificPermissions = specificUserPermissions.map(
        (perm) => perm.trim().toLowerCase()
      );

      // Filtrar permisos EXACTOS para Usuario
      const userPermissions = allPermissions.filter((p) =>
        normalizedSpecificPermissions.includes(p.name.trim().toLowerCase())
      );
      // Crear un arreglo de datos para inserción
      const permissionsToAssign = userPermissions.map((permission) => ({
        roleId,
        permissionId: permission.id,
        status: true,
      }));

      // Eliminar permisos antiguos del rol
      await this.prisma.rolePermission.deleteMany({ where: { roleId } });

      // Asignar los nuevos permisos usando createMany
      if (permissionsToAssign.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: permissionsToAssign,
        });
        console.log(
          `Se asignaron ${permissionsToAssign.length} permisos al rol Usuario.`
        );
      }

      console.log(userPermissions);

      console.log("Asignación de permisos completada.");
    } catch (error: any) {
      console.error("❌ Error al crear permisos de Usuario:", error.message);
      throw error;
    }
  }
  // Método para inicializar todos los roles
  async initializeRolePermissions() {
    // Obtener los roles
    const superAdminRole = await this.prisma.role.findFirst({
      where: { name: "Superadmin" },
    });
    const adminRole = await this.prisma.role.findFirst({
      where: { name: "Administrador" },
    });
    const userRole = await this.prisma.role.findFirst({
      where: { name: "Usuario" },
    });

    // Verificar que los roles existan
    if (!superAdminRole || !adminRole || !userRole) {
      throw new Error("Uno o más roles no encontrados");
    }

    // Asignar permisos a cada rol
    await this.createSuperAdminPermissions(superAdminRole.id);
    await this.createAdminPermissions(adminRole.id);
    await this.createUserPermissions(userRole.id);
  }

  // Función para crear menús y asignarlos
  async initializeMenusAndRoles() {
    // Primero crear todos los menús una sola vez
    for (const menu of allMenus) {
      await this.createSingleMenu(menu);
    }

    // Luego asignar los menús a cada rol
    for (const [roleName, menuPaths] of Object.entries(menuAssignments)) {
      console.log("Asignando menús al rol:", roleName);
      const role = await this.getRoleIdByName(roleName);

      if (!role) {
        console.log(`Rol ${roleName} no encontrado`);
        continue;
      }

      for (const path of menuPaths) {
        await this.assignMenuToRole(path, role.id);
      }
    }
  }

  async createSingleMenu(
    menu: {
      label: string;
      path: string;
      icon: string;
      requiredPermissions: string[];
    },
    companyId?: string
  ) {
    const { label, path, icon, requiredPermissions } = menu;

    // Verificar si ya existe
    const existingMenu = await this.prisma.menu.findUnique({
      where: { path },
    });

    const permissionObjects = await Promise.all(
      requiredPermissions.map(async (name) => {
        return await this.prisma.permission.findFirst({
          where: {
            name: name,
            companyId: companyId || null,
          },
        });
      })
    );

    const validPermissions = permissionObjects.filter((p) => p !== null);

    if (!existingMenu) {
      try {
        await this.prisma.menu.create({
          data: {
            label,
            path,
            icon,
            status: true,
            permissions: {
              connect: validPermissions.map((p) => ({ id: p.id })),
            },
          },
        });
        console.log(`Menú creado: ${label}`);
      } catch (error: any) {
        console.log(`Error al crear menú ${label}: ${error.message}`);
      }
    }
  }

  // Función auxiliar para asignar menú a rol
  async assignMenuToRole(menuPath: string, roleId: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { path: menuPath },
    });

    if (!menu) {
      console.log(`Menú con path ${menuPath} no encontrado`);
      return;
    }
    const roleMenuExists = await this.prisma.roleMenu.findFirst({
      where: { roleId, menuId: menu.id },
    });

    if (!roleMenuExists) {
      await this.prisma.roleMenu.create({
        data: { roleId, menuId: menu.id },
      });
      console.log(`Menú ${menuPath} asignado al rol ${roleId}`);
    }
  }

  async getRoleIdByName(roleName: string) {
    const role = await this.prisma.role.findFirst({
      where: {
        name: roleName.trim(), // Asegurar coincidencia exacta
      },
    });

    if (!role) {
      console.log(`❌ Rol "${roleName}" no encontrado`);
      return null;
    }

    return role;
  }

  async createMenus(
    menus: {
      label: string;
      path: string;
      icon: string;
      requiredPermissions: string[];
    }[],
    roleId: string,
    companyId?: string
  ) {
    try {
      console.log("Creando menús...");
      logger.info("Creando menús...");

      for (const menu of menus) {
        const { label, path, icon, requiredPermissions } = menu;

        // Verificar si el menú ya existe
        let existingMenu = await this.prisma.menu.findFirst({
          where: { path },
        });

        const permissionObjects = await Promise.all(
          requiredPermissions.map(async (name) => {
            return await this.prisma.permission.findFirst({
              where: {
                name: name,
                companyId: companyId || null,
              },
            });
          })
        );

        const validPermissions = permissionObjects.filter((p) => p !== null);

        if (!existingMenu) {
          // Crear el menú si no existe
          existingMenu = await this.prisma.menu.create({
            data: {
              label,
              path,
              icon,
              status: true,
              permissions: {
                connect: validPermissions.map((p) => ({ id: p.id })),
              },
            },
          });

          console.log(`Menú creado: ${label}`);
          logger.info(`Menú creado: ${label}`);
        } else {
          console.log(`El menú ya existe: ${label}`);
          logger.info(`El menú ya existe: ${label}`);
        }

        // Asociar el menú al rol correspondiente
        const roleMenuExists = await this.prisma.roleMenu.findFirst({
          where: {
            roleId,
            menuId: existingMenu.id,
          },
        });

        if (!roleMenuExists) {
          await this.prisma.roleMenu.create({
            data: {
              roleId,
              menuId: existingMenu.id,
            },
          });
        } else {
          console.log(`El menú ya está asignado al rol con ID: ${roleId}`);
          logger.info(`El menú ya está asignado al rol con ID: ${roleId}`);
        }
      }

      console.log("Menús creados y asignados correctamente.");
      logger.info("Menús creados y asignados correctamente.");
    } catch (error: any) {
      console.error("Error al crear menús:", error.message);
      logger.error("Error al crear menús:", error.message);
      throw new AppError(`Error al crear menús: ${error.message}`, 500);
    }
  }
}
