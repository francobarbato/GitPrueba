import { NextRequest, NextResponse } from "next/server"
import { CasoService } from "@/lib/aplication/services/caso.service"
import { PrismaCasoRepository } from "@/lib/infrastructure/repositories/prisma/caso.repository"

// GET /api/casos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const abogadoId = searchParams.get("abogadoId")
    const estado = searchParams.get("estado")
    const tipo = searchParams.get("tipo")

    const casoRepository = new PrismaCasoRepository()
    const casoService = new CasoService(casoRepository)

    const filtros = {
      ...(abogadoId && { abogadoId: Number(abogadoId) }),
      ...(estado && { estado }),
      ...(tipo && { tipo }),
    }

    const casos = await casoService.getAllCasos(Object.keys(filtros).length > 0 ? filtros : undefined)

    return NextResponse.json({
      success: true,
      data: casos,
    })
  } catch (error) {
    console.error("Error al obtener casos:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST /api/casos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { numero, titulo, descripcion, tipo, abogadoId, clienteId, fechaInicio } = body

    if (!numero || !titulo || !descripcion || !tipo || !abogadoId || !clienteId || !fechaInicio) {
      return NextResponse.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Formatear fechas correctamente
    const formattedData = {
      ...body,
      fechaInicio: new Date(fechaInicio),
      abogadoId: Number(abogadoId),
      clienteId: Number(clienteId),
      porcentajeAvance: body.porcentajeAvance || 0
    }

    const { PrismaCasoRepository } = await import("../../../../lib/infrastructure/repositories/prisma/caso.repository")
    const { CasoService } = await import("../../../../lib/aplication/services/caso.service")

    const casoRepository = new PrismaCasoRepository()
    const casoService = new CasoService(casoRepository)

    const nuevoCaso = await casoService.createCaso(formattedData)

    return NextResponse.json(
      {
        success: true,
        data: nuevoCaso,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error al crear caso:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json()

//     const { numero, titulo, descripcion, tipo, abogadoId, clienteId, fechaInicio } = body

//     if (!numero || !titulo || !descripcion || !tipo || !abogadoId || !clienteId || !fechaInicio) {
//       return NextResponse.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
//     }

//     const casoRepository = new PrismaCasoRepository()
//     const casoService = new CasoService(casoRepository)

//     const nuevoCaso = await casoService.createCaso({
//       numero,
//       titulo,
//       descripcion,
//       tipo,
//       estado: "abierto",
//       fechaInicio: new Date(fechaInicio),
//       abogadoId: Number(abogadoId),
//       clienteId: Number(clienteId),
//       porcentajeAvance: 0,
//     })

//     return NextResponse.json(
//       {
//         success: true,
//         data: nuevoCaso,
//       },
//       { status: 201 },
//     )
//   } catch (error) {
//     console.error("Error al crear caso:", error)
//     return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
//   }
// }
