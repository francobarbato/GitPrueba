// app/api/clientes/por-abogado/route.ts
// Devuelve los clientes de un abogado específico.
// Solo accesible para ASISTENTE y ADMIN.

import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "src/lib/db/prisma"

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const rol = (token.rol as string)?.toUpperCase()
  if (rol !== 'ASISTENTE' && rol !== 'ADMIN') {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const abogadoId = searchParams.get("abogadoId")

  if (!abogadoId) {
    return NextResponse.json({ error: "abogadoId requerido" }, { status: 400 })
  }

  const clientes = await prisma.cliente.findMany({
    where: {
      activo: true,
      abogadoId,
    },
    select: { id: true, nombre: true, apellido: true, numeroDocumento: true },
    orderBy: { nombre: "asc" },
  })

  return NextResponse.json({ clientes })
}