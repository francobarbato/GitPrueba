"use server" // <-- ESTO ES LO MÁS IMPORTANTÉ: Obliga a todo este archivo a correr en el servidor

import { DocumentoService, DocumentoUploadInput } from "../../../lib/aplication/services/documento.service"
import { revalidatePath } from "next/cache"

// Instanciamos el servicio acá, donde es seguro porque estamos del lado del servidor
const documentoService = new DocumentoService()

// Action para obtener los documentos agrupados por carpeta
export async function fetchDocumentosPorCaso(casoId: string, opciones?: { soloPublicos?: boolean }) {
  try {
    return await documentoService.getDocumentosPorCaso(casoId, opciones)
  } catch (error: any) {
    console.error("Error en fetchDocumentosPorCaso:", error)
    throw new Error(error.message || "Error al cargar documentos")
  }
}

// Action para eliminar un documento
export async function actionEliminarDocumento(documentoId: string, usuarioId: string, casoId: string) {
  try {
    const result = await documentoService.eliminarDocumento(documentoId, usuarioId)
    // Forzamos a Next.js a refrescar la pantalla para ver el cambio reflejado
    revalidatePath(`/casos/${casoId}`) 
    return result
  } catch (error: any) {
    throw new Error(error.message || "Error al eliminar el documento")
  }
}