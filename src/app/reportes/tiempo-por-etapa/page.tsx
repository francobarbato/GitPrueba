// app/reportes/tiempo-por-etapa/page.tsx
// Estado de casos activos por etapa procesal
// Secciones:
//   1. Análisis por Tipo de Caso (cards por fuero + tabs con distribución + desplegable)
//   2. Distribución actual por etapa (panorama general — solo Admin y Abogado)
//   3. Detalle de expediente individual (timeline por caso — todos)
//
// Visibilidad por rol:
//   - Admin: Sección 1 + 2 + 3
//   - Abogado: Sección 1 + 2 + 3 (sus casos)
//   - Asistente: Sección 1 + 3
//
// Filtros:
//   - Fuero (todos)
//   - Abogado (solo Admin y Asistente)

import React from "react"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { differenceInDays } from "date-fns"
import { ArrowLeft, BarChart3, AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Componentes
import { AnalisisPorTipoCaso } from "./components/AnalisisPorTipoCaso"
import { DistribucionActual } from "./components/DistribucionActual"
import { SelectorCasoTimeline } from "./components/SelectorCasoTimeline"
import { FiltrosEtapa } from "./components/FiltrosEtapa"

// ============================================================================
// TIPOS
// ============================================================================

export type RangoEstancamiento = 'normal' | 'atencion' | 'demorado' | 'critico'

export type AnalisisTipo = {
  tipo: string
  totalCasos: number
  distribucion: {
    etapa: string
    cantidad: number
    porcentaje: number
    promedioHistorico: number
    casos: {
      id: string
      numero: string
      titulo: string
      diasEnEstado: number
      diasSinMovimiento: number
      rango: RangoEstancamiento
    }[]
  }[]
}

export type DistribucionEtapa = {
  etapa: string
  cantidadCasos: number
  porcentaje: number
  promedioHistorico: number
}

export type CasoTimeline = {
  id: string
  numero: string
  titulo: string
  estado: string
  tipo: string
  totalDias: number
  tiempos: {
    estado: string
    dias: number
    porcentaje: number
    esActual: boolean
  }[]
}

// ============================================================================
// HELPERS
// ============================================================================

function getRango(diasSinMovimiento: number): RangoEstancamiento {
  if (diasSinMovimiento >= 365) return 'critico'
  if (diasSinMovimiento >= 180) return 'demorado'
  if (diasSinMovimiento >= 90) return 'atencion'
  return 'normal'
}

const isAdmin = (rol: string) => rol?.toUpperCase() === 'ADMIN'
const isAbogado = (rol: string) => rol?.toUpperCase() === 'ABOGADO'
const isAsistente = (rol: string) => rol?.toUpperCase() === 'ASISTENTE'

// ============================================================================
// CÁLCULO DE BENCHMARKS HISTÓRICOS
// ============================================================================

async function calcularBenchmarks(): Promise<Map<string, number>> {
  const casosConBitacora = await prisma.caso.findMany({
    where: {
      bitacoras: { some: { accion: "ESTADO_CHANGE" } }
    },
    include: {
      bitacoras: {
        where: { accion: { in: ["ESTADO_CHANGE", "CREATE"] } },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  const tiemposPorEtapa = new Map<string, number[]>()

  casosConBitacora.forEach(caso => {
    const cambios = caso.bitacoras.filter(b => b.accion === "ESTADO_CHANGE")
    if (cambios.length === 0) return

    let fechaAnterior = caso.fechaInicio

    cambios.forEach(bitacora => {
      const dias = differenceInDays(bitacora.createdAt, fechaAnterior)
      if (dias > 0 && bitacora.estadoAnterior) {
        if (!tiemposPorEtapa.has(bitacora.estadoAnterior)) {
          tiemposPorEtapa.set(bitacora.estadoAnterior, [])
        }
        tiemposPorEtapa.get(bitacora.estadoAnterior)!.push(dias)
      }
      fechaAnterior = bitacora.createdAt
    })

    if (caso.estaCerrado && caso.fechaCierre) {
      const diasFinal = differenceInDays(caso.fechaCierre, fechaAnterior)
      if (diasFinal > 0) {
        if (!tiemposPorEtapa.has(caso.estado)) {
          tiemposPorEtapa.set(caso.estado, [])
        }
        tiemposPorEtapa.get(caso.estado)!.push(diasFinal)
      }
    }
  })

  const benchmarks = new Map<string, number>()
  tiemposPorEtapa.forEach((tiempos, etapa) => {
    benchmarks.set(
      etapa,
      Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
    )
  })

  return benchmarks
}

// ============================================================================
// OBTENER DATOS DEL REPORTE
// ============================================================================

async function obtenerDatosReporte(
  userId: string,
  userRol: string,
  filtroFuero: string,
  filtroAbogado: string
) {
  const benchmarks = await calcularBenchmarks()

  const whereActivos: any = { estaCerrado: false }

  // Visibilidad por rol
  if (isAbogado(userRol)) {
    whereActivos.abogadoId = userId
  }

  // Filtro por abogado (Admin o Asistente)
  if (filtroAbogado !== 'todos') {
    whereActivos.abogadoId = filtroAbogado
  }

  // Filtro por fuero
  if (filtroFuero !== 'todos') {
    whereActivos.tipo = filtroFuero
  }

  const casosActivos = await prisma.caso.findMany({
    where: whereActivos,
    select: {
      id: true,
      numero: true,
      titulo: true,
      estado: true,
      tipo: true,
      fechaInicio: true,
      fechaUltimoCambioEstado: true,
      updatedAt: true,
      abogado: { select: { nombre: true, apellido: true, email: true } }
    }
  })

  // ========== SECCIÓN 1: Análisis por Tipo de Caso ==========
  const tiposCasosMap = new Map<string, typeof casosActivos>()
  casosActivos.forEach(caso => {
    const tipo = caso.tipo || 'OTRO'
    if (!tiposCasosMap.has(tipo)) tiposCasosMap.set(tipo, [])
    tiposCasosMap.get(tipo)!.push(caso)
  })

  const analisisPorTipo: AnalisisTipo[] = Array.from(tiposCasosMap.entries())
    .map(([tipo, casos]) => {
      const distribucionMap = new Map<string, typeof casosActivos>()
      casos.forEach(c => {
        if (!distribucionMap.has(c.estado)) distribucionMap.set(c.estado, [])
        distribucionMap.get(c.estado)!.push(c)
      })

      const distribucion = Array.from(distribucionMap.entries())
        .map(([etapa, casosEtapa]) => ({
          etapa,
          cantidad: casosEtapa.length,
          porcentaje: Math.round((casosEtapa.length / casos.length) * 100),
          promedioHistorico: benchmarks.get(etapa) || 0,
          casos: casosEtapa.map(c => {
            const diasSinMov = differenceInDays(new Date(), c.updatedAt)
            return {
              id: c.id,
              numero: c.numero,
              titulo: c.titulo,
              diasEnEstado: differenceInDays(new Date(), c.fechaUltimoCambioEstado),
              diasSinMovimiento: diasSinMov,
              rango: getRango(diasSinMov),
            }
          }).sort((a, b) => b.diasSinMovimiento - a.diasSinMovimiento)
        }))
        .sort((a, b) => b.cantidad - a.cantidad)

      return { tipo, totalCasos: casos.length, distribucion }
    })
    .sort((a, b) => b.totalCasos - a.totalCasos)

  // ========== SECCIÓN 2: Distribución actual por etapa ==========
  const distribucionMap = new Map<string, number>()
  casosActivos.forEach(caso => {
    distribucionMap.set(caso.estado, (distribucionMap.get(caso.estado) || 0) + 1)
  })

  const distribucionActual: DistribucionEtapa[] = Array.from(distribucionMap.entries())
    .map(([etapa, cantidad]) => ({
      etapa,
      cantidadCasos: cantidad,
      porcentaje: casosActivos.length > 0
        ? Math.round((cantidad / casosActivos.length) * 100)
        : 0,
      promedioHistorico: benchmarks.get(etapa) || 0
    }))
    .sort((a, b) => b.cantidadCasos - a.cantidadCasos)

  // ========== SECCIÓN 3: Selector de caso ==========
  const casosConCliente = await prisma.caso.findMany({
    where: whereActivos,
    select: {
      id: true,
      numero: true,
      titulo: true,
      estado: true,
      updatedAt: true,
      cliente: { select: { nombre: true, apellido: true } }
    },
    orderBy: { updatedAt: 'desc' }
  })

  const casosSelector = casosConCliente.map(c => {
    const diasSinMov = differenceInDays(new Date(), c.updatedAt)
    return {
      id: c.id,
      numero: c.numero,
      titulo: c.titulo,
      estado: c.estado,
      cliente: c.cliente,
      diasSinMovimiento: diasSinMov,
      rango: getRango(diasSinMov),
    }
  })

  return {
    analisisPorTipo,
    distribucionActual,
    casosSelector,
    totalCasosActivos: casosActivos.length,
  }
}

// ============================================================================
// OBTENER TIMELINE DE UN CASO ESPECÍFICO
// ============================================================================

async function obtenerTimelineCaso(casoId: string): Promise<CasoTimeline | null> {
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    include: {
      bitacoras: {
        where: { accion: { in: ["ESTADO_CHANGE", "CREATE"] } },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!caso) return null

  const hoy = new Date()
  const fechaFin = caso.estaCerrado && caso.fechaCierre ? caso.fechaCierre : hoy
  const totalDias = Math.max(1, differenceInDays(fechaFin, caso.fechaInicio))

  const tiempos: CasoTimeline['tiempos'] = []
  const cambiosEstado = caso.bitacoras.filter(b => b.accion === "ESTADO_CHANGE")

  if (cambiosEstado.length === 0) {
    tiempos.push({
      estado: caso.estado,
      dias: totalDias,
      porcentaje: 100,
      esActual: !caso.estaCerrado
    })
  } else {
    const createEntry = caso.bitacoras.find(b => b.accion === "CREATE")
    const primerCambio = cambiosEstado[0]
    const estadoInicial = primerCambio.estadoAnterior
      || createEntry?.estadoNuevo
      || "Inicio / Demanda"

    type Tramo = { estado: string; desde: Date; hasta: Date }
    const tramos: Tramo[] = []

    tramos.push({
      estado: estadoInicial,
      desde: caso.fechaInicio,
      hasta: cambiosEstado[0].createdAt
    })

    for (let i = 0; i < cambiosEstado.length; i++) {
      const cambio = cambiosEstado[i]
      const siguienteFecha = cambiosEstado[i + 1]?.createdAt || fechaFin

      tramos.push({
        estado: cambio.estadoNuevo || caso.estado,
        desde: cambio.createdAt,
        hasta: siguienteFecha
      })
    }

    const tramosConsolidados: Tramo[] = []
    tramos.forEach(tramo => {
      const ultimo = tramosConsolidados[tramosConsolidados.length - 1]
      if (ultimo && ultimo.estado === tramo.estado) {
        ultimo.hasta = tramo.hasta
      } else {
        tramosConsolidados.push({ ...tramo })
      }
    })

    tramosConsolidados.forEach((tramo, index) => {
      const dias = Math.max(0, differenceInDays(tramo.hasta, tramo.desde))
      const esUltimo = index === tramosConsolidados.length - 1

      tiempos.push({
        estado: tramo.estado,
        dias,
        porcentaje: totalDias > 0 ? Math.round((dias / totalDias) * 100) : 0,
        esActual: esUltimo && !caso.estaCerrado
      })
    })

    const sumaPorcentaje = tiempos.reduce((s, t) => s + t.porcentaje, 0)
    if (sumaPorcentaje === 0 && tiempos.length > 0) {
      const porcentajeEquitativo = Math.round(100 / tiempos.length)
      tiempos.forEach((t, i) => {
        t.porcentaje = i === tiempos.length - 1
          ? 100 - (porcentajeEquitativo * (tiempos.length - 1))
          : porcentajeEquitativo
      })
    }
  }

  return {
    id: caso.id,
    numero: caso.numero,
    titulo: caso.titulo,
    estado: caso.estado,
    tipo: caso.tipo || 'OTRO',
    totalDias,
    tiempos
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default async function TiempoPorEtapaPage({
  searchParams
}: {
  searchParams: { casoId?: string; fuero?: string; abogado?: string }
}) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const userRol = user.rol?.toUpperCase() || ''

  const filtroFuero = searchParams?.fuero || 'todos'
  const filtroAbogado = searchParams?.abogado || 'todos'

  // Lista de abogados para el filtro (solo Admin y Asistente)
  let abogadosLista: { id: string; nombre: string }[] = []
  if (isAdmin(userRol) || isAsistente(userRol)) {
    const abogados = await prisma.user.findMany({
      where: { rol: 'ABOGADO', isActive: true },
      select: { id: true, nombre: true, apellido: true },
      orderBy: { nombre: 'asc' }
    })
    abogadosLista = abogados.map(a => ({
      id: a.id,
      nombre: `${a.nombre || ''} ${a.apellido || ''}`.trim()
    }))
  }

  const {
    analisisPorTipo,
    distribucionActual,
    casosSelector,
    totalCasosActivos,
  } = await obtenerDatosReporte(user.id, userRol, filtroFuero, filtroAbogado)

  // Timeline del caso seleccionado
  const casoIdSeleccionado = searchParams?.casoId
  let timelineCaso: CasoTimeline | null = null
  if (casoIdSeleccionado) {
    timelineCaso = await obtenerTimelineCaso(casoIdSeleccionado)
  }

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
                    <BarChart3 className="h-6 w-6 text-indigo-600" />
                    Estado de casos activos por etapa procesal
                  </h1>
                  <p className="text-sm text-slate-500">
                    Dónde están tus casos: volumen y concentración por etapa procesal
                  </p>
                </div>
              </div>

              <span className="text-xs font-medium px-3 py-1.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                {isAbogado(userRol) ? 'Vista Personal' : 'Vista General'}
              </span>
            </div>

            {/* Filtros */}
            <div className="mb-6">
              <FiltrosEtapa
                abogados={abogadosLista}
                mostrarFiltroAbogado={isAdmin(userRol) || isAsistente(userRol)}
              />
            </div>

            {totalCasosActivos === 0 ? (
              <Card className="p-12 text-center border-slate-200">
                <AlertTriangle className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">
                  No hay casos activos para analizar
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {filtroFuero !== 'todos' || filtroAbogado !== 'todos'
                    ? 'Probá cambiando los filtros para ver más resultados.'
                    : 'Los datos aparecerán cuando haya expedientes en curso.'
                  }
                </p>
              </Card>
            ) : (
              <>
                {/* SECCIÓN 1: Análisis por Tipo de Caso — todos */}
                <AnalisisPorTipoCaso datos={analisisPorTipo} />

                {/* SECCIÓN 2: Distribución Actual por Etapa — solo Admin y Abogado */}
                {(isAdmin(userRol) || isAbogado(userRol)) && (
                  <DistribucionActual
                    distribucion={distribucionActual}
                    totalCasos={totalCasosActivos}
                  />
                )}

                {/* SECCIÓN 3: Detalle de Expediente Individual — todos */}
                <SelectorCasoTimeline
                  casos={casosSelector}
                  casoActual={casoIdSeleccionado}
                  timelineCaso={timelineCaso}
                />
              </>
            )}

            {/* Nota metodológica */}
            <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                📖 Metodología del Reporte
              </p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li><strong>Promedios históricos:</strong> Calculados a partir de transiciones de estado registradas en la bitácora.</li>
                <li><strong>Días en etapa actual:</strong> Calculados desde la última transición de estado (<code>fechaUltimoCambioEstado</code>).</li>
                <li><strong>Días sin movimiento:</strong> Basado en <code>updatedAt</code> del caso. Cualquier acción (edición, cambio de estado, nota en bitácora) reinicia el contador.</li>
                <li><strong>Timeline individual:</strong> Reconstruido desde la bitácora del expediente.</li>
                <li><strong>Sobre los tiempos de permanencia:</strong> Reflejan cuánto tiempo lleva un caso en cada etapa, no la causa de la demora. Factores externos como tiempos del juzgado, pericias en curso, demoras de la contraparte o complejidad procesal deben ser evaluados por el profesional a cargo.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}