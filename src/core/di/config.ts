import "reflect-metadata";
import { PrismaClient } from "@/prisma/prisma";
import { RoleRepository } from "../../modules/roles/repository/role.repository";
import { RolesService } from "../../modules/roles/services/roles.service";
import { RoleController } from "../../modules/roles/controllers/role.controller";
import { DependencyContainer } from "./container";
import { CompanyRepository } from "../../modules/companies/repository/company.repository";
import { CompanyService } from "../../modules/companies/services/company.service";
import { CompanyController } from "../../modules/companies/controllers/company.controller";
import { WorkplaceRepository } from "../../modules/workplace/repository/workplace.repository";
import { WorkplaceService } from "../../modules/workplace/services/workplace.service";
import { WorkplaceController } from "../../modules/workplace/controllers/workplace.controller";
import { WorkplaceValidator } from "../../modules/workplace/validations/WorkplaceValidator";
import { PositionService } from "../../modules/position/services/position.service";
import { PositionController } from "../../modules/position/controllers/position.controller";
import { PositionRepository } from "../../modules/position/repository/position.repository";
import { CompanyValidator } from "../../modules/companies/validations/CompanyValidator";
import { DocumentTypeValidator } from "../../modules/documentType/validations/DocumentTypeValidator.validator";
import { DocumentTypeRepository } from "../../modules/documentType/repository/documentType.repository";
import { RoleMenuRepository } from "../../modules/relationships/roleMenu/repository/roleMenu.repository";
import { RoleMenuService } from "../../modules/relationships/roleMenu/service/roleMenu.service";
import { RoleMenuController } from "../../modules/relationships/roleMenu/controller/roleMenu.controller";
import { DocumentTypeService } from "../../modules/documentType/services/documentType.service";
import { DocumentTypeController } from "../../modules/documentType/controller/documentType.controller";
import { UserRepository } from "../../modules/users/repository/user.repository";
import { UserValidator } from "../../modules/users/validations/UserValidator";
import { UserService } from "../../modules/users/services/user.service";
import { UserController } from "../../modules/users/controllers/user.controller";
import { PasswordHasher } from "../../modules/users/services/PasswordHasher";
import { PasswordVerifier } from "../../modules/users/services/PasswordVerifier";
import { RoleValidator } from "../../modules/roles/validation/RoleValidator";
import { AuthController } from "../../modules/auth/controllers/auth.controller";
import { AuthService } from "../../modules/auth/services/auth.service";
import { PermissionRepository } from "../../modules/permissions/repository/permission.repository";
import { PermissionService } from "../../modules/permissions/services/permission.service";
import { PermissionController } from "../../modules/permissions/controllers/permission.controller";
import { InitializationService } from "../../modules/initial/services/initialization.service";
import { RolesPermissionsRepository } from "../../modules/relationships/rolesPermissions/repository/rolesPermissions.repository";
import { RolePermissionService } from "../../modules/relationships/rolesPermissions/services/rolesPermissions.service";
import { RolePermissionController } from "../../modules/relationships/rolesPermissions/controller/rolePermissions.controller";
import { PermissionUtils } from "../../utils/helper/permissions.helper";
import { UserUtils } from "../../utils/helper/users.helper";
import { MenuRepository } from "../../modules/menu/repository/menu.repository";
import { MenuService } from "../../modules/menu/services/menu.service";
import { MenuController } from "../../modules/menu/controller/menu.controller";
import { CloudinaryService } from "../../modules/cloudinary/services/cloudinary.service";
import { ScheduleRepository } from "../../modules/schedule/Schedule/repository/schedule.repository";
import { ScheduleRangeRepository } from "../../modules/schedule/scheduleRange/repository/scheduleRange.repository";
import { ScheduleService } from "../../modules/schedule/Schedule/service/schedule.service";
import { ScheduleController } from "../../modules/schedule/Schedule/controller/schedule.controller";
import { ScheduleValidator } from "../../modules/schedule/Schedule/validator/schedule.validator";
import { AttendanceRepository } from "../../modules/attendance/repository/attendance.repository";
import { AttendanceService } from "../../modules/attendance/service/attendance.service";
import { AttendanceController } from "../../modules/attendance/controller/attendance.controller";
import { DashboardRepository } from "../../modules/dashboard/repository/dashboard.repository";
import { DashboardService } from "../../modules/dashboard/services/dashboard.service";
import { DashboardController } from "../../modules/dashboard/controller/dashboard.controller";
import { ReportAttendanceController } from "../../modules/attendance/controller/report.controller";
import { ReportAttendanceService } from "../../modules/attendance/service/report.service";
import { ReportAttendanceRepository } from "../../modules/attendance/repository/report.repository";
import { ScheduleChangeRepository } from "@/modules/schedule/scheduleChange/repository/scheduleChange.repository";
import { ScheduleChangeService } from "@/modules/schedule/scheduleChange/services/scheduleChange.service";
import { ScheduleChangeController } from "@/modules/schedule/scheduleChange/controller/scheduleChange.controller";
import { PermissionTypeRepository } from "@/modules/permissionsType/repository/permissionType.repository";
import { PermissionTypeService } from "@/modules/permissionsType/services/permissionType.service";
import { PermissionTypeController } from "@/modules/permissionsType/controllers/permissionType.controller";
import { ScheduleExceptionController } from "@/modules/schedule/scheduleException/controller/scheduleException.controller";
import { ScheduleExceptionService } from "@/modules/schedule/scheduleException/services/scheduleException.service";
import { ScheduleExceptionRepository } from "@/modules/schedule/scheduleException/repository/scheduleException.repository";

