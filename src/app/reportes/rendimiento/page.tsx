// app/reportes/rendimiento/page.tsx
// TAC-08: Rendimiento y Velocidad - Análisis HISTÓRICO de eficiencia

import React from "react"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { subDays, differenceInDays, startOfMonth, subMonths } from "date-fns"
import { ArrowLeft, TrendingUp, Trophy, Clock, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

// Componentes
import { KPIsRendimiento } from "./components/KPIsRendimiento"
import { TablaRendimientoAbogados } from "./components/TablaRendimientoAbogados"
import { RankingVelocidad } from "./components/RankingVelocidad"
import { DesglosePorTipo } from "./components/DesglosePorTipo"
import { FiltrosPeriodo } from "./components/FiltrosPeriodo"

// ============================================================================
// TIPOS
// ============================================================================

export type KPIsData = {
  casosCerradosPeriodo: number
  tiempoPromedioResolucion: number
  mejorAbogado: string
  mejorTiempo: number
  comparativaAnterior: number // % de mejora/empeoramiento vs período anterior
}

export type RendimientoAbogado = {
  id: string
  nombre: string
  email: string
  casosCerrados: number
  tiempoPromedio: number
  tiempoMinimo: number
  tiempoMaximo: number
  posicionRanking: number
  tendencia: 'mejora' | 'estable' | 'empeora'
  desglosePorTipo: { tipo: string; cantidad: number; tiempoPromedio: number }[]
}

export type DesgloseTipo = {
  tipo: string
  casosCerrados: number
  tiempoPromedio: number
  abogadoMasRapido: string
  abogadoMasRapidoTiempo: number
}

// ============================================================================
// FUNCIONES DE DATOS
// ============================================================================

function getPeriodoFechas(periodo: string): { desde: Date; hasta: Date; desdeAnterior: Date; hastaAnterior: Date } {
  const hasta = new Date()
  let desde: Date
  let desdeAnterior: Date
  let hastaAnterior: Date

  switch (periodo) {
    case '30':
      desde = subDays(hasta, 30)
      hastaAnterior = subDays(hasta, 30)
      desdeAnterior = subDays(hasta, 60)
      break
    case '90':
      desde = subDays(hasta, 90)
      hastaAnterior = subDays(hasta, 90)
      desdeAnterior = subDays(hasta, 180)
      break
    case '180':
      desde = subDays(hasta, 180)
      hastaAnterior = subDays(hasta, 180)
      desdeAnterior = subDays(hasta, 360)
      break
    case '365':
      desde = subDays(hasta, 365)
      hastaAnterior = subDays(hasta, 365)
      desdeAnterior = subDays(hasta, 730)
      break
    default: // 90 días por defecto
      desde = subDays(hasta, 90)
      hastaAnterior = subDays(hasta, 90)
      desdeAnterior = subDays(hasta, 180)
  }

  return { desde, hasta, desdeAnterior, hastaAnterior }
}

async function calcularRendimiento(
  userId: string,
  esAdmin: boolean,
  periodo: string,
  filtroTipo?: string
): Promise<{
  kpis: KPIsData
  rendimientoAbogados: RendimientoAbogado[]
  desglosePorTipo: DesgloseTipo[]
}> {
  const { desde, hasta, desdeAnterior, hastaAnterior } = getPeriodoFechas(periodo)

  // Construir filtros
  const whereBase: any = {
    estaCerrado: true,
    fechaCierre: { not: null }
  }

  if (!esAdmin) {
    whereBase.abogadoId = userId
  }

  if (filtroTipo && filtroTipo !== 'TODOS') {
    whereBase.tipo = filtroTipo
  }

  // Casos cerrados en el período actual
  const casosPeriodoActual = await prisma.caso.findMany({
    where: {
      ...whereBase,
      fechaCierre: {
        gte: desde,
        lte: hasta
      }
    },
    include: {
      abogado: {
        select: { id: true, nombre: true, apellido: true, email: true }
      }
    }
  })

  // Casos cerrados en el período anterior (para comparativa)
  const casosPeriodoAnterior = await prisma.caso.findMany({
    where: {
      ...whereBase,
      fechaCierre: {
        gte: desdeAnterior,
        lte: hastaAnterior
      }
    }
  })

  // ========== CALCULAR KPIs ==========
  
  // Calcular tiempo de resolución para cada caso
  const tiemposActuales = casosPeriodoActual.map(caso => {
    return differenceInDays(caso.fechaCierre!, caso.fechaInicio)
  }).filter(t => t > 0)

  const tiemposAnteriores = casosPeriodoAnterior.map(caso => {
    return differenceInDays(caso.fechaCierre!, caso.fechaInicio)
  }).filter(t => t > 0)

  const tiempoPromedioActual = tiemposActuales.length > 0
    ? Math.round(tiemposActuales.reduce((a, b) => a + b, 0) / tiemposActuales.length)
    : 0

  const tiempoPromedioAnterior = tiemposAnteriores.length > 0
    ? Math.round(tiemposAnteriores.reduce((a, b) => a + b, 0) / tiemposAnteriores.length)
    : 0

  // Comparativa: negativo = mejora (más rápido), positivo = empeora
  const comparativaAnterior = tiempoPromedioAnterior > 0
    ? Math.round(((tiempoPromedioActual - tiempoPromedioAnterior) / tiempoPromedioAnterior) * 100)
    : 0

  // ========== CALCULAR RENDIMIENTO POR ABOGADO ==========
  
  const abogadosMap = new Map<string, {
    id: string
    nombre: string
    email: string
    tiempos: number[]
    desglose: Map<string, number[]>
  }>()

  casosPeriodoActual.forEach(caso => {
    const abogadoId = caso.abogado.id
    const nombreAbogado = caso.abogado.nombre && caso.abogado.apellido
      ? `${caso.abogado.nombre} ${caso.abogado.apellido}`
      : caso.abogado.email.split('@')[0]

    if (!abogadosMap.has(abogadoId)) {
      abogadosMap.set(abogadoId, {
        id: abogadoId,
        nombre: nombreAbogado,
        email: caso.abogado.email,
        tiempos: [],
        desglose: new Map()
      })
    }

    const tiempo = differenceInDays(caso.fechaCierre!, caso.fechaInicio)
    if (tiempo > 0) {
      abogadosMap.get(abogadoId)!.tiempos.push(tiempo)

      // Agregar al desglose por tipo
      const tipo = caso.tipo || 'Sin tipo'
      if (!abogadosMap.get(abogadoId)!.desglose.has(tipo)) {
        abogadosMap.get(abogadoId)!.desglose.set(tipo, [])
      }
      abogadosMap.get(abogadoId)!.desglose.get(tipo)!.push(tiempo)
    }
  })

  // Calcular datos del período anterior para tendencia
  const tiemposAnteriorPorAbogado = new Map<string, number[]>()
  casosPeriodoAnterior.forEach(caso => {
    const tiempo = differenceInDays(caso.fechaCierre!, caso.fechaInicio)
    if (tiempo > 0) {
      if (!tiemposAnteriorPorAbogado.has(caso.abogadoId)) {
        tiemposAnteriorPorAbogado.set(caso.abogadoId, [])
      }
      tiemposAnteriorPorAbogado.get(caso.abogadoId)!.push(tiempo)
    }
  })

  // Convertir a array y calcular métricas
  const rendimientoAbogados: RendimientoAbogado[] = Array.from(abogadosMap.values())
    .map(abogado => {
      const tiempoPromedio = abogado.tiempos.length > 0
        ? Math.round(abogado.tiempos.reduce((a, b) => a + b, 0) / abogado.tiempos.length)
        : 0

      // Calcular tendencia comparando con período anterior
      const tiemposAnt = tiemposAnteriorPorAbogado.get(abogado.id) || []
      const promedioAnterior = tiemposAnt.length > 0
        ? Math.round(tiemposAnt.reduce((a, b) => a + b, 0) / tiemposAnt.length)
        : 0

      let tendencia: 'mejora' | 'estable' | 'empeora' = 'estable'
      if (promedioAnterior > 0) {
        const diferencia = ((tiempoPromedio - promedioAnterior) / promedioAnterior) * 100
        if (diferencia < -10) tendencia = 'mejora'
        else if (diferencia > 10) tendencia = 'empeora'
      }

      // Desglose por tipo
      const desglosePorTipo = Array.from(abogado.desglose.entries()).map(([tipo, tiempos]) => ({
        tipo,
        cantidad: tiempos.length,
        tiempoPromedio: Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
      }))

      return {
        id: abogado.id,
        nombre: abogado.nombre,
        email: abogado.email,
        casosCerrados: abogado.tiempos.length,
        tiempoPromedio,
        tiempoMinimo: abogado.tiempos.length > 0 ? Math.min(...abogado.tiempos) : 0,
        tiempoMaximo: abogado.tiempos.length > 0 ? Math.max(...abogado.tiempos) : 0,
        posicionRanking: 0, // Se calcula después
        tendencia,
        desglosePorTipo
      }
    })
    .filter(a => a.casosCerrados > 0)
    .sort((a, b) => a.tiempoPromedio - b.tiempoPromedio) // Más rápido primero

  // Asignar posiciones de ranking
  rendimientoAbogados.forEach((abogado, index) => {
    abogado.posicionRanking = index + 1
  })

  // Encontrar mejor abogado
  const mejorAbogado = rendimientoAbogados[0]

  // ========== DESGLOSE POR TIPO DE CASO ==========
  
  const tiposCasosMap = new Map<string, {
    tiempos: number[]
    abogados: Map<string, { nombre: string; tiempos: number[] }>
  }>()

  casosPeriodoActual.forEach(caso => {
    const tipo = caso.tipo || 'Sin tipo'
    const tiempo = differenceInDays(caso.fechaCierre!, caso.fechaInicio)
    
    if (tiempo <= 0) return

    if (!tiposCasosMap.has(tipo)) {
      tiposCasosMap.set(tipo, { tiempos: [], abogados: new Map() })
    }

    tiposCasosMap.get(tipo)!.tiempos.push(tiempo)

    const nombreAbogado = caso.abogado.nombre && caso.abogado.apellido
      ? `${caso.abogado.nombre} ${caso.abogado.apellido}`
      : caso.abogado.email.split('@')[0]

    if (!tiposCasosMap.get(tipo)!.abogados.has(caso.abogado.id)) {
      tiposCasosMap.get(tipo)!.abogados.set(caso.abogado.id, { nombre: nombreAbogado, tiempos: [] })
    }
    tiposCasosMap.get(tipo)!.abogados.get(caso.abogado.id)!.tiempos.push(tiempo)
  })

  const desglosePorTipo: DesgloseTipo[] = Array.from(tiposCasosMap.entries())
    .map(([tipo, data]) => {
      const tiempoPromedio = Math.round(data.tiempos.reduce((a, b) => a + b, 0) / data.tiempos.length)

      // Encontrar abogado más rápido en este tipo
      let abogadoMasRapido = 'N/A'
      let abogadoMasRapidoTiempo = Infinity

      data.abogados.forEach((abogadoData, _) => {
        const promedio = Math.round(abogadoData.tiempos.reduce((a, b) => a + b, 0) / abogadoData.tiempos.length)
        if (promedio < abogadoMasRapidoTiempo) {
          abogadoMasRapidoTiempo = promedio
          abogadoMasRapido = abogadoData.nombre
        }
      })

      return {
        tipo,
        casosCerrados: data.tiempos.length,
        tiempoPromedio,
        abogadoMasRapido,
        abogadoMasRapidoTiempo: abogadoMasRapidoTiempo === Infinity ? 0 : abogadoMasRapidoTiempo
      }
    })
    .sort((a, b) => b.casosCerrados - a.casosCerrados)

  // ========== CONSTRUIR KPIs ==========
  
  const kpis: KPIsData = {
    casosCerradosPeriodo: casosPeriodoActual.length,
    tiempoPromedioResolucion: tiempoPromedioActual,
    mejorAbogado: mejorAbogado?.nombre || 'N/A',
    mejorTiempo: mejorAbogado?.tiempoPromedio || 0,
    comparativaAnterior
  }

  return { kpis, rendimientoAbogados, desglosePorTipo }
}

// Obtener tipos disponibles para filtro
async function obtenerTiposCaso(userId: string, esAdmin: boolean): Promise<string[]> {
  const whereClause = esAdmin ? {} : { abogadoId: userId }
  
  const casos = await prisma.caso.findMany({
    where: {
      ...whereClause,
      estaCerrado: true
    },
    select: { tipo: true },
    distinct: ['tipo']
  })

  return casos.map(c => c.tipo).filter(Boolean) as string[]
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default async function RendimientoPage({
  searchParams
}: {
  searchParams: {
    periodo?: string
    tipo?: string
  }
}) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const esAdmin = user.rol?.toUpperCase() === 'ADMIN'
  const periodo = searchParams.periodo || '90'
  const filtroTipo = searchParams.tipo

  // Obtener datos
  const tiposDisponibles = await obtenerTiposCaso(user.id, esAdmin)
  const { kpis, rendimientoAbogados, desglosePorTipo } = await calcularRendimiento(
    user.id,
    esAdmin,
    periodo,
    filtroTipo
  )

  // Texto del período para mostrar
  const periodoTexto = {
    '30': 'últimos 30 días',
    '90': 'últimos 90 días',
    '180': 'últimos 6 meses',
    '365': 'último año'
  }[periodo] || 'últimos 90 días'

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Link href="/reportes">
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                    Rendimiento y Velocidad
                  </h1>
                  <p className="text-sm text-slate-500">
                    Análisis histórico de eficiencia en resolución de casos ({periodoTexto})
                  </p>
                </div>
              </div>

              <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                esAdmin 
                  ? 'bg-purple-50 text-purple-700 border-purple-200' 
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {esAdmin ? 'Vista Gerencial' : 'Mi Rendimiento'}
              </span>
            </div>

            {/* Filtros */}
            <FiltrosPeriodo 
              periodoActual={periodo}
              tiposDisponibles={tiposDisponibles}
              tipoActual={filtroTipo}
            />

            {/* Verificar si hay datos */}
            {kpis.casosCerradosPeriodo === 0 ? (
              <div className="mt-8 p-12 bg-white border border-slate-200 rounded-lg text-center">
                <Clock className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">
                  No hay casos cerrados en este período
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  Probá seleccionando un período más amplio o quitando los filtros
                </p>
              </div>
            ) : (
              <>
                {/* KPIs */}
                <KPIsRendimiento data={kpis} />

                {/* Ranking de Velocidad (Top 3) - Solo si hay más de 1 abogado */}
                {esAdmin && rendimientoAbogados.length > 1 && (
                  <RankingVelocidad abogados={rendimientoAbogados.slice(0, 5)} />
                )}

                {/* Tabla de Rendimiento por Abogado */}
                {esAdmin && rendimientoAbogados.length > 0 && (
                  <TablaRendimientoAbogados data={rendimientoAbogados} />
                )}

                {/* Desglose por Tipo de Caso */}
                {desglosePorTipo.length > 1 && (
                  <DesglosePorTipo data={desglosePorTipo} />
                )}
              </>
            )}

            {/* Nota informativa */}
            <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-600">
                <strong>Metodología:</strong>{' '}
                Tiempo de resolución = días entre fecha de inicio y fecha de cierre del caso. 
                Solo se consideran casos efectivamente cerrados en el período seleccionado.
                La tendencia compara con el período anterior equivalente.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
