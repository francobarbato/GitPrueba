import { NextRequest, NextResponse } from "next/server"
import { CasoService } from "@/lib/aplication/services/caso.service"
import { PrismaCasoRepository } from "@/lib/infrastructure/repositories/prisma/caso.repository"

// GET /api/casos/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const casoRepository = new PrismaCasoRepository()
    const casoService = new CasoService(casoRepository)

    const caso = await casoService.getCasoById(id)

    if (!caso) {
      return NextResponse.json({ success: false, error: "Caso no encontrado" }, { status: 404 })
    }

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
    console.log("=== INICIO PUT ===")
    console.log("ID recibido:", params.id)
    
    const id = Number(params.id)
    const body = await request.json()
    
    console.log("Body recibido:", JSON.stringify(body, null, 2))
    console.log("ID parseado:", id)

    if (isNaN(id)) {
      console.log("ERROR: ID inválido")
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

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

    const { PrismaCasoRepository } = await import("../../../../../lib/infrastructure/repositories/prisma/caso.repository")
    const { CasoService } = await import("../../../../../lib/aplication/services/caso.service")
    
    const casoRepository = new PrismaCasoRepository()
    const casoService = new CasoService(casoRepository)

    console.log("Llamando a updateCaso...")
    const casoActualizado = await casoService.updateCaso(id, dataToUpdate)
    
    console.log("Caso actualizado exitosamente:", JSON.stringify(casoActualizado, null, 2))

    return NextResponse.json({
      success: true,
      data: casoActualizado,
    })
  } catch (error: any) {
    console.error("=== ERROR EN PUT ===")
    console.error("Error completo:", error)
    console.error("Stack trace:", error.stack)
    
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}

// export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const id = Number(params.id)
//     const body = await request.json()
    
//     console.log("Body recibido:", body)

//     if (isNaN(id)) {
//       return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
//     }

//     // Formatear fechas correctamente
//     if (body.fechaInicio) {
//       body.fechaInicio = new Date(body.fechaInicio).toISOString()
//     }
    
//     if (body.fechaCierre) {
//       body.fechaCierre = new Date(body.fechaCierre).toISOString()
//     }

//     const { PrismaCasoRepository } = await import("../../../../../lib/infrastructure/repositories/prisma/caso.repository")
//     const { CasoService } = await import("../../../../../lib/aplication/services/caso.service")
    
//     const casoRepository = new PrismaCasoRepository()
//     const casoService = new CasoService(casoRepository)

//     const casoActualizado = await casoService.updateCaso(id, body)

//     return NextResponse.json({
//       success: true,
//       data: casoActualizado,
//     })
//   } catch (error) {
//     console.error("Error al actualizar caso:", error)
//     return NextResponse.json({ 
//       success: false, 
//       error: "Error interno del servidor",
//       details: error instanceof Error ? error.message : "Error desconocido"
//     }, { status: 500 })
//   }
// }

/*///////////////////////////////////////////////////////////////////////////////////////////////////*/


// export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const id = Number(params.id)
//     const body = await request.json()

//     if (isNaN(id)) {
//       return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
//     }

//     const casoRepository = new PrismaCasoRepository()
//     const casoService = new CasoService(casoRepository)

//     const casoActualizado = await casoService.updateCaso(id, body)

//     return NextResponse.json({
//       success: true,
//       data: casoActualizado,
//     })
//   } catch (error) {
//     console.error("Error al actualizar caso:", error)
//     return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
//   }
// }

// DELETE /api/casos/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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