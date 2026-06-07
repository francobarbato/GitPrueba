'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { revalidatePath } from "next/cache"
import { generarToken, fechaDeVencimiento, TOKEN_TTL } from "src/lib/auth/tokens"
import { sendActivationEmail } from "src/lib/email/send"

// ============================================================================
// PERMISOS DE GESTIÓN DEL PORTAL
// ============================================================================
// ADMIN     — puede gestionar (defensa en profundidad; el middleware ya lo
//             bloquea de /clientes)
// ABOGADO   — solo el portal de sus propios clientes (cliente.abogadoId === user.id)
// ASISTENTE — acceso general: puede gestionar el portal de cualquier cliente
//             del estudio (mismo criterio que documentos y plantillas)
// ============================================================================
const ROLES_GESTION_PORTAL = ['ADMIN', 'ABOGADO', 'ASISTENTE'] as const

// ============================================================================
// ENVIAR INVITACIÓN AL PORTAL
// ============================================================================
export async function crearUsuarioPortalAction(clienteId: string): Promise<{
  error?: string
  success?: boolean
}> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  const userRol = user.rol?.toUpperCase() || ''
  if (!ROLES_GESTION_PORTAL.includes(userRol as any)) {
    return { error: "No tenés permiso para invitar al portal" }
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        usuarioPortalId: true,
        abogadoId: true,
      }
    })

    if (!cliente) return { error: "Cliente no encontrado" }
    if (!cliente.email) {
      return { error: "El cliente debe tener un email registrado para enviar la invitación" }
    }
    if (cliente.usuarioPortalId) {
      return { error: "Este cliente ya tiene un usuario de portal. Si querés reenviar el email, usá 'Reenviar invitación'." }
    }

    const emailExistente = await prisma.user.findUnique({
      where: { email: cliente.email },
      select: { id: true, isActive: true }
    })
    if (emailExistente) {
      return {
        error: emailExistente.isActive
          ? `El email ${cliente.email} ya está registrado con otra cuenta activa.`
          : `El email ${cliente.email} pertenece a un usuario desactivado. No se puede reutilizar.`
      }
    }

    // Ownership: solo aplica al ABOGADO; ASISTENTE y ADMIN no se restringen.
    if (userRol === 'ABOGADO' && cliente.abogadoId !== user.id) {
      return { error: "Solo podés gestionar el portal de tus propios clientes" }
    }

    const token = generarToken()
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

    await prisma.$transaction(async (tx) => {
      const usuario = await tx.user.create({
        data: {
          email: cliente.email!,
          password: null,
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          name: `${cliente.nombre}${cliente.apellido ? ` ${cliente.apellido}` : ''}`.trim(),
          rol: 'CLIENTE',
          isActive: false,
          creadoPor: user.id,
        }
      })

      await tx.accountActivationToken.create({
        data: {
          token,
          userId: usuario.id,
          expiresAt: fechaDeVencimiento(TOKEN_TTL.ACCOUNT_ACTIVATION),
        }
      })

      await tx.cliente.update({
        where: { id: clienteId },
        data: { usuarioPortalId: usuario.id }
      })

      await tx.bitacora.create({
        data: {
          texto: `Invitación al portal enviada al cliente ${cliente.nombre}${cliente.apellido ? ` ${cliente.apellido}` : ''} (${cliente.email})`,
          tipo: "auto",
          accion: "Invitación de Cliente al Portal",
          usuarioId: user.id,
        }
      })
    })

    const envio = await sendActivationEmail({
      to: cliente.email,
      nombre: cliente.nombre,
      apellido: cliente.apellido ?? "",
      token,
      appUrl,
    })

    if (!envio.ok) {
      console.error(`Error enviando email al cliente ${clienteId}:`, envio.error)
      revalidatePath(`/clientes/${clienteId}`)
      return {
        error: `Usuario creado y vinculado, pero falló el envío del email. Reenviá la invitación desde el panel. (${envio.error})`,
      }
    }

    console.log(`Invitación al portal enviada para cliente ${cliente.nombre} (${cliente.email}) por user ${user.id} (${userRol})`)
    revalidatePath(`/clientes/${clienteId}`)
    return { success: true }

  } catch (error: any) {
    console.error("Error en crearUsuarioPortalAction:", error)
    return { error: error.message || "Error al enviar la invitación" }
  }
}

