import { type NextRequest, NextResponse } from "next/server"
import { CasoService } from "@/lib/aplication/services/caso.service"
import { PrismaCasoRepository } from "@/lib/infrastructure/repositories/prisma/caso.repository"

// GET /api/casos/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("=== GET CASO ===")
    console.log("ID recibido:", params.id)

    const id = Number(params.id)

    if (isNaN(id)) {
      console.log("ID inválido:", params.id)
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const casoRepository = new PrismaCasoRepository()
    const casoService = new CasoService(casoRepository)

    const caso = await casoService.getCasoById(id)

    if (!caso) {
      console.log("Caso no encontrado para ID:", id)
      return NextResponse.json({ success: false, error: "Caso no encontrado" }, { status: 404 })
    }

    console.log("Caso encontrado:", caso.numero)
    return NextResponse.json({
      success: true,
      data: caso,
    })
  } catch (error) {
    console.error("Error al obtener caso:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

// PUT /api/casos/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("=== PUT CASO ===")
    console.log("ID recibido:", params.id)
    console.log("Método:", request.method)
    console.log("URL:", request.url)

    const id = Number(params.id)

    if (isNaN(id)) {
      console.log("ERROR: ID inválido:", params.id)
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    console.log("Body recibido:", JSON.stringify(body, null, 2))

    // Formatear fechas correctamente
    const dataToUpdate = { ...body }
    if (body.fechaInicio) {
      dataToUpdate.fechaInicio = new Date(body.fechaInicio)
      console.log("Fecha inicio formateada:", dataToUpdate.fechaInicio)
    }

    if (body.fechaCierre) {
      dataToUpdate.fechaCierre = new Date(body.fechaCierre)
      console.log("Fecha cierre formateada:", dataToUpdate.fechaCierre)
    }

    console.log("Datos a actualizar:", JSON.stringify(dataToUpdate, null, 2))

    const casoRepository = new PrismaCasoRepository()
    const casoService = new CasoService(casoRepository)

    console.log("Llamando a updateCaso...")
    const casoActualizado = await casoService.updateCaso(id, dataToUpdate)

    console.log("Caso actualizado exitosamente:", casoActualizado.numero)

    return NextResponse.json({
      success: true,
      data: casoActualizado,
    })
  } catch (error: any) {
    console.error("=== ERROR EN PUT ===")
    console.error("Error completo:", error)
    console.error("Stack trace:", error.stack)

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

// DELETE /api/casos/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("=== DELETE CASO ===")
    console.log("ID recibido:", params.id)

    const id = Number(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const casoRepository = new PrismaCasoRepository()
    const casoService = new CasoService(casoRepository)

    await casoService.deleteCaso(id)

    return NextResponse.json({
      success: true,
      message: "Caso eliminado correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar caso:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
