-- CreateIndex
CREATE INDEX `ScheduleException_userId_date_idx` ON `ScheduleException`(`userId`, `date`);

-- CreateIndex
CREATE INDEX `ScheduleException_scheduleId_date_idx` ON `ScheduleException`(`scheduleId`, `date`);

-- CreateIndex
CREATE INDEX `ScheduleException_workplaceId_date_idx` ON `ScheduleException`(`workplaceId`, `date`);

-- CreateIndex
CREATE INDEX `ScheduleException_positionId_date_idx` ON `ScheduleException`(`positionId`, `date`);

-- CreateIndex
CREATE INDEX `ScheduleException_companyId_date_idx` ON `ScheduleException`(`companyId`, `date`);

-- AddForeignKey
ALTER TABLE `ScheduleException` ADD CONSTRAINT `ScheduleException_workplaceId_fkey` FOREIGN KEY (`workplaceId`) REFERENCES `Workplace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleException` ADD CONSTRAINT `ScheduleException_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `Position`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleException` ADD CONSTRAINT `ScheduleException_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleException` ADD CONSTRAINT `ScheduleException_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
