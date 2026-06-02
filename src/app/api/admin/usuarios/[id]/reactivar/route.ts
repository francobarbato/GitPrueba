// app/api/admin/usuarios/[id]/reactivar/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()

    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const usuario = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (usuario.isActive) {
      return NextResponse.json({ error: "El usuario ya está activo" }, { status: 400 })
    }

    // Limpieza defensiva: si el email todavía tiene el sufijo .deleted.xxx
    // de la versión anterior del DELETE, lo restauramos al original.
    // Esto es solo para datos viejos en BD; los nuevos ya no tienen sufijo.
    let emailRestaurado = usuario.email
    if (usuario.email.includes('.deleted.')) {
      emailRestaurado = usuario.email.split('.deleted.')[0]

      const emailEnUso = await prisma.user.findFirst({
        where: {
          email: emailRestaurado,
          id:    { not: params.id }
        }
      })

      if (emailEnUso) {
        return NextResponse.json({
          error: "No se puede reactivar: el email original ya está en uso por otro usuario."
        }, { status: 400 })
      }
    }

    const actualizado = await prisma.user.update({
      where: { id: params.id },
      data: {
        isActive: true,
        email:    emailRestaurado,
      }
    })

    await prisma.bitacora.create({
      data: {
        texto:     `Usuario reactivado: ${emailRestaurado}`,
        tipo:      'auto',
        accion:    'Reactivación de Usuario',
        usuarioId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      usuario: {
        id:       actualizado.id,
        nombre:   actualizado.nombre,
        apellido: actualizado.apellido,
        email:    actualizado.email,
        isActive: actualizado.isActive
      }
    })

  } catch (error: any) {
    console.error("Error al reactivar usuario:", error)
    return NextResponse.json(
      { error: error.message || "Error al reactivar usuario" },
      { status: 500 }
    )
  }
}