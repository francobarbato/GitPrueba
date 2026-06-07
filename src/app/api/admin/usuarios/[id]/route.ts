// app/api/admin/usuarios/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"

// ===== GET: Obtener usuario por ID =====
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const usuario = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        ultimoAcceso: true,
        debeResetearPassword: true,
        _count: {
          select: {
            casos: { where: { estaCerrado: false } },
            clientes: true
          }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(usuario)
  } catch (error: any) {
    console.error("Error al obtener usuario:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ===== PATCH: Actualizar usuario (edición básica) =====
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { nombre, apellido, email, rol, isActive } = body

    const existente = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existente) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (email && email !== existente.email) {
      const emailDuplicado = await prisma.user.findUnique({ where: { email } })
      if (emailDuplicado) {
        return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 })
      }
    }

    const actualizado = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(nombre   !== undefined && { nombre }),
        ...(apellido !== undefined && { apellido }),
        ...(email    !== undefined && { email }),
        ...(rol      !== undefined && { rol }),
        ...(isActive !== undefined && { isActive }),
        ...(nombre !== undefined && apellido !== undefined && {
          name: `${nombre} ${apellido}`
        })
      }
    })

    return NextResponse.json({
      id: actualizado.id,
      nombre: actualizado.nombre,
      apellido: actualizado.apellido,
      email: actualizado.email,
      rol: actualizado.rol,
      isActive: actualizado.isActive
    })
  } catch (error: any) {
    console.error("Error al actualizar usuario:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// ===== DELETE: SOLO cancela invitaciones pendientes =====
// La desactivación de usuarios ACTIVOS se hace por el panel de offboarding
// (/usuarios/[id]/offboarding) usando la server action correspondiente.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const usuario = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, isActive: true, rol: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Si está ACTIVO, no se puede desactivar desde acá — hay que usar el panel
    if (usuario.isActive) {
      return NextResponse.json({
        error: "Para desactivar un usuario activo usá el panel de offboarding desde el listado de usuarios.",
        requierePanelOffboarding: true,
      }, { status: 400 })
    }

    // El user está inactivo: solo puede ser cancelación de invitación.
    // Verificar que tenga un token de activación pendiente válido.
    const tokenActivo = await prisma.accountActivationToken.findFirst({
      where: {
        userId: params.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true }
    })

    if (!tokenActivo) {
      return NextResponse.json({
        error: "Este usuario ya está desactivado y no tiene invitación pendiente."
      }, { status: 400 })
    }

    // Cancelar la invitación: invalidar todos los tokens del user
    await prisma.accountActivationToken.updateMany({
      where: { userId: params.id, usedAt: null },
      data: { usedAt: new Date() },
    })

    await prisma.bitacora.create({
      data: {
        texto: `Invitación cancelada: ${usuario.email}`,
        tipo: 'auto',
        accion: 'Cancelación de Invitación',
        usuarioId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: "Invitación cancelada correctamente."
    })
  } catch (error: any) {
    console.error("Error al cancelar invitación:", error)
    return NextResponse.json({
      error: error.message || "Error al cancelar la invitación"
    }, { status: 500 })
  }
}