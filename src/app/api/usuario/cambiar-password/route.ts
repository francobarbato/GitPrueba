// src/app/api/usuario/cambiar-password/route.ts
// ACTUALIZADO: Redirige a /portal si es CLIENTE

import { NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const user = await getUserSessionServer()
    
    if (!user || !user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validaciones
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      )
    }

    // Validar requisitos de contraseña
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumbers = /\d/.test(newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return NextResponse.json(
        { error: "La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales" },
        { status: 400 }
      )
    }

    // Obtener usuario de la BD
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        id: true, 
        password: true, 
        rol: true,
        debeResetearPassword: true 
      }
    })

    if (!dbUser || !dbUser.password) {
      return NextResponse.json(
        { error: "Usuario no encontrado o sin contraseña configurada" },
        { status: 404 }
      )
    }

    // Verificar contraseña actual
    const isValid = await bcrypt.compare(currentPassword, dbUser.password)
    
    if (!isValid) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 400 }
      )
    }

    // Verificar que la nueva sea diferente a la actual
    const isSamePassword = await bcrypt.compare(newPassword, dbUser.password)
    if (isSamePassword) {
      return NextResponse.json(
        { error: "La nueva contraseña debe ser diferente a la actual" },
        { status: 400 }
      )
    }

    // Hashear y guardar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        debeResetearPassword: false // Ya no necesita resetear
      }
    })

    // Determinar URL de redirección según el rol
    const userRol = dbUser.rol?.toUpperCase()
    let redirectUrl = '/'
    
    if (userRol === 'CLIENTE') {
      redirectUrl = '/portal'
    }

    console.log(`✅ Contraseña cambiada para usuario ${user.id} (rol: ${userRol})`)

    return NextResponse.json({ 
      success: true,
      message: "Contraseña actualizada correctamente",
      redirectUrl: redirectUrl
    })

  } catch (error: any) {
    console.error("Error cambiando contraseña:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}