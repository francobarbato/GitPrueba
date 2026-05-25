/*
  Warnings:

  - The values [CIVIL,COMERCIAL] on the enum `caso_tipo` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `caso` MODIFY `tipo` ENUM('LABORAL', 'CIVIL_COMERCIAL', 'FAMILIA', 'PENAL', 'SUCESIONES', 'CONTENCIOSO_ADMINISTRATIVO', 'OTRO') NOT NULL;
