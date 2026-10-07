-- AlterTable
ALTER TABLE `User` ADD COLUMN `resetTokenExpiry` DATETIME(3) NULL,
    ADD COLUMN `resetTokenHash` VARCHAR(191) NULL;
