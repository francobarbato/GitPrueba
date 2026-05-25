// src/lib/storage/storageKeys.ts
// Nomenclatura consistente para todas las rutas de archivos

import { v4 as uuidv4 } from 'uuid'
import path from 'path'

// El segundo parámetro identifica el "contenedor" del archivo:
//   - el id de la carpeta (carpetas libres anidadas), o
//   - 'raiz' cuando el documento va suelto en el expediente.
// Ya no se usa el enum CarpetaDocumento.
export function buildStorageKey(
  casoId: string,
  contenedor: string,
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

  const contenedorLimpio = (contenedor || 'raiz').replace(/[^a-z0-9_-]/gi, '_')

  // Resultado: casos/abc123/raiz/demanda_inicial_1234567890_a1b2c3d4.pdf
  //        o:  casos/abc123/<carpetaId>/archivo_....pdf
  return `casos/${casoId}/${contenedorLimpio}/${nombreLimpio}_${timestamp}_${uuid}${extension}`
}