// src/lib/aplication/services/documento.service.ts

import prisma from "src/lib/db/prisma"
import { storage } from "src/lib/storage"
import { buildStorageKey } from "src/lib/storage/storageKeys"
import { differenceInDays } from "date-fns"
import {
  DocumentoListItem,
  CarpetaListItem,
  ContenidoCarpeta
} from "./documento.types"

// ============================================================================
// TIPOS
// ============================================================================

export type DocumentoUploadInput = {
  casoId: string
  subidoPorId: string
  carpetaId?: string | null      // null/undefined = raíz del expediente
  descripcion?: string
  esInterno?: boolean
  file: {
    buffer: Buffer
    nombre: string
    tipo: string
    tamanio: number
  }
}

// Contexto del usuario para validar ownership (ADMIN es técnico, sin datos legales).
export type ContextoUsuario = {
  usuarioId: string
  rol?: string | null
}

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
  // OWNERSHIP
  // --------------------------------------------------------------------------
  private async verificarAccesoCaso(casoId: string, ctx?: ContextoUsuario): Promise<void> {
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      select: { id: true, abogadoId: true }
    })
    if (!caso) throw new Error('Caso no encontrado')
    if (!ctx) return
    if (ctx.rol?.toUpperCase() === 'ADMIN') {
      throw new Error('El rol administrador no tiene acceso a los documentos de los expedientes')
    }
    if (caso.abogadoId !== ctx.usuarioId) {
      throw new Error('No tenés permiso para acceder a los documentos de este expediente')
    }
  }

  // Valida que una carpeta exista y pertenezca al caso indicado.
  private async verificarCarpetaDelCaso(carpetaId: string, casoId: string) {
    const carpeta = await prisma.carpeta.findUnique({
      where: { id: carpetaId },
      select: { id: true, casoId: true, nombre: true, carpetaPadreId: true }
    })
    if (!carpeta) throw new Error('Carpeta no encontrada')
    if (carpeta.casoId !== casoId) throw new Error('La carpeta no pertenece a este expediente')
    return carpeta
  }

  // --------------------------------------------------------------------------
  // VALIDACIÓN DE ARCHIVO
  // --------------------------------------------------------------------------
  validarArchivo(tipo: string, tamanio: number): { valido: boolean; error?: string } {
    if (!TIPOS_PERMITIDOS.includes(tipo)) {
      return { valido: false, error: `Tipo de archivo no permitido. Se aceptan: PDF, Word, Excel, imágenes y texto plano.` }
    }
    if (tamanio > TAMANIO_MAXIMO) {
      return { valido: false, error: `El archivo supera el tamaño máximo permitido de 10MB.` }
    }
    return { valido: true }
  }

  // ==========================================================================
  // CARPETAS
  // ==========================================================================

  // Crea una carpeta en la raíz del expediente o dentro de otra carpeta.
  async crearCarpeta(
    casoId: string,
    nombre: string,
    carpetaPadreId: string | null,
    ctx?: ContextoUsuario
  ) {
    await this.verificarAccesoCaso(casoId, ctx)

    const nombreLimpio = nombre.trim()
    if (!nombreLimpio) throw new Error('El nombre de la carpeta no puede estar vacío')
    if (nombreLimpio.length > 100) throw new Error('El nombre es demasiado largo (máximo 100 caracteres)')

    // Si es anidada, validar que la carpeta padre sea del mismo caso.
    if (carpetaPadreId) {
      await this.verificarCarpetaDelCaso(carpetaPadreId, casoId)
    }

    // Evitar duplicados en el mismo nivel.
    const yaExiste = await prisma.carpeta.findFirst({
      where: { casoId, carpetaPadreId: carpetaPadreId ?? null, nombre: nombreLimpio }
    })
    if (yaExiste) throw new Error('Ya existe una carpeta con ese nombre en este nivel')

    const carpeta = await prisma.carpeta.create({
      data: { casoId, nombre: nombreLimpio, carpetaPadreId: carpetaPadreId ?? null }
    })

    await prisma.bitacora.create({
      data: {
        casoId, usuarioId: ctx?.usuarioId || '',
        accion: 'CARPETA_CREADA',
        texto: `Carpeta creada: ${nombreLimpio}`,
        tipo: 'sistema'
      }
    })

    return carpeta
  }

  async renombrarCarpeta(carpetaId: string, nuevoNombre: string, ctx?: ContextoUsuario) {
    const carpeta = await prisma.carpeta.findUnique({
      where: { id: carpetaId },
      select: { id: true, casoId: true, carpetaPadreId: true, nombre: true }
    })
    if (!carpeta) throw new Error('Carpeta no encontrada')
    await this.verificarAccesoCaso(carpeta.casoId, ctx)

    const nombreLimpio = nuevoNombre.trim()
    if (!nombreLimpio) throw new Error('El nombre no puede estar vacío')
    if (nombreLimpio.length > 100) throw new Error('El nombre es demasiado largo (máximo 100 caracteres)')

    const yaExiste = await prisma.carpeta.findFirst({
      where: {
        casoId: carpeta.casoId,
        carpetaPadreId: carpeta.carpetaPadreId,
        nombre: nombreLimpio,
        id: { not: carpetaId }
      }
    })
    if (yaExiste) throw new Error('Ya existe una carpeta con ese nombre en este nivel')

    return await prisma.carpeta.update({
      where: { id: carpetaId },
      data: { nombre: nombreLimpio }
    })
  }

  // Borra una carpeta. El cascade del schema borra subcarpetas y documentos.
  // (Los archivos físicos del storage se limpian acá antes de borrar la fila.)
  async eliminarCarpeta(carpetaId: string, ctx?: ContextoUsuario) {
    const carpeta = await prisma.carpeta.findUnique({
      where: { id: carpetaId },
      select: { id: true, casoId: true, nombre: true }
    })
    if (!carpeta) throw new Error('Carpeta no encontrada')
    await this.verificarAccesoCaso(carpeta.casoId, ctx)

    // Recolectar TODOS los documentos de esta carpeta y sus subcarpetas (recursivo)
    // para borrar sus archivos físicos del storage.
    const idsCarpetas = await this.recolectarIdsCarpetaYDescendientes(carpetaId)
    const documentos = await prisma.documento.findMany({
      where: { carpetaId: { in: idsCarpetas } },
      select: { storageKey: true }
    })
    for (const doc of documentos) {
      try { await storage.delete(doc.storageKey) } catch { /* si falla, seguimos */ }
    }

    // Borrar la carpeta: el cascade del schema elimina subcarpetas y filas de documentos.
    await prisma.carpeta.delete({ where: { id: carpetaId } })

    await prisma.bitacora.create({
      data: {
        casoId: carpeta.casoId, usuarioId: ctx?.usuarioId || '',
        accion: 'CARPETA_ELIMINADA',
        texto: `Carpeta eliminada: ${carpeta.nombre}`,
        detalle: `Se eliminaron ${documentos.length} documento(s) y sus subcarpetas`,
        tipo: 'sistema'
      }
    })

    return { success: true, documentosEliminados: documentos.length }
  }

  // Devuelve el id de la carpeta + todos sus descendientes (recursivo).
  private async recolectarIdsCarpetaYDescendientes(carpetaId: string): Promise<string[]> {
    const resultado: string[] = [carpetaId]
    const hijas = await prisma.carpeta.findMany({
      where: { carpetaPadreId: carpetaId },
      select: { id: true }
    })
    for (const hija of hijas) {
      const sub = await this.recolectarIdsCarpetaYDescendientes(hija.id)
      resultado.push(...sub)
    }
    return resultado
  }

  // --------------------------------------------------------------------------
  // CONTENIDO DE UN NIVEL (raíz del caso o dentro de una carpeta)
  // --------------------------------------------------------------------------
  async getContenido(
    casoId: string,
    carpetaId: string | null,
    opciones?: { soloPublicos?: boolean },
    ctx?: ContextoUsuario
  ): Promise<ContenidoCarpeta> {
    await this.verificarAccesoCaso(casoId, ctx)

    // Carpeta actual + breadcrumb
    let carpetaActual: CarpetaListItem | null = null
    const ruta: CarpetaListItem[] = []

    if (carpetaId) {
      const actual = await this.mapearCarpeta(carpetaId)
      if (!actual || actual.casoId !== casoId) throw new Error('Carpeta no encontrada en este expediente')
      carpetaActual = actual

      // Construir breadcrumb subiendo por los padres
      let cursor: string | null = actual.carpetaPadreId
      const cadena: CarpetaListItem[] = [actual]
      while (cursor) {
        const padre = await this.mapearCarpeta(cursor)
        if (!padre) break
        cadena.unshift(padre)
        cursor = padre.carpetaPadreId
      }
      ruta.push(...cadena)
    }

    // Subcarpetas de este nivel
    const subcarpetasRaw = await prisma.carpeta.findMany({
      where: { casoId, carpetaPadreId: carpetaId ?? null },
      orderBy: { nombre: 'asc' }
    })
    const subcarpetas: CarpetaListItem[] = []
    for (const c of subcarpetasRaw) {
      subcarpetas.push(await this.mapearCarpetaDesde(c))
    }

    // Documentos de este nivel
    const whereDoc: any = { casoId, carpetaId: carpetaId ?? null }
    if (opciones?.soloPublicos) whereDoc.esInterno = false

    const documentosRaw = await prisma.documento.findMany({
      where: whereDoc,
      include: { subidoPor: { select: { nombre: true, apellido: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })
    const documentos = documentosRaw.map(d => this.mapearDocumento(d))

    return { carpetaActual, ruta, subcarpetas, documentos }
  }

  // Lista TODOS los documentos de un caso (para vista "todos", sin navegar carpetas).
  async getTodosLosDocumentos(
    casoId: string,
    opciones?: { soloPublicos?: boolean },
    ctx?: ContextoUsuario
  ): Promise<DocumentoListItem[]> {
    await this.verificarAccesoCaso(casoId, ctx)
    const where: any = { casoId }
    if (opciones?.soloPublicos) where.esInterno = false

    const docs = await prisma.documento.findMany({
      where,
      include: { subidoPor: { select: { nombre: true, apellido: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return docs.map(d => this.mapearDocumento(d))
  }

  // Lista las carpetas de un caso (para el selector del drawer de subida).
  async getCarpetasDelCaso(casoId: string, ctx?: ContextoUsuario): Promise<CarpetaListItem[]> {
    await this.verificarAccesoCaso(casoId, ctx)
    const carpetas = await prisma.carpeta.findMany({
      where: { casoId },
      orderBy: { nombre: 'asc' }
    })
    const items: CarpetaListItem[] = []
    for (const c of carpetas) {
      items.push(await this.mapearCarpetaDesde(c))
    }
    return items
  }

  // --------------------------------------------------------------------------
  // SUBIR DOCUMENTO
  // --------------------------------------------------------------------------
  async subirDocumento(input: DocumentoUploadInput, ctx?: ContextoUsuario) {
    const { casoId, subidoPorId, carpetaId, descripcion, esInterno, file } = input

    const validacion = this.validarArchivo(file.tipo, file.tamanio)
    if (!validacion.valido) throw new Error(validacion.error)

    await this.verificarAccesoCaso(casoId, ctx)

    // Si va dentro de una carpeta, validar que sea del mismo caso.
    if (carpetaId) {
      await this.verificarCarpetaDelCaso(carpetaId, casoId)
    }

    const storageKey = buildStorageKey(casoId, carpetaId || 'raiz', file.nombre)
    const extension = file.nombre.split('.').pop()?.toLowerCase() || ''

    const resultado = await storage.upload(file.buffer, storageKey, file.tipo)

    const documento = await prisma.documento.create({
      data: {
        nombre: file.nombre,
        nombreOriginal: file.nombre,
        storageKey: resultado.storageKey,
        url: resultado.url,
        tipo: file.tipo,
        extension,
        tamanio: file.tamanio,
        descripcion: descripcion || null,
        esInterno: esInterno || false,
        casoId,
        carpetaId: carpetaId ?? null,
        subidoPorId
      }
    })

    await prisma.bitacora.create({
      data: {
        casoId, usuarioId: subidoPorId,
        accion: 'DOCUMENTO_SUBIDO',
        texto: `Documento subido: ${file.nombre}`,
        detalle: `Tamaño: ${this.formatearTamanio(file.tamanio)}`,
        tipo: 'sistema'
      }
    })

    return documento
  }

  // --------------------------------------------------------------------------
  // ELIMINAR DOCUMENTO
  // --------------------------------------------------------------------------
  async eliminarDocumento(documentoId: string, usuarioId: string, ctx?: ContextoUsuario) {
    const documento = await prisma.documento.findUnique({
      where: { id: documentoId },
      select: { id: true, nombre: true, storageKey: true, casoId: true }
    })
    if (!documento) throw new Error('Documento no encontrado')
    await this.verificarAccesoCaso(documento.casoId, ctx ?? { usuarioId })

    await storage.delete(documento.storageKey)
    await prisma.documento.delete({ where: { id: documentoId } })

    await prisma.bitacora.create({
      data: {
        casoId: documento.casoId, usuarioId,
        accion: 'DOCUMENTO_ELIMINADO',
        texto: `Documento eliminado: ${documento.nombre}`,
        tipo: 'sistema'
      }
    })

    return { success: true }
  }

  // --------------------------------------------------------------------------
  // MOVER DOCUMENTO a otra carpeta (o a la raíz)
  // --------------------------------------------------------------------------
  async moverDocumento(
    documentoId: string,
    nuevaCarpetaId: string | null,
    ctx?: ContextoUsuario
  ) {
    const documento = await prisma.documento.findUnique({
      where: { id: documentoId },
      select: { id: true, casoId: true, nombre: true }
    })
    if (!documento) throw new Error('Documento no encontrado')
    await this.verificarAccesoCaso(documento.casoId, ctx)

    if (nuevaCarpetaId) {
      await this.verificarCarpetaDelCaso(nuevaCarpetaId, documento.casoId)
    }

    return await prisma.documento.update({
      where: { id: documentoId },
      data: { carpetaId: nuevaCarpetaId ?? null }
    })
  }

  // --------------------------------------------------------------------------
  // ACTUALIZAR METADATA (descripción, visibilidad)
  // --------------------------------------------------------------------------
  async actualizarDocumento(
    documentoId: string,
    usuarioId: string,
    data: { descripcion?: string; esInterno?: boolean },
    ctx?: ContextoUsuario
  ) {
    const documento = await prisma.documento.findUnique({
      where: { id: documentoId },
      select: { id: true, casoId: true, nombre: true }
    })
    if (!documento) throw new Error('Documento no encontrado')
    await this.verificarAccesoCaso(documento.casoId, ctx ?? { usuarioId })

    const actualizado = await prisma.documento.update({
      where: { id: documentoId },
      data
    })

    await prisma.bitacora.create({
      data: {
        casoId: documento.casoId, usuarioId,
        accion: 'DOCUMENTO_ACTUALIZADO',
        texto: `Documento actualizado: ${documento.nombre}`,
        tipo: 'sistema'
      }
    })

    return actualizado
  }

  // --------------------------------------------------------------------------
  // MAPPERS
  // --------------------------------------------------------------------------
  private mapearDocumento(doc: any): DocumentoListItem {
    return {
      id: doc.id,
      nombre: doc.nombre,
      nombreOriginal: doc.nombreOriginal,
      tipo: doc.tipo,
      extension: doc.extension,
      tamanio: doc.tamanio,
      descripcion: doc.descripcion,
      esInterno: doc.esInterno,
      url: doc.url || '',
      storageKey: doc.storageKey,
      casoId: doc.casoId,
      carpetaId: doc.carpetaId ?? null,
      subidoPor: doc.subidoPor?.nombre && doc.subidoPor?.apellido
        ? `${doc.subidoPor.nombre} ${doc.subidoPor.apellido}`
        : (doc.subidoPor?.email?.split('@')[0] || 'Usuario'),
      subidoPorId: doc.subidoPorId,
      createdAt: doc.createdAt,
      diasSubido: differenceInDays(new Date(), doc.createdAt)
    }
  }

  private async mapearCarpeta(carpetaId: string): Promise<CarpetaListItem | null> {
    const c = await prisma.carpeta.findUnique({ where: { id: carpetaId } })
    if (!c) return null
    return this.mapearCarpetaDesde(c)
  }

  private async mapearCarpetaDesde(c: any): Promise<CarpetaListItem> {
    const [cantidadDocumentos, cantidadSubcarpetas] = await Promise.all([
      prisma.documento.count({ where: { carpetaId: c.id } }),
      prisma.carpeta.count({ where: { carpetaPadreId: c.id } })
    ])
    return {
      id: c.id,
      nombre: c.nombre,
      casoId: c.casoId,
      carpetaPadreId: c.carpetaPadreId ?? null,
      cantidadDocumentos,
      cantidadSubcarpetas,
      createdAt: c.createdAt
    }
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------
  formatearTamanio(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}