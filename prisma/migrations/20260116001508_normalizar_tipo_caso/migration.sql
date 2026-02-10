-- Migración 1: Normalizar valores existentes de 'tipo' a UPPERCASE
UPDATE `caso` SET `tipo` = UPPER(`tipo`) WHERE `tipo` IS NOT NULL;

-- Verificar que todos los valores sean válidos para el ENUM
UPDATE `caso` 
SET `tipo` = 'OTRO' 
WHERE `tipo` NOT IN ('LABORAL', 'CIVIL', 'COMERCIAL', 'FAMILIA', 'PENAL', 'SUCESIONES', 'OTRO');