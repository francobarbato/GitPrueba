"use server"

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { DocumentoService } from "../../../lib/aplication/services/documento.service"

const documentoService = new DocumentoService()

// ============================================================================
// LECTURA DE DOCUMENTOS / CARPETAS
// ============================================================================
// Reemplaza al viejo fetchDocumentosPorCaso (que agrupaba por enum).
// Ahora la navegación es por carpetas anidadas.

// Contenido de un nivel: breadcrumb + subcarpetas + documentos.
// carpetaId = null → raíz del expediente.
export async function fetchContenidoCarpeta(
  casoId: string,
  carpetaId: string | null,
  opciones?: { soloPublicos?: boolean }
) {
  const user = await getUserSessionServer()
  if (!user?.id) throw new Error("No autorizado")

  try {
    return await documentoService.getContenido(
      casoId,
      carpetaId,
      opciones,
      { usuarioId: user.id, rol: user.rol }
    )
  } catch (error: any) {
    console.error("Error en fetchContenidoCarpeta:", error)
    throw new Error(error.message || "Error al cargar el contenido")
  }
}

// Todos los documentos de un caso (vista plana, sin navegar).
export async function fetchTodosLosDocumentos(
  casoId: string,
  opciones?: { soloPublicos?: boolean }
) {
  const user = await getUserSessionServer()
  if (!user?.id) throw new Error("No autorizado")

  try {
    return await documentoService.getTodosLosDocumentos(
      casoId, opciones, { usuarioId: user.id, rol: user.rol }
    )
  } catch (error: any) {
    console.error("Error en fetchTodosLosDocumentos:", error)
    throw new Error(error.message || "Error al cargar documentos")
  }
}

// Lista de carpetas de un caso (para selectores).
export async function fetchCarpetasDelCaso(casoId: string) {
  const user = await getUserSessionServer()
  if (!user?.id) throw new Error("No autorizado")

  try {
    return await documentoService.getCarpetasDelCaso(
      casoId, { usuarioId: user.id, rol: user.rol }
    )
  } catch (error: any) {
    console.error("Error en fetchCarpetasDelCaso:", error)
    throw new Error(error.message || "Error al cargar carpetas")
  }
}