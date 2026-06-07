import { type NextRequest, NextResponse } from "next/server"
import prisma from "src/lib/db/prisma"

// PATCH - Actualizar tarea (completar, reactivar, editar)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] PATCH /api/tareas/[id] - Actualizando tarea")

    const body = await request.json()
    const tareaId = params.id
    const { action, description, dueDate } = body

    console.log("[v0] Acción:", action, "ID:", tareaId)

    let tarea
    let mensajeBitacora = ""

    switch (action) {
      case "completar":
        tarea = await prisma.requirement.update({
          where: { id: tareaId },
          data: { isCompleted: true },
        })
        mensajeBitacora = `Completada: "${tarea.description}"`
        break

      case "reactivar":
        tarea = await prisma.requirement.update({
          where: { id: tareaId },
          data: { isCompleted: false },
        })
        mensajeBitacora = `Reactivada: "${tarea.description}"`
        break

      case "editar":
        tarea = await prisma.requirement.update({
          where: { id: tareaId },
          data: {
            description,
            dueDate: dueDate ? new Date(dueDate) : null,
          },
        })
        mensajeBitacora = `Editada: "${tarea.description}"`
        break

      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    console.log("[v0] Tarea actualizada exitosamente")

    const usuario = await prisma.user.findFirst()

    if (usuario) {
      await prisma.bitacora.create({
        data: {
          tipo: "auto",
          accion: `Tarea ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          texto: mensajeBitacora,
          usuarioId: usuario.id,
          casoId: tarea.casoId,
        },
      })
    }

    return NextResponse.json(tarea)
  } catch (error) {
    console.error("[v0] Error actualizando evento:", error)
    return NextResponse.json({ error: "Error al actualizar evento" }, { status: 500 })
  }
}

// DELETE - Eliminar tarea
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] DELETE /api/tareas/[id] - Eliminando evento")

    const tareaId = params.id

    const tarea = await prisma.requirement.findUnique({
      where: { id: tareaId },
    })

    if (!tarea) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 })
    }

    await prisma.requirement.delete({
      where: { id: tareaId },
    })

    console.log("[v0] Evento eliminado exitosamente")

    const usuario = await prisma.user.findFirst()

    if (usuario) {
      await prisma.bitacora.create({
        data: {
          tipo: "auto",
          accion: "Evento Eliminado",
          texto: `Eliminado: "${tarea.description}"`,
          usuarioId: usuario.id,
          casoId: tarea.casoId,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error eliminando evento:", error)
    return NextResponse.json({ error: "Error al eliminar evento" }, { status: 500 })
  }
}
