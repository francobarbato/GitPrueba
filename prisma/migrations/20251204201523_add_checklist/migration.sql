-- AlterTable
ALTER TABLE `caso` ADD COLUMN `isFavorite` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `priority` ENUM('HIGH', 'NORMAL', 'LOW') NOT NULL DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE `requirement` (
    `id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `casoId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `requirement` ADD CONSTRAINT `requirement_casoId_fkey` FOREIGN KEY (`casoId`) REFERENCES `caso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
