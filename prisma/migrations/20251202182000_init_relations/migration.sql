/*
  Warnings:

  - The primary key for the `caso` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `cliente` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `usuario` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `abogadoId` to the `cliente` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `account` DROP FOREIGN KEY `account_userId_fkey`;

-- DropForeignKey
ALTER TABLE `caso` DROP FOREIGN KEY `Caso_abogadoId_fkey`;

-- DropForeignKey
ALTER TABLE `caso` DROP FOREIGN KEY `Caso_clienteId_fkey`;

-- DropForeignKey
ALTER TABLE `session` DROP FOREIGN KEY `session_userId_fkey`;

-- AlterTable
ALTER TABLE `account` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `caso` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `abogadoId` VARCHAR(191) NOT NULL,
    MODIFY `clienteId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `cliente` DROP PRIMARY KEY,
    ADD COLUMN `abogadoId` VARCHAR(191) NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `session` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `usuario` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `cliente` ADD CONSTRAINT `cliente_abogadoId_fkey` FOREIGN KEY (`abogadoId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caso` ADD CONSTRAINT `caso_abogadoId_fkey` FOREIGN KEY (`abogadoId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caso` ADD CONSTRAINT `caso_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
