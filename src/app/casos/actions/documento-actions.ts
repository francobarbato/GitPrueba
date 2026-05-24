// app/casos/actions/documento-actions.ts
'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { DocumentoService } from "@/lib/aplication/services/documento.service"
import { CarpetaDocumento } from "@prisma/client"
import { revalidatePath } from "next/cache"

const documentoService = new DocumentoService()

export type DocumentoActionState = {
  error?: string | null
  message?: string | null
  documentoId?: string | null
}

// ============================================================================
// 1. SUBIR DOCUMENTO
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
  const carpeta = formData.get('carpeta') as CarpetaDocumento
  const descripcion = formData.get('descripcion') as string
  const archivo = formData.get('archivo') as File

  if (!casoId) return { error: 'Caso no especificado' }
  if (!carpeta) return { error: 'Carpeta no especificada' }
  if (!archivo || archivo.size === 0) return { error: 'No se seleccionó ningún archivo' }

  const carpetasValidas = Object.values(CarpetaDocumento)
  if (!carpetasValidas.includes(carpeta)) {
    return { error: 'Carpeta no válida' }
  }

  try {
    const bytes = await archivo.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const documento = await documentoService.subirDocumento(
      {
        casoId,
        subidoPorId: user.id,
        carpeta,
        descripcion: descripcion || undefined,
        esInterno,
        file: {
          buffer,
          nombre: archivo.name,
          tipo: archivo.type,
          tamanio: archivo.size
        }
      },
      { usuarioId: user.id, rol: user.rol }   // ← ownership
    )

    revalidatePath(`/casos/${casoId}`)
    revalidatePath(`/documentos`)

    return {
      message: `Documento "${archivo.name}" subido correctamente`,
      documentoId: documento.id
    }

  } catch (error: any) {
    console.error('Error subiendo documento:', error)
    return { error: error.message || 'Error al subir el documento' }
  }
}

// ============================================================================
// 2. ELIMINAR DOCUMENTO
// ============================================================================

export async function eliminarDocumentoAction(
  documentoId: string,
  casoId: string
): Promise<DocumentoActionState> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: 'No autorizado' }

  const userRol = user.rol?.toUpperCase()
  if (userRol === 'ASISTENTE') {
    return { error: 'No tenés permiso para eliminar documentos' }
  }

  try {
    await documentoService.eliminarDocumento(
      documentoId,
      user.id,
      { usuarioId: user.id, rol: user.rol }   // ← ownership
    )

    revalidatePath(`/casos/${casoId}`)
    revalidatePath(`/documentos`)

    return { message: 'Documento eliminado correctamente' }

  } catch (error: any) {
    console.error('Error eliminando documento:', error)
    return { error: error.message || 'Error al eliminar el documento' }
  }
}

// ============================================================================
// 3. ACTUALIZAR METADATA DEL DOCUMENTO
// ============================================================================

export async function actualizarDocumentoAction(
  prevState: DocumentoActionState,
  formData: FormData
): Promise<DocumentoActionState> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: 'No autorizado' }

  const userRol = user.rol?.toUpperCase()
  if (userRol === 'ASISTENTE') {
    return { error: 'No tenés permiso para editar documentos' }
  }

  const documentoId = formData.get('documentoId') as string
  const casoId = formData.get('casoId') as string
  const descripcion = formData.get('descripcion') as string
  const carpeta = formData.get('carpeta') as CarpetaDocumento
  const esInterno = formData.get('esInterno') === 'true'

  if (!documentoId) return { error: 'Documento no especificado' }
  if (!casoId) return { error: 'Caso no especificado' }

  try {
    await documentoService.actualizarDocumento(
      documentoId,
      user.id,
      {
        descripcion: descripcion || undefined,
        carpeta: carpeta || undefined,
        esInterno
      },
      { usuarioId: user.id, rol: user.rol }   // ← ownership
    )

    revalidatePath(`/casos/${casoId}`)
    revalidatePath(`/documentos`)

    return { message: 'Documento actualizado correctamente' }

  } catch (error: any) {
    console.error('Error actualizando documento:', error)
    return { error: error.message || 'Error al actualizar el documento' }
  }
}