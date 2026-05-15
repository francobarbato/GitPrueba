// src/app/api/usuario/cambiar-password/route.ts
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

    // 1. Buscamos primero al usuario para ver su estado
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
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // ════ LÓGICA DE VALIDACIÓN FLEXIBLE ════
    // Si NO debe resetear (es un cambio voluntario), exigimos la actual.
    // Si DEBE resetear (primer login), permitimos que currentPassword sea nulo.
    if (!dbUser.debeResetearPassword && !currentPassword) {
      return NextResponse.json(
        { error: "La contraseña actual es requerida" },
        { status: 400 }
      )
    }

    if (!newPassword) {
      return NextResponse.json(
        { error: "La nueva contraseña es requerida" },
        { status: 400 }
      )
    }

    // Validaciones de seguridad (se mantienen igual)
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Mínimo 8 caracteres" }, { status: 400 })
    }

    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumbers = /\d/.test(newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return NextResponse.json(
        { error: "La contraseña no cumple los requisitos de complejidad" },
        { status: 400 }
      )
    }

    // ════ VERIFICACIÓN DE CONTRASEÑA ACTUAL ════
    // Solo verificamos contra la BD si NO es un reseteo obligatorio
    if (!dbUser.debeResetearPassword) {
      const isValid = await bcrypt.compare(currentPassword, dbUser.password)
      if (!isValid) {
        return NextResponse.json(
          { error: "La contraseña actual es incorrecta" },
          { status: 400 }
        )
      }
    }

    // Verificar que la nueva no sea igual a la actual
    const isSamePassword = await bcrypt.compare(newPassword, dbUser.password)
    if (isSamePassword) {
      return NextResponse.json(
        { error: "La nueva contraseña debe ser diferente a la anterior" },
        { status: 400 }
      )
    }

    // Hashear y guardar
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        debeResetearPassword: false 
      }
    })

    const userRol = dbUser.rol?.toUpperCase()
    let redirectUrl = userRol === 'CLIENTE' ? '/portal' : '/'
    if (userRol === 'CLIENTE') {
      redirectUrl = '/portal'
    } else {
      // Aseguramos que los abogados vayan a su dashboard y no al revés
      redirectUrl = '/' 
    }

    console.log(`✅ Contraseña cambiada. Redirigiendo a: ${redirectUrl}`)

    return NextResponse.json({ 
      success: true,
      message: "Contraseña actualizada correctamente",
      redirectUrl: redirectUrl 
    })

  } catch (error: any) {
    console.error("Error cambiando contraseña:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}