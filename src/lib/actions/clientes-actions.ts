// src/lib/actions/clientes-actions.ts


'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type ClienteState = {
  message?: string | null
  error?: string | null
}

// ============================================================================
// CREAR CLIENTE (ACTUALIZADO CON creadoPorId)
// ============================================================================
export async function crearClienteAction(
  prevState: ClienteState,
  formData: FormData
): Promise<ClienteState> {
  const user = await getUserSessionServer()

  if (!user || !user.id) {
    return { error: "No autorizado. Debes iniciar sesión." }
  }

  const userRol = user.rol?.toUpperCase()

  // Extraer datos del formulario
  const nombre = formData.get("nombre") as string
  const apellido = formData.get("apellido") as string | null
  const tipoPersona = formData.get("tipoPersona") as string
  const tipoDocumento = formData.get("tipoDocumento") as string
  const numeroDocumento = formData.get("numeroDocumento") as string
  const condicionIva = formData.get("condicionIva") as string
  const email = formData.get("email") as string | null
  const telefono = formData.get("telefono") as string | null
  const direccion = formData.get("direccion") as string | null
  const notasInternas = formData.get("notasInternas") as string | null
  const activo = formData.get("activo") === "on"

  // Validaciones básicas
  if (!nombre || nombre.trim().length < 2) {
    return { error: "El nombre es obligatorio y debe tener al menos 2 caracteres" }
  }

  if (!numeroDocumento || numeroDocumento.trim().length < 5) {
    return { error: "El número de documento es obligatorio" }
  }

  if (tipoPersona === "FISICA" && (!apellido || apellido.trim().length < 2)) {
    return { error: "El apellido es obligatorio para personas físicas" }
  }

  // Verificar documento único
  const existeDocumento = await prisma.cliente.findUnique({
    where: { numeroDocumento: numeroDocumento.trim() }
  })

  if (existeDocumento) {
    return { error: `Ya existe un cliente con el documento ${numeroDocumento}` }
  }

  // ===== DETERMINAR abogadoId =====
  // Si es Asistente: el cliente queda "sin abogado asignado" hasta que se use en un caso
  // Si es Abogado: se asigna a sí mismo
  // Si es Admin: se asigna a sí mismo (puede reasignarlo después)
  
  let abogadoId: string
  
  if (userRol === 'ASISTENTE') {
    // Para el Asistente, necesitamos un abogado por defecto (el primer admin o el sistema)
    // O podemos hacer que el cliente se asigne al abogado cuando se crea el caso
    // Por ahora, asignamos al primer admin disponible
    const adminDefault = await prisma.user.findFirst({
      where: { rol: 'ADMIN', isActive: true },
      select: { id: true }
    })
    
    if (!adminDefault) {
      return { error: "No hay administrador disponible para asignar el cliente" }
    }
    
    abogadoId = adminDefault.id
  } else {
    // Abogado o Admin se asignan a sí mismos
    abogadoId = user.id
  }

  try {
    await prisma.cliente.create({
      data: {
        nombre: nombre.trim(),
        apellido: apellido?.trim() || null,
        tipoPersona: tipoPersona as any,
        tipoDocumento: tipoDocumento as any,
        numeroDocumento: numeroDocumento.trim(),
        condicionIva: condicionIva as any,
        email: email?.trim() || null,
        telefono: telefono?.trim() || null,
        direccion: direccion?.trim() || null,
        notasInternas: notasInternas?.trim() || null,
        activo: activo,
        abogadoId: abogadoId,
        creadoPorId: user.id  // ← NUEVO: Guardar quién creó el cliente
      }
    })

    console.log(`✅ Cliente creado: ${nombre} - Creado por: ${user.id} (${userRol})`)

  } catch (error: any) {
    console.error("Error creando cliente:", error)
    return { error: error.message || "Error al crear el cliente" }
  }

  revalidatePath("/clientes")
  redirect("/clientes")
}

// ============================================================================
// ACTUALIZAR CLIENTE
// ============================================================================
export async function actualizarClienteAction(
  prevState: ClienteState,
  formData: FormData
): Promise<ClienteState> {
  const user = await getUserSessionServer()

  if (!user || !user.id) {
    return { error: "No autorizado" }
  }

  const clienteId = formData.get("id") as string
  if (!clienteId) {
    return { error: "ID de cliente no válido" }
  }

  const nombre = formData.get("nombre") as string
  const apellido = formData.get("apellido") as string | null
  const tipoPersona = formData.get("tipoPersona") as string
  const tipoDocumento = formData.get("tipoDocumento") as string
  const numeroDocumento = formData.get("numeroDocumento") as string
  const condicionIva = formData.get("condicionIva") as string
  const email = formData.get("email") as string | null
  const telefono = formData.get("telefono") as string | null
  const direccion = formData.get("direccion") as string | null
  const notasInternas = formData.get("notasInternas") as string | null
  const activo = formData.get("activo") === "on"

  // Validaciones
  if (!nombre || nombre.trim().length < 2) {
    return { error: "El nombre es obligatorio" }
  }

  if (!numeroDocumento || numeroDocumento.trim().length < 5) {
    return { error: "El número de documento es obligatorio" }
  }

  // Verificar documento único (excluyendo el cliente actual)
  const existeDocumento = await prisma.cliente.findFirst({
    where: {
      numeroDocumento: numeroDocumento.trim(),
      id: { not: clienteId }
    }
  })

  if (existeDocumento) {
    return { error: `Ya existe otro cliente con el documento ${numeroDocumento}` }
  }

  try {
    await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        nombre: nombre.trim(),
        apellido: apellido?.trim() || null,
        tipoPersona: tipoPersona as any,
        tipoDocumento: tipoDocumento as any,
        numeroDocumento: numeroDocumento.trim(),
        condicionIva: condicionIva as any,
        email: email?.trim() || null,
        telefono: telefono?.trim() || null,
        direccion: direccion?.trim() || null,
        notasInternas: notasInternas?.trim() || null,
        activo: activo
      }
    })

  } catch (error: any) {
    console.error("Error actualizando cliente:", error)
    return { error: "Error al actualizar el cliente" }
  }

  revalidatePath("/clientes")
  revalidatePath(`/clientes/${clienteId}`)
  redirect("/clientes")
}

// ============================================================================
// ELIMINAR CLIENTE (Soft Delete)
// ============================================================================
export async function eliminarClienteAction(clienteId: string): Promise<ClienteState> {
  const user = await getUserSessionServer()

  if (!user || !user.id) {
    return { error: "No autorizado" }
  }

  try {
    // Verificar si tiene casos activos
    const casosActivos = await prisma.caso.count({
      where: {
        clienteId: clienteId,
        estado: {
          notIn: ['Terminado', 'Archivado']
        }
      }
    })

    if (casosActivos > 0) {
      return { error: `No se puede eliminar: el cliente tiene ${casosActivos} caso(s) activo(s)` }
    }

    // Soft delete
    await prisma.cliente.update({
      where: { id: clienteId },
      data: { activo: false }
    })

    revalidatePath("/clientes")
    return { message: "Cliente eliminado correctamente" }

  } catch (error: any) {
    console.error("Error eliminando cliente:", error)
    return { error: "Error al eliminar el cliente" }
  }
}