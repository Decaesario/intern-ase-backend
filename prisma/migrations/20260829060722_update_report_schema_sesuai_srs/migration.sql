/*
  Warnings:

  - You are about to alter the column `status` on the `Report` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(2))`.
  - Added the required column `wasteTypes` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Report` ADD COLUMN `otherWasteType` VARCHAR(191) NULL,
    ADD COLUMN `rejectReason` VARCHAR(191) NULL,
    ADD COLUMN `wasteTypes` JSON NOT NULL,
    MODIFY `status` ENUM('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'SUBMITTED';
