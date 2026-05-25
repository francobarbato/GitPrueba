-- CreateTable
CREATE TABLE `tarea` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `prioridad` VARCHAR(191) NOT NULL DEFAULT 'Media',
    `fatal` BOOLEAN NOT NULL DEFAULT false,
    `fecha` VARCHAR(191) NULL,
    `completada` BOOLEAN NOT NULL DEFAULT false,
    `usuarioId` VARCHAR(191) NOT NULL,
    `casoId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tarea` ADD CONSTRAINT `tarea_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarea` ADD CONSTRAINT `tarea_casoId_fkey` FOREIGN KEY (`casoId`) REFERENCES `caso`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `caso` RENAME INDEX `caso_abogadoId_fkey` TO `Caso_abogadoId_fkey`;

-- RenameIndex
ALTER TABLE `caso` RENAME INDEX `caso_clienteId_fkey` TO `Caso_clienteId_fkey`;
