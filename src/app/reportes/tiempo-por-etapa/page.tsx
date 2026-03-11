// app/reportes/tiempo-por-etapa/page.tsx
// Estado de casos activos por etapa procesal
// Sección 1: casos agrupados por etapa (orden procesal, colapsable)
// Sección 2: cronología de expediente individual

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

import { CasosAgrupadosPorEtapa, type GrupoEtapa, type CasoEnEtapa } from "./components/CasosAgrupadosPorEtapa"
import { SelectorCasoTimeline } from "./components/SelectorCasoTimeline"
import { FiltrosEtapa } from "./components/FiltrosEtapa"

// ============================================================================
// TIPOS
// ============================================================================

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

const isAdmin     = (rol: string) => rol?.toUpperCase() === 'ADMIN'
const isAbogado   = (rol: string) => rol?.toUpperCase() === 'ABOGADO'
const isAsistente = (rol: string) => rol?.toUpperCase() === 'ASISTENTE'

// ============================================================================
// OBTENER DATOS — sección 1
// ============================================================================

async function obtenerDatosReporte(
  userId: string,
  userRol: string,
  filtroFuero: string,
  filtroAbogado: string,
  filtroEtapa: string,
) {
  const where: any = { estaCerrado: false }

  if (isAbogado(userRol)) {
    where.abogadoId = userId
  } else if (filtroAbogado !== 'todos') {
    where.abogadoId = filtroAbogado
  }

  if (filtroFuero !== 'todos') where.tipo = filtroFuero
  if (filtroEtapa !== 'todas') where.estado = filtroEtapa

  const casosActivos = await prisma.caso.findMany({
    where,
    select: {
      id: true,
      numero: true,
      titulo: true,
      estado: true,
      tipo: true,
      fechaInicio: true,
      fechaUltimoCambioEstado: true,
      updatedAt: true,
    },
  })

  const hoy = new Date()

  // Agrupar por etapa
  const etapaMap = new Map<string, CasoEnEtapa[]>()
  casosActivos.forEach(caso => {
    if (!etapaMap.has(caso.estado)) etapaMap.set(caso.estado, [])
    etapaMap.get(caso.estado)!.push({
      id: caso.id,
      numero: caso.numero,
      titulo: caso.titulo,
      tipo: caso.tipo || 'OTRO',
      diasTotales: differenceInDays(hoy, caso.fechaInicio),
      diasEnEstado: differenceInDays(hoy, caso.fechaUltimoCambioEstado),
    })
  })

  // Dentro de cada grupo, ordenar por diasEnEstado desc (más tiempo primero)
  const grupos: GrupoEtapa[] = Array.from(etapaMap.entries()).map(([etapa, casos]) => ({
    etapa,
    casos: casos.sort((a, b) => b.diasEnEstado - a.diasEnEstado),
  }))

  // Casos para el selector de timeline
  const casosConCliente = await prisma.caso.findMany({
    where,
    select: {
      id: true, numero: true, titulo: true, estado: true, updatedAt: true,
      cliente: { select: { nombre: true, apellido: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const casosSelector = casosConCliente.map(c => ({
    id: c.id, numero: c.numero, titulo: c.titulo, estado: c.estado,
    cliente: c.cliente,
    diasSinMovimiento: differenceInDays(hoy, c.updatedAt),
    rango: 'normal' as const,
  }))

  return { grupos, totalCasos: casosActivos.length, casosSelector }
}

// ============================================================================
// TIMELINE DE UN CASO — sin cambios
// ============================================================================

async function obtenerTimelineCaso(casoId: string): Promise<CasoTimeline | null> {
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    include: {
      bitacoras: {
        where: { accion: { in: ["ESTADO_CHANGE", "CREATE"] } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!caso) return null

  const hoy = new Date()
  const fechaFin = caso.estaCerrado && caso.fechaCierre ? caso.fechaCierre : hoy
  const totalDias = Math.max(1, differenceInDays(fechaFin, caso.fechaInicio))
  const tiempos: CasoTimeline['tiempos'] = []
  const cambiosEstado = caso.bitacoras.filter(b => b.accion === "ESTADO_CHANGE")

  if (cambiosEstado.length === 0) {
    tiempos.push({ estado: caso.estado, dias: totalDias, porcentaje: 100, esActual: !caso.estaCerrado })
  } else {
    const createEntry = caso.bitacoras.find(b => b.accion === "CREATE")
    const primerCambio = cambiosEstado[0]
    const estadoInicial = primerCambio.estadoAnterior || createEntry?.estadoNuevo || "Inicio / Demanda"

    type Tramo = { estado: string; desde: Date; hasta: Date }
    const tramos: Tramo[] = [{ estado: estadoInicial, desde: caso.fechaInicio, hasta: cambiosEstado[0].createdAt }]

    for (let i = 0; i < cambiosEstado.length; i++) {
      const cambio = cambiosEstado[i]
      const siguienteFecha = cambiosEstado[i + 1]?.createdAt || fechaFin
      tramos.push({ estado: cambio.estadoNuevo || caso.estado, desde: cambio.createdAt, hasta: siguienteFecha })
    }

    const tramosConsolidados: Tramo[] = []
    tramos.forEach(tramo => {
      const ultimo = tramosConsolidados[tramosConsolidados.length - 1]
      if (ultimo && ultimo.estado === tramo.estado) ultimo.hasta = tramo.hasta
      else tramosConsolidados.push({ ...tramo })
    })

    tramosConsolidados.forEach((tramo, index) => {
      const dias = Math.max(0, differenceInDays(tramo.hasta, tramo.desde))
      const esUltimo = index === tramosConsolidados.length - 1
      tiempos.push({
        estado: tramo.estado, dias,
        porcentaje: totalDias > 0 ? Math.round((dias / totalDias) * 100) : 0,
        esActual: esUltimo && !caso.estaCerrado,
      })
    })

    const sumaPorcentaje = tiempos.reduce((s, t) => s + t.porcentaje, 0)
    if (sumaPorcentaje === 0 && tiempos.length > 0) {
      const porcentajeEquitativo = Math.round(100 / tiempos.length)
      tiempos.forEach((t, i) => {
        t.porcentaje = i === tiempos.length - 1
          ? 100 - porcentajeEquitativo * (tiempos.length - 1)
          : porcentajeEquitativo
      })
    }
  }

  return {
    id: caso.id, numero: caso.numero, titulo: caso.titulo,
    estado: caso.estado, tipo: caso.tipo || 'OTRO', totalDias, tiempos,
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default async function TiempoPorEtapaPage({
  searchParams
}: {
  searchParams: Promise<{ casoId?: string; fuero?: string; abogado?: string; etapa?: string }>
}) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const userRol = user.rol?.toUpperCase() || ''
  const params = await searchParams

  const filtroFuero  = params?.fuero   || 'todos'
  const filtroEtapa  = params?.etapa   || 'todas'
  const abogadoParam = params?.abogado || 'todos'

  // Lista de abogados — solo Admin y Asistente
  let abogadosLista: { id: string; nombre: string }[] = []
  if (isAdmin(userRol) || isAsistente(userRol)) {
    const abogados = await prisma.user.findMany({
      where: { rol: 'ABOGADO', isActive: true },
      select: { id: true, nombre: true, apellido: true },
      orderBy: { nombre: 'asc' },
    })
    abogadosLista = abogados.map(a => ({
      id: a.id,
      nombre: `${a.nombre || ''} ${a.apellido || ''}`.trim(),
    }))
  }

  const filtroAbogado = abogadoParam !== 'todos' && abogadosLista.some(a => a.id === abogadoParam)
    ? abogadoParam : 'todos'

  const { grupos, totalCasos, casosSelector } =
    await obtenerDatosReporte(user.id, userRol, filtroFuero, filtroAbogado, filtroEtapa)

  const casoIdSeleccionado = params?.casoId
  const timelineCaso = casoIdSeleccionado
    ? await obtenerTimelineCaso(casoIdSeleccionado)
    : null

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
                    {isAbogado(userRol)
                      ? "En qué etapa están tus casos y cuánto tiempo llevan ahí"
                      : "En qué etapa están los casos y cuánto tiempo llevan ahí"
                    }
                  </p>
                </div>
              </div>

              {!isAbogado(userRol) && (
                <span className="text-xs font-medium px-3 py-1.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                  Vista General
                </span>
              )}
            </div>

            {/* Filtros */}
            <div className="mb-6">
              <FiltrosEtapa
                abogados={abogadosLista}
                mostrarFiltroAbogado={isAdmin(userRol) || isAsistente(userRol)}
              />
            </div>

            {/* Estado vacío */}
            {totalCasos === 0 ? (
              <Card className="p-12 text-center border-slate-200">
                <AlertTriangle className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">No hay casos activos para mostrar</p>
                <p className="text-sm text-slate-400 mt-2">
                  {filtroFuero !== 'todos' || filtroAbogado !== 'todos' || filtroEtapa !== 'todas'
                    ? 'Probá cambiando los filtros para ver más resultados.'
                    : 'Los datos aparecerán cuando haya expedientes en curso.'
                  }
                </p>
              </Card>
            ) : (
              <>
                {/* Sección 1 */}
                <CasosAgrupadosPorEtapa grupos={grupos} totalCasos={totalCasos} />

                {/* Sección 2 */}
                <SelectorCasoTimeline
                  casos={casosSelector}
                  casoActual={casoIdSeleccionado}
                  timelineCaso={timelineCaso}
                />
              </>
            )}

            {/* Metodología */}
            <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <p className="text-sm text-blue-900 font-semibold mb-2">📖 Metodología del Reporte</p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li><strong>Días en etapa:</strong> Desde la última transición de estado (<code>fechaUltimoCambioEstado</code>).</li>
                <li><strong>Días totales:</strong> Desde la fecha de inicio del caso (<code>fechaInicio</code>) hasta hoy.</li>
                <li><strong>Cronología individual:</strong> Reconstruida desde la bitácora del expediente.</li>
                <li><strong>Sobre los tiempos:</strong> Reflejan duración en cada etapa. No implican juicio sobre la demora — los tiempos en derecho dependen de factores externos al sistema.</li>
              </ul>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}