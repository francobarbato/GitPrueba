// src/lib/storage/storageKeys.ts
// Nomenclatura consistente para todas las rutas de archivos

import { CarpetaDocumento } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

export function buildStorageKey(
  casoId: string,
  carpeta: CarpetaDocumento,
  nombreOriginal: string
): string {
  const extension = path.extname(nombreOriginal).toLowerCase()
  const timestamp = Date.now()
  const uuid = uuidv4().split('-')[0]      // Solo primeros 8 chars
  const nombreLimpio = nombreOriginal
    .replace(extension, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 40)                       // Máximo 40 chars

  // Resultado: casos/abc123/PRUEBA/demanda_inicial_1234567890_a1b2c3d4.pdf
  return `casos/${casoId}/${carpeta}/${nombreLimpio}_${timestamp}_${uuid}${extension}`
}