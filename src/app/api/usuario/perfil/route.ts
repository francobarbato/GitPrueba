// src/app/api/usuario/perfil/route.ts
//
// GET  /api/usuario/perfil   → datos del perfil del usuario logueado
// PATCH /api/usuario/perfil  → actualiza nombre/apellido del usuario
//
// Visión A — Sincronización con el Cliente:
// Si el usuario tiene un Cliente vinculado (rol CLIENTE accediendo al portal),
// los cambios de nombre/apellido también se propagan al Cliente.nombre /
// Cliente.apellido en la misma transacción. Así el abogado ve los datos
// actualizados en el sistema interno cuando el cliente los edita desde el
// portal.

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"

// ===== GET: Obtener perfil del usuario actual =====
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSessionServer()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        name: true,
        image: true,
        rol: true,
        isActive: true,
        debeResetearPassword: true,
        createdAt: true,
        ultimoAcceso: true,
        _count: {
          select: {
            casos: true,
            clientes: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(user)

  } catch (error: any) {
    console.error("Error al obtener perfil:", error)
    return NextResponse.json(
      { error: error.message || "Error al obtener perfil" },
      { status: 500 }
    )
  }
}

// ===== PATCH: Actualizar perfil del usuario actual =====
export async function PATCH(req: NextRequest) {
  try {
    const session = await getUserSessionServer()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { nombre, apellido } = body

    // Validaciones básicas
    if (nombre !== undefined && (typeof nombre !== 'string' || nombre.trim() === '')) {
      return NextResponse.json({ error: "El nombre no puede estar vacío" }, { status: 400 })
    }
    if (apellido !== undefined && typeof apellido !== 'string') {
      return NextResponse.json({ error: "Apellido inválido" }, { status: 400 })
    }

    const nombreLimpio = nombre !== undefined ? nombre.trim() : undefined
    const apellidoLimpio = apellido !== undefined ? apellido.trim() : undefined

    // Si NO hay nada para actualizar, salir temprano
    if (nombreLimpio === undefined && apellidoLimpio === undefined) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 })
    }

    // Construimos el data del User
    const dataUser: any = {}
    if (nombreLimpio !== undefined) dataUser.nombre = nombreLimpio
    if (apellidoLimpio !== undefined) dataUser.apellido = apellidoLimpio
    // El campo `name` (legacy de NextAuth) solo se actualiza si vinieron ambos
    if (nombreLimpio !== undefined && apellidoLimpio !== undefined) {
      dataUser.name = `${nombreLimpio} ${apellidoLimpio}`.trim()
    }

    // Detectar si el user tiene cliente vinculado (es CLIENTE accediendo desde el portal)
    const usuarioActual = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        clienteVinculado: { select: { id: true } }
      }
    })

    const tieneClienteVinculado = !!usuarioActual?.clienteVinculado

    if (tieneClienteVinculado) {
      // ───────────────────────────────────────────────────────────────
      // Cliente del portal: sincronizar User + Cliente en transacción.
      // ───────────────────────────────────────────────────────────────
      const dataCliente: any = {}
      if (nombreLimpio !== undefined) dataCliente.nombre = nombreLimpio
      // El cliente puede tener apellido = null si es Persona Jurídica, pero acá
      // siempre es Persona Física (porque hay usuarioPortal, y el portal es solo
      // para personas físicas en este sistema). Igual lo manejamos defensivamente.
      if (apellidoLimpio !== undefined) dataCliente.apellido = apellidoLimpio || null

      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
          where: { id: session.id },
          data: dataUser,
          select: {
            id: true, nombre: true, apellido: true,
            email: true, name: true, rol: true
          }
        }),
        prisma.cliente.update({
          where: { id: usuarioActual!.clienteVinculado!.id },
          data: dataCliente
        }),
        prisma.bitacora.create({
          data: {
            texto: `Cliente actualizó sus datos personales desde el portal`,
            detalle: [
              nombreLimpio !== undefined ? `Nombre: ${nombreLimpio}` : null,
              apellidoLimpio !== undefined ? `Apellido: ${apellidoLimpio}` : null,
            ].filter(Boolean).join(' | ') || null,
            tipo: 'auto',
            accion: 'Cambio de Datos del Cliente',
            usuarioId: session.id,
          }
        })
      ])

      return NextResponse.json({ success: true, user: updatedUser })
    }

    // ─────────────────────────────────────────────────────────────────
    // Usuario interno (ABOGADO/ASISTENTE) o sin cliente vinculado.
    // Solo se actualiza User.
    // ─────────────────────────────────────────────────────────────────
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: dataUser,
      select: {
        id: true, nombre: true, apellido: true,
        email: true, name: true, rol: true
      }
    })

    return NextResponse.json({ success: true, user: updatedUser })

  } catch (error: any) {
    console.error("Error al actualizar perfil:", error)
    return NextResponse.json(
      { error: error.message || "Error al actualizar perfil" },
      { status: 500 }
    )
  }
}