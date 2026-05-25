/*
  Warnings:

  - You are about to drop the column `fechaCierre` on the `caso` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `bitacora` DROP FOREIGN KEY `bitacora_casoId_fkey`;

-- DropForeignKey
ALTER TABLE `tarea` DROP FOREIGN KEY `tarea_casoId_fkey`;

-- AlterTable
ALTER TABLE `bitacora` MODIFY `accion` VARCHAR(191) NULL,
    MODIFY `detalle` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `caso` DROP COLUMN `fechaCierre`,
    ADD COLUMN `fechaFin` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `tarea` ADD CONSTRAINT `tarea_casoId_fkey` FOREIGN KEY (`casoId`) REFERENCES `caso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bitacora` ADD CONSTRAINT `bitacora_casoId_fkey` FOREIGN KEY (`casoId`) REFERENCES `caso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
