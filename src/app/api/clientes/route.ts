// src/app/api/clientes/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { ClienteService } from "@/lib/aplication/services/cliente.service"

const clienteService = new ClienteService()

// GET /api/clientes
export async function GET(req: NextRequest) {
  try {
    // ===== VERIFICACIÓN DE SESIÓN =====
    const user = await getUserSessionServer()
    if (!user || !user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // ==================================

    const userRol = user.rol?.toUpperCase()
    const { searchParams } = new URL(req.url)

    const estado = searchParams.get("estado")
    const tipoDocumento = searchParams.get("tipoDocumento")
    const buscar = searchParams.get("buscar")

    // Obtener clientes según rol — mismo criterio que la página de listado
    let clientes
    if (userRol === 'ADMIN' || userRol === 'ASISTENTE') {
      clientes = await clienteService.getAllClientes()
    } else {
      clientes = await clienteService.getClientesByAbogado(user.id)
    }

    // Aplicar filtros opcionales
    if (buscar) {
      const termino = buscar.toLowerCase()
      clientes = clientes.filter((c: any) =>
        c.nombre?.toLowerCase().includes(termino) ||
        c.apellido?.toLowerCase().includes(termino) ||
        c.email?.toLowerCase().includes(termino) ||
        c.numeroDocumento?.includes(termino)
      )
    }
    if (estado) {
      clientes = clientes.filter((c: any) => c.estado === estado)
    }
    if (tipoDocumento) {
      clientes = clientes.filter((c: any) => c.tipoDocumento === tipoDocumento)
    }

    return NextResponse.json(clientes)

  } catch (error) {
    console.error("[API] Error al obtener clientes:", error)
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 })
  }
}

// POST /api/clientes
export async function POST(req: NextRequest) {
  try {
    // ===== VERIFICACIÓN DE SESIÓN =====
    const user = await getUserSessionServer()
    if (!user || !user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // ==================================

    const body = await req.json()
    const { nombre, apellido, email, numeroDocumento, tipoDocumento, direccion, telefono, estado } = body

    const nuevoCliente = await clienteService.createCliente({
      nombre,
      apellido,
      email,
      numeroDocumento,
      tipoDocumento,
      direccion,
      telefono,
      estado: estado || "activo",
    }, user.id) // ← usuarioId requerido por el servicio

    return NextResponse.json(nuevoCliente, { status: 201 })

  } catch (error: any) {
    console.error("[API] Error al crear cliente:", error)
    return NextResponse.json({ error: error.message || "Error al crear cliente" }, { status: 400 })
  }
}