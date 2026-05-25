/*
  Warnings:

  - Added the required column `accion` to the `bitacora` table without a default value. This is not possible if the table is not empty.
  - Added the required column `detalle` to the `bitacora` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bitacora` ADD COLUMN `accion` VARCHAR(191) NOT NULL,
    ADD COLUMN `casoId` VARCHAR(191) NULL,
    ADD COLUMN `detalle` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `bitacora_casoId_idx` ON `bitacora`(`casoId`);

-- AddForeignKey
ALTER TABLE `bitacora` ADD CONSTRAINT `bitacora_casoId_fkey` FOREIGN KEY (`casoId`) REFERENCES `caso`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `bitacora` RENAME INDEX `bitacora_usuarioId_fkey` TO `bitacora_usuarioId_idx`;
