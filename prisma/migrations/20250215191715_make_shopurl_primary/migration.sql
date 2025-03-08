/*
  Warnings:

  - The primary key for the `Settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Settings` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    MODIFY `shopUrl` VARCHAR(255) NOT NULL,
    ADD PRIMARY KEY (`shopUrl`);
