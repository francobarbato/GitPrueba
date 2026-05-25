-- CreateTable
CREATE TABLE `bitacora` (
    `id` VARCHAR(191) NOT NULL,
    `texto` TEXT NOT NULL,
    `tipo` VARCHAR(191) NOT NULL DEFAULT 'manual',
    `usuarioId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bitacora` ADD CONSTRAINT `bitacora_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
