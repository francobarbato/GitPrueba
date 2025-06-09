import { NextRequest, NextResponse } from "next/server"
import { DashboardService } from "@/lib/aplication/services/dashboard.service"

// GET /api/reportes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")

    const dashboardService = new DashboardService()

    switch (tipo) {
      case "casos-por-abogado":
        const casosPorAbogado = await dashboardService.obtenerCasosPorAbogado()
        return NextResponse.json({
          success: true,
          data: casosPorAbogado,
        })

      case "avance-casos":
        const avanceCasos = await dashboardService.obtenerAvanceCasos()
        return NextResponse.json({
          success: true,
          data: avanceCasos,
        })

      case "resumen":
      default:
        const resumen = await dashboardService.obtenerResumenGeneral()
        return NextResponse.json({
          success: true,
          data: resumen,
        })
    }
  } catch (error) {
    console.error("Error al obtener reportes:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}