export const configureDependencies = () => {
  // Register Prisma
  const prisma = new PrismaClient();
  DependencyContainer.registerInstance(PrismaClient, prisma);

  // Register Repository
  DependencyContainer.registerSingleton<CompanyRepository>(
    "CompanyRepository",
    CompanyRepository
  );
  DependencyContainer.registerSingleton<WorkplaceRepository>(
    "WorkplaceRepository",
    WorkplaceRepository
  );
  DependencyContainer.registerSingleton<PositionRepository>(
    "PositionRepository",
    PositionRepository
  );
  DependencyContainer.registerSingleton<RoleRepository>(
    "RoleRepository",
    RoleRepository
  );
  DependencyContainer.registerSingleton<DocumentTypeRepository>(
    "DocumentTypeRepository",
    DocumentTypeRepository
  );
  DependencyContainer.registerSingleton<PermissionRepository>(
    "PermissionRepository",
    PermissionRepository
  );
  DependencyContainer.registerSingleton<UserRepository>(
    "UserRepository",
    UserRepository
  );
  DependencyContainer.registerSingleton<RolesPermissionsRepository>(
    "RolesPermissionsRepository",
    RolesPermissionsRepository
  );
  DependencyContainer.registerSingleton<MenuRepository>(
    "MenuRepository",
    MenuRepository
  );
  DependencyContainer.registerSingleton<RoleMenuRepository>(
    "RoleMenuRepository",
    RoleMenuRepository
  );
  DependencyContainer.registerSingleton<ScheduleRepository>(
    "ScheduleRepository",
    ScheduleRepository
  );
  DependencyContainer.registerSingleton<ScheduleRangeRepository>(
    "ScheduleRangeRepository",
    ScheduleRangeRepository
  );
  DependencyContainer.registerSingleton<AttendanceRepository>(
    "AttendanceRepository",
    AttendanceRepository
  );
  DependencyContainer.registerSingleton<DashboardRepository>(
    "DashboardRepository",
    DashboardRepository
  );
  DependencyContainer.registerSingleton<ReportAttendanceRepository>(
    "ReportAttendanceRepository",
    ReportAttendanceRepository
  );
  DependencyContainer.registerSingleton<ScheduleChangeRepository>(
    "ScheduleChangeRepository",
    ScheduleChangeRepository
  );
  DependencyContainer.registerSingleton<PermissionTypeRepository>(
    "PermissionTypeRepository",
    PermissionTypeRepository
  );
  DependencyContainer.registerSingleton<ScheduleExceptionRepository>(
    "ScheduleExceptionRepository",
    ScheduleExceptionRepository
  );

  // Register Validator (depends on Service)
  DependencyContainer.registerSingleton<CompanyValidator>(
    "CompanyValidator",
    CompanyValidator
  );
  DependencyContainer.registerSingleton<WorkplaceValidator>(
    "WorkplaceValidator",
    WorkplaceValidator
  );
  DependencyContainer.registerSingleton<DocumentTypeValidator>(
    "DocumentTypeValidator",
    DocumentTypeValidator
  );
  DependencyContainer.registerSingleton<RoleValidator>(
    "RoleValidator",
    RoleValidator
  );
  DependencyContainer.registerSingleton<UserValidator>(
    "UserValidator",
    UserValidator
  );
  DependencyContainer.registerSingleton<ScheduleValidator>(
    "ScheduleValidator",
    ScheduleValidator
  );

  DependencyContainer.registerSingleton<PermissionUtils>(
    "PermissionUtils",
    PermissionUtils
  );
  DependencyContainer.registerSingleton<UserUtils>("UserUtils", UserUtils);

  // Register Service (depends on Repository)
  DependencyContainer.registerSingleton<CompanyService>(
    "CompanyService",
    CompanyService
  );
  DependencyContainer.registerSingleton<RolesService>(
    "RolesService",
    RolesService
  );
  DependencyContainer.registerSingleton<WorkplaceService>(
    "WorkplaceService",
    WorkplaceService
  );
  DependencyContainer.registerSingleton<PositionService>(
    "PositionService",
    PositionService
  );
  DependencyContainer.registerSingleton<DocumentTypeService>(
    "DocumentTypeService",
    DocumentTypeService
  );
  DependencyContainer.registerSingleton<PermissionService>(
    "PermissionService",
    PermissionService
  );
  DependencyContainer.registerSingleton<UserService>(
    "UserService",
    UserService
  );
  DependencyContainer.registerSingleton<PasswordHasher>(
    "PasswordHasher",
    PasswordHasher
  );
  DependencyContainer.registerSingleton<PasswordVerifier>(
    "PasswordVerifier",
    PasswordVerifier
  );
  DependencyContainer.registerSingleton<AuthService>(
    "AuthService",
    AuthService
  );
  DependencyContainer.registerSingleton<RolePermissionService>(
    "RolePermissionService",
    RolePermissionService
  );
  DependencyContainer.registerSingleton<MenuService>(
    "MenuService",
    MenuService
  );
  DependencyContainer.registerSingleton<RoleMenuService>(
    "RoleMenuService",
    RoleMenuService
  );
  DependencyContainer.registerSingleton<InitializationService>(
    "InitializationService",
    InitializationService
  );
  DependencyContainer.registerSingleton<CloudinaryService>(
    "CloudinaryService",
    CloudinaryService
  );
  DependencyContainer.registerSingleton<ScheduleService>(
    "ScheduleService",
    ScheduleService
  );
  DependencyContainer.registerSingleton<AttendanceService>(
    "AttendanceService",
    AttendanceService
  );
  DependencyContainer.registerSingleton<DashboardService>(
    "DashboardService",
    DashboardService
  );

  // Register Report
  DependencyContainer.registerSingleton<ReportAttendanceService>(
    "ReportAttendanceService",
    ReportAttendanceService
  );

  DependencyContainer.registerSingleton<ScheduleChangeService>(
    "ScheduleChangeService",
    ScheduleChangeService
  );

  DependencyContainer.registerSingleton<PermissionTypeService>(
    "PermissionTypeService",
    PermissionTypeService
  );
  DependencyContainer.registerSingleton<ScheduleExceptionService>(
    "ScheduleExceptionService",
    ScheduleExceptionService
  );

  // Register Controller (depends on Service)
  DependencyContainer.registerSingleton<CompanyController>(
    "CompanyController",
    CompanyController
  );
  DependencyContainer.registerSingleton<RoleController>(
    "RoleController",
    RoleController
  );
  DependencyContainer.registerSingleton<WorkplaceController>(
    "WorkplaceController",
    WorkplaceController
  );
  DependencyContainer.registerSingleton<PositionController>(
    "PositionController",
    PositionController
  );
  DependencyContainer.registerSingleton<DocumentTypeController>(
    "DocumentTypeController",
    DocumentTypeController
  );
  DependencyContainer.registerSingleton<PermissionController>(
    "PermissionController",
    PermissionController
  );
  DependencyContainer.registerSingleton<UserController>(
    "UserController",
    UserController
  );
  DependencyContainer.registerSingleton<AuthController>(
    "AuthController",
    AuthController
  );
  DependencyContainer.registerSingleton<MenuController>(
    "MenuController",
    MenuController
  );
  DependencyContainer.registerSingleton<RoleMenuController>(
    "RoleMenuController",
    RoleMenuController
  );
  DependencyContainer.registerSingleton<RolePermissionController>(
    "RolePermissionController",
    RolePermissionController
  );
  DependencyContainer.registerSingleton<ScheduleController>(
    "ScheduleController",
    ScheduleController
  );
  DependencyContainer.registerSingleton<AttendanceController>(
    "AttendanceController",
    AttendanceController
  );
  DependencyContainer.registerSingleton<DashboardController>(
    "DashboardController",
    DashboardController
  );
  DependencyContainer.registerSingleton<ReportAttendanceController>(
    "ReportAttendanceController",
    ReportAttendanceController
  );
  DependencyContainer.registerSingleton<ScheduleChangeController>(
    "ScheduleChangeController",
    ScheduleChangeController
  );
  DependencyContainer.registerSingleton<PermissionTypeController>(
    "PermissionTypeController",
    PermissionTypeController
  );
  DependencyContainer.registerSingleton<ScheduleExceptionController>(
    "ScheduleExceptionController",
    ScheduleExceptionController
  );
};
