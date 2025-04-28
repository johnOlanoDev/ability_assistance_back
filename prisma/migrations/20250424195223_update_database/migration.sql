/*
  Warnings:

  - Made the column `checkIn` on table `scheduleexception` required. This step will fail if there are existing NULL values in that column.
  - Made the column `checkOut` on table `scheduleexception` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `schedulechange` MODIFY `newCheckIn` VARCHAR(191) NOT NULL,
    MODIFY `newCheckOut` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `scheduleexception` MODIFY `checkIn` VARCHAR(191) NOT NULL,
    MODIFY `checkOut` VARCHAR(191) NOT NULL;
