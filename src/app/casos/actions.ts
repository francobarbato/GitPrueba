'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { CasoService } from "@/lib/aplication/services/caso.service"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma" 
import { Priority } from "@prisma/client"

const casoService = new CasoService()

export type State = {
  error?: string | null
  message?: string | null
}

// --- ACCIÓN CREAR (SIN CAMBIOS, LA DEJAMOS IGUAL) ---
export async function crearCasoAction(prevState: State, formData: FormData): Promise<State> {
  const user = await getUserSessionServer()
  
  if (!user || !user.id) {
    return { error: "No autorizado. Debes iniciar sesión." }
  }

  const requirementsRaw = formData.get("requirements") as string
  let requirementsData = []
  try {
    if (requirementsRaw) {
        requirementsData = JSON.parse(requirementsRaw)
    }
  } catch (e) {
    console.error("Error parseando requisitos", e)
  }

  const dataToCreate = {
    numero: formData.get("numero") as string,
    titulo: formData.get("titulo") as string,
    descripcion: formData.get("descripcion") as string,
    tipo: formData.get("tipo") as string,
    fechaInicio: formData.get("fechaInicio") as string,
    clienteId: formData.get("clienteId") as string,
    priority: (formData.get("priority") as string) || "NORMAL",
    isFavorite: formData.get("isFavorite") === "on",
    requirements: requirementsData 
  }

  if (!dataToCreate.numero || !dataToCreate.titulo || !dataToCreate.clienteId) {
      return { error: "Faltan campos obligatorios" }
  }

  try {
    await casoService.createCaso(dataToCreate, user.id)
  } catch (error: any) {
    return { error: error.message || "Error al crear el caso" }
  }

  revalidatePath("/casos")
  revalidatePath("/reportes/carga-trabajo")
  redirect("/casos")
}

// --- ACCIÓN ACTUALIZAR (CORREGIDA Y COMPLETA) ---
export async function actualizarCasoAction(prevState: State, formData: FormData): Promise<State> {
  const user = await getUserSessionServer()
  
  if (!user || !user.id) {
    return { error: "No autorizado" }
  }

  const casoId = formData.get("id") as string
  if (!casoId) return { error: "ID de caso no válido" }

  // Parseamos el Checklist
  const requirementsRaw = formData.get("requirements") as string
  let requirementsData = []
  try {
    if (requirementsRaw) {
        requirementsData = JSON.parse(requirementsRaw)
    }
  } catch (e) {
    console.error("Error parseando requisitos update", e)
  }

  // 2. CORREGIMOS EL TIPO DE PRIORITY AQUÍ
  // Convertimos el string que viene del form al tipo 'Priority' de Prisma
  const priorityValue = formData.get("priority") as string
  // Si no viene nada o es inválido, usamos NORMAL por defecto
  const priorityEnum = (priorityValue && ["HIGH", "NORMAL", "LOW"].includes(priorityValue)) 
                        ? (priorityValue as Priority) 
                        : Priority.NORMAL

  const rawData = {
    numero: formData.get("numero") as string,
    titulo: formData.get("titulo") as string,
    descripcion: formData.get("descripcion") as string,
    tipo: formData.get("tipo") as string,
    estado: formData.get("estado") as string,
    clienteId: formData.get("clienteId") as string,
    
    priority: priorityEnum, // <--- AHORA SÍ ES DEL TIPO CORRECTO
    isFavorite: formData.get("isFavorite") === "on",
  }

  try {
    await prisma.caso.update({
        where: { id: casoId },
        data: {
            ...rawData,
            requirements: {
                deleteMany: {}, 
                create: requirementsData.map((req: any) => ({
                    description: req.description,
                    dueDate: req.dueDate ? new Date(req.dueDate) : null,
                    isCompleted: req.isCompleted || false 
                }))
            }
        }
    })

  } catch (error: any) {
    console.error("Error actualizando caso:", error)
    return { error: "Error al actualizar el caso" }
  }

  revalidatePath("/casos")
  revalidatePath(`/casos/${casoId}`)
  revalidatePath("/reportes/carga-trabajo")
  redirect("/casos")
}