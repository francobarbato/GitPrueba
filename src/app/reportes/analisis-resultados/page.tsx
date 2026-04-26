// app/reportes/analisis-resultados/page.tsx
// REPORTE ES-011: Análisis de Resultados (Tasa de Éxito)
// Vista personal: casos propios del abogado logueado
// Vista gerencial: todos los abogados, desglose comparativo por abogado en el expand

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { differenceInDays, subDays } from "date-fns"
import { ArrowLeft, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

import { KPICards } from "./components/KPICards"
import { TablaMotivos } from "./components/TablaMotivos"
import { TablaMotivosGerencial, type MotivoCierreGerencial } from "./components/TablaMotivosGerencial"
import { TablaFueroResultados } from "./components/TablaFueroResultados"
import { PanelInsights } from "./components/PanelInsights"
import { FiltrosPeriodoResultados } from "./components/FiltroPeriodoResultados"
import { ToggleVistaResultados } from "./components/ToggleVistaResultados"
import { FiltroAbogadoGerencial } from "./components/FiltroAbogadoGerencial"
import { redirect, notFound } from "next/navigation"

// ============================================================================
// CONSTANTES
// ============================================================================

const TIPO_CASO_LABELS: Record<string, string> = {
  LABORAL: "Laboral",
  CIVIL_COMERCIAL: "Civil y Comercial",
  FAMILIA: "Familia",
  PENAL: "Penal",
  SUCESIONES: "Sucesiones",
  CONTENCIOSO_ADMINISTRATIVO: "Contencioso Adm.",
  OTRO: "Otro",
}

const MOTIVOS_EXITOSOS = ["FAVORABLE", "ACUERDO"]

const PERIODO_LABELS: Record<string, string> = {
  "90": "últimos 90 días",
  "180": "últimos 180 días",
  "365": "último año",
}

// ============================================================================
// QUERY — VISTA PERSONAL (sin cambios respecto al original)
// ============================================================================

async function getAnalisisResultados(periodoDias?: number, abogadoId?: string) {
  const whereClause: any = { estaCerrado: true }

  if (periodoDias) {
    const fechaDesde = subDays(new Date(), periodoDias)
    whereClause.fechaCierre = { gte: fechaDesde }
  }

  if (abogadoId) {
    whereClause.abogadoId = abogadoId
  }

  const casosCerrados = await prisma.caso.findMany({
    where: whereClause,
    select: {
      id: true,
      numero: true,
      titulo: true,
      tipo: true,
      motivoCierre: true,
      montoDisputa: true,
      montoFinal: true,
      fechaInicio: true,
      fechaCierre: true,
      abogado: { select: { nombre: true, apellido: true } }
    },
    orderBy: { fechaCierre: "desc" },
  })

  const totalCerrados = casosCerrados.length

  if (totalCerrados === 0) {
    return {
      kpis: { totalCerrados: 0, tasaExito: 0, tasaRecupero: 0, promedioDiasCierre: 0 },
      motivoRows: [],
      fueroRows: [],
      insights: {
        motivoMasRapido: null, motivoMasLento: null, motivoMejorRecupero: null,
        fueroPredominante: null,
        acuerdosVsSentencias: { acuerdosDias: 0, sentenciasDias: 0, acuerdosRecupero: 0, sentenciasRecupero: 0, hayDatos: false },
      },
    }
  }

  const casosExitosos = casosCerrados.filter(c => c.motivoCierre && MOTIVOS_EXITOSOS.includes(c.motivoCierre)).length
  const tasaExito = Math.round((casosExitosos / totalCerrados) * 100)

  const montoReclamadoTotal = casosCerrados.reduce((s, c) => s + (c.montoDisputa ? Number(c.montoDisputa) : 0), 0)
  const montoObtenidoTotal = casosCerrados.reduce((s, c) => s + (c.montoFinal ? Number(c.montoFinal) : 0), 0)
  const tasaRecupero = montoReclamadoTotal > 0 ? Math.round((montoObtenidoTotal / montoReclamadoTotal) * 100) : 0

  const diasCierreArr = casosCerrados
    .filter(c => c.fechaCierre)
    .map(c => differenceInDays(c.fechaCierre!, c.fechaInicio))
    .filter(d => d > 0)
  const promedioDiasCierre = diasCierreArr.length > 0
    ? Math.round(diasCierreArr.reduce((a, b) => a + b, 0) / diasCierreArr.length)
    : 0

  const porMotivo: Record<string, typeof casosCerrados> = {}
  for (const caso of casosCerrados) {
    const motivo = caso.motivoCierre || "Sin especificar"
    if (!porMotivo[motivo]) porMotivo[motivo] = []
    porMotivo[motivo].push(caso)
  }

  const motivoRows = Object.entries(porMotivo)
    .map(([motivo, casos]) => {
      const cantidad = casos.length
      const porcentaje = Math.round((cantidad / totalCerrados) * 100)
      const reclamado = casos.reduce((s, c) => s + (c.montoDisputa ? Number(c.montoDisputa) : 0), 0)
      const obtenido = casos.reduce((s, c) => s + (c.montoFinal ? Number(c.montoFinal) : 0), 0)
      const recupero = reclamado > 0 ? Math.round((obtenido / reclamado) * 100) : 0
      const dias = casos.filter(c => c.fechaCierre).map(c => differenceInDays(c.fechaCierre!, c.fechaInicio)).filter(d => d > 0)
      const promDias = dias.length > 0 ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : 0

      return {
        motivo, cantidad, porcentaje,
        montoReclamadoTotal: reclamado,
        montoObtenidoTotal: obtenido,
        tasaRecupero: recupero,
        promedioDias: promDias,
        casos: casos.map(c => {
          const diasDuracion = c.fechaCierre ? differenceInDays(c.fechaCierre, c.fechaInicio) : 0
          const abogadoNombre = c.abogado.nombre && c.abogado.apellido
            ? `${c.abogado.nombre} ${c.abogado.apellido}`
            : c.abogado.nombre || "Sin asignar"
          return {
            id: c.id, numero: c.numero, titulo: c.titulo,
            tipo: c.tipo, tipoLabel: TIPO_CASO_LABELS[c.tipo] || c.tipo,
            montoDisputa: c.montoDisputa ? Number(c.montoDisputa) : 0,
            montoFinal: c.montoFinal ? Number(c.montoFinal) : 0,
            diasDuracion,
            fechaCierre: c.fechaCierre ? c.fechaCierre.toLocaleDateString("es-AR") : "—",
            abogadoNombre,
          }
        }),
      }
    })
    .sort((a, b) => b.cantidad - a.cantidad)

  const porFuero: Record<string, typeof casosCerrados> = {}
  for (const caso of casosCerrados) {
    if (!porFuero[caso.tipo]) porFuero[caso.tipo] = []
    porFuero[caso.tipo].push(caso)
  }

  const fueroRows = Object.entries(porFuero)
    .map(([tipo, casos]) => {
      const totalF = casos.length
      const favorables = casos.filter(c => c.motivoCierre === "FAVORABLE").length
      const acuerdos = casos.filter(c => c.motivoCierre === "ACUERDO").length
      const desfavorables = casos.filter(c => c.motivoCierre === "DESFAVORABLE").length
      const otros = totalF - favorables - acuerdos - desfavorables
      const tasaExitoFuero = totalF > 0 ? Math.round(((favorables + acuerdos) / totalF) * 100) : 0
      const dias = casos.filter(c => c.fechaCierre).map(c => differenceInDays(c.fechaCierre!, c.fechaInicio)).filter(d => d > 0)
      const promDias = dias.length > 0 ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : 0
      return {
        tipoLabel: TIPO_CASO_LABELS[tipo] || tipo,
        totalCerrados: totalF, favorables, acuerdos, desfavorables, otros,
        tasaExito: tasaExitoFuero, promedioDias: promDias,
      }
    })
    .sort((a, b) => b.totalCerrados - a.totalCerrados)

  const motivosConDias = motivoRows.filter(m => m.promedioDias > 0)
  const motivoMasRapido = motivosConDias.length > 0
    ? { motivo: [...motivosConDias].sort((a, b) => a.promedioDias - b.promedioDias)[0].motivo, dias: [...motivosConDias].sort((a, b) => a.promedioDias - b.promedioDias)[0].promedioDias }
    : null
  const motivoMasLento = motivosConDias.length > 0
    ? { motivo: [...motivosConDias].sort((a, b) => b.promedioDias - a.promedioDias)[0].motivo, dias: [...motivosConDias].sort((a, b) => b.promedioDias - a.promedioDias)[0].promedioDias }
    : null
  const motivosConRecupero = motivoRows.filter(m => m.tasaRecupero > 0)
  const motivoMejorRecupero = motivosConRecupero.length > 0
    ? { motivo: [...motivosConRecupero].sort((a, b) => b.tasaRecupero - a.tasaRecupero)[0].motivo, tasa: [...motivosConRecupero].sort((a, b) => b.tasaRecupero - a.tasaRecupero)[0].tasaRecupero }
    : null
  const fueroPredominante = fueroRows.length > 0
    ? { tipo: fueroRows[0].tipoLabel, cantidad: fueroRows[0].totalCerrados }
    : null
  const acuerdosData = motivoRows.find(m => m.motivo === "ACUERDO")
  const sentenciasData = motivoRows.find(m => m.motivo === "FAVORABLE")
  const acuerdosVsSentencias = {
    acuerdosDias: acuerdosData?.promedioDias || 0,
    sentenciasDias: sentenciasData?.promedioDias || 0,
    acuerdosRecupero: acuerdosData?.tasaRecupero || 0,
    sentenciasRecupero: sentenciasData?.tasaRecupero || 0,
    hayDatos: !!(acuerdosData && sentenciasData),
  }

  return {
    kpis: { totalCerrados, tasaExito, tasaRecupero, promedioDiasCierre },
    motivoRows, fueroRows,
    insights: { motivoMasRapido, motivoMasLento, motivoMejorRecupero, fueroPredominante, acuerdosVsSentencias },
  }
}

// ============================================================================
// QUERY — VISTA GERENCIAL
// Todos los abogados, desglose por abogado dentro de cada motivo
// ============================================================================

async function getAnalisisGerencial(periodoDias?: number, filtroAbogadoId?: string): Promise<{
  kpis: { totalCerrados: number; tasaExito: number; tasaRecupero: number; promedioDiasCierre: number }
  motivoRows: MotivoCierreGerencial[]
  fueroRows: { tipoLabel: string; totalCerrados: number; favorables: number; acuerdos: number; desfavorables: number; otros: number; tasaExito: number; promedioDias: number }[]
  insights: any
}> {
  const whereClause: any = { estaCerrado: true }

  if (periodoDias) {
    whereClause.fechaCierre = { gte: subDays(new Date(), periodoDias) }
  }

  // Si hay filtro de abogado, los KPIs y tablas se calculan solo para ese abogado
  if (filtroAbogadoId && filtroAbogadoId !== "todos") {
    whereClause.abogadoId = filtroAbogadoId
  }

  const casosCerrados = await prisma.caso.findMany({
    where: whereClause,
    select: {
      id: true,
      numero: true,
      titulo: true,
      tipo: true,
      motivoCierre: true,
      montoDisputa: true,
      montoFinal: true,
      fechaInicio: true,
      fechaCierre: true,
      abogado: { select: { id: true, nombre: true, apellido: true } }
    },
    orderBy: { fechaCierre: "desc" },
  })

  const totalCerrados = casosCerrados.length

  if (totalCerrados === 0) {
    return {
      kpis: { totalCerrados: 0, tasaExito: 0, tasaRecupero: 0, promedioDiasCierre: 0 },
      motivoRows: [],
      fueroRows: [],
      insights: {
        motivoMasRapido: null, motivoMasLento: null, motivoMejorRecupero: null,
        fueroPredominante: null,
        acuerdosVsSentencias: { acuerdosDias: 0, sentenciasDias: 0, acuerdosRecupero: 0, sentenciasRecupero: 0, hayDatos: false },
      },
    }
  }

  // KPIs globales
  const casosExitosos = casosCerrados.filter(c => c.motivoCierre && MOTIVOS_EXITOSOS.includes(c.motivoCierre)).length
  const tasaExito = Math.round((casosExitosos / totalCerrados) * 100)
  const montoReclamadoTotal = casosCerrados.reduce((s, c) => s + (c.montoDisputa ? Number(c.montoDisputa) : 0), 0)
  const montoObtenidoTotal = casosCerrados.reduce((s, c) => s + (c.montoFinal ? Number(c.montoFinal) : 0), 0)
  const tasaRecupero = montoReclamadoTotal > 0 ? Math.round((montoObtenidoTotal / montoReclamadoTotal) * 100) : 0
  const diasArr = casosCerrados.filter(c => c.fechaCierre).map(c => differenceInDays(c.fechaCierre!, c.fechaInicio)).filter(d => d > 0)
  const promedioDiasCierre = diasArr.length > 0 ? Math.round(diasArr.reduce((a, b) => a + b, 0) / diasArr.length) : 0

  // Agrupar por motivo + desglose por abogado dentro de cada motivo
  type AbogadoData = {
    id: string; nombre: string
    casos: number; reclamado: number; obtenido: number; dias: number[]
  }

  const porMotivo: Record<string, { casos: typeof casosCerrados; abogados: Map<string, AbogadoData> }> = {}

  for (const caso of casosCerrados) {
    const motivo = caso.motivoCierre || "Sin especificar"
    if (!porMotivo[motivo]) porMotivo[motivo] = { casos: [], abogados: new Map() }
    porMotivo[motivo].casos.push(caso)

    const abId = caso.abogado?.id || "sin-asignar"
    const abNombre = caso.abogado
      ? `${caso.abogado.nombre || ""} ${caso.abogado.apellido || ""}`.trim()
      : "Sin asignar"

    if (!porMotivo[motivo].abogados.has(abId)) {
      porMotivo[motivo].abogados.set(abId, { id: abId, nombre: abNombre, casos: 0, reclamado: 0, obtenido: 0, dias: [] })
    }

    const ab = porMotivo[motivo].abogados.get(abId)!
    ab.casos++
    ab.reclamado += caso.montoDisputa ? Number(caso.montoDisputa) : 0
    ab.obtenido += caso.montoFinal ? Number(caso.montoFinal) : 0
    if (caso.fechaCierre) {
      const d = differenceInDays(caso.fechaCierre, caso.fechaInicio)
      if (d > 0) ab.dias.push(d)
    }
  }

  const motivoRows: MotivoCierreGerencial[] = Object.entries(porMotivo)
    .map(([motivo, data]) => {
      const cantidad = data.casos.length
      const porcentaje = Math.round((cantidad / totalCerrados) * 100)
      const reclamado = data.casos.reduce((s, c) => s + (c.montoDisputa ? Number(c.montoDisputa) : 0), 0)
      const obtenido = data.casos.reduce((s, c) => s + (c.montoFinal ? Number(c.montoFinal) : 0), 0)
      const recupero = reclamado > 0 ? Math.round((obtenido / reclamado) * 100) : 0
      const dias = data.casos.filter(c => c.fechaCierre).map(c => differenceInDays(c.fechaCierre!, c.fechaInicio)).filter(d => d > 0)
      const promDias = dias.length > 0 ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : 0

      const porAbogado = Array.from(data.abogados.values()).map(ab => ({
        id: ab.id,
        nombre: ab.nombre,
        cantidad: ab.casos,
        montoReclamado: ab.reclamado,
        montoObtenido: ab.obtenido,
        tasaRecupero: ab.reclamado > 0 ? Math.round((ab.obtenido / ab.reclamado) * 100) : 0,
        promedioDias: ab.dias.length > 0 ? Math.round(ab.dias.reduce((a, b) => a + b, 0) / ab.dias.length) : 0,
      }))

      return { motivo, cantidad, porcentaje, montoReclamadoTotal: reclamado, montoObtenidoTotal: obtenido, tasaRecupero: recupero, promedioDias: promDias, porAbogado }
    })
    .sort((a, b) => b.cantidad - a.cantidad)

  // Fuero rows — igual que en personal pero sin filtro de abogado
  const porFuero: Record<string, typeof casosCerrados> = {}
  for (const caso of casosCerrados) {
    if (!porFuero[caso.tipo]) porFuero[caso.tipo] = []
    porFuero[caso.tipo].push(caso)
  }
  const fueroRows = Object.entries(porFuero)
    .map(([tipo, casos]) => {
      const totalF = casos.length
      const favorables = casos.filter(c => c.motivoCierre === "FAVORABLE").length
      const acuerdos = casos.filter(c => c.motivoCierre === "ACUERDO").length
      const desfavorables = casos.filter(c => c.motivoCierre === "DESFAVORABLE").length
      const otros = totalF - favorables - acuerdos - desfavorables
      const tasaExitoFuero = totalF > 0 ? Math.round(((favorables + acuerdos) / totalF) * 100) : 0
      const dias = casos.filter(c => c.fechaCierre).map(c => differenceInDays(c.fechaCierre!, c.fechaInicio)).filter(d => d > 0)
      const promDias = dias.length > 0 ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : 0
      return { tipoLabel: TIPO_CASO_LABELS[tipo] || tipo, totalCerrados: totalF, favorables, acuerdos, desfavorables, otros, tasaExito: tasaExitoFuero, promedioDias: promDias }
    })
    .sort((a, b) => b.totalCerrados - a.totalCerrados)

  // Insights — igual que personal
  const motivosConDias = motivoRows.filter(m => m.promedioDias > 0)
  const motivoMasRapido = motivosConDias.length > 0 ? { motivo: [...motivosConDias].sort((a, b) => a.promedioDias - b.promedioDias)[0].motivo, dias: [...motivosConDias].sort((a, b) => a.promedioDias - b.promedioDias)[0].promedioDias } : null
  const motivoMasLento = motivosConDias.length > 0 ? { motivo: [...motivosConDias].sort((a, b) => b.promedioDias - a.promedioDias)[0].motivo, dias: [...motivosConDias].sort((a, b) => b.promedioDias - a.promedioDias)[0].promedioDias } : null
  const motivosConRecupero = motivoRows.filter(m => m.tasaRecupero > 0)
  const motivoMejorRecupero = motivosConRecupero.length > 0 ? { motivo: [...motivosConRecupero].sort((a, b) => b.tasaRecupero - a.tasaRecupero)[0].motivo, tasa: [...motivosConRecupero].sort((a, b) => b.tasaRecupero - a.tasaRecupero)[0].tasaRecupero } : null
  const fueroPredominante = fueroRows.length > 0 ? { tipo: fueroRows[0].tipoLabel, cantidad: fueroRows[0].totalCerrados } : null
  const acuerdosData = motivoRows.find(m => m.motivo === "ACUERDO")
  const sentenciasData = motivoRows.find(m => m.motivo === "FAVORABLE")
  const acuerdosVsSentencias = { acuerdosDias: acuerdosData?.promedioDias || 0, sentenciasDias: sentenciasData?.promedioDias || 0, acuerdosRecupero: acuerdosData?.tasaRecupero || 0, sentenciasRecupero: sentenciasData?.tasaRecupero || 0, hayDatos: !!(acuerdosData && sentenciasData) }

  return {
    kpis: { totalCerrados, tasaExito, tasaRecupero, promedioDiasCierre },
    motivoRows, fueroRows,
    insights: { motivoMasRapido, motivoMasLento, motivoMejorRecupero, fueroPredominante, acuerdosVsSentencias },
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AnalisisResultadosPage({ searchParams }: PageProps) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const userRol = user.rol?.toUpperCase()
  // Defensa en profundidad — bloquear roles no operativos
  if (userRol === 'CLIENTE' || userRol === 'ADMIN') notFound()
  if (userRol === 'ASISTENTE') redirect("/reportes")

  const params = await searchParams

  const vistaParam = typeof params.vista === "string" ? params.vista : undefined
  const vistaGerencial = vistaParam === "gerencial"

  const periodoParam = typeof params.periodo === "string" ? params.periodo : undefined
  const periodoDias = periodoParam ? parseInt(periodoParam, 10) : undefined
  const periodoValido = periodoDias && !isNaN(periodoDias) && periodoDias > 0 ? periodoDias : undefined

  // Lista de abogados para filtros
  const abogadosDb = await prisma.user.findMany({
    where: { rol: "ABOGADO", isActive: true },
    select: { id: true, nombre: true, apellido: true },
    orderBy: { nombre: "asc" },
  })
  const listaAbogados = abogadosDb.map(a => ({
    id: a.id,
    nombre: a.nombre && a.apellido ? `${a.nombre} ${a.apellido}` : a.nombre || "Sin nombre",
  }))

  // Vista personal — filtro de abogado aplica al logueado si es ABOGADO
  const abogadoParam = typeof params.abogado === "string" ? params.abogado : undefined

  let abogadoIdPersonal: string | undefined
  if (userRol === 'ABOGADO') {
    // Abogado siempre ve sus propios casos en vista personal
    abogadoIdPersonal = user.id
  } else {
    // Admin: puede filtrar por abogado en vista personal
    abogadoIdPersonal = abogadoParam && listaAbogados.some(a => a.id === abogadoParam)
      ? abogadoParam
      : undefined
  }

  // Abogado seleccionado en vista gerencial para el desglose
  const abogadoGerencialId = abogadoParam && listaAbogados.some(a => a.id === abogadoParam)
    ? abogadoParam
    : "todos"

  // Ejecutar solo la query que corresponde
  const [datosPersonal, datosGerencial] = await Promise.all([
    !vistaGerencial
      ? getAnalisisResultados(periodoValido, abogadoIdPersonal)
      : Promise.resolve(null),
    vistaGerencial
      ? getAnalisisGerencial(periodoValido, abogadoGerencialId)
      : Promise.resolve(null),
  ])

  const subtituloPeriodo = periodoParam && PERIODO_LABELS[periodoParam]
    ? vistaGerencial
      ? `Resultados del estudio — ${PERIODO_LABELS[periodoParam]}`
      : `Cierres, resultados y montos recuperados — ${PERIODO_LABELS[periodoParam]}`
    : vistaGerencial
      ? "Resultados comparativos del estudio por abogado"
      : "Cómo terminaron los casos: motivos de cierre, tasa de éxito y montos recuperados"

  const datos = vistaGerencial ? datosGerencial! : datosPersonal!

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Link href="/reportes">
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-amber-500" />
                    Resultados de casos cerrados
                  </h1>
                  <p className="text-sm text-slate-500">{subtituloPeriodo}</p>
                </div>
              </div>

            </div>

            {/* Toggle — debajo del header, mismo patrón que cartera por fuero */}
            <div className="mb-6">
              <ToggleVistaResultados vistaActual={vistaGerencial ? 'gerencial' : 'personal'} />
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {/* Filtro de período — siempre visible */}
              <FiltrosPeriodoResultados
                abogados={[]}
              />

              {/* Filtro de abogado en vista gerencial — separado */}
              {vistaGerencial && (
                <FiltroAbogadoGerencial abogados={listaAbogados} />
              )}
            </div>

            {/* KPIs — iguales en ambas vistas */}
            <KPICards data={datos.kpis} />

            {/* Tabla motivos */}
            {datos.motivoRows.length > 0 ? (
              vistaGerencial ? (
                <TablaMotivosGerencial
                  data={datosGerencial!.motivoRows}
                  filtroAbogadoId={abogadoGerencialId}
                />
              ) : (
                <TablaMotivos data={datosPersonal!.motivoRows} />
              )
            ) : (
              <div className="p-8 bg-white border border-slate-200 rounded-lg text-center mb-6">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No hay casos cerrados en este período</p>
                <p className="text-sm text-slate-400 mt-1">
                  Probá ampliando el rango temporal o seleccionando &quot;Todo el historial&quot;.
                </p>
              </div>
            )}

            {/* Tabla fuero e insights — iguales en ambas vistas */}
            {datos.fueroRows.length > 0 && <TablaFueroResultados data={datos.fueroRows} />}
            {datos.motivoRows.length > 0 && <PanelInsights data={datos.insights} />}

            {/* Nota metodológica */}
            <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 mb-1">Metodología del Reporte</p>
              <p className="text-xs text-slate-500">
                <strong>Tasa de éxito:</strong> (Sentencias favorables + Acuerdos/Conciliaciones) / Total de cerrados en el período.{" "}
                <strong>Tasa de recupero:</strong> Monto obtenido / Monto reclamado original.{" "}
                <strong>Duración promedio:</strong> Días desde fecha de inicio hasta fecha de cierre.{" "}
                Solo incluye casos con cierre formal registrado en el sistema.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}