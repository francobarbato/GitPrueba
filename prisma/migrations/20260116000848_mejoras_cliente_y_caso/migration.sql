/*
  Warnings:

  - You are about to alter the column `tipo` on the `caso` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.
  - Made the column `numeroDocumento` on table `cliente` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tipoDocumento` on table `cliente` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `cliente_email_key` ON `cliente`;

-- AlterTable
ALTER TABLE `caso` ADD COLUMN `contraparteDni` VARCHAR(191) NULL,
    ADD COLUMN `contraparteNombre` VARCHAR(191) NULL,
    ADD COLUMN `fuero` VARCHAR(191) NULL,
    ADD COLUMN `juzgado` VARCHAR(191) NULL,
    ADD COLUMN `montoDisputa` DECIMAL(15, 2) NULL,
    ADD COLUMN `ubicacionFisica` VARCHAR(191) NULL,
    MODIFY `tipo` ENUM('LABORAL', 'CIVIL', 'COMERCIAL', 'FAMILIA', 'PENAL', 'SUCESIONES', 'OTRO') NOT NULL;

-- AlterTable
ALTER TABLE `cliente` ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `condicionIva` ENUM('RESPONSABLE_INSCRIPTO', 'MONOTRIBUTISTA', 'EXENTO', 'CONSUMIDOR_FINAL', 'NO_CATEGORIZADO') NOT NULL DEFAULT 'CONSUMIDOR_FINAL',
    ADD COLUMN `notasInternas` TEXT NULL,
    ADD COLUMN `tipoPersona` ENUM('FISICA', 'JURIDICA') NOT NULL DEFAULT 'FISICA',
    MODIFY `apellido` VARCHAR(191) NULL,
    MODIFY `numeroDocumento` VARCHAR(191) NOT NULL,
    MODIFY `tipoDocumento` ENUM('DNI', 'CUIT', 'CUIL', 'PASAPORTE', 'OTRO') NOT NULL DEFAULT 'DNI';

-- CreateIndex
CREATE INDEX `caso_tipo_idx` ON `caso`(`tipo`);

-- CreateIndex
CREATE INDEX `caso_estado_idx` ON `caso`(`estado`);

-- CreateIndex
CREATE INDEX `caso_contraparteDni_idx` ON `caso`(`contraparteDni`);

-- CreateIndex
CREATE INDEX `cliente_numeroDocumento_idx` ON `cliente`(`numeroDocumento`);

-- CreateIndex
CREATE INDEX `cliente_email_idx` ON `cliente`(`email`);

-- RenameIndex
ALTER TABLE `cliente` RENAME INDEX `cliente_abogadoId_fkey` TO `cliente_abogadoId_idx`;
