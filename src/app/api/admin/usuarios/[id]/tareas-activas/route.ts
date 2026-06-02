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

    // Una tarea está "activa" si no fue completada y no fue cerrada como vencida.
    const filtroActivas = {
      estado:           { not: 'COMPLETADA' as const },
      vencidaCerradaEn: null,
    }

    const [comoResponsable, comoSupervisor] = await Promise.all([
      prisma.tarea.count({ where: { responsableId: params.id, ...filtroActivas } }),
      prisma.tarea.count({ where: { supervisorId:  params.id, ...filtroActivas } }),
    ])

    return NextResponse.json({
      total: comoResponsable + comoSupervisor,
      comoResponsable,
      comoSupervisor,
    })
  } catch (error: any) {
    console.error("Error al contar tareas activas:", error)
    return NextResponse.json({ error: error.message || "Error" }, { status: 500 })
  }
}