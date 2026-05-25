-- Script SIMPLE para limpiar la base de datos
-- Copia y pega esto en MySQL Workbench y ejecuta

-- 1. Eliminar todos los casos
DELETE FROM Caso;

-- 2. Eliminar todos los clientes
DELETE FROM Usuario WHERE rol = 'cliente';

-- 3. Reiniciar contadores
ALTER TABLE Caso AUTO_INCREMENT = 1;
ALTER TABLE Usuario AUTO_INCREMENT = 1;

-- 4. Insertar abogados precargados
INSERT INTO Usuario (nombre, apellido, email, rol, createdAt, updatedAt) VALUES
('María', 'González', 'maria.gonzalez@estudio.com', 'abogado', NOW(), NOW()),
('Carlos', 'Rodríguez', 'carlos.rodriguez@estudio.com', 'abogado', NOW(), NOW()),
('Ana', 'Martínez', 'ana.martinez@estudio.com', 'abogado', NOW(), NOW()),
('Luis', 'Fernández', 'luis.fernandez@estudio.com', 'abogado', NOW(), NOW());

-- Listo! Ahora tienes:
-- - 0 casos
-- - 0 clientes
-- - 4 abogados precargados
