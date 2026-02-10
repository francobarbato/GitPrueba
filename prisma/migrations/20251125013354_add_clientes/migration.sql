/*
  Warnings:

  - A unique constraint covering the columns `[numeroDocumento]` on the table `usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `numeroDocumento` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `usuario_numeroDocumento_key` ON `usuario`(`numeroDocumento`);
