// En permissionsUtils.ts
import { getRoleById } from "@/actions";

export const isSuperAdminUtils = async (
  roleId: string | undefined
): Promise<boolean> => {
  if (!roleId) return false;
  try {
    const { data } = await getRoleById(roleId);
    return data?.name === "Superadmin" || data?.name === "superadmin";
  } catch (error) { 
    console.error("Error al verificar si el usuario es superadmin:", error);
    return false;
  }
};


export const isAdminUtils = async (
  roleId: string | undefined
): Promise<boolean> => {
  if (!roleId) return false;
  try {
    const { data } = await getRoleById(roleId);
    return data?.name === "Administrador" || data?.name === "administrador";
  } catch (error) {
    console.error("Error al verificar si el usuario es admin:", error);
    return false;
  }
};