// ============================================================================
// REENVIAR INVITACIÓN
// ============================================================================
export async function reenviarInvitacionPortalAction(clienteId: string): Promise<{
  error?: string
  success?: boolean
}> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  const userRol = user.rol?.toUpperCase() || ''
  if (!ROLES_GESTION_PORTAL.includes(userRol as any)) {
    return { error: "No tenés permiso para reenviar invitaciones" }
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        usuarioPortalId: true,
        abogadoId: true,
        usuarioPortal: {
          select: { id: true, email: true, isActive: true, password: true }
        }
      }
    })

    if (!cliente) return { error: "Cliente no encontrado" }
    if (!cliente.usuarioPortalId || !cliente.usuarioPortal) {
      return { error: "Este cliente no tiene un usuario de portal vinculado. Usá 'Enviar invitación' en su lugar." }
    }
    if (cliente.usuarioPortal.password) {
      return { error: "Este cliente ya activó su cuenta alguna vez. Si perdió la contraseña, debe usar 'Olvidé mi contraseña' desde el login." }
    }

    if (userRol === 'ABOGADO' && cliente.abogadoId !== user.id) {
      return { error: "Solo podés gestionar tus propios clientes" }
    }

    const emailDestino = cliente.email ?? cliente.usuarioPortal.email
    if (!emailDestino) return { error: "No hay email registrado para enviar la invitación" }

    await prisma.accountActivationToken.deleteMany({
      where: { userId: cliente.usuarioPortalId }
    })

    const token = generarToken()
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

    await prisma.accountActivationToken.create({
      data: {
        token,
        userId: cliente.usuarioPortalId,
        expiresAt: fechaDeVencimiento(TOKEN_TTL.ACCOUNT_ACTIVATION),
      }
    })

    await prisma.bitacora.create({
      data: {
        texto: `Reenvío de invitación al portal para cliente ${cliente.nombre}${cliente.apellido ? ` ${cliente.apellido}` : ''} (${emailDestino})`,
        tipo: "auto",
        accion: "Reenvío Invitación Cliente",
        usuarioId: user.id,
      }
    })

    const envio = await sendActivationEmail({
      to: emailDestino,
      nombre: cliente.nombre,
      apellido: cliente.apellido ?? "",
      token,
      appUrl,
    })

    if (!envio.ok) {
      return { error: `El token fue renovado pero falló el envío del email. (${envio.error})` }
    }

    revalidatePath(`/clientes/${clienteId}`)
    return { success: true }

  } catch (error: any) {
    console.error("Error en reenviarInvitacionPortalAction:", error)
    return { error: error.message || "Error al reenviar la invitación" }
  }
}

// ============================================================================
// DESACTIVAR USUARIO DE PORTAL
// ============================================================================
export async function desactivarUsuarioPortalAction(clienteId: string): Promise<{
  error?: string
  success?: boolean
}> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  const userRol = user.rol?.toUpperCase() || ''
  if (!ROLES_GESTION_PORTAL.includes(userRol as any)) {
    return { error: "No tenés permiso para desactivar usuarios de portal" }
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nombre: true,
        usuarioPortalId: true,
        abogadoId: true,
        usuarioPortal: { select: { id: true, isActive: true } }
      }
    })

    if (!cliente) return { error: "Cliente no encontrado" }
    if (!cliente.usuarioPortalId || !cliente.usuarioPortal) {
      return { error: "Este cliente no tiene usuario de portal" }
    }

    if (userRol === 'ABOGADO' && cliente.abogadoId !== user.id) {
      return { error: "Solo podés gestionar tus propios clientes" }
    }

    await prisma.user.update({
      where: { id: cliente.usuarioPortalId },
      data: { isActive: false }
    })

    await prisma.accountActivationToken.updateMany({
      where: { userId: cliente.usuarioPortalId, usedAt: null },
      data: { usedAt: new Date() }
    })

    await prisma.bitacora.create({
      data: {
        texto: `Acceso al portal desactivado para cliente ${cliente.nombre}`,
        tipo: "auto",
        accion: "Desactivación Portal Cliente",
        usuarioId: user.id,
      }
    })

    revalidatePath(`/clientes/${clienteId}`)
    return { success: true }

  } catch (error: any) {
    console.error("Error en desactivarUsuarioPortalAction:", error)
    return { error: error.message || "Error al desactivar usuario" }
  }
}

// ============================================================================
// REACTIVAR USUARIO DE PORTAL
// ============================================================================
export async function reactivarUsuarioPortalAction(clienteId: string): Promise<{
  error?: string
  success?: boolean
}> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  const userRol = user.rol?.toUpperCase() || ''
  if (!ROLES_GESTION_PORTAL.includes(userRol as any)) {
    return { error: "No tenés permiso para reactivar usuarios" }
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nombre: true,
        usuarioPortalId: true,
        abogadoId: true,
        usuarioPortal: { select: { id: true, password: true } }
      }
    })

    if (!cliente) return { error: "Cliente no encontrado" }
    if (!cliente.usuarioPortalId || !cliente.usuarioPortal) {
      return { error: "No hay usuario de portal asociado" }
    }
    if (!cliente.usuarioPortal.password) {
      return { error: "Este cliente nunca activó su cuenta. Reenviá la invitación en lugar de reactivar." }
    }

    if (userRol === 'ABOGADO' && cliente.abogadoId !== user.id) {
      return { error: "Solo podés gestionar tus propios clientes" }
    }

    await prisma.user.update({
      where: { id: cliente.usuarioPortalId },
      data: { isActive: true }
    })

    await prisma.bitacora.create({
      data: {
        texto: `Acceso al portal reactivado para cliente ${cliente.nombre}`,
        tipo: "auto",
        accion: "Reactivación Portal Cliente",
        usuarioId: user.id,
      }
    })

    revalidatePath(`/clientes/${clienteId}`)
    return { success: true }

  } catch (error: any) {
    console.error("Error en reactivarUsuarioPortalAction:", error)
    return { error: error.message || "Error al reactivar el usuario" }
  }
}