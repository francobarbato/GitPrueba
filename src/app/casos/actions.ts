'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { CasoService } from "@/lib/aplication/services/caso.service"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const casoService = new CasoService()

export type State = {
  error?: string | null
  message?: string | null
}

// Acción para CREAR (ya la tenías)
export async function crearCasoAction(prevState: State, formData: FormData): Promise<State> {
  // ... (tu código de crear) ...
  return { message: "Creado" }
}

// Acción para ACTUALIZAR (Asegúrate de tener esta función con EXPORT)
export async function actualizarCasoAction(prevState: State, formData: FormData): Promise<State> {
  const user = await getUserSessionServer()
  
  if (!user || !user.id) {
    return { error: "No autorizado" }
  }

  const casoId = formData.get("id") as string
  if (!casoId) return { error: "ID de caso no válido" }

  const casoExistente = await casoService.getCasoById(casoId)
  if (!casoExistente) return { error: "Caso no encontrado" }
  
  // Verificación de seguridad
  if (user.rol !== 'admin' && casoExistente.abogadoId !== user.id) {
    return { error: "No tienes permisos para editar este caso" }
  }

  const rawData = {
    numero: formData.get("numero") as string,
    titulo: formData.get("titulo") as string,
    descripcion: formData.get("descripcion") as string,
    tipo: formData.get("tipo") as string,
    estado: formData.get("estado") as string,
    clienteId: formData.get("clienteId") as string,
  }

  try {
    await casoService.updateCaso(casoId, rawData)
  } catch (error: any) {
    console.error("Error actualizando caso:", error)
    return { error: "Error al actualizar el caso" }
  }

  revalidatePath("/casos")
  revalidatePath(`/casos/${casoId}`)
  redirect("/casos")
}