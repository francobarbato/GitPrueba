// src/app/api/usuario/cambiar-password/route.ts
// 
// USO: El usuario cambia SU PROPIA contraseña

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import bcrypt from "bcryptjs"

// ===== VALIDACIÓN DE CONTRASEÑA =====
function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres")
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Debe contener al menos una letra mayúscula")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Debe contener al menos una letra minúscula")
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Debe contener al menos un número")
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Debe contener al menos un carácter especial (!@#$%...)")
  }

  return { valid: errors.length === 0, errors }
}

// ===== POST: Usuario cambia su propia contraseña =====
export async function POST(req: NextRequest) {
  try {
    // Obtener sesión del usuario actual
    const session = await getUserSessionServer()

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { currentPassword, newPassword } = body

    // Obtener usuario de la BD
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        password: true,
        debeResetearPassword: true,
        email: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Si el usuario NO tiene que resetear, debe proporcionar contraseña actual
    if (!user.debeResetearPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Debe proporcionar la contraseña actual" },
          { status: 400 }
        )
      }

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password || '')
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "La contraseña actual es incorrecta" },
          { status: 400 }
        )
      }
    }

    // Validar que venga la nueva contraseña
    if (!newPassword) {
      return NextResponse.json(
        { error: "Debe proporcionar la nueva contraseña" },
        { status: 400 }
      )
    }

    // Validar fortaleza de nueva contraseña
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          error: "La nueva contraseña no cumple con los requisitos de seguridad",
          detalles: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password)
      if (isSamePassword) {
        return NextResponse.json(
          { error: "La nueva contraseña debe ser diferente a la actual" },
          { status: 400 }
        )
      }
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Actualizar en BD
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        debeResetearPassword: false  // ← Ya no necesita cambiarla
      }
    })

    // Registrar en bitácora
    await prisma.bitacora.create({
      data: {
        texto: `Usuario cambió su contraseña`,
        tipo: 'auto',
        accion: 'Cambio de Contraseña',
        usuarioId: user.id
      }
    }).catch(err => console.warn("No se pudo crear bitácora:", err))

    console.log(`✅ Usuario ${user.email} cambió su contraseña`)

    return NextResponse.json({ 
      success: true,
      message: "Contraseña actualizada correctamente"
    })

  } catch (error: any) {
    console.error("Error al cambiar contraseña:", error)
    return NextResponse.json(
      { error: error.message || "Error al cambiar contraseña" },
      { status: 500 }
    )
  }
}