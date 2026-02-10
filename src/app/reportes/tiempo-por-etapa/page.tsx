// app/reportes/tiempo-por-etapa/page.tsx
// TAC-06: Cuellos de Botella (Tiempos por Etapa)

import React from "react"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { differenceInDays, differenceInHours } from "date-fns"
import { ArrowLeft, Clock, AlertTriangle, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ResumenGeneral } from "./components/ResumenGeneral"
import { TablaPromediosPorEtapa } from "./components/TablaPromediosPorEtapa"
import { ComparativaPorTipo } from "./components/ComparativaPorTipo"
import { GraficoDistribucion } from "./components/GraficoDistribucion"
import { FiltrosReporte } from "./components/FiltrosReporte"

// ============================================================================
// TIPOS
// ============================================================================

export type TiempoPorEtapa = {
  etapa: string
  diasPromedio: number
  diasMinimo: number
  diasMaximo: number
  cantidadCasos: number
  porcentajeDelTotal: number
  esCuelloBotella: boolean // Si supera el umbral definido
}

export type TiempoPorTipoCaso = {
  tipoCaso: string
  etapas: TiempoPorEtapa[]
  tiempoTotalPromedio: number
  cantidadCasos: number
}

export type ResumenReporte = {
  tiempoPromedioTotal: number
  etapaMasLenta: string
  etapaMasRapida: string
  casosAnalizados: number
  casosConCuelloBotella: number
  porcentajeCuellos: number
}

// ============================================================================
// FUNCIONES DE CÁLCULO
// ============================================================================

