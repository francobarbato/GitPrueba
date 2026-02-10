import { ClienteService } from "@/lib/aplication/services/cliente.service"
import type { NextRequest } from "next/server"

const clienteService = new ClienteService()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const estado = searchParams.get("estado")
    const tipoDocumento = searchParams.get("tipoDocumento")
    const buscar = searchParams.get("buscar")

    const filtros = {
      ...(estado && { estado }),
      ...(tipoDocumento && { tipoDocumento }),
      ...(buscar && { buscar }),
    }

    const clientes = await clienteService.obtenerTodos(filtros)
    return Response.json(clientes)
  } catch (error) {
    console.error("[API] Error al obtener clientes:", error)
    return Response.json({ error: "Error al obtener clientes" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
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
    })

    return Response.json(nuevoCliente, { status: 201 })
  } catch (error: any) {
    console.error("[API] Error al crear cliente:", error)
    return Response.json({ error: error.message || "Error al crear cliente" }, { status: 400 })
  }
}