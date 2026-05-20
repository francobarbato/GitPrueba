// src/lib/aplication/services/documento.service.ts

import prisma from "src/lib/db/prisma"
import { storage } from "src/lib/storage"
import { buildStorageKey } from "src/lib/storage/storageKeys"
import { CarpetaDocumento } from "@prisma/client"
import { differenceInDays } from "date-fns"
import { 
  DocumentoListItem, 
  DocumentosPorCarpeta, 
  CARPETA_LABELS 
} from "./documento.types"

// ============================================================================
// TIPOS
// ============================================================================

export type DocumentoUploadInput = {
  casoId: string
  subidoPorId: string
  carpeta: CarpetaDocumento
  descripcion?: string
  esInterno?: boolean
  file: {
    buffer: Buffer
    nombre: string
    tipo: string
    tamanio: number
  }
}

// export type DocumentoListItem = {
//   id: string
//   nombre: string
//   nombreOriginal: string
//   tipo: string
//   extension: string
//   tamanio: number
//   carpeta: CarpetaDocumento
//   descripcion: string | null
//   esInterno: boolean
//   url: string
//   storageKey: string
//   subidoPor: string
//   subidoPorId: string
//   createdAt: Date
//   diasSubido: number
// }

// export type DocumentosPorCarpeta = {
//   carpeta: CarpetaDocumento
//   label: string
//   documentos: DocumentoListItem[]
//   cantidad: number
// }

// Labels para mostrar en UI
// export const CARPETA_LABELS: Record<CarpetaDocumento, string> = {
//   DEMANDA_CONTESTACION: 'Demanda y Contestación',
//   ESCRITOS_JUDICIALES: 'Escritos Judiciales',
//   NOTIFICACIONES_CEDULAS: 'Notificaciones y Cédulas',
//   PRUEBA: 'Prueba',
//   DOCUMENTACION_CLIENTE: 'Documentación del Cliente',
//   NOTAS_INTERNOS: 'Notas y Documentos Internos',
//   OTROS: 'Otros'
// }

// Tipos de archivo permitidos
const TIPOS_PERMITIDOS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain'
]

const TAMANIO_MAXIMO = 10 * 1024 * 1024 // 10MB

// ============================================================================
// SERVICE
// ============================================================================

export class DocumentoService {

  // --------------------------------------------------------------------------
  // VALIDACIONES
  // --------------------------------------------------------------------------

  validarArchivo(tipo: string, tamanio: number): { valido: boolean; error?: string } {
    if (!TIPOS_PERMITIDOS.includes(tipo)) {
      return {
        valido: false,
        error: `Tipo de archivo no permitido. Se aceptan: PDF, Word, Excel, imágenes y texto plano.`
      }
    }

    if (tamanio > TAMANIO_MAXIMO) {
      return {
        valido: false,
        error: `El archivo supera el tamaño máximo permitido de 10MB.`
      }
    }

    return { valido: true }
  }

  // --------------------------------------------------------------------------
  // SUBIR DOCUMENTO
  // --------------------------------------------------------------------------

