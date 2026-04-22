/*
  Warnings:

  - You are about to drop the column `completada` on the `tarea` table. All the data in the column will be lost.
  - You are about to drop the column `fatal` on the `tarea` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `tarea` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `tarea` table. All the data in the column will be lost.
  - You are about to alter the column `prioridad` on the `tarea` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(9))`.
  - Added the required column `creadorId` to the `tarea` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsableId` to the `tarea` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `tarea` DROP FOREIGN KEY `tarea_casoId_fkey`;

-- DropForeignKey
ALTER TABLE `tarea` DROP FOREIGN KEY `tarea_usuarioId_fkey`;

-- AlterTable
ALTER TABLE `bitacora` ADD COLUMN `tareaId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `cliente` ADD COLUMN `ultimoAccesoPortal` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `tarea` DROP COLUMN `completada`,
    DROP COLUMN `fatal`,
    DROP COLUMN `fecha`,
    DROP COLUMN `usuarioId`,
    ADD COLUMN `ambito` ENUM('INTERNO', 'EXTERNO') NOT NULL DEFAULT 'INTERNO',
    ADD COLUMN `categoria` ENUM('PRESENTACION_ESCRITO', 'AUDIENCIA', 'NOTIFICACION_CEDULA', 'CONTROL_EXPEDIENTE', 'APELACION_RECURSO', 'PERICIA_PRUEBA', 'REUNION_CLIENTE', 'REDACCION_DOCUMENTACION', 'TRAMITE_ADMINISTRATIVO', 'REQUERIMIENTO_CLIENTE', 'GESTION_FINANCIERA', 'REUNION_EQUIPO', 'VENCIMIENTO_PLAZO') NOT NULL DEFAULT 'REUNION_CLIENTE',
    ADD COLUMN `clienteId` VARCHAR(191) NULL,
    ADD COLUMN `creadorId` VARCHAR(191) NOT NULL,
    ADD COLUMN `descripcion` TEXT NULL,
    ADD COLUMN `estado` ENUM('PENDIENTE', 'EN_PROCESO', 'BLOQUEADA', 'COMPLETADA', 'VENCIDA') NOT NULL DEFAULT 'PENDIENTE',
    ADD COLUMN `fechaCompletada` DATETIME(3) NULL,
    ADD COLUMN `fechaInicio` DATETIME(3) NULL,
    ADD COLUMN `fechaVencimiento` DATETIME(3) NULL,
    ADD COLUMN `lugarFisico` VARCHAR(191) NULL,
    ADD COLUMN `motivoBloqueo` TEXT NULL,
    ADD COLUMN `motivoDesbloqueo` TEXT NULL,
    ADD COLUMN `responsableId` VARCHAR(191) NOT NULL,
    ADD COLUMN `supervisorId` VARCHAR(191) NULL,
    ADD COLUMN `tipo` ENUM('PROCESAL', 'INTERNA') NOT NULL DEFAULT 'INTERNA',
    ADD COLUMN `visibleCliente` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `prioridad` ENUM('BAJA', 'MEDIA', 'ALTA', 'FATAL') NOT NULL DEFAULT 'MEDIA';

-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `ultimoAccesoComentarios` DATETIME(3) NULL,
    ADD COLUMN `ultimoAccesoTareas` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `comentario_tarea` (
    `id` VARCHAR(191) NOT NULL,
    `texto` TEXT NOT NULL,
    `tareaId` VARCHAR(191) NOT NULL,
    `autorId` VARCHAR(191) NOT NULL,
    `citaComentarioId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `comentario_tarea_tareaId_idx`(`tareaId`),
    INDEX `comentario_tarea_autorId_idx`(`autorId`),
    INDEX `comentario_tarea_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarea_lectura` (
    `userId` VARCHAR(191) NOT NULL,
    `tareaId` VARCHAR(191) NOT NULL,
    `ultimaLectura` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tarea_lectura_tareaId_idx`(`tareaId`),
    PRIMARY KEY (`userId`, `tareaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `bitacora_tareaId_idx` ON `bitacora`(`tareaId`);

-- CreateIndex
CREATE INDEX `tarea_clienteId_idx` ON `tarea`(`clienteId`);

-- CreateIndex
CREATE INDEX `tarea_creadorId_idx` ON `tarea`(`creadorId`);

-- CreateIndex
CREATE INDEX `tarea_responsableId_idx` ON `tarea`(`responsableId`);

-- CreateIndex
CREATE INDEX `tarea_supervisorId_idx` ON `tarea`(`supervisorId`);

-- CreateIndex
CREATE INDEX `tarea_estado_idx` ON `tarea`(`estado`);

-- CreateIndex
CREATE INDEX `tarea_fechaVencimiento_idx` ON `tarea`(`fechaVencimiento`);

-- AddForeignKey
ALTER TABLE `tarea` ADD CONSTRAINT `tarea_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarea` ADD CONSTRAINT `tarea_casoId_fkey` FOREIGN KEY (`casoId`) REFERENCES `caso`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarea` ADD CONSTRAINT `tarea_creadorId_fkey` FOREIGN KEY (`creadorId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarea` ADD CONSTRAINT `tarea_responsableId_fkey` FOREIGN KEY (`responsableId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarea` ADD CONSTRAINT `tarea_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comentario_tarea` ADD CONSTRAINT `comentario_tarea_citaComentarioId_fkey` FOREIGN KEY (`citaComentarioId`) REFERENCES `comentario_tarea`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comentario_tarea` ADD CONSTRAINT `comentario_tarea_tareaId_fkey` FOREIGN KEY (`tareaId`) REFERENCES `tarea`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comentario_tarea` ADD CONSTRAINT `comentario_tarea_autorId_fkey` FOREIGN KEY (`autorId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarea_lectura` ADD CONSTRAINT `tarea_lectura_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarea_lectura` ADD CONSTRAINT `tarea_lectura_tareaId_fkey` FOREIGN KEY (`tareaId`) REFERENCES `tarea`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bitacora` ADD CONSTRAINT `bitacora_tareaId_fkey` FOREIGN KEY (`tareaId`) REFERENCES `tarea`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `tarea` RENAME INDEX `tarea_casoId_fkey` TO `tarea_casoId_idx`;
