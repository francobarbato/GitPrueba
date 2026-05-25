/*
  Warnings:

  - A unique constraint covering the columns `[usuarioPortalId]` on the table `cliente` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `cliente` ADD COLUMN `usuarioPortalId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `cliente_usuarioPortalId_key` ON `cliente`(`usuarioPortalId`);

-- CreateIndex
CREATE INDEX `cliente_usuarioPortalId_idx` ON `cliente`(`usuarioPortalId`);

-- AddForeignKey
ALTER TABLE `cliente` ADD CONSTRAINT `cliente_usuarioPortalId_fkey` FOREIGN KEY (`usuarioPortalId`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
