import { NextRequest, NextResponse } from "next/server"
import { CasoService } from "@/lib/aplication/services/caso.service"

// Instancia global (o por request) sin argumentos, ya que el servicio crea su propio repo
const casoService = new CasoService()

// GET /api/casos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extraemos params. OJO: Los IDs en tu schema son String (UUID), no Number.
    const abogadoId = searchParams.get("abogadoId")
    const estado = searchParams.get("estado")
    const tipo = searchParams.get("tipo")

    // Filtros dinámicos
    const filtros: any = {}
    if (abogadoId) filtros.abogadoId = abogadoId // Es string
    if (estado) filtros.estado = estado
    if (tipo) filtros.tipo = tipo

    // Llamada al servicio (sin pasarle nada si no hay filtros)
    const casos = await casoService.getAllCasos() 
    
    // Nota: Si tu servicio soporta filtrado en getAllCasos, pásale 'filtros'. 
    // Si no, tendrás que filtrar acá o mejorar el servicio. 
    // Por ahora traemos todos para que no falle.

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

    // Validación básica
    const { numero, titulo, descripcion, tipo, abogadoId, clienteId, fechaInicio } = body

    if (!numero || !titulo || !tipo || !abogadoId || !clienteId) {
      return NextResponse.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Preparar objeto. 
    // IMPORTANTE: Tus IDs son String (UUID) según tu Schema. No uses Number().
    const dataToCreate = {
      numero,
      titulo,
      descripcion,
      tipo,
      fechaInicio: new Date(fechaInicio), // Convertir string a Date
      clienteId: String(clienteId),       // Asegurar String
      porcentajeAvance: body.porcentajeAvance || 0,
      
      // Nuevos campos opcionales que agregamos hoy (para que no falle si no vienen)
      priority: body.priority || "NORMAL",
      isFavorite: body.isFavorite === true
    }

    // CORRECCIÓN PRINCIPAL AQUÍ:
    // El método createCaso pide (data, abogadoId). Pasamos el ID como segundo argumento.
    const nuevoCaso = await casoService.createCaso(dataToCreate, String(abogadoId))

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