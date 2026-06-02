import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()
    if (!user || !user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const caso = await prisma.caso.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        numero: true,
        abogadoId: true,
        recibidoEnReasignacion: true,
      }
    })

    if (!caso) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
    }

    // Solo el titular actual del caso puede marcarlo como revisado
    if (caso.abogadoId !== user.id) {
      return NextResponse.json({
        error: "Solo el titular del caso puede marcarlo como revisado"
      }, { status: 403 })
    }

    if (!caso.recibidoEnReasignacion) {
      return NextResponse.json({
        error: "El caso no está en estado pendiente de revisión"
      }, { status: 400 })
    }

    await prisma.caso.update({
      where: { id: params.id },
      data: { recibidoEnReasignacion: false }
    })

    await prisma.bitacora.create({
      data: {
        casoId:    params.id,
        texto:     `Caso ${caso.numero} marcado como revisado por su nuevo titular`,
        tipo:      'auto',
        accion:    'Marcado como Revisado',
        usuarioId: user.id,
      }
    })

    return NextResponse.json({ success: true, message: "Caso marcado como revisado" })

  } catch (error: any) {
    console.error("Error al marcar caso como revisado:", error)
    return NextResponse.json(
      { error: error.message || "Error" },
      { status: 500 }
    )
  }
}