import { Decimal } from "@prisma/client/runtime/library";
import { CompanyResponse } from "@/modules/companies/types/company.types";
import { ScheduleResponse } from "@/modules/schedule/Schedule/types/schedule.types";
import { UserResponse } from "@/modules/users/types/user.types";
import { PermissionTypeResponse } from "@/modules/permissionsType/types/permissionTypes.types";

export interface ReportAttendanceResponse {
  id?: string;
  scheduleId: string;
  schedule?: ScheduleResponse | null;
  companyId?: string | null;
  company?: CompanyResponse | null;
  date?: string;

  // Fecha y hora de entrada
  checkInDate?: string;
  checkIn?: string;

  // Fecha y hora de salida
  checkOutDate?: string;
  checkOut?: string;

  // Latitud y longitud
  locationLatitude?: Decimal | null;
  locationLongitude?: Decimal | null;
  locationAddress?: string | null;
  hoursWorked?: Decimal | null;
  overtimeHours?: Decimal | null;
  notes?: string | null;
  description?: string | null;
  userId: string;
  user?: UserResponse | null;
  typePermissionId?: string;
  typePermission?: PermissionTypeResponse | null;
  typeAssistanceId?: AsistentType;
  status?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

// attendance.types.ts
export interface AttendanceHistory {
  id: string;
  userId: string;
  companyId?: string | null;
  checkInDate: string;
  checkIn: string;
  checkOutDate?: string | null;
  checkOut?: string | null;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  locationAddress?: string | null;
  typeAssistanceId: AsistentType;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  company?: CompanyResponse | null;
  user: UserResponse;
  schedule: ScheduleResponse;
}

export interface CreateReportAttendance {
  scheduleId?: string | null;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  locationLatitude?: Decimal | null;
  locationLongitude?: Decimal | null;
  locationAddress?: string | null;
  hoursWorked?: Decimal | null;
  overtimeHours?: Decimal | null;
  notes?: string | null;
  description?: string | null;
  userId: string;
  typePermissionId?: string;
  typeAssistanceId: AsistentType;
  status?: boolean;
  companyId?: string | null;
}

export type UpdateReportAttendance = Partial<CreateReportAttendance>;

export const AsistentType = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  EARLY_EXIT: "EARLY_EXIT",
  PERMISSION_HOURS: "PERMISSION_HOURS",
  VACATION: "VACATION",
  MEDICAL_LEAVE: "MEDICAL_LEAVE",
  JUSTIFIED_ABSENCE: "JUSTIFIED_ABSENCE",
  INJUSTIFIED_ABSENCE: "INJUSTIFIED_ABSENCE",
  OTHER: "OTHER",
} as const;

export type AsistentType = (typeof AsistentType)[keyof typeof AsistentType];
