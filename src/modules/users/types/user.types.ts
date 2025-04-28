import { CompanyResponse } from "@/modules/companies/types/company.types";
import { DocumentTypeResponse } from "@/modules/documentType/types/documentType.types";
import { PositionResponse } from "@/modules/position/types/position.types";
import { WorkPlacesResponse } from "@/modules/workplace/types/workplace.types";
import { Prisma, Gender } from "@prisma/client";
import { RoleResponse } from "@/modules/roles/types/roles.types";

export interface UserResponse {
  id: string;
  name: string;
  lastName: string;
  email: string;
  numberDocument: string;
  gender: string;
  salary?: Prisma.Decimal | null;
  birthDate: Date;
  avatarPublicId?: string | null;
  avatarUrl?: string | null;
  workplaceId?: string | null;
  positionId?: string | null;
  code: string;
  status: boolean;
  createdAt: Date;
  phoneNumber?: string | null;
  updatedAt: Date;
  deletedAt: Date | null;
  companyId?: string | null;
  roleId?: string | null;
  role?: RoleResponse | null;
  company?: CompanyResponse | null;
  workplace?: WorkPlacesResponse | null;
  position?: PositionResponse | null;
  documentType?: DocumentTypeResponse | null;
}

export type CreateUserDTO = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  password: string;
  numberDocument: string;
  gender: Gender;
  salary?: Prisma.Decimal | null;
  birthDate: Date;
  phoneNumber?: string | null;
  avatarPublicId?: string | null;
  avatarUrl?: string | null;
  lastLogin?: Date | null;
  code: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  companyId?: string | null;
  workplaceId?: string | null;
  positionId?: string | null;
  roleId?: string | null;
  documentTypeId?: string | null;
};

export type UpdateUserDTO = Partial<
  Omit<
    CreateUserDTO,
    "email, status, companyId, workplaceId, positionId, documentTypeId, numberDocument, roleId, code"
  > & {
    avatarFile?: Buffer;
  }
>;

// Solo campos básicos (perfil)
// user.dto.ts
export type UpdateProfileDTO = Partial<
  Pick<CreateUserDTO, "name" | "lastName" | "salary" | "phoneNumber" | "birthDate"> & {
    avatarUrl?: string;       // URL de la imagen
    avatarPublicId?: string;  // Public ID de Cloudinary
  }
>;