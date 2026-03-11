// src/app/api/clientes/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { ClienteService } from "@/lib/aplication/services/cliente.service"

const clienteService = new ClienteService()

// GET /api/clientes/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ===== VERIFICACIÓN DE SESIÓN =====
    const user = await getUserSessionServer()
    if (!user || !user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // ==================================

    const id = params.id
    const cliente = await clienteService.getClienteById(id)

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // Verificar que el abogado solo pueda ver sus propios clientes
    const userRol = user.rol?.toUpperCase()
    if (userRol === 'ABOGADO' && (cliente as any).abogadoId !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    return NextResponse.json(cliente)

  } catch (error: any) {
    console.error("[API] Error al obtener cliente:", error)
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}

// PUT /api/clientes/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ===== VERIFICACIÓN DE SESIÓN =====
    const user = await getUserSessionServer()
    if (!user || !user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // ==================================

    const id = params.id
    const userRol = user.rol?.toUpperCase()

    // Verificar ownership antes de actualizar
    const clienteExistente = await clienteService.getClienteById(id)
    if (!clienteExistente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const esAdmin = userRol === 'ADMIN'
    const esAsistente = userRol === 'ASISTENTE'
    const esPropietario = (clienteExistente as any).abogadoId === user.id

    if (!esAdmin && !esAsistente && !esPropietario) {
      return NextResponse.json({ error: "No tenés permiso para editar este cliente" }, { status: 403 })
    }

    const body = await req.json()
    const { nombre, apellido, email, numeroDocumento, tipoDocumento, direccion, telefono, activo, condicionIva } = body

    const clienteActualizado = await clienteService.actualizarCliente(id, {
      nombre,
      apellido,
      email,
      numeroDocumento,
      tipoDocumento,
      direccion,
      telefono,
      activo,
      condicionIva
    })

    return NextResponse.json(clienteActualizado)

  } catch (error: any) {
    console.error("[API] Error al actualizar cliente:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// DELETE /api/clientes/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ===== VERIFICACIÓN DE SESIÓN =====
    const user = await getUserSessionServer()
    if (!user || !user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // ==================================

    const id = params.id
    const userRol = user.rol?.toUpperCase()

    // FIX: comparación en mayúsculas — antes era user.rol === 'admin' (siempre false)
    const esAdmin = userRol === 'ADMIN'

    await clienteService.deleteCliente(id, user.id, esAdmin)

    return NextResponse.json({ mensaje: "Cliente eliminado" })

  } catch (error: any) {
    console.error("[API] Error al eliminar cliente:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}