  async subirDocumento(input: DocumentoUploadInput) {
    const { casoId, subidoPorId, carpeta, descripcion, esInterno, file } = input

    // Validar archivo
    const validacion = this.validarArchivo(file.tipo, file.tamanio)
    if (!validacion.valido) {
      throw new Error(validacion.error)
    }

    // Verificar que el caso existe
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      select: { id: true, numero: true, titulo: true }
    })
    if (!caso) throw new Error('Caso no encontrado')

    // Construir key única para storage
    const storageKey = buildStorageKey(casoId, carpeta, file.nombre)
    const extension = file.nombre.split('.').pop()?.toLowerCase() || ''

    // Subir al storage
    const resultado = await storage.upload(file.buffer, storageKey, file.tipo)

    // Guardar en base de datos
    const documento = await prisma.documento.create({
      data: {
        nombre: file.nombre,
        nombreOriginal: file.nombre,
        storageKey: resultado.storageKey,
        url: resultado.url,
        tipo: file.tipo,
        extension,
        tamanio: file.tamanio,
        carpeta,
        descripcion: descripcion || null,
        esInterno: esInterno || false,
        casoId,
        subidoPorId
      }
    })

    // Registrar en bitácora
    await prisma.bitacora.create({
      data: {
        casoId,
        usuarioId: subidoPorId,
        accion: 'DOCUMENTO_SUBIDO',
        texto: `Documento subido: ${file.nombre}`,
        detalle: `Carpeta: ${CARPETA_LABELS[carpeta]} | Tamaño: ${this.formatearTamanio(file.tamanio)}`,
        tipo: 'sistema'
      }
    })

    return documento
  }

  // --------------------------------------------------------------------------
  // OBTENER DOCUMENTOS POR CASO (agrupados por carpeta)
  // --------------------------------------------------------------------------

  async getDocumentosPorCaso(
    casoId: string,
    opciones?: {
      soloPublicos?: boolean   // Para portal cliente
      carpeta?: CarpetaDocumento
    }
  ): Promise<DocumentosPorCarpeta[]> {
    const where: any = { casoId }

    if (opciones?.soloPublicos) {
      where.esInterno = false
    }

    if (opciones?.carpeta) {
      where.carpeta = opciones.carpeta
    }

    const documentos = await prisma.documento.findMany({
      where,
      include: {
        subidoPor: {
          select: { nombre: true, apellido: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Mapear a DocumentoListItem
    const items: DocumentoListItem[] = documentos.map(doc => ({
      id: doc.id,
      nombre: doc.nombre,
      nombreOriginal: doc.nombreOriginal,
      tipo: doc.tipo,
      extension: doc.extension,
      tamanio: doc.tamanio,
      carpeta: doc.carpeta,
      descripcion: doc.descripcion,
      esInterno: doc.esInterno,
      url: doc.url || '',
      storageKey: doc.storageKey,
      subidoPor: doc.subidoPor.nombre && doc.subidoPor.apellido
        ? `${doc.subidoPor.nombre} ${doc.subidoPor.apellido}`
        : doc.subidoPor.email.split('@')[0],
      subidoPorId: doc.subidoPorId,
      createdAt: doc.createdAt,
      diasSubido: differenceInDays(new Date(), doc.createdAt)
    }))

    // Agrupar por carpeta
    const todasLasCarpetas = Object.keys(CARPETA_LABELS) as CarpetaDocumento[]
    
    return todasLasCarpetas.map(carpeta => ({
      carpeta,
      label: CARPETA_LABELS[carpeta],
      documentos: items.filter(d => d.carpeta === carpeta),
      cantidad: items.filter(d => d.carpeta === carpeta).length
    }))
  }

  // --------------------------------------------------------------------------
  // OBTENER UN DOCUMENTO POR ID
  // --------------------------------------------------------------------------

  async getDocumentoPorId(documentoId: string) {
    return await prisma.documento.findUnique({
      where: { id: documentoId },
      include: {
        subidoPor: {
          select: { nombre: true, apellido: true, email: true }
        },
        caso: {
          select: { id: true, numero: true, titulo: true }
        }
      }
    })
  }

  // --------------------------------------------------------------------------
  // ELIMINAR DOCUMENTO
  // --------------------------------------------------------------------------

  async eliminarDocumento(documentoId: string, usuarioId: string) {
    const documento = await prisma.documento.findUnique({
      where: { id: documentoId },
      select: {
        id: true,
        nombre: true,
        storageKey: true,
        casoId: true,
        carpeta: true
      }
    })

    if (!documento) throw new Error('Documento no encontrado')

    // Eliminar del storage
    await storage.delete(documento.storageKey)

    // Eliminar de la base de datos
    await prisma.documento.delete({
      where: { id: documentoId }
    })

    // Registrar en bitácora
    await prisma.bitacora.create({
      data: {
        casoId: documento.casoId,
        usuarioId,
        accion: 'DOCUMENTO_ELIMINADO',
        texto: `Documento eliminado: ${documento.nombre}`,
        detalle: `Carpeta: ${CARPETA_LABELS[documento.carpeta]}`,
        tipo: 'sistema'
      }
    })

    return { success: true }
  }

  // --------------------------------------------------------------------------
  // ACTUALIZAR METADATA (descripción, carpeta, visibilidad)
  // --------------------------------------------------------------------------

  async actualizarDocumento(
    documentoId: string,
    usuarioId: string,
    data: {
      descripcion?: string
      carpeta?: CarpetaDocumento
      esInterno?: boolean
    }
  ) {
    const documento = await prisma.documento.findUnique({
      where: { id: documentoId },
      select: { id: true, casoId: true, nombre: true }
    })

    if (!documento) throw new Error('Documento no encontrado')

    const actualizado = await prisma.documento.update({
      where: { id: documentoId },
      data
    })

    // Registrar en bitácora
    await prisma.bitacora.create({
      data: {
        casoId: documento.casoId,
        usuarioId,
        accion: 'DOCUMENTO_ACTUALIZADO',
        texto: `Documento actualizado: ${documento.nombre}`,
        tipo: 'sistema'
      }
    })

    return actualizado
  }

  // --------------------------------------------------------------------------
  // BUSCAR DOCUMENTOS
  // --------------------------------------------------------------------------

  async buscarDocumentos(casoId: string, query: string) {
    return await prisma.documento.findMany({
      where: {
        casoId,
        OR: [
          { nombre: { contains: query } },
          { nombreOriginal: { contains: query } },
          { descripcion: { contains: query } }
        ]
      },
      include: {
        subidoPor: {
          select: { nombre: true, apellido: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  formatearTamanio(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  getIconoPorExtension(extension: string): string {
    const iconos: Record<string, string> = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      webp: '🖼️',
      txt: '📃'
    }
    return iconos[extension.toLowerCase()] || '📎'
  }
}