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
  if (userRol === 'ADMIN') {
  return { error: "El administrador no puede crear clientes." }
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

  const tipoSociedad = formData.get("tipoSociedad") as string | null
  const representanteNombre = formData.get("representanteNombre") as string | null
  const representanteDni = formData.get("representanteDni") as string | null
  const bienesEmbargables = formData.get("bienesEmbargables") as string | null

  const tipoDocumentoFinal = tipoPersona === "JURIDICA" ? "CUIT" : tipoDocumento

  if (!nombre || nombre.trim().length < 2) {
    return { error: "El nombre es obligatorio y debe tener al menos 2 caracteres" }
  }

  if (!numeroDocumento || numeroDocumento.trim().length < 5) {
    return { error: "El número de documento es obligatorio" }
  }

  if (tipoPersona === "FISICA" && (!apellido || apellido.trim().length < 2)) {
    return { error: "El apellido es obligatorio para personas físicas" }
  }

  if (tipoPersona === "JURIDICA") {
    if (!tipoSociedad || tipoSociedad.trim() === "") {
      return { error: "El tipo de sociedad es obligatorio para personas jurídicas" }
    }
    if (!representanteNombre || representanteNombre.trim().length < 2) {
      return { error: "El nombre del representante legal es obligatorio para personas jurídicas" }
    }
    if (!representanteDni || representanteDni.trim().length < 5) {
      return { error: "El DNI del representante es obligatorio para personas jurídicas" }
    }
  }

  const existeDocumento = await prisma.cliente.findUnique({
    where: { numeroDocumento: numeroDocumento.trim() }
  })

  if (existeDocumento) {
    return { error: `Ya existe un cliente con el documento ${numeroDocumento}` }
  }

  if (!email || email.trim().length === 0) {
  return { error: "El email es obligatorio" }
}

if (!telefono || telefono.trim().length === 0) {
  return { error: "El teléfono es obligatorio" }
}
if (!direccion || direccion.trim().length < 5) {
  return { error: "La dirección es obligatoria" }
}

  let abogadoId: string
  
if (userRol === 'ASISTENTE') {
  const abogadoIdFromForm = formData.get("abogadoId") as string
  if (!abogadoIdFromForm) {
    return { error: "Debes seleccionar un abogado responsable para el cliente" }
  }
  // Verificar que existe y es ABOGADO
  const abogadoExiste = await prisma.user.findFirst({
    where: { id: abogadoIdFromForm, isActive: true, rol: 'ABOGADO' }
  })
  if (!abogadoExiste) {
    return { error: "El abogado seleccionado no es válido" }
  }
  abogadoId = abogadoIdFromForm
  } else {
    abogadoId = user.id
  }

  try {
    await prisma.cliente.create({
      data: {
        nombre: nombre.trim(),
        apellido: apellido?.trim() || null,
        tipoPersona: tipoPersona as any,
        tipoDocumento: tipoDocumentoFinal as any,
        numeroDocumento: numeroDocumento.trim(),
        condicionIva: condicionIva as any,
        email: email?.trim() || null,
        telefono: telefono?.trim() || null,
        direccion: direccion?.trim() || null,
        notasInternas: notasInternas?.trim() || null,
        activo: activo,
        abogadoId: abogadoId,
        creadoPorId: user.id,
        tipoSociedad: tipoPersona === "JURIDICA" ? tipoSociedad?.trim() || null : null,
        representanteNombre: tipoPersona === "JURIDICA" ? representanteNombre?.trim() || null : null,
        representanteDni: tipoPersona === "JURIDICA" ? representanteDni?.trim() || null : null,
        bienesEmbargables: tipoPersona === "FISICA" ? bienesEmbargables?.trim() || null : null,
      }
    })

    console.log(`✅ Cliente creado: ${nombre} - Creado por: ${user.id} (${userRol})`)

} catch (error: any) {
  console.error("Error en crearClienteAction:", error)

  if (error.code === 'P2002') {
    const target = error.meta?.target as string || ''
    
    if (target.includes('numeroDocumento')) {
      return { error: "Ya existe un cliente con ese número de documento." }
    }
    if (target.includes('email')) {
      return { error: "Ya existe un cliente registrado con ese email." }
    }
    if (target.includes('telefono')) {
      return { error: "Ya existe un cliente registrado con ese teléfono." }
    }
    
    return { error: "Ya existe un cliente con alguno de los datos ingresados." }
  }

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

  const userRol = user.rol?.toUpperCase()
  if (userRol === 'ADMIN') {
  return { error: "El administrador no puede editar clientes." }
}

  const clienteId = formData.get("id") as string
  if (!clienteId) {
    return { error: "ID de cliente no válido" }
  }

  // ===== VERIFICACIÓN DE OWNERSHIP =====
  const clienteExistente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { 
      abogadoId: true, 
      creadoPorId: true,
      nombre: true,
      apellido: true,
      tipoPersona: true,
      tipoDocumento: true,
      numeroDocumento: true,
    }
  })

  if (!clienteExistente) {
    return { error: "Cliente no encontrado" }
  }

  const esAdmin = userRol === 'ADMIN'
  const esAsistente = userRol === 'ASISTENTE'
  const esPropietario = clienteExistente.abogadoId === user.id
  const esCreador = clienteExistente.creadoPorId === user.id

  if (!esAdmin && !esAsistente && !esPropietario && !esCreador) {
    return { error: "No tenés permiso para editar este cliente" }
  }
  // =====================================

  const nombre = clienteExistente.nombre
  const apellido = clienteExistente.apellido
  const tipoPersona = clienteExistente.tipoPersona
  const tipoDocumento = clienteExistente.tipoDocumento
  const numeroDocumento = clienteExistente.numeroDocumento
  const condicionIva = formData.get("condicionIva") as string
  const email = formData.get("email") as string | null
  const telefono = formData.get("telefono") as string | null
  const direccion = formData.get("direccion") as string | null
  const notasInternas = formData.get("notasInternas") as string | null
  const activo = formData.get("activo") === "on"

  const tipoSociedad = formData.get("tipoSociedad") as string | null
  const representanteNombre = formData.get("representanteNombre") as string | null
  const representanteDni = formData.get("representanteDni") as string | null
  const bienesEmbargables = formData.get("bienesEmbargables") as string | null

  const tipoDocumentoFinal = tipoPersona === "JURIDICA" ? "CUIT" : tipoDocumento


  if (tipoPersona === "JURIDICA") {
    if (!tipoSociedad || tipoSociedad.trim() === "") {
      return { error: "El tipo de sociedad es obligatorio para personas jurídicas" }
    }
    if (!representanteNombre || representanteNombre.trim().length < 2) {
      return { error: "El nombre del representante legal es obligatorio para personas jurídicas" }
    }
    if (!representanteDni || representanteDni.trim().length < 5) {
      return { error: "El DNI del representante es obligatorio para personas jurídicas" }
    }
  }

  const existeDocumento = await prisma.cliente.findFirst({
    where: {
      numeroDocumento: numeroDocumento.trim(),
      id: { not: clienteId }
    }
  })

  if (existeDocumento) {
    return { error: `Ya existe otro cliente con el documento ${numeroDocumento}` }
  }
  if (!email || email.trim().length === 0) {
  return { error: "El email es obligatorio" }
}

