import { ClienteService } from "@/lib/aplication/services/cliente.service"
import type { NextRequest } from "next/server"

const clienteService = new ClienteService()

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const cliente = await clienteService.obtenerPorId(id)
    return Response.json(cliente)
  } catch (error: any) {
    console.error("[API] Error al obtener cliente:", error)
    return Response.json({ error: error.message }, { status: 404 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await req.json()
    const { nombre, apellido, email, numeroDocumento, tipoDocumento, direccion, telefono, estado } = body

    const clienteActualizado = await clienteService.actualizarCliente(id, {
      nombre,
      apellido,
      email,
      numeroDocumento,
      tipoDocumento,
      direccion,
      telefono,
      estado,
    })

    return Response.json(clienteActualizado)
  } catch (error: any) {
    console.error("[API] Error al actualizar cliente:", error)
    return Response.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    await clienteService.eliminarCliente(id)
    return Response.json({ mensaje: "Cliente eliminado" })
  } catch (error: any) {
    console.error("[API] Error al eliminar cliente:", error)
    return Response.json({ error: error.message }, { status: 400 })
  }
}
