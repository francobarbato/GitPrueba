import { type NextRequest, NextResponse } from "next/server"
import { CasoService } from "@/lib/aplication/services/caso.service"
import { PrismaCasoRepository } from "@/lib/infrastructure/repositories/prisma/caso.repository"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")

    const casoRepository = new PrismaCasoRepository()
    const casoService = new CasoService(casoRepository)

    // Obtener todos los casos para generar reportes
    const casos = await casoService.getAllCasos()

    switch (tipo) {
      case "resumen":
        const resumen = {
          totalCasos: casos.length,
          casosAbiertos: casos.filter((c) => c.estado === "abierto").length,
          casosEnProceso: casos.filter((c) => c.estado === "en_proceso").length,
          casosCerrados: casos.filter((c) => c.estado === "cerrado").length,
          casosArchivados: casos.filter((c) => c.estado === "archivado").length,
          promedioAvance:
            casos.length > 0
              ? Math.round(casos.reduce((sum, caso) => sum + (caso.porcentajeAvance || 0), 0) / casos.length)
              : 0,
        }
        return NextResponse.json({ success: true, data: resumen })

      case "casos-por-abogado":
        const casosPorAbogado = casos.reduce((acc: any, caso) => {
          const abogadoNombre = caso.abogado ? `${caso.abogado.nombre} ${caso.abogado.apellido}`.trim() : "Sin asignar"

          if (!acc[abogadoNombre]) {
            acc[abogadoNombre] = 0
          }
          acc[abogadoNombre]++
          return acc
        }, {})

        const dataCasosPorAbogado = Object.entries(casosPorAbogado).map(([abogado, casos]) => ({
          abogado,
          casos: casos as number,
        }))

        return NextResponse.json({ success: true, data: dataCasosPorAbogado })

      case "casos-por-tipo":
        const casosPorTipo = casos.reduce((acc: any, caso) => {
          const tipo = caso.tipo || "Sin tipo"
          if (!acc[tipo]) {
            acc[tipo] = 0
          }
          acc[tipo]++
          return acc
        }, {})

        const dataCasosPorTipo = Object.entries(casosPorTipo).map(([tipo, cantidad]) => ({
          tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
          cantidad: cantidad as number,
        }))

        return NextResponse.json({ success: true, data: dataCasosPorTipo })

      case "casos-por-estado":
        const casosPorEstado = casos.reduce((acc: any, caso) => {
          const estado = caso.estado || "Sin estado"
          if (!acc[estado]) {
            acc[estado] = 0
          }
          acc[estado]++
          return acc
        }, {})

        const dataCasosPorEstado = Object.entries(casosPorEstado).map(([estado, cantidad]) => ({
          estado: estado === "en_proceso" ? "En Proceso" : estado.charAt(0).toUpperCase() + estado.slice(1),
          cantidad: cantidad as number,
        }))

        return NextResponse.json({ success: true, data: dataCasosPorEstado })

      case "avance-casos":
        const avancePorTipo = casos.reduce((acc: any, caso) => {
          const tipo = caso.tipo || "Sin tipo"
          if (!acc[tipo]) {
            acc[tipo] = { total: 0, suma: 0 }
          }
          acc[tipo].total++
          acc[tipo].suma += caso.porcentajeAvance || 0
          return acc
        }, {})

        const dataAvancePorTipo = Object.entries(avancePorTipo).map(([tipo, data]: [string, any]) => ({
          tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
          promedio: Math.round(data.suma / data.total),
        }))

        return NextResponse.json({ success: true, data: dataAvancePorTipo })

      default:
        const todosLosDatos = {
          resumen: {
            totalCasos: casos.length,
            casosAbiertos: casos.filter((c) => c.estado === "abierto").length,
            casosEnProceso: casos.filter((c) => c.estado === "en_proceso").length,
            casosCerrados: casos.filter((c) => c.estado === "cerrado").length,
            promedioAvance:
              casos.length > 0
                ? Math.round(casos.reduce((sum, caso) => sum + (caso.porcentajeAvance || 0), 0) / casos.length)
                : 0,
          },
          casos: casos.length,
        }
        return NextResponse.json({ success: true, data: todosLosDatos })
    }
  } catch (error) {
    console.error("Error al generar reportes:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