if (!telefono || telefono.trim().length === 0) {
  return { error: "El teléfono es obligatorio" }
}

  try {
    await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        nombre: nombre.trim(),
        apellido: apellido?.trim() || null,
        tipoPersona: tipoPersona as any,
        tipoDocumento: tipoDocumentoFinal as any,
        numeroDocumento: numeroDocumento.trim(),
        condicionIva: condicionIva as any,
        email: email?.trim() || null,
        telefono: telefono?.trim() || null,
        direccion: direccion?.trim() || null,
        notasInternas: notasInternas?.trim() || null,
        activo: activo,
        tipoSociedad: tipoPersona === "JURIDICA" ? tipoSociedad?.trim() || null : null,
        representanteNombre: tipoPersona === "JURIDICA" ? representanteNombre?.trim() || null : null,
        representanteDni: tipoPersona === "JURIDICA" ? representanteDni?.trim() || null : null,
        bienesEmbargables: tipoPersona === "FISICA" ? bienesEmbargables?.trim() || null : null,
      }
    })

} catch (error: any) {
  console.error("Error en crearClienteAction:", error)

  if (error.code === 'P2002') {
    const target = error.meta?.target as string || ''
    
    if (target.includes('numeroDocumento')) {
      return { error: "Ya existe un cliente con ese número de documento." }
    }
    if (target.includes('email')) {
      return { error: "Ya existe un cliente registrado con ese email." }
    }
    if (target.includes('telefono')) {
      return { error: "Ya existe un cliente registrado con ese teléfono." }
    }
    
    return { error: "Ya existe un cliente con alguno de los datos ingresados." }
  }

  return { error: error.message || "Error al crear el cliente" }
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

  const userRol = user.rol?.toUpperCase()

  // ===== VERIFICACIÓN DE OWNERSHIP =====
  const clienteExistente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { abogadoId: true, creadoPorId: true }
  })

  if (!clienteExistente) {
    return { error: "Cliente no encontrado" }
  }

  const esPropietario = clienteExistente.abogadoId === user.id
  const esCreador = clienteExistente.creadoPorId === user.id

  // Asistente NO puede eliminar — solo Admin, propietario o creador
  if (!esPropietario && !esCreador) {
    return { error: "No tenés permiso para eliminar este cliente" }
  }
  // =====================================

  try {
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