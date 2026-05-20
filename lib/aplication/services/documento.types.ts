// src/lib/aplication/services/documento.types.ts
// Solo tipos y constantes - seguro para usar en cliente y servidor

import { CarpetaDocumento } from "@prisma/client"

export type DocumentoListItem = {
  id: string
  nombre: string
  nombreOriginal: string
  tipo: string
  extension: string
  tamanio: number
  carpeta: CarpetaDocumento
  descripcion: string | null
  esInterno: boolean
  url: string
  storageKey: string
  subidoPor: string
  subidoPorId: string
  createdAt: Date
  diasSubido: number
}

export type DocumentosPorCarpeta = {
  carpeta: CarpetaDocumento
  label: string
  documentos: DocumentoListItem[]
  cantidad: number
}

export const CARPETA_LABELS: Record<CarpetaDocumento, string> = {
  DEMANDA_CONTESTACION: 'Demanda y Contestación',
  ESCRITOS_JUDICIALES: 'Escritos Judiciales',
  NOTIFICACIONES_CEDULAS: 'Notificaciones y Cédulas',
  PRUEBA: 'Prueba',
  DOCUMENTACION_CLIENTE: 'Documentación del Cliente',
  NOTAS_INTERNOS: 'Notas y Documentos Internos',
  OTROS: 'Otros'
}