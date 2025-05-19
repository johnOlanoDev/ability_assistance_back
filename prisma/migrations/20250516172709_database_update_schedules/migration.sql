-- CreateTable
CREATE TABLE `Company` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `ruc` VARCHAR(11) NOT NULL,
    `companyName` VARCHAR(50) NOT NULL,
    `logo` VARCHAR(150) NULL,
    `colorPrimary` VARCHAR(7) NULL,
    `colorSecondary` VARCHAR(7) NULL,
    `colorSidebar` VARCHAR(7) NULL,
    `fontPrincipal` VARCHAR(50) NULL,
    `fontSecondary` VARCHAR(50) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Company_name_key`(`name`),
    UNIQUE INDEX `Company_ruc_key`(`ruc`),
    UNIQUE INDEX `Company_companyName_key`(`companyName`),
    INDEX `Company_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `description` VARCHAR(50) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NULL,

    INDEX `Role_companyId_name_idx`(`companyId`, `name`),
    UNIQUE INDEX `Role_name_companyId_key`(`name`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Schedule` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `workplaceId` VARCHAR(191) NULL,
    `positionId` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Schedule_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduleRange` (
    `id` VARCHAR(191) NOT NULL,
    `scheduleId` VARCHAR(191) NOT NULL,
    `startDay` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    `endDay` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    `checkIn` VARCHAR(191) NOT NULL,
    `checkOut` VARCHAR(191) NOT NULL,
    `isNightShift` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `ScheduleRange_scheduleId_startDay_endDay_checkIn_checkOut_key`(`scheduleId`, `startDay`, `endDay`, `checkIn`, `checkOut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduleChange` (
    `id` VARCHAR(191) NOT NULL,
    `scheduleId` VARCHAR(191) NULL,
    `workplaceId` VARCHAR(191) NULL,
    `positionId` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NULL,
    `changeDate` DATE NOT NULL,
    `newCheckIn` VARCHAR(191) NOT NULL,
    `newCheckOut` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(200) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `ScheduleChange_scheduleId_changeDate_key`(`scheduleId`, `changeDate`),
    UNIQUE INDEX `ScheduleChange_workplaceId_changeDate_key`(`workplaceId`, `changeDate`),
    UNIQUE INDEX `ScheduleChange_positionId_changeDate_key`(`positionId`, `changeDate`),
    UNIQUE INDEX `ScheduleChange_companyId_changeDate_key`(`companyId`, `changeDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduleException` (
    `id` VARCHAR(191) NOT NULL,
    `scheduleId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `workplaceId` VARCHAR(191) NULL,
    `positionId` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NULL,
    `date` DATE NOT NULL,
    `checkIn` VARCHAR(191) NULL,
    `checkOut` VARCHAR(191) NULL,
    `isDayOff` BOOLEAN NOT NULL DEFAULT false,
    `reason` VARCHAR(200) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `ScheduleException_userId_date_idx`(`userId`, `date`),
    INDEX `ScheduleException_scheduleId_date_idx`(`scheduleId`, `date`),
    INDEX `ScheduleException_workplaceId_date_idx`(`workplaceId`, `date`),
    INDEX `ScheduleException_positionId_date_idx`(`positionId`, `date`),
    INDEX `ScheduleException_companyId_date_idx`(`companyId`, `date`),
    UNIQUE INDEX `ScheduleException_scheduleId_date_key`(`scheduleId`, `date`),
    UNIQUE INDEX `ScheduleException_userId_date_key`(`userId`, `date`),
    UNIQUE INDEX `ScheduleException_workplaceId_date_key`(`workplaceId`, `date`),
    UNIQUE INDEX `ScheduleException_positionId_date_key`(`positionId`, `date`),
    UNIQUE INDEX `ScheduleException_companyId_date_key`(`companyId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentType` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NOT NULL,

    INDEX `DocumentType_id_name_createdAt_idx`(`id`, `name`, `createdAt` ASC),
    UNIQUE INDEX `DocumentType_name_companyId_key`(`name`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Position` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `description` VARCHAR(50) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `workplaceId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,

    INDEX `Position_companyId_workplaceId_name_idx`(`companyId`, `workplaceId`, `name`),
    UNIQUE INDEX `Position_name_workplaceId_companyId_key`(`name`, `workplaceId`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Workplace` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NOT NULL,

    INDEX `Workplace_companyId_idx`(`companyId`),
    UNIQUE INDEX `Workplace_name_companyId_key`(`name`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `description` VARCHAR(50) NOT NULL,
    `module` VARCHAR(40) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NULL,

    INDEX `Permission_companyId_name_createdAt_idx`(`companyId`, `name`, `createdAt` DESC),
    UNIQUE INDEX `Permission_companyId_name_key`(`companyId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Menu` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Menu_path_key`(`path`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoleMenu` (
    `roleId` VARCHAR(191) NOT NULL,
    `menuId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `RoleMenu_roleId_menuId_key`(`roleId`, `menuId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DownloadFormat` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `DownloadFormat_name_key`(`name`),
    INDEX `DownloadFormat_name_createdAt_idx`(`name`, `createdAt` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PermissionType` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `duration` INTEGER NOT NULL,
    `description` VARCHAR(50) NOT NULL,
    `durationUnit` ENUM('HOURS', 'DAYS') NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NULL,
    `typeAssistanceEffect` ENUM('PRESENT', 'ABSENT', 'LATE', 'EARLY_EXIT', 'PERMISSION_HOURS', 'VACATION', 'MEDICAL_LEAVE', 'JUSTIFIED_ABSENCE', 'INJUSTIFIED_ABSENCE', 'OTHER') NULL DEFAULT 'PRESENT',

    INDEX `PermissionType_name_companyId_createdAt_idx`(`name`, `companyId`, `createdAt` DESC),
    UNIQUE INDEX `PermissionType_companyId_name_key`(`companyId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `lastName` VARCHAR(30) NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `password` VARCHAR(60) NOT NULL,
    `numberDocument` VARCHAR(20) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL DEFAULT 'MALE',
    `salary` DECIMAL(10, 2) NULL,
    `phoneNumber` VARCHAR(15) NULL,
    `birthDate` DATE NOT NULL,
    `refreshToken` TEXT NULL,
    `lastLogin` DATETIME(3) NULL,
    `avatarPublicId` VARCHAR(150) NULL,
    `avatarUrl` VARCHAR(150) NULL,
    `code` VARCHAR(10) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NULL,
    `roleId` VARCHAR(191) NULL,
    `workplaceId` VARCHAR(191) NULL,
    `positionId` VARCHAR(191) NULL,
    `documentTypeId` VARCHAR(191) NULL,

    INDEX `User_companyId_email_idx`(`companyId`, `email`),
    INDEX `User_companyId_numberDocument_idx`(`companyId`, `numberDocument`),
    INDEX `User_roleId_idx`(`roleId`),
    INDEX `User_workplaceId_idx`(`workplaceId`),
    INDEX `User_positionId_idx`(`positionId`),
    INDEX `User_documentTypeId_idx`(`documentTypeId`),
    INDEX `User_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `unique_company_email`(`companyId`, `email`),
    UNIQUE INDEX `unique_company_document`(`companyId`, `numberDocument`),
    UNIQUE INDEX `unique_company_code`(`companyId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `permissionId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `unique_role_permission`(`roleId`, `permissionId`),
    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportAttendance` (
    `id` CHAR(36) NOT NULL,
    `scheduleId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `checkIn` TIME(6) NOT NULL,
    `checkOut` TIME(6) NULL,
    `locationLatitude` DECIMAL(9, 6) NULL,
    `locationLongitude` DECIMAL(9, 6) NULL,
    `locationAddress` VARCHAR(200) NULL,
    `hoursWorked` DECIMAL(5, 2) NULL,
    `overtimeHours` DECIMAL(5, 2) NULL,
    `description` VARCHAR(200) NULL,
    `notes` VARCHAR(200) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `typePermissionId` VARCHAR(191) NULL,
    `typeAssistanceId` ENUM('PRESENT', 'ABSENT', 'LATE', 'EARLY_EXIT', 'PERMISSION_HOURS', 'VACATION', 'MEDICAL_LEAVE', 'JUSTIFIED_ABSENCE', 'INJUSTIFIED_ABSENCE', 'OTHER') NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NULL,

    INDEX `ReportAttendance_date_userId_idx`(`date`, `userId`),
    UNIQUE INDEX `ReportAttendance_companyId_scheduleId_date_userId_key`(`companyId`, `scheduleId`, `date`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyAttendanceSummary` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `totalUsers` INTEGER NOT NULL,
    `onTimeCount` INTEGER NOT NULL,
    `lateCount` INTEGER NOT NULL,
    `absentCount` INTEGER NOT NULL,
    `earlyDepartureCount` INTEGER NOT NULL,

    UNIQUE INDEX `DailyAttendanceSummary_companyId_date_key`(`companyId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_MenuToPermission` (
    `A` VARCHAR(191) NOT NULL,
    `B` CHAR(36) NOT NULL,

    UNIQUE INDEX `_MenuToPermission_AB_unique`(`A`, `B`),
    INDEX `_MenuToPermission_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Role` ADD CONSTRAINT `Role_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_workplaceId_fkey` FOREIGN KEY (`workplaceId`) REFERENCES `Workplace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `Position`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleRange` ADD CONSTRAINT `ScheduleRange_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleChange` ADD CONSTRAINT `ScheduleChange_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleException` ADD CONSTRAINT `ScheduleException_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleException` ADD CONSTRAINT `ScheduleException_workplaceId_fkey` FOREIGN KEY (`workplaceId`) REFERENCES `Workplace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleException` ADD CONSTRAINT `ScheduleException_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `Position`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleException` ADD CONSTRAINT `ScheduleException_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleException` ADD CONSTRAINT `ScheduleException_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentType` ADD CONSTRAINT `DocumentType_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Position` ADD CONSTRAINT `Position_workplaceId_fkey` FOREIGN KEY (`workplaceId`) REFERENCES `Workplace`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Position` ADD CONSTRAINT `Position_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Workplace` ADD CONSTRAINT `Workplace_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Permission` ADD CONSTRAINT `Permission_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoleMenu` ADD CONSTRAINT `RoleMenu_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoleMenu` ADD CONSTRAINT `RoleMenu_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `Menu`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PermissionType` ADD CONSTRAINT `PermissionType_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_workplaceId_fkey` FOREIGN KEY (`workplaceId`) REFERENCES `Workplace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `Position`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_documentTypeId_fkey` FOREIGN KEY (`documentTypeId`) REFERENCES `DocumentType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportAttendance` ADD CONSTRAINT `ReportAttendance_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportAttendance` ADD CONSTRAINT `ReportAttendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportAttendance` ADD CONSTRAINT `ReportAttendance_typePermissionId_fkey` FOREIGN KEY (`typePermissionId`) REFERENCES `PermissionType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportAttendance` ADD CONSTRAINT `ReportAttendance_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_MenuToPermission` ADD CONSTRAINT `_MenuToPermission_A_fkey` FOREIGN KEY (`A`) REFERENCES `Menu`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_MenuToPermission` ADD CONSTRAINT `_MenuToPermission_B_fkey` FOREIGN KEY (`B`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
