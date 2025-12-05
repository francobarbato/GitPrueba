'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { ClienteService } from "@/lib/aplication/services/cliente.service"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const clienteService = new ClienteService()

export type State = {
  error?: string | null
  message?: string | null
}

// ¡IMPORTANTE! Debe decir "export async function"
export async function crearClienteAction(prevState: State, formData: FormData): Promise<State> {
  
  const user = await getUserSessionServer()
  
  if (!user || !user.id) {
    return { error: "Usuario no autorizado o sesión inválida" }
  }

  const rawData = {
    nombre: formData.get("nombre") as string,
    apellido: formData.get("apellido") as string,
    email: formData.get("email") as string,
    telefono: formData.get("telefono") as string,
    numeroDocumento: formData.get("numeroDocumento") as string,
    tipoDocumento: (formData.get("tipoDocumento") as string) || "DNI",
    direccion: formData.get("direccion") as string,
    estado: "Activo" // Valor por defecto
  }

  try {
    await clienteService.createCliente(rawData, user.id)
  } catch (error: any) {
    console.error("Error creando cliente:", error)
    return { error: error.message || "Error al crear el cliente" }
  }

  revalidatePath("/clientes")
  redirect("/clientes")
  
  return { message: "Creado" }
}
export async function actualizarClienteAction(prevState: State, formData: FormData): Promise<State> {
  const user = await getUserSessionServer()
  
  if (!user || !user.id) {
    return { error: "No autorizado" }
  }

  const clienteId = formData.get("id") as string
  if (!clienteId) return { error: "ID de cliente inválido" }

  // 1. Verificar permisos (Igual que en Casos)
  const clienteExistente = await clienteService.getClienteById(clienteId)
  if (!clienteExistente) return { error: "Cliente no encontrado" }

  if (user.rol !== 'admin' && clienteExistente.abogadoId !== user.id) {
    return { error: "No tienes permisos para editar este cliente" }
  }

  // 2. Preparar datos
  const rawData = {
    nombre: formData.get("nombre") as string,
    apellido: formData.get("apellido") as string,
    email: formData.get("email") as string,
    telefono: formData.get("telefono") as string,
    numeroDocumento: formData.get("numeroDocumento") as string,
    tipoDocumento: formData.get("tipoDocumento") as string,
    direccion: formData.get("direccion") as string,
    estado: formData.get("estado") as string,
  }

  // 3. Actualizar
  try {
    await clienteService.actualizarCliente(clienteId, rawData)
  } catch (error: any) {
    console.error("Error actualizando cliente:", error)
    // Manejo básico de duplicados (ej: email)
    if (error.message.includes("email")) return { error: "El email ya está registrado por otro cliente." }
    return { error: "Error al actualizar el cliente." }
  }

  revalidatePath("/clientes")
  redirect("/clientes")
}