async function calcularTiemposPorEtapa(
  userId: string, 
  esAdmin: boolean,
  filtroTipo?: string,
  filtroDesde?: string,
  filtroHasta?: string
): Promise<{
  tiemposPorEtapa: TiempoPorEtapa[]
  tiemposPorTipo: TiempoPorTipoCaso[]
  resumen: ResumenReporte
}> {
  
  // Construir filtros de consulta
  const whereClause: any = {}
  
  if (!esAdmin) {
    whereClause.abogadoId = userId
  }
  
  if (filtroTipo && filtroTipo !== 'TODOS') {
    whereClause.tipo = filtroTipo
  }
  
  if (filtroDesde || filtroHasta) {
    whereClause.fechaInicio = {}
    if (filtroDesde) {
      whereClause.fechaInicio.gte = new Date(filtroDesde)
    }
    if (filtroHasta) {
      whereClause.fechaInicio.lte = new Date(filtroHasta)
    }
  }

  // Obtener casos con su bitácora de cambios de estado
  const casos = await prisma.caso.findMany({
    where: whereClause,
    include: {
      bitacoras: {
        where: {
          OR: [
            { accion: "Cambio de Estado" },
            { accion: "ESTADO_CHANGE" },
            { accion: "CREATE" }
          ]
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  // Estructura para acumular tiempos por etapa
  const tiemposAcumulados: Map<string, number[]> = new Map()
  
  // Estructura para acumular por tipo de caso
  const tiemposPorTipoCaso: Map<string, Map<string, number[]>> = new Map()

  // Procesar cada caso
  casos.forEach(caso => {
    const tipoCaso = caso.tipo || 'SIN_TIPO'
    
    if (!tiemposPorTipoCaso.has(tipoCaso)) {
      tiemposPorTipoCaso.set(tipoCaso, new Map())
    }
    
    const tiemposTipo = tiemposPorTipoCaso.get(tipoCaso)!

    // Si no hay bitácoras, usar el estado actual desde fechaInicio
    if (caso.bitacoras.length === 0) {
      const fechaFin = caso.estaCerrado ? caso.fechaCierre || caso.fechaFin || new Date() : new Date()
      const diasEnEstado = Math.max(1, differenceInDays(fechaFin, caso.fechaInicio))
      
      // Acumular globalmente
      if (!tiemposAcumulados.has(caso.estado)) {
        tiemposAcumulados.set(caso.estado, [])
      }
      tiemposAcumulados.get(caso.estado)!.push(diasEnEstado)
      
      // Acumular por tipo
      if (!tiemposTipo.has(caso.estado)) {
        tiemposTipo.set(caso.estado, [])
      }
      tiemposTipo.get(caso.estado)!.push(diasEnEstado)
      
      return
    }

    // Procesar bitácoras para calcular tiempo en cada etapa
    let fechaAnterior = caso.fechaInicio
    let estadoAnterior = "Inicio / Demanda" // Estado inicial por defecto

    // Revisar si hay un registro de creación para obtener el estado inicial
    const registroCreacion = caso.bitacoras.find(b => b.accion === "CREATE")
    if (registroCreacion && registroCreacion.estadoNuevo) {
      estadoAnterior = registroCreacion.estadoNuevo
    }

    // Procesar cambios de estado
    caso.bitacoras.forEach((bitacora, index) => {
      // Solo procesar cambios de estado reales
      if (bitacora.accion !== "Cambio de Estado" && bitacora.accion !== "ESTADO_CHANGE") {
        return
      }

      const estadoQueTermina = bitacora.estadoAnterior || estadoAnterior
      const diasEnEtapa = Math.max(0, differenceInDays(bitacora.createdAt, fechaAnterior))

      if (diasEnEtapa > 0 && estadoQueTermina) {
        // Acumular globalmente
        if (!tiemposAcumulados.has(estadoQueTermina)) {
          tiemposAcumulados.set(estadoQueTermina, [])
        }
        tiemposAcumulados.get(estadoQueTermina)!.push(diasEnEtapa)

        // Acumular por tipo
        if (!tiemposTipo.has(estadoQueTermina)) {
          tiemposTipo.set(estadoQueTermina, [])
        }
        tiemposTipo.get(estadoQueTermina)!.push(diasEnEtapa)
      }

      // Actualizar para la próxima iteración
      fechaAnterior = bitacora.createdAt
      estadoAnterior = bitacora.estadoNuevo || estadoAnterior
    })

    // Agregar tiempo en el estado actual (desde el último cambio hasta hoy o cierre)
    const fechaFinal = caso.estaCerrado 
      ? (caso.fechaCierre || caso.fechaFin || new Date()) 
      : new Date()
    
    const diasEnEstadoActual = Math.max(0, differenceInDays(fechaFinal, fechaAnterior))
    
    if (diasEnEstadoActual > 0) {
      const estadoActual = caso.estado
      
      // Acumular globalmente
      if (!tiemposAcumulados.has(estadoActual)) {
        tiemposAcumulados.set(estadoActual, [])
      }
      tiemposAcumulados.get(estadoActual)!.push(diasEnEstadoActual)

      // Acumular por tipo
      if (!tiemposTipo.has(estadoActual)) {
        tiemposTipo.set(estadoActual, [])
      }
      tiemposTipo.get(estadoActual)!.push(diasEnEstadoActual)
    }
  })

  // Calcular estadísticas por etapa
  let tiempoTotalGlobal = 0
  const tiemposPorEtapa: TiempoPorEtapa[] = []

  tiemposAcumulados.forEach((tiempos, etapa) => {
    if (tiempos.length === 0) return

    const suma = tiempos.reduce((a, b) => a + b, 0)
    const promedio = Math.round(suma / tiempos.length)
    const minimo = Math.min(...tiempos)
    const maximo = Math.max(...tiempos)

    tiempoTotalGlobal += promedio

    tiemposPorEtapa.push({
      etapa,
      diasPromedio: promedio,
      diasMinimo: minimo,
      diasMaximo: maximo,
      cantidadCasos: tiempos.length,
      porcentajeDelTotal: 0, // Se calcula después
      esCuelloBotella: false // Se determina después
    })
  })

  // Calcular porcentajes y detectar cuellos de botella
  const promedioGeneral = tiemposPorEtapa.length > 0 
    ? tiempoTotalGlobal / tiemposPorEtapa.length 
    : 0

  tiemposPorEtapa.forEach(etapa => {
    etapa.porcentajeDelTotal = tiempoTotalGlobal > 0 
      ? Math.round((etapa.diasPromedio / tiempoTotalGlobal) * 100) 
      : 0
    // Cuello de botella: si supera 1.5x el promedio general
    etapa.esCuelloBotella = etapa.diasPromedio > promedioGeneral * 1.5
  })

  // Ordenar por días promedio (de mayor a menor)
  tiemposPorEtapa.sort((a, b) => b.diasPromedio - a.diasPromedio)

  // Calcular tiempos por tipo de caso
  const tiemposPorTipoArray: TiempoPorTipoCaso[] = []

  tiemposPorTipoCaso.forEach((etapasMap, tipoCaso) => {
    const etapas: TiempoPorEtapa[] = []
    let tiempoTotal = 0
    let maxCasos = 0

    etapasMap.forEach((tiempos, etapa) => {
      if (tiempos.length === 0) return

      const suma = tiempos.reduce((a, b) => a + b, 0)
      const promedio = Math.round(suma / tiempos.length)
      
      tiempoTotal += promedio
      maxCasos = Math.max(maxCasos, tiempos.length)

      etapas.push({
        etapa,
        diasPromedio: promedio,
        diasMinimo: Math.min(...tiempos),
        diasMaximo: Math.max(...tiempos),
        cantidadCasos: tiempos.length,
        porcentajeDelTotal: 0,
        esCuelloBotella: false
      })
    })

    // Calcular porcentajes dentro del tipo
    etapas.forEach(e => {
      e.porcentajeDelTotal = tiempoTotal > 0 ? Math.round((e.diasPromedio / tiempoTotal) * 100) : 0
      e.esCuelloBotella = e.diasPromedio > (tiempoTotal / etapas.length) * 1.5
    })

    etapas.sort((a, b) => b.diasPromedio - a.diasPromedio)

    tiemposPorTipoArray.push({
      tipoCaso,
      etapas,
      tiempoTotalPromedio: tiempoTotal,
      cantidadCasos: maxCasos
    })
  })

  tiemposPorTipoArray.sort((a, b) => b.tiempoTotalPromedio - a.tiempoTotalPromedio)

  // Calcular resumen
  const etapaMasLenta = tiemposPorEtapa[0]?.etapa || 'N/A'
  const etapaMasRapida = tiemposPorEtapa[tiemposPorEtapa.length - 1]?.etapa || 'N/A'
  const casosConCuelloBotella = tiemposPorEtapa.filter(e => e.esCuelloBotella).length

  const resumen: ResumenReporte = {
    tiempoPromedioTotal: tiempoTotalGlobal,
    etapaMasLenta,
    etapaMasRapida,
    casosAnalizados: casos.length,
    casosConCuelloBotella,
    porcentajeCuellos: tiemposPorEtapa.length > 0 
      ? Math.round((casosConCuelloBotella / tiemposPorEtapa.length) * 100) 
      : 0
  }

  return {
    tiemposPorEtapa,
    tiemposPorTipo: tiemposPorTipoArray,
    resumen
  }
}

// Obtener tipos de caso disponibles para el filtro
async function obtenerTiposCaso(userId: string, esAdmin: boolean): Promise<string[]> {
  const casos = await prisma.caso.findMany({
    where: esAdmin ? {} : { abogadoId: userId },
    select: { tipo: true },
    distinct: ['tipo']
  })
  
  return casos.map(c => c.tipo).filter(Boolean) as string[]
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default async function TiempoPorEtapaPage({
  searchParams
}: {
  searchParams: { 
    tipo?: string
    desde?: string
    hasta?: string
  }
}) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const esAdmin = user.rol?.toUpperCase() === 'ADMIN'

  // Obtener tipos disponibles para filtros
  const tiposDisponibles = await obtenerTiposCaso(user.id, esAdmin)

  // Calcular tiempos con filtros aplicados
  const { tiemposPorEtapa, tiemposPorTipo, resumen } = await calcularTiemposPorEtapa(
    user.id,
    esAdmin,
    searchParams.tipo,
    searchParams.desde,
    searchParams.hasta
  )

  // Si no hay datos
  if (resumen.casosAnalizados === 0) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <Link href="/reportes" className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                  <ArrowLeft size={20} />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="text-indigo-600" /> 
                    TAC-06: Cuellos de Botella
                  </h1>
                  <p className="text-sm text-slate-500">Análisis de tiempos por etapa procesal</p>
                </div>
              </div>

              <Card className="p-12 text-center border-slate-200">
                <AlertTriangle className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">No hay datos para analizar</p>
                <p className="text-sm text-slate-400 mt-2">
                  Se necesitan casos con historial de cambios de estado para generar este reporte.
                </p>
                <Link href="/casos/nuevo" className="mt-4 inline-block">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Crear Caso
                  </button>
                </Link>
              </Card>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Link href="/reportes" className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="text-indigo-600" /> 
                  TAC-06: Cuellos de Botella
                </h1>
                <p className="text-sm text-slate-500">
                  Análisis de tiempos promedio por etapa procesal para detectar demoras
                </p>
              </div>
            </div>

            {/* Filtros */}
            <FiltrosReporte 
              tiposDisponibles={tiposDisponibles}
              filtroTipoActual={searchParams.tipo}
              filtroDesde={searchParams.desde}
              filtroHasta={searchParams.hasta}
            />

            {/* Resumen General */}
            <ResumenGeneral resumen={resumen} />

            {/* Tabla de Promedios por Etapa */}
            <TablaPromediosPorEtapa tiempos={tiemposPorEtapa} />

            {/* Gráfico de Distribución */}
            <GraficoDistribucion tiempos={tiemposPorEtapa} />

            {/* Comparativa por Tipo de Caso */}
            {tiemposPorTipo.length > 1 && (
              <ComparativaPorTipo datos={tiemposPorTipo} />
            )}

            {/* Nota informativa */}
            <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                Interpretación del Reporte
              </p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li><strong>Cuello de Botella:</strong> Etapa que supera 1.5x el promedio general de duración</li>
                <li><strong>Tiempo promedio:</strong> Días promedio que un caso permanece en cada etapa</li>
                <li><strong>Porcentaje del total:</strong> Proporción del tiempo total del proceso que consume cada etapa</li>
                <li>Los datos se calculan a partir del historial de cambios de estado en la bitácora</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
