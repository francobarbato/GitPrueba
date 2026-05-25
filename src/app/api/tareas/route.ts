import { type NextRequest, NextResponse } from "next/server"
import prisma from "src/lib/db/prisma"

// POST - Crear nueva tarea
export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST /api/tareas - Iniciando creación de tarea")

    const body = await request.json()
    const { casoId, description, dueDate } = body

    console.log("[v0] Datos recibidos:", { casoId, description, dueDate })

    if (!casoId || !description) {
      console.log("[v0] Error: Faltan campos requeridos")
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const tarea = await prisma.requirement.create({
      data: {
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        isCompleted: false,
        casoId,
      },
    })

    console.log("[v0] Tarea creada exitosamente:", tarea.id)

    const usuario = await prisma.user.findFirst()

    if (usuario) {
      await prisma.bitacora.create({
        data: {
          tipo: "auto",
          accion: "Tarea Creada",
          texto: `Nueva tarea: "${description}"`,
          usuarioId: usuario.id,
          casoId,
        },
      })
    }

    return NextResponse.json(tarea)
  } catch (error) {
    console.error("[v0] Error creando tarea:", error)
    return NextResponse.json({ error: "Error al crear tarea" }, { status: 500 })
  }
}

// GET - Obtener tareas de un caso
export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/tareas - Obteniendo tareas")

    const { searchParams } = new URL(request.url)
    const casoId = searchParams.get("casoId")

    console.log("[v0] casoId:", casoId)

    if (!casoId) {
      return NextResponse.json({ error: "casoId es requerido" }, { status: 400 })
    }

    const tareas = await prisma.requirement.findMany({
      where: { casoId },
      orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }],
    })

    console.log("[v0] Tareas encontradas:", tareas.length)

    return NextResponse.json(tareas)
  } catch (error) {
    console.error("[v0] Error obteniendo tareas:", error)
    return NextResponse.json({ error: "Error al obtener tareas" }, { status: 500 })
  }
}
