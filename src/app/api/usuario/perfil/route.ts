// src/app/api/usuario/perfil/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"

// ===== GET: Obtener perfil del usuario actual =====
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSessionServer()

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
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
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
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
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { nombre, apellido, telefono } = body

    // Validaciones básicas
    if (nombre !== undefined && nombre.trim() === '') {
      return NextResponse.json(
        { error: "El nombre no puede estar vacío" },
        { status: 400 }
      )
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(apellido !== undefined && { apellido: apellido.trim() }),
        ...(nombre !== undefined && apellido !== undefined && {
          name: `${nombre.trim()} ${apellido.trim()}`
        }),
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        name: true,
        rol: true
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error: any) {
    console.error("Error al actualizar perfil:", error)
    return NextResponse.json(
      { error: error.message || "Error al actualizar perfil" },
      { status: 500 }
    )
  }
}