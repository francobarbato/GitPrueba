// app/api/admin/usuarios/[id]/casos-activos/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const casos = await prisma.caso.findMany({
      where: {
        abogadoId:   params.id,
        estaCerrado: false,
      },
      select: {
        id:       true,
        numero:   true,
        titulo:   true,
        tipo:     true,
        priority: true,
        cliente:  { select: { nombre: true, apellido: true } },
      },
      orderBy: [
        { priority: 'desc' },     // urgentes primero
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ casos })
  } catch (error: any) {
    console.error("Error al listar casos del usuario:", error)
    return NextResponse.json(
      { error: error.message || "Error al listar casos" },
      { status: 500 }
    )
  }
}