// app/api/admin/usuarios/[id]/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import bcrypt from "bcryptjs"

// Generar contraseña temporal segura
function generarPasswordTemporal(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const special = '!@#$%&*'
  let password = ''
  
  // 8 caracteres alfanuméricos
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // Agregar un carácter especial al final
  password += special.charAt(Math.floor(Math.random() * special.length))
  
  return password
}

export async function POST(
  req: NextRequest,
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

    if (!usuario.isActive) {
      return NextResponse.json({ 
        error: "No se puede resetear la contraseña de un usuario inactivo" 
      }, { status: 400 })
    }

    // Generar nueva contraseña temporal
    const tempPassword = generarPasswordTemporal()
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Actualizar usuario
    await prisma.user.update({
      where: { id: params.id },
      data: {
        password: hashedPassword,
        debeResetearPassword: true
      }
    })

    // Registrar en bitácora
    await prisma.bitacora.create({
      data: {
        texto: `Contraseña reseteada para: ${usuario.email}`,
        tipo: 'auto',
        accion: 'Reset de Contraseña',
        usuarioId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      tempPassword,
      mensaje: "El usuario deberá cambiar la contraseña en su próximo inicio de sesión"
    })

  } catch (error: any) {
    console.error("Error al resetear contraseña:", error)
    return NextResponse.json(
      { error: error.message || "Error al resetear contraseña" },
      { status: 500 }
    )
  }
}
