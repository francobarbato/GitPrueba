-- AlterTable
ALTER TABLE `caso` ADD COLUMN `cerradoPorId` VARCHAR(191) NULL,
    ADD COLUMN `estaCerrado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `estadoAntesCierre` VARCHAR(191) NULL,
    ADD COLUMN `fechaCierre` DATETIME(3) NULL,
    ADD COLUMN `montoFinal` DECIMAL(15, 2) NULL,
    ADD COLUMN `motivoCierre` VARCHAR(191) NULL,
    ADD COLUMN `observacionCierre` TEXT NULL;
