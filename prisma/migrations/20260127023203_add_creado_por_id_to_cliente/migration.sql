-- AlterTable
ALTER TABLE `cliente` ADD COLUMN `creadoPorId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `cliente_creadoPorId_idx` ON `cliente`(`creadoPorId`);
