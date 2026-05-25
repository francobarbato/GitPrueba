// app/api/admin/usuarios/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { UserService } from "@/lib/aplication/services/user.service"

const userService = new UserService()

// ===== VALIDACIÓN DE CONTRASEÑA (Backend) =====
function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres")
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra mayúscula")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra minúscula")
  }
  if (!/[0-9]/.test(password)) {
    errors.push("La contraseña debe contener al menos un número")
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("La contraseña debe contener al menos un carácter especial (!@#$%^&*...)")
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ===== GET: Obtener todos los usuarios =====
export async function GET(req: NextRequest) {
  try {
    const user = await getUserSessionServer()

    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden ver usuarios." },
        { status: 403 }
      )
    }

    const usuarios = await userService.obtenerTodos()
    const estadisticas = await userService.obtenerEstadisticas()

    return NextResponse.json({
      usuarios,
      estadisticas
    })

  } catch (error: any) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json(
      { error: error.message || "Error al obtener usuarios" },
      { status: 500 }
    )
  }
}

// ===== POST: Crear nuevo usuario =====
export async function POST(req: NextRequest) {
  try {
    const user = await getUserSessionServer()

    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { nombre, apellido, email, password, rol } = body

    // ===== VALIDACIONES BÁSICAS =====
    if (!nombre || !apellido || !email || !password || !rol) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      )
    }

    // ===== VALIDAR EMAIL FORMATO =====
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "El formato del email no es válido" },
        { status: 400 }
      )
    }

    // ===== VALIDAR ROL PERMITIDO =====
    if (!['ADMIN', 'ABOGADO', 'ASISTENTE'].includes(rol)) {
      return NextResponse.json(
        { error: "Rol inválido. Solo se pueden crear usuarios con rol ADMIN, ABOGADO o ASISTENTE" },
        { status: 400 }
      )
    }

    // ===== VALIDAR FORTALEZA DE CONTRASEÑA =====
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          error: "La contraseña no cumple con los requisitos de seguridad",
          detalles: passwordValidation.errors 
        },
        { status: 400 }
      )
    }

    // ===== CREAR USUARIO (el servicio ya valida duplicados y conflictos) =====
    const nuevoUsuario = await userService.crearUsuario({
      nombre,
      apellido,
      email: email.toLowerCase().trim(), // Normalizar email
      password,
      rol,
      creadoPor: user.id
    })

    return NextResponse.json(nuevoUsuario, { status: 201 })

  } catch (error: any) {
    console.error("Error al crear usuario:", error)
    
    // Mensajes de error más específicos
    let errorMessage = error.message || "Error al crear usuario"
    let statusCode = 400

    if (error.message.includes("email")) {
      errorMessage = "Ya existe un usuario registrado con ese email"
    } else if (error.message.includes("CLIENTE")) {
      errorMessage = "No se pueden crear usuarios con rol CLIENTE desde este panel. Los clientes se vinculan automáticamente desde el módulo de clientes."
      statusCode = 403
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}