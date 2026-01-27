// src/app/api/admin/usuarios/cambiar-password/route.ts
// 
// USO: El ADMIN resetea la contraseña de OTRO usuario
// Ejemplo: POST /api/admin/usuarios/cambiar-password
// Body: { userId: "xxx", newPassword: "temporal123" }

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
    errors.push("Debe contener al menos un carácter especial")
  }

  return { valid: errors.length === 0, errors }
}

// ===== POST: Admin resetea contraseña de otro usuario =====
export async function POST(req: NextRequest) {
  try {
    // Verificar que sea ADMIN
    const admin = await getUserSessionServer()

    if (!admin || admin.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden resetear contraseñas." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { userId, newPassword } = body

    // Validar campos requeridos
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: "Debe proporcionar userId y newPassword" },
        { status: 400 }
      )
    }

    // Validar fortaleza de contraseña
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          error: "La contraseña no cumple con los requisitos",
          detalles: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nombre: true, apellido: true }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Actualizar contraseña y marcar que debe cambiarla
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        debeResetearPassword: true  // ← El usuario deberá cambiarla en su próximo login
      }
    })

    // Registrar en bitácora
    await prisma.bitacora.create({
      data: {
        texto: `Admin reseteó contraseña de: ${usuario.email}`,
        tipo: 'auto',
        accion: 'Reset de Contraseña (Admin)',
        usuarioId: admin.id
      }
    }).catch(err => console.warn("No se pudo crear bitácora:", err))

    console.log(`✅ Admin ${admin.email} reseteó contraseña de ${usuario.email}`)

    return NextResponse.json({ 
      success: true,
      message: `Contraseña de ${usuario.nombre} ${usuario.apellido} reseteada correctamente. Deberá cambiarla en su próximo inicio de sesión.`
    })

  } catch (error: any) {
    console.error("Error al resetear contraseña:", error)
    return NextResponse.json(
      { error: error.message || "Error al resetear contraseña" },
      { status: 500 }
    )
  }
}