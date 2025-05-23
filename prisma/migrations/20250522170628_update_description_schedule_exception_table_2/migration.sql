/*
  Warnings:

  - You are about to alter the column `exceptionType` on the `ScheduleException` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `ScheduleException` MODIFY `exceptionType` ENUM('INDIVIDUAL', 'WORKPLACE', 'POSITION', 'COMPANY', 'HOLIDAY') NOT NULL;
