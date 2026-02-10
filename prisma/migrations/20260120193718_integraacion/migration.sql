-- CreateTable
CREATE TABLE `pago` (
    `id` VARCHAR(191) NOT NULL,
    `concepto` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `monto` DOUBLE NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'pendiente',
    `comprobanteUrl` TEXT NULL,
    `comprobanteTipo` VARCHAR(191) NULL,
    `montoPagado` DOUBLE NULL,
    `fechaPago` DATETIME(3) NULL,
    `validadoPor` VARCHAR(191) NULL,
    `fechaValidacion` DATETIME(3) NULL,
    `notaValidacion` TEXT NULL,
    `casoId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pago_casoId_idx`(`casoId`),
    INDEX `pago_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pago` ADD CONSTRAINT `pago_validadoPor_fkey` FOREIGN KEY (`validadoPor`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pago` ADD CONSTRAINT `pago_casoId_fkey` FOREIGN KEY (`casoId`) REFERENCES `caso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
