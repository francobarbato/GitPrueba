// app/reportes/tiempo-por-etapa/page.tsx

import React from "react"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { differenceInDays } from "date-fns"
import { ArrowLeft, Clock, TrendingUp, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SelectorCasoMejorado } from "./components/SelectorCaso"
import { TimelineChartMejorado } from "./components/TimelineChart"

type TiempoEtapa = {
  estado: string
  dias: number
  porcentaje: number
  fechaInicio: Date
  fechaFin: Date
  esActual: boolean
  esDemorado: boolean
  tiempoEsperado?: number
  desvio?: number
}

type PromediosEstudio = {
  [estado: string]: number
}

async function obtenerCasosDisponibles(userId: string, esAdmin: boolean) {
  return await prisma.caso.findMany({
    where: esAdmin ? {} : { abogadoId: userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      numero: true,
      titulo: true,
      estado: true,
      tipo: true,
      cliente: {
        select: { nombre: true, apellido: true }
      }
    },
    take: 100 // Limitar para performance
  })
}

async function calcularPromediosEstudio(userId: string, esAdmin: boolean) {
  const casos = await prisma.caso.findMany({
    where: esAdmin ? {} : { abogadoId: userId },
    include: {
      bitacoras: {
        where: {
          accion: "Cambio de Estado"
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  const tiemposPorEstado: { [estado: string]: number[] } = {}

  casos.forEach(caso => {
    const cambios = caso.bitacoras
    if (cambios.length === 0) return

    let fechaAnterior = caso.fechaInicio

    cambios.forEach(cambio => {
      const dias = differenceInDays(cambio.createdAt, fechaAnterior)
      const estado = cambio.estadoNuevo || 'Estado Previo'
      
      if (dias > 0) {
        if (!tiemposPorEstado[estado]) {
          tiemposPorEstado[estado] = []
        }
        tiemposPorEstado[estado].push(dias)
      }
      
      fechaAnterior = cambio.createdAt
    })
  })

  // Calcular promedios
  const promedios: PromediosEstudio = {}
  Object.entries(tiemposPorEstado).forEach(([estado, tiempos]) => {
    promedios[estado] = Math.round(
      tiempos.reduce((a, b) => a + b, 0) / tiempos.length
    )
  })

  return promedios
}

async function analizarTiemposPorEtapa(casoId: string, promediosEstudio: PromediosEstudio) {
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    include: {
      bitacoras: {
        where: {
          accion: "Cambio de Estado",
          estadoAnterior: { not: null },
          estadoNuevo: { not: null }
        },
        orderBy: { createdAt: 'asc' }
      },
      cliente: true
    }
  })

  if (!caso) return null

  const hoy = new Date()
  const fechaFin = caso.fechaFin || hoy
  const totalDias = Math.max(1, differenceInDays(fechaFin, caso.fechaInicio))

  const tiempos: TiempoEtapa[] = []

  if (caso.bitacoras.length === 0) {
    // Sin historial de cambios
    const tiempoEsperado = promediosEstudio[caso.estado] || null
    const desvio = tiempoEsperado ? totalDias - tiempoEsperado : null

    tiempos.push({
      estado: caso.estado,
      dias: totalDias,
      porcentaje: 100,
      fechaInicio: caso.fechaInicio,
      fechaFin: fechaFin,
      esActual: true,
      esDemorado: desvio !== null ? desvio > tiempoEsperado! * 0.3 : false,
      tiempoEsperado: tiempoEsperado || undefined,
      desvio: desvio || undefined
    })
  } else {
    // Con historial de cambios
    let fechaAnterior = caso.fechaInicio
    let estadoAnterior = "Inicio"

    caso.bitacoras.forEach((cambio, index) => {
      const diasEnEtapa = differenceInDays(cambio.createdAt, fechaAnterior)
      const nombreEstado = cambio.estadoAnterior || estadoAnterior
      const tiempoEsperado = promediosEstudio[nombreEstado] || null
      const desvio = tiempoEsperado ? diasEnEtapa - tiempoEsperado : null

      if (diasEnEtapa > 0) {
        tiempos.push({
          estado: nombreEstado,
          dias: diasEnEtapa,
          porcentaje: Math.round((diasEnEtapa / totalDias) * 100),
          fechaInicio: fechaAnterior,
          fechaFin: cambio.createdAt,
          esActual: false,
          esDemorado: desvio !== null ? desvio > tiempoEsperado! * 0.3 : false,
          tiempoEsperado: tiempoEsperado || undefined,
          desvio: desvio || undefined
        })
      }

      fechaAnterior = cambio.createdAt
      estadoAnterior = cambio.estadoNuevo || estadoAnterior
    })

    // Etapa actual
    const diasActuales = differenceInDays(fechaFin, fechaAnterior)
    const tiempoEsperado = promediosEstudio[caso.estado] || null
    const desvio = tiempoEsperado ? diasActuales - tiempoEsperado : null

    if (diasActuales > 0) {
      tiempos.push({
        estado: caso.estado,
        dias: diasActuales,
        porcentaje: Math.round((diasActuales / totalDias) * 100),
        fechaInicio: fechaAnterior,
        fechaFin: fechaFin,
        esActual: true,
        esDemorado: desvio !== null ? desvio > tiempoEsperado! * 0.3 : false,
        tiempoEsperado: tiempoEsperado || undefined,
        desvio: desvio || undefined
      })
    }
  }

  // Calcular métricas adicionales
  const etapaMasLarga = [...tiempos].sort((a, b) => b.dias - a.dias)[0]
  const etapasConDesvio = tiempos.filter(t => t.desvio && Math.abs(t.desvio) > 0)
  const etapaConMayorDesvio = etapasConDesvio.length > 0
    ? [...etapasConDesvio].sort((a, b) => Math.abs(b.desvio!) - Math.abs(a.desvio!))[0]
    : null

  const promedioRealPorEtapa = tiempos.length > 0 
    ? Math.round(totalDias / tiempos.length)
    : 0

  const promedioEsperadoGeneral = Object.values(promediosEstudio).length > 0
    ? Math.round(Object.values(promediosEstudio).reduce((a, b) => a + b, 0) / Object.values(promediosEstudio).length)
    : null

  const desvioGeneral = promedioEsperadoGeneral
    ? Math.round(((totalDias - promedioEsperadoGeneral) / promedioEsperadoGeneral) * 100)
    : null

  return {
    caso,
    tiempos,
    totalDias,
    metricas: {
      etapaMasLarga,
      etapaConMayorDesvio,
      promedioRealPorEtapa,
      promedioEsperadoGeneral,
      desvioGeneral,
      etapasCompletadas: tiempos.filter(t => !t.esActual).length,
      etapasConDemora: tiempos.filter(t => t.esDemorado).length
    }
  }
}

export default async function TiempoPorEtapaPage({
  searchParams
}: {
  searchParams: { casoId?: string }
}) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const esAdmin = user.rol === 'admin'

  // Obtener casos disponibles para el selector
  const casosDisponibles = await obtenerCasosDisponibles(user.id, esAdmin)

  // Calcular promedios del estudio
  const promediosEstudio = await calcularPromediosEstudio(user.id, esAdmin)

  // Si no hay casoId, usar el primer caso disponible
  const casoId = searchParams.casoId || casosDisponibles[0]?.id

  if (!casoId || casosDisponibles.length === 0) {
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
                    <Clock className="text-indigo-600" /> Análisis Temporal por Etapa
                  </h1>
                  <p className="text-sm text-slate-500">Gestión procesal y productividad</p>
                </div>
              </div>

              <Card className="p-12 text-center">
                <AlertTriangle className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">No hay casos disponibles</p>
                <p className="text-sm text-slate-400 mt-2">Crea tu primer caso para ver el análisis temporal</p>
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

  // Analizar tiempos del caso seleccionado
  const analisis = await analizarTiemposPorEtapa(casoId, promediosEstudio)

  if (!analisis) {
    redirect('/reportes/tiempo-por-etapa')
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link href="/reportes" className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="text-indigo-600" /> Análisis Temporal por Etapa
                </h1>
                <p className="text-sm text-slate-500">
                  Reporte orientado a análisis interno de productividad y gestión procesal
                </p>
              </div>

              {analisis.metricas.desvioGeneral !== null && (
                <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  analisis.metricas.desvioGeneral > 20 
                    ? 'bg-red-100 text-red-700'
                    : analisis.metricas.desvioGeneral > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {analisis.metricas.desvioGeneral > 0 ? '+' : ''}
                  {analisis.metricas.desvioGeneral}% vs promedio
                </div>
              )}
            </div>

            {/* Selector de Caso */}
            <SelectorCasoMejorado
              casos={casosDisponibles} 
              casoActual={casoId}
            />

            {/* Timeline y Análisis */}
            <TimelineChartMejorado 
              datos={{
                tiempos: analisis.tiempos,
                totalDias: analisis.totalDias,
                metricas: analisis.metricas
              }}
              caso={analisis.caso}
            />

            {/* Nota informativa */}
            <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                📊 Interpretación de Métricas
              </p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li><strong>Tiempo esperado:</strong> Promedio calculado de todos los casos similares del estudio</li>
                <li><strong>Desvío:</strong> Diferencia entre tiempo real y esperado (⚠️ si supera 30%)</li>
                <li><strong>Etapas demoradas:</strong> Aquellas que exceden significativamente el promedio</li>
                <li><strong>Comparación vs promedio:</strong> Porcentaje de diferencia respecto al tiempo típico del estudio</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}