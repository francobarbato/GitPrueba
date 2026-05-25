/*
  Warnings:

  - You are about to drop the column `direccion` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `numeroDocumento` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `tipoDocumento` on the `usuario` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `caso` DROP FOREIGN KEY `Caso_clienteId_fkey`;

-- DropIndex
DROP INDEX `usuario_numeroDocumento_key` ON `usuario`;

-- AlterTable
ALTER TABLE `usuario` DROP COLUMN `direccion`,
    DROP COLUMN `estado`,
    DROP COLUMN `numeroDocumento`,
    DROP COLUMN `telefono`,
    DROP COLUMN `tipoDocumento`;

-- CreateTable
CREATE TABLE `cliente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `numeroDocumento` VARCHAR(191) NULL,
    `tipoDocumento` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cliente_email_key`(`email`),
    UNIQUE INDEX `cliente_numeroDocumento_key`(`numeroDocumento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `caso` ADD CONSTRAINT `Caso_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
