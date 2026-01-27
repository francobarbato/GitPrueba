/*
  Warnings:

  - You are about to alter the column `rol` on the `usuario` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `creadoPor` VARCHAR(191) NULL,
    ADD COLUMN `debeResetearPassword` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `ultimoAcceso` DATETIME(3) NULL,
    MODIFY `rol` ENUM('ADMIN', 'ABOGADO', 'ASISTENTE', 'CLIENTE') NOT NULL DEFAULT 'ABOGADO';
