import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@/prisma/prisma";
import { JwtHelper } from "@/utils/helper/jwt.helper";
import { logger } from "@/logger/logger";

/**
 * Middleware que verifica si el usuario está autenticado.
 */

const prisma = new PrismaClient();

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization; // Obtener el header de autorización

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ message: "No autorizado, Token no proporcionado" });
      return;
    }

    const token = authHeader.split(" ")[1]; // Obtener el token

    const decoded = JwtHelper.verifyToken(token); // Verificar el token

    req.user = {
      userId: decoded.userId,
      roleId: decoded.roleId,
      companyId: decoded.companyId,
    }; // Agregar el usuario decodificado al objeto request

    next();
  } catch (error) {
    next(error);
  }
};

// Función auxiliar para obtener permisos de los roles
export const validateCompanyPermission = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userCompanyId = req.user?.companyId as string;
    const userRoleId = req.user?.roleId as string;
    
    if(!userRoleId) {
      res.status(403).json({message: "Tu rol no tiene permisos asignados"});
      return;
    }

    // Obtener permisos del usuario desde la base de datos
    const userPermissions = await getPermissionsForRoles(
      [userRoleId],
      userCompanyId
    );

    logger.info(`Permisos del usuario: ${userPermissions}`);
    logger.info(`Permisos requeridos: ${requiredPermissions}`);

    if(userPermissions.length === 0) {
      res.status(403).json({message: "Tu rol no tiene permisos asignados"});
      return;
    }

    // Verificar si el usuario tiene todos los permisos requeridos
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );

    logger.info(`Tiene permisos: ${hasPermission}`);

    if (!hasPermission) {
      res
        .status(403)
        .json({ message: "No tienes permisos para realizar esta acción" });
      return;
    }

    next();
  };
};

// Función auxiliar para obtener permisos de los roles dentro de una empresa
async function getPermissionsForRoles(
  roleIds: string[],
  companyId: string | undefined
): Promise<string[]> {
  const whereClause = companyId
    ? {
        roleId: { in: roleIds },
        OR: [
          { role: { companyId } }, // Permisos específicos de la empresa
          { role: { companyId: null } }, // Permisos globales
        ],
      }
    : { roleId: { in: roleIds }, status: true };

  const permissions = await prisma.rolePermission.findMany({
    where: whereClause,
    select: { permission: { select: { name: true, status: true } } },
  });
  logger.info(`Permisos obtenidos: ${permissions}`);
  return permissions.filter((p) => p.permission.status === true).map((p) => p.permission.name)
}
