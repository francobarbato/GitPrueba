/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `cliente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telefono]` on the table `cliente` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `caso` ADD COLUMN `ciudad` VARCHAR(191) NULL,
    ADD COLUMN `fechaUltimoCambioEstado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `provincia` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `cliente` ADD COLUMN `bienesEmbargables` VARCHAR(191) NULL,
    ADD COLUMN `representanteDni` VARCHAR(191) NULL,
    ADD COLUMN `representanteNombre` VARCHAR(191) NULL,
    ADD COLUMN `tipoSociedad` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `caso_colaborador` (
    `id` VARCHAR(191) NOT NULL,
    `casoId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `permiso` VARCHAR(191) NOT NULL DEFAULT 'LECTURA',
    `asignadoPorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `caso_colaborador_casoId_userId_key`(`casoId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `caso_fechaUltimoCambioEstado_idx` ON `caso`(`fechaUltimoCambioEstado`);

-- CreateIndex
CREATE UNIQUE INDEX `Cliente_email_key` ON `cliente`(`email`);

-- CreateIndex
CREATE UNIQUE INDEX `Cliente_telefono_key` ON `cliente`(`telefono`);

-- AddForeignKey
ALTER TABLE `caso_colaborador` ADD CONSTRAINT `caso_colaborador_casoId_fkey` FOREIGN KEY (`casoId`) REFERENCES `caso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caso_colaborador` ADD CONSTRAINT `caso_colaborador_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caso_colaborador` ADD CONSTRAINT `caso_colaborador_asignadoPorId_fkey` FOREIGN KEY (`asignadoPorId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
