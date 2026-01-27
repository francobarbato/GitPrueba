// app/api/admin/usuarios/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { UserService } from "@/lib/aplication/services/user.service"

const userService = new UserService()

// ===== GET: Obtener usuario por ID =====
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()

    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const usuario = await userService.obtenerPorId(params.id)
    return NextResponse.json(usuario)

  } catch (error: any) {
    console.error("Error al obtener usuario:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    )
  }
}

// ===== PATCH: Actualizar usuario =====
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
    const actualizado = await userService.actualizarUsuario(params.id, body)

    return NextResponse.json(actualizado)

  } catch (error: any) {
    console.error("Error al actualizar usuario:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

// ===== DELETE: Eliminar usuario (soft delete) =====
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()

    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    await userService.eliminarUsuario(params.id, user.id)
    return NextResponse.json({ message: "Usuario eliminado correctamente" })

  } catch (error: any) {
    console.error("Error al eliminar usuario:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}