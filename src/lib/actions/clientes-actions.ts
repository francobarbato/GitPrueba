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
// CREAR CLIENTE
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
        email: email?.trim().toLowerCase() || null,
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
    console.log(`Cliente creado: ${nombre} - Creado por: ${user.id} (${userRol})`)

  } catch (error: any) {
    console.error("Error en crearClienteAction:", error)
    if (error.code === 'P2002') {
      const target = error.meta?.target as string || ''
      if (target.includes('numeroDocumento')) return { error: "Ya existe un cliente con ese número de documento." }
      if (target.includes('email')) return { error: "Ya existe un cliente registrado con ese email." }
      if (target.includes('telefono')) return { error: "Ya existe un cliente registrado con ese teléfono." }
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
// Visión A — Email único sincronizado:
// Si el email del cliente cambia Y el cliente tiene portal vinculado, se
// propaga al User.email en una transacción atómica:
//   1. Cliente.email → email nuevo
//   2. User.email del portal → email nuevo
//   3. prisma.session.deleteMany() → invalida sesiones activas (relogin forzado)
//   4. Tokens de activación sin usar → cancelados (link viejo deja de servir)
//   5. Bitácora con trazabilidad
// Si no tiene portal vinculado, solo se actualiza Cliente.email.
// ============================================================================
export async function actualizarClienteAction(
  prevState: ClienteState,
  formData: FormData
): Promise<ClienteState> {
  const user = await getUserSessionServer()
  if (!user || !user.id) return { error: "No autorizado" }

  const userRol = user.rol?.toUpperCase()
  if (userRol === 'ADMIN') return { error: "El administrador no puede editar clientes." }

  const clienteId = formData.get("id") as string
  if (!clienteId) return { error: "ID de cliente no válido" }

  // Cargamos cliente con email actual + datos del portal (si tiene)
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
      email: true,
      usuarioPortalId: true,
      usuarioPortal: { select: { id: true, email: true } }
    }
  })

  if (!clienteExistente) return { error: "Cliente no encontrado" }

  // ===== OWNERSHIP =====
  const esAsistente = userRol === 'ASISTENTE'
  const esPropietario = clienteExistente.abogadoId === user.id
  const esCreador = clienteExistente.creadoPorId === user.id

  if (!esAsistente && !esPropietario && !esCreador) {
    return { error: "No tenés permiso para editar este cliente" }
  }

  // Campos no editables desde el form (vienen de la DB)
  const nombre = clienteExistente.nombre
  const apellido = clienteExistente.apellido
  const tipoPersona = clienteExistente.tipoPersona
  const tipoDocumento = clienteExistente.tipoDocumento
  const numeroDocumento = clienteExistente.numeroDocumento

  // Campos editables del form
  const condicionIva = formData.get("condicionIva") as string
  const emailRaw = (formData.get("email") as string | null) || ""
  const email = emailRaw.trim().toLowerCase() || null
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
    if (!tipoSociedad || tipoSociedad.trim() === "") return { error: "El tipo de sociedad es obligatorio para personas jurídicas" }
    if (!representanteNombre || representanteNombre.trim().length < 2) return { error: "El nombre del representante legal es obligatorio para personas jurídicas" }
    if (!representanteDni || representanteDni.trim().length < 5) return { error: "El DNI del representante es obligatorio para personas jurídicas" }
  }

  if (!email) return { error: "El email es obligatorio" }
  if (!telefono || telefono.trim().length === 0) return { error: "El teléfono es obligatorio" }

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!EMAIL_REGEX.test(email)) return { error: "El email no tiene un formato válido" }

  // ===== ¿Cambió el email? =====
  const emailActual = clienteExistente.email?.toLowerCase() ?? null
  const emailCambio = email !== emailActual

  // ===== Si cambió: validar unicidad contra Cliente Y User =====
  if (emailCambio) {
    const usadoPorOtroCliente = await prisma.cliente.findFirst({
      where: { email, id: { not: clienteId } },
      select: { id: true }
    })
    if (usadoPorOtroCliente) {
      return { error: "Ese email ya está registrado para otro cliente." }
    }

    if (clienteExistente.usuarioPortalId) {
      // Tiene portal: el email puede coincidir con su propio User, pero no con otro
      const usadoPorOtroUser = await prisma.user.findFirst({
        where: { email, id: { not: clienteExistente.usuarioPortalId } },
        select: { id: true }
      })
      if (usadoPorOtroUser) {
        return { error: "Ese email ya está usado por otra cuenta del sistema." }
      }
    } else {
      // Sin portal: el email no debe existir en ningún User
      const usadoPorUser = await prisma.user.findFirst({
        where: { email },
        select: { id: true }
      })
      if (usadoPorUser) {
        return { error: "Ese email ya está usado por una cuenta del sistema." }
      }
    }
  }

  try {
    if (emailCambio && clienteExistente.usuarioPortalId) {
      // ═══════════════════════════════════════════════════════════════════
      // Cambió el email Y tiene portal vinculado: propagación en transacción
      // ═══════════════════════════════════════════════════════════════════
      await prisma.$transaction([
        prisma.cliente.update({
          where: { id: clienteId },
          data: {
            condicionIva: condicionIva as any,
            email,
            telefono: telefono?.trim() || null,
            direccion: direccion?.trim() || null,
            notasInternas: notasInternas?.trim() || null,
            activo,
            tipoSociedad: tipoPersona === "JURIDICA" ? tipoSociedad?.trim() || null : null,
            representanteNombre: tipoPersona === "JURIDICA" ? representanteNombre?.trim() || null : null,
            representanteDni: tipoPersona === "JURIDICA" ? representanteDni?.trim() || null : null,
            bienesEmbargables: tipoPersona === "FISICA" ? bienesEmbargables?.trim() || null : null,
          }
        }),
        prisma.user.update({
          where: { id: clienteExistente.usuarioPortalId },
          data: { email, emailVerified: new Date() }
        }),
        // Si el cliente tenía sesión activa, lo desloguea (debe entrar con el email nuevo)
        prisma.session.deleteMany({
          where: { userId: clienteExistente.usuarioPortalId }
        }),
        // Si tenía invitación pendiente sin activar, cancelar el token viejo
        prisma.accountActivationToken.updateMany({
          where: { userId: clienteExistente.usuarioPortalId, usedAt: null },
          data: { usedAt: new Date() }
        }),
        prisma.bitacora.create({
          data: {
            texto: `Email del cliente ${clienteExistente.nombre}${clienteExistente.apellido ? ' ' + clienteExistente.apellido : ''} actualizado: ${clienteExistente.email} → ${email}`,
            detalle: `Propagado al acceso al portal. Sesiones activas invalidadas. Tokens de invitación pendientes cancelados.`,
            tipo: 'auto',
            accion: 'Cambio de Email del Cliente',
            usuarioId: user.id,
          }
        })
      ])
    } else {
      // Sin portal vinculado o el email no cambió: update normal
      await prisma.cliente.update({
        where: { id: clienteId },
        data: {
          condicionIva: condicionIva as any,
          email,
          telefono: telefono?.trim() || null,
          direccion: direccion?.trim() || null,
          notasInternas: notasInternas?.trim() || null,
          activo,
          tipoSociedad: tipoPersona === "JURIDICA" ? tipoSociedad?.trim() || null : null,
          representanteNombre: tipoPersona === "JURIDICA" ? representanteNombre?.trim() || null : null,
          representanteDni: tipoPersona === "JURIDICA" ? representanteDni?.trim() || null : null,
          bienesEmbargables: tipoPersona === "FISICA" ? bienesEmbargables?.trim() || null : null,
        }
      })
    }

  } catch (error: any) {
    console.error("Error en actualizarClienteAction:", error)
    if (error.code === 'P2002') {
      const target = error.meta?.target as string || ''
      if (target.includes('numeroDocumento')) return { error: "Ya existe un cliente con ese número de documento." }
      if (
        target.includes('email') ||
        target.includes('Usuario_email_key') ||
        target.includes('Cliente_email_key')
      ) return { error: "Ese email ya está registrado en el sistema." }
      if (target.includes('telefono')) return { error: "Ya existe un cliente registrado con ese teléfono." }
      return { error: "Ya existe un cliente con alguno de los datos ingresados." }
    }
    return { error: error.message || "Error al actualizar el cliente" }
  }

  revalidatePath("/clientes")
  revalidatePath(`/clientes/${clienteId}`)
  redirect("/clientes")
}

// ============================================================================
// ELIMINAR CLIENTE (Soft Delete) — sin cambios
// ============================================================================
export async function eliminarClienteAction(clienteId: string): Promise<ClienteState> {
  const user = await getUserSessionServer()
  if (!user || !user.id) return { error: "No autorizado" }

  const clienteExistente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { abogadoId: true, creadoPorId: true }
  })
  if (!clienteExistente) return { error: "Cliente no encontrado" }

  const esPropietario = clienteExistente.abogadoId === user.id
  const esCreador = clienteExistente.creadoPorId === user.id
  if (!esPropietario && !esCreador) {
    return { error: "No tenés permiso para eliminar este cliente" }
  }

  try {
    const casosActivos = await prisma.caso.count({
      where: {
        clienteId: clienteId,
        estado: { notIn: ['Terminado', 'Archivado'] }
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