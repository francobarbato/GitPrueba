'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { revalidatePath } from "next/cache"

export async function crearTareaAction(formData: FormData) {
  const user = await getUserSessionServer()
  
  if (!user || !user.id) {
    return { error: "No autorizado" }
  }

  const titulo = formData.get("titulo") as string
  const prioridad = formData.get("prioridad") as string
  const fatal = formData.get("fatal") === "on" // Checkbox
  const casoId = formData.get("casoId") as string // ID del caso seleccionado (opcional)

  if (!titulo) return { error: "El título es obligatorio" }

  try {
    await prisma.tarea.create({
      data: {
        titulo,
        prioridad: prioridad || "Media",
        fatal,
        fecha: "Hoy", // Por defecto para la demo, o podrías poner un input de fecha
        usuarioId: user.id, // ¡USAMOS EL ID REAL!
        casoId: casoId === "none" ? null : casoId
      }
    })
    
    revalidatePath("/gestion-tareas")
    return { success: true }

  } catch (error) {
    console.error("Error creando tarea:", error)
    return { error: "Error al guardar la tarea" }
  }
}

export async function crearComentarioAction(texto: string) {
  const user = await getUserSessionServer()
  if (!user || !user.id) return { error: "No autorizado" }

  try {
    await prisma.bitacora.create({
      data: {
        texto,
        tipo: 'manual',
        usuarioId: user.id
      }
    })
    revalidatePath("/gestion-tareas") // ¡Esto actualiza la pantalla!
    return { success: true }
  } catch (error) {
    console.error("Error bitácora:", error)
    return { error: "No se pudo guardar" }
  }
}

// Acción para marcar como completada (Check)
export async function toggleTareaAction(id: string, estadoActual: boolean) {
  try {
    await prisma.tarea.update({
      where: { id },
      data: { completada: !estadoActual }
    })
    revalidatePath("/gestion-tareas")
  } catch (error) {
    console.error("Error actualizando tarea:", error)
  }
}

