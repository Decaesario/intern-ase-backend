/*
  Warnings:

  - You are about to drop the column `eventId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventParticipant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Event` DROP FOREIGN KEY `Event_organizerId_fkey`;

-- DropForeignKey
ALTER TABLE `EventParticipant` DROP FOREIGN KEY `EventParticipant_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `EventParticipant` DROP FOREIGN KEY `EventParticipant_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Report` DROP FOREIGN KEY `Report_eventId_fkey`;

-- DropIndex
DROP INDEX `Report_eventId_fkey` ON `Report`;

-- AlterTable
ALTER TABLE `Report` DROP COLUMN `eventId`;

-- DropTable
DROP TABLE `Event`;

-- DropTable
DROP TABLE `EventParticipant`;
