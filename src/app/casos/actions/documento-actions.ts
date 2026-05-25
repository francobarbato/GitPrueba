// app/casos/actions/documento-actions.ts
'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { DocumentoService } from "@/lib/aplication/services/documento.service"
import { revalidatePath } from "next/cache"

const documentoService = new DocumentoService()

export type DocumentoActionState = {
  error?: string | null
  message?: string | null
  documentoId?: string | null
}

export type CarpetaActionResult = {
  error?: string | null
  message?: string | null
  carpetaId?: string | null
}

// Helper para refrescar las vistas que muestran documentos.
function revalidarVistas(casoId: string) {
  revalidatePath(`/casos/${casoId}`)
  revalidatePath(`/documentos`)
}

// ============================================================================
// DOCUMENTOS
// ============================================================================

export async function subirDocumentoAction(
  prevState: DocumentoActionState,
  formData: FormData
): Promise<DocumentoActionState> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: 'No autorizado' }

  const userRol = user.rol?.toUpperCase()

  const esInterno = formData.get('esInterno') === 'true'
  if (userRol === 'ASISTENTE' && esInterno) {
    return { error: 'No tenés permiso para subir documentos internos' }
  }

  const casoId = formData.get('casoId') as string
  const carpetaIdRaw = formData.get('carpetaId') as string | null
  const carpetaId = carpetaIdRaw && carpetaIdRaw !== '' ? carpetaIdRaw : null
  const descripcion = formData.get('descripcion') as string
  const archivo = formData.get('archivo') as File

  if (!casoId) return { error: 'Expediente no especificado' }
  if (!archivo || archivo.size === 0) return { error: 'No se seleccionó ningún archivo' }

  try {
    const bytes = await archivo.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const documento = await documentoService.subirDocumento(
      {
        casoId,
        subidoPorId: user.id,
        carpetaId,
        descripcion: descripcion || undefined,
        esInterno,
        file: { buffer, nombre: archivo.name, tipo: archivo.type, tamanio: archivo.size }
      },
      { usuarioId: user.id, rol: user.rol }
    )

    revalidarVistas(casoId)
    return { message: `Documento "${archivo.name}" subido correctamente`, documentoId: documento.id }
  } catch (error: any) {
    console.error('Error subiendo documento:', error)
    return { error: error.message || 'Error al subir el documento' }
  }
}

export async function eliminarDocumentoAction(
  documentoId: string,
  casoId: string
): Promise<DocumentoActionState> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: 'No autorizado' }
  if (user.rol?.toUpperCase() === 'ASISTENTE') {
    return { error: 'No tenés permiso para eliminar documentos' }
  }

  try {
    await documentoService.eliminarDocumento(documentoId, user.id, { usuarioId: user.id, rol: user.rol })
    revalidarVistas(casoId)
    return { message: 'Documento eliminado correctamente' }
  } catch (error: any) {
    console.error('Error eliminando documento:', error)
    return { error: error.message || 'Error al eliminar el documento' }
  }
}

export async function moverDocumentoAction(
  documentoId: string,
  nuevaCarpetaId: string | null,
  casoId: string
): Promise<DocumentoActionState> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: 'No autorizado' }

  try {
    await documentoService.moverDocumento(documentoId, nuevaCarpetaId, { usuarioId: user.id, rol: user.rol })
    revalidarVistas(casoId)
    return { message: 'Documento movido correctamente' }
  } catch (error: any) {
    console.error('Error moviendo documento:', error)
    return { error: error.message || 'Error al mover el documento' }
  }
}

export async function actualizarDocumentoAction(
  prevState: DocumentoActionState,
  formData: FormData
): Promise<DocumentoActionState> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: 'No autorizado' }
  if (user.rol?.toUpperCase() === 'ASISTENTE') {
    return { error: 'No tenés permiso para editar documentos' }
  }

  const documentoId = formData.get('documentoId') as string
  const casoId = formData.get('casoId') as string
  const descripcion = formData.get('descripcion') as string
  const esInterno = formData.get('esInterno') === 'true'

  if (!documentoId) return { error: 'Documento no especificado' }
  if (!casoId) return { error: 'Expediente no especificado' }

  try {
    await documentoService.actualizarDocumento(
      documentoId, user.id,
      { descripcion: descripcion || undefined, esInterno },
      { usuarioId: user.id, rol: user.rol }
    )
    revalidarVistas(casoId)
    return { message: 'Documento actualizado correctamente' }
  } catch (error: any) {
    console.error('Error actualizando documento:', error)
    return { error: error.message || 'Error al actualizar el documento' }
  }
}

// ============================================================================
// CARPETAS
// ============================================================================
// Permisos: crear/renombrar → ABOGADO y ASISTENTE | borrar → solo ABOGADO.

export async function crearCarpetaAction(
  casoId: string,
  nombre: string,
  carpetaPadreId: string | null
): Promise<CarpetaActionResult> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: 'No autorizado' }

  const rol = user.rol?.toUpperCase()
  if (rol !== 'ABOGADO' && rol !== 'ASISTENTE') {
    return { error: 'No tenés permiso para crear carpetas' }
  }

  try {
    const carpeta = await documentoService.crearCarpeta(
      casoId, nombre, carpetaPadreId, { usuarioId: user.id, rol: user.rol }
    )
    revalidarVistas(casoId)
    return { message: `Carpeta "${carpeta.nombre}" creada`, carpetaId: carpeta.id }
  } catch (error: any) {
    return { error: error.message || 'Error al crear la carpeta' }
  }
}

export async function renombrarCarpetaAction(
  carpetaId: string,
  nuevoNombre: string,
  casoId: string
): Promise<CarpetaActionResult> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: 'No autorizado' }

  const rol = user.rol?.toUpperCase()
  if (rol !== 'ABOGADO' && rol !== 'ASISTENTE') {
    return { error: 'No tenés permiso para renombrar carpetas' }
  }

  try {
    await documentoService.renombrarCarpeta(carpetaId, nuevoNombre, { usuarioId: user.id, rol: user.rol })
    revalidarVistas(casoId)
    return { message: 'Carpeta renombrada' }
  } catch (error: any) {
    return { error: error.message || 'Error al renombrar la carpeta' }
  }
}

export async function eliminarCarpetaAction(
  carpetaId: string,
  casoId: string
): Promise<CarpetaActionResult> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: 'No autorizado' }

  // Borrar carpeta es destructivo → solo ABOGADO.
  if (user.rol?.toUpperCase() !== 'ABOGADO') {
    return { error: 'Solo el abogado responsable puede eliminar carpetas' }
  }

  try {
    const res = await documentoService.eliminarCarpeta(carpetaId, { usuarioId: user.id, rol: user.rol })
    revalidarVistas(casoId)
    return { message: `Carpeta eliminada (${res.documentosEliminados} documento(s) borrados)` }
  } catch (error: any) {
    return { error: error.message || 'Error al eliminar la carpeta' }
  }
}