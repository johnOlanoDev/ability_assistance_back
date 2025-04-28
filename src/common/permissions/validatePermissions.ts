export const validatePermissions = (
  userRoles: string[],
  userCompanyId: string | undefined,
  targetCompanyId?: string
): void => {
  const isSuperAdmin = userRoles?.map((role) => role.toLowerCase()).includes("superadmin");

  if (!isSuperAdmin && targetCompanyId && targetCompanyId !== userCompanyId) {
    throw new Error("No tienes permisos para realizar esta acción");
  }
};
