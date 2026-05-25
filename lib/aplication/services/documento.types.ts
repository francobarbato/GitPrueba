// src/lib/aplication/services/documento.types.ts
// Solo tipos - seguro para usar en cliente y servidor

export type DocumentoListItem = {
  id: string
  nombre: string
  nombreOriginal: string
  tipo: string
  extension: string
  tamanio: number
  descripcion: string | null
  esInterno: boolean
  url: string
  storageKey: string
  casoId: string
  carpetaId: string | null      // null = suelto en la raíz del expediente
  subidoPor: string
  subidoPorId: string
  createdAt: Date
  diasSubido: number
}

// Una carpeta dentro de un expediente (puede estar anidada).
export type CarpetaListItem = {
  id: string
  nombre: string
  casoId: string
  carpetaPadreId: string | null   // null = raíz del expediente
  cantidadDocumentos: number      // documentos directos en esta carpeta
  cantidadSubcarpetas: number     // subcarpetas directas
  createdAt: Date
}

// Contenido de un nivel del explorador (una carpeta o la raíz):
// las subcarpetas y los documentos que viven en ese nivel.
export type ContenidoCarpeta = {
  carpetaActual: CarpetaListItem | null   // null = estamos en la raíz del expediente
  ruta: CarpetaListItem[]                 // breadcrumb desde la raíz hasta la actual
  subcarpetas: CarpetaListItem[]
  documentos: DocumentoListItem[]
}