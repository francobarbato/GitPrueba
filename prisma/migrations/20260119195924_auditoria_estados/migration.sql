-- AlterTable
ALTER TABLE `bitacora` ADD COLUMN `estadoAnterior` VARCHAR(191) NULL,
    ADD COLUMN `estadoNuevo` VARCHAR(191) NULL,
    MODIFY `detalle` TEXT NULL;

-- CreateIndex
CREATE INDEX `bitacora_createdAt_idx` ON `bitacora`(`createdAt`);

-- CreateIndex
CREATE INDEX `bitacora_accion_idx` ON `bitacora`(`accion`);
