// app/reportes/evolucion-cartera/page.tsx
// ES-14: Evolución y Tendencia de Cartera
// Vista personal (ABOGADO): flujo propio + comparativo vs estudio
// Vista gerencial: todo el estudio, sin cambios

import React from "react"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import {
  subDays, startOfMonth, format, isBefore, isAfter,
} from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowLeft, TrendingUp, ArrowUpRight, ArrowDownRight, Minus,
  Scale, Layers, AlertTriangle, CheckCircle2, Lightbulb
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { FiltroTiempo } from "./components/FiltroTiempo"
import { TablaFlujo } from "./components/Tablaflujo"
import { TablaComposicion } from "./components/Tablacomposicion"
import { ToggleVistaEvolucion } from "./components/ToggleVistaEvolucion"
import { redirect, notFound } from "next/navigation"
// ============================================================================
// TIPOS
// ============================================================================

export type PeriodoFlujo = {
  periodo: string; periodoKey: string
  ingresados: number; cerrados: number; balance: number
  carteraActiva: number; variacionIngresos: number | null; variacionCierres: number | null
}

export type ComposicionTipo = {
  tipo: string; tipoLabel: string
  cantidadAnterior: number; cantidadActual: number
  porcentajeAnterior: number; porcentajeActual: number
  variacionPuntos: number; tendencia: 'sube' | 'baja' | 'estable'
}

export type Observacion = { tipo: 'info' | 'alerta' | 'positivo'; texto: string }

// ============================================================================
// CONFIG
// ============================================================================

const PERIODOS_DISPONIBLES = [
  { key: '60',  label: 'Últimos 60 días',  dias: 60  },
  { key: '90',  label: 'Últimos 90 días',  dias: 90  },
  { key: '120', label: 'Últimos 120 días', dias: 120 },
  { key: '180', label: 'Últimos 6 meses',  dias: 180 },
  { key: '365', label: 'Último año',       dias: 365 },
]

const TIPO_LABELS: Record<string, string> = {
  'LABORAL': 'Laboral', 'CIVIL_COMERCIAL': 'Civil y Comercial',
  'FAMILIA': 'Familia', 'SUCESIONES': 'Sucesiones',
  'CONTENCIOSO_ADMINISTRATIVO': 'Cont. Administrativo', 'PENAL': 'Penal',
}

// ============================================================================
// QUERY GERENCIAL — sin cambios respecto al original
// ============================================================================

async function obtenerDatosGerencial(diasFiltro: number) {
  const hoy = new Date()
  const fechaDesde = subDays(hoy, diasFiltro)
  const fechaDesdeAnterior = subDays(fechaDesde, diasFiltro)

  const todosCasos = await prisma.caso.findMany({
    select: { id: true, tipo: true, fechaInicio: true, estaCerrado: true, fechaCierre: true, motivoCierre: true }
  })

  const ingresadosPeriodo = todosCasos.filter(c =>
    isAfter(c.fechaInicio, fechaDesde) || c.fechaInicio.getTime() === fechaDesde.getTime()
  )
  const cerradosPeriodo = todosCasos.filter(c =>
    c.estaCerrado && c.fechaCierre &&
    (isAfter(c.fechaCierre, fechaDesde) || c.fechaCierre.getTime() === fechaDesde.getTime())
  )
  const carteraActivaTotal = todosCasos.filter(c => !c.estaCerrado).length
  const balanceNeto = ingresadosPeriodo.length - cerradosPeriodo.length

  const ingresadosAnterior = todosCasos.filter(c =>
    isAfter(c.fechaInicio, fechaDesdeAnterior) && isBefore(c.fechaInicio, fechaDesde)
  )
  const cerradosAnterior = todosCasos.filter(c =>
    c.estaCerrado && c.fechaCierre &&
    isAfter(c.fechaCierre, fechaDesdeAnterior) && isBefore(c.fechaCierre, fechaDesde)
  )

  const variacionIngresos = ingresadosAnterior.length > 0
    ? Math.round(((ingresadosPeriodo.length - ingresadosAnterior.length) / ingresadosAnterior.length) * 100) : null
  const variacionCierres = cerradosAnterior.length > 0
    ? Math.round(((cerradosPeriodo.length - cerradosAnterior.length) / cerradosAnterior.length) * 100) : null

  const mesesAtras = Math.max(Math.ceil(diasFiltro / 30), 2)
  const flujoMensual: PeriodoFlujo[] = []

  for (let i = mesesAtras - 1; i >= 0; i--) {
    const mesInicio = startOfMonth(subDays(hoy, i * 30))
    const mesFin = startOfMonth(subDays(hoy, (i - 1) * 30))
    const mesFinReal = i === 0 ? hoy : mesFin

    const ingresadosMes = todosCasos.filter(c =>
      (isAfter(c.fechaInicio, mesInicio) || c.fechaInicio.getTime() === mesInicio.getTime()) &&
      isBefore(c.fechaInicio, mesFinReal)
    ).length

    const cerradosMes = todosCasos.filter(c =>
      c.estaCerrado && c.fechaCierre &&
      (isAfter(c.fechaCierre, mesInicio) || c.fechaCierre.getTime() === mesInicio.getTime()) &&
      isBefore(c.fechaCierre, mesFinReal)
    ).length

    const carteraAlFinalMes = todosCasos.filter(c =>
      (isBefore(c.fechaInicio, mesFinReal) || c.fechaInicio.getTime() === mesFinReal.getTime()) &&
      (!c.estaCerrado || (c.fechaCierre && isAfter(c.fechaCierre, mesFinReal)))
    ).length

    const anterior = flujoMensual[flujoMensual.length - 1]
    flujoMensual.push({
      periodo: format(mesInicio, 'MMM yyyy', { locale: es }),
      periodoKey: format(mesInicio, 'yyyy-MM'),
      ingresados: ingresadosMes, cerrados: cerradosMes,
      balance: ingresadosMes - cerradosMes, carteraActiva: carteraAlFinalMes,
      variacionIngresos: anterior && anterior.ingresados > 0
        ? Math.round(((ingresadosMes - anterior.ingresados) / anterior.ingresados) * 100) : null,
      variacionCierres: anterior && anterior.cerrados > 0
        ? Math.round(((cerradosMes - anterior.cerrados) / anterior.cerrados) * 100) : null,
    })
  }

  // Composición por tipo
  const ingresadosActualPorTipo = new Map<string, number>()
  const ingresadosAnteriorPorTipo = new Map<string, number>()
  ingresadosPeriodo.forEach(c => {
    const tipo = c.tipo || 'OTRO'
    ingresadosActualPorTipo.set(tipo, (ingresadosActualPorTipo.get(tipo) || 0) + 1)
  })
  ingresadosAnterior.forEach(c => {
    const tipo = c.tipo || 'OTRO'
    ingresadosAnteriorPorTipo.set(tipo, (ingresadosAnteriorPorTipo.get(tipo) || 0) + 1)
  })

  const todosLosTipos = new Set([...ingresadosActualPorTipo.keys(), ...ingresadosAnteriorPorTipo.keys()])
  const totalActual = ingresadosPeriodo.length || 1
  const totalAnterior = ingresadosAnterior.length || 1

  const composicion: ComposicionTipo[] = Array.from(todosLosTipos)
    .map(tipo => {
      const cantActual = ingresadosActualPorTipo.get(tipo) || 0
      const cantAnterior = ingresadosAnteriorPorTipo.get(tipo) || 0
      const pctActual = Math.round((cantActual / totalActual) * 100)
      const pctAnterior = Math.round((cantAnterior / totalAnterior) * 100)
      const variacion = pctActual - pctAnterior
      return {
        tipo, tipoLabel: TIPO_LABELS[tipo] || tipo,
        cantidadAnterior: cantAnterior, cantidadActual: cantActual,
        porcentajeAnterior: pctAnterior, porcentajeActual: pctActual,
        variacionPuntos: variacion,
        tendencia: variacion > 2 ? 'sube' as const : variacion < -2 ? 'baja' as const : 'estable' as const,
      }
    })
    .sort((a, b) => b.cantidadActual - a.cantidadActual)

  // Observaciones
  const observaciones: Observacion[] = []
  if (balanceNeto > 3) {
    observaciones.push({ tipo: 'alerta', texto: `Se están acumulando casos: ingresaron ${ingresadosPeriodo.length} y se cerraron ${cerradosPeriodo.length} en el período. Balance neto: +${balanceNeto}.` })
  } else if (balanceNeto < -2) {
    observaciones.push({ tipo: 'positivo', texto: `Se cerraron más casos de los que ingresaron (${cerradosPeriodo.length} cierres vs ${ingresadosPeriodo.length} ingresos). La cartera se está reduciendo.` })
  } else {
    observaciones.push({ tipo: 'info', texto: `El flujo está equilibrado: ${ingresadosPeriodo.length} ingresos y ${cerradosPeriodo.length} cierres en el período.` })
  }
  if (variacionIngresos !== null) {
    if (variacionIngresos > 20) observaciones.push({ tipo: 'info', texto: `Los ingresos crecieron un ${variacionIngresos}% respecto al período anterior. Mayor demanda de servicios.` })
    else if (variacionIngresos < -20) observaciones.push({ tipo: 'alerta', texto: `Los ingresos cayeron un ${Math.abs(variacionIngresos)}% respecto al período anterior.` })
  }
  const tipoQueMasCrece = composicion.find(c => c.tendencia === 'sube')
  if (tipoQueMasCrece && tipoQueMasCrece.variacionPuntos > 5) {
    observaciones.push({ tipo: 'info', texto: `${tipoQueMasCrece.tipoLabel} ganó ${tipoQueMasCrece.variacionPuntos} puntos de participación. El perfil del estudio está virando hacia esta materia.` })
  }
  if (carteraActivaTotal > 30) observaciones.push({ tipo: 'alerta', texto: `La cartera activa tiene ${carteraActivaTotal} casos. Evaluar la capacidad operativa del equipo.` })
  if (ingresadosPeriodo.length === 0) observaciones.push({ tipo: 'alerta', texto: `No se registraron ingresos de casos nuevos en el período seleccionado.` })

  return {
    kpis: { ingresados: ingresadosPeriodo.length, cerrados: cerradosPeriodo.length, balanceNeto, carteraActiva: carteraActivaTotal, variacionIngresos, variacionCierres },
    flujoMensual, composicion, observaciones,
  }
}

// ============================================================================
// QUERY PERSONAL — filtrada por abogadoId
// Sin composición por tipo (con pocos casos no es significativo)
// Cartera activa = solo los casos del abogado
// ============================================================================

async function obtenerDatosPersonal(abogadoId: string, diasFiltro: number) {
  const hoy = new Date()
  const fechaDesde = subDays(hoy, diasFiltro)
  const fechaDesdeAnterior = subDays(fechaDesde, diasFiltro)

  // Todos los casos del abogado (para flujo mensual e histórico de cartera)
  const casosPropios = await prisma.caso.findMany({
    where: { abogadoId },
    select: { id: true, tipo: true, fechaInicio: true, estaCerrado: true, fechaCierre: true }
  })

  // Promedio del estudio en el mismo período — para comparativo en KPIs
  const todosLosCasos = await prisma.caso.findMany({
    select: { id: true, fechaInicio: true, estaCerrado: true, fechaCierre: true }
  })
  const totalAbogados = await prisma.user.count({ where: { rol: 'ABOGADO', isActive: true } })

  const ingresadosPeriodo = casosPropios.filter(c =>
    isAfter(c.fechaInicio, fechaDesde) || c.fechaInicio.getTime() === fechaDesde.getTime()
  )
  const cerradosPeriodo = casosPropios.filter(c =>
    c.estaCerrado && c.fechaCierre &&
    (isAfter(c.fechaCierre, fechaDesde) || c.fechaCierre.getTime() === fechaDesde.getTime())
  )
  const carteraActivaPropia = casosPropios.filter(c => !c.estaCerrado).length
  const balanceNeto = ingresadosPeriodo.length - cerradosPeriodo.length

  const ingresadosAnterior = casosPropios.filter(c =>
    isAfter(c.fechaInicio, fechaDesdeAnterior) && isBefore(c.fechaInicio, fechaDesde)
  )
  const cerradosAnterior = casosPropios.filter(c =>
    c.estaCerrado && c.fechaCierre &&
    isAfter(c.fechaCierre, fechaDesdeAnterior) && isBefore(c.fechaCierre, fechaDesde)
  )

  const variacionIngresos = ingresadosAnterior.length > 0
    ? Math.round(((ingresadosPeriodo.length - ingresadosAnterior.length) / ingresadosAnterior.length) * 100) : null
  const variacionCierres = cerradosAnterior.length > 0
    ? Math.round(((cerradosPeriodo.length - cerradosAnterior.length) / cerradosAnterior.length) * 100) : null

  // Promedio del estudio por abogado en el período
  const ingresadosEstudio = todosLosCasos.filter(c =>
    isAfter(c.fechaInicio, fechaDesde) || c.fechaInicio.getTime() === fechaDesde.getTime()
  ).length
  const cerradosEstudio = todosLosCasos.filter(c =>
    c.estaCerrado && c.fechaCierre &&
    (isAfter(c.fechaCierre, fechaDesde) || c.fechaCierre.getTime() === fechaDesde.getTime())
  ).length
  const promedioIngresadosEstudio = totalAbogados > 0
    ? Math.round((ingresadosEstudio / totalAbogados) * 10) / 10 : 0
  const promedioCerradosEstudio = totalAbogados > 0
    ? Math.round((cerradosEstudio / totalAbogados) * 10) / 10 : 0

  // Flujo mensual — todo filtrado por el abogado
  const mesesAtras = Math.max(Math.ceil(diasFiltro / 30), 2)
  const flujoMensual: PeriodoFlujo[] = []

  for (let i = mesesAtras - 1; i >= 0; i--) {
    const mesInicio = startOfMonth(subDays(hoy, i * 30))
    const mesFin = startOfMonth(subDays(hoy, (i - 1) * 30))
    const mesFinReal = i === 0 ? hoy : mesFin

    const ingresadosMes = casosPropios.filter(c =>
      (isAfter(c.fechaInicio, mesInicio) || c.fechaInicio.getTime() === mesInicio.getTime()) &&
      isBefore(c.fechaInicio, mesFinReal)
    ).length

    const cerradosMes = casosPropios.filter(c =>
      c.estaCerrado && c.fechaCierre &&
      (isAfter(c.fechaCierre, mesInicio) || c.fechaCierre.getTime() === mesInicio.getTime()) &&
      isBefore(c.fechaCierre, mesFinReal)
    ).length

    // Cartera activa del abogado al final del mes
    const carteraAlFinalMes = casosPropios.filter(c =>
      (isBefore(c.fechaInicio, mesFinReal) || c.fechaInicio.getTime() === mesFinReal.getTime()) &&
      (!c.estaCerrado || (c.fechaCierre && isAfter(c.fechaCierre, mesFinReal)))
    ).length

    const anterior = flujoMensual[flujoMensual.length - 1]
    flujoMensual.push({
      periodo: format(mesInicio, 'MMM yyyy', { locale: es }),
      periodoKey: format(mesInicio, 'yyyy-MM'),
      ingresados: ingresadosMes, cerrados: cerradosMes,
      balance: ingresadosMes - cerradosMes, carteraActiva: carteraAlFinalMes,
      variacionIngresos: anterior && anterior.ingresados > 0
        ? Math.round(((ingresadosMes - anterior.ingresados) / anterior.ingresados) * 100) : null,
      variacionCierres: anterior && anterior.cerrados > 0
        ? Math.round(((cerradosMes - anterior.cerrados) / anterior.cerrados) * 100) : null,
    })
  }

  // Observaciones personales
  const observaciones: Observacion[] = []
  if (balanceNeto > 3) {
    observaciones.push({ tipo: 'alerta', texto: `Tu cartera está creciendo: ingresaron ${ingresadosPeriodo.length} casos y cerraste ${cerradosPeriodo.length} en el período.` })
  } else if (balanceNeto < -2) {
    observaciones.push({ tipo: 'positivo', texto: `Cerraste más casos de los que ingresaron (${cerradosPeriodo.length} cierres vs ${ingresadosPeriodo.length} ingresos). Tu cartera se está reduciendo.` })
  } else {
    observaciones.push({ tipo: 'info', texto: `Tu flujo está equilibrado: ${ingresadosPeriodo.length} ingresos y ${cerradosPeriodo.length} cierres en el período.` })
  }
  if (ingresadosPeriodo.length > promedioIngresadosEstudio + 2) {
    observaciones.push({ tipo: 'info', texto: `Ingresaste ${ingresadosPeriodo.length} casos, por encima del promedio del estudio (${promedioIngresadosEstudio} por abogado).` })
  } else if (ingresadosPeriodo.length < promedioIngresadosEstudio - 2 && promedioIngresadosEstudio > 0) {
    observaciones.push({ tipo: 'info', texto: `Ingresaste ${ingresadosPeriodo.length} casos, por debajo del promedio del estudio (${promedioIngresadosEstudio} por abogado).` })
  }
  if (carteraActivaPropia > 15) {
    observaciones.push({ tipo: 'alerta', texto: `Tenés ${carteraActivaPropia} casos activos. Revisá tu carga operativa.` })
  }

  return {
    kpis: {
      ingresados: ingresadosPeriodo.length,
      cerrados: cerradosPeriodo.length,
      balanceNeto,
      carteraActiva: carteraActivaPropia,
      variacionIngresos,
      variacionCierres,
      promedioIngresadosEstudio,
      promedioCerradosEstudio,
    },
    flujoMensual,
    observaciones,
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default async function EvolucionCarteraPage({
  searchParams
}: {
  searchParams: Promise<{ periodo?: string; vista?: string }>
}) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const userRol = user.rol?.toUpperCase()
  // Defensa en profundidad — bloquear roles no operativos
if (userRol === 'CLIENTE' || userRol === 'ADMIN') notFound()
  if (userRol === 'ASISTENTE') redirect("/reportes")

  const params = await searchParams
  const periodoKey = params?.periodo || '180'
  const periodoConfig = PERIODOS_DISPONIBLES.find(p => p.key === periodoKey) || PERIODOS_DISPONIBLES[3]
  const diasFiltro = periodoConfig.dias

  // Admin siempre ve gerencial, abogado puede alternar
  const esAbogado = userRol === 'ABOGADO'
  const vistaParam = params?.vista
  // Si es abogado y no eligió vista, default personal. Admin siempre gerencial.
  const vistaPersonal = esAbogado && vistaParam !== 'gerencial'

  const [datosGerencial, datosPersonal] = await Promise.all([
    !vistaPersonal ? obtenerDatosGerencial(diasFiltro) : Promise.resolve(null),
    vistaPersonal ? obtenerDatosPersonal(user.id, diasFiltro) : Promise.resolve(null),
  ])

  const kpis = vistaPersonal ? datosPersonal!.kpis : datosGerencial!.kpis
  const flujoMensual = vistaPersonal ? datosPersonal!.flujoMensual : datosGerencial!.flujoMensual
  const composicion = !vistaPersonal ? datosGerencial!.composicion : null
  const observaciones = vistaPersonal ? datosPersonal!.observaciones : datosGerencial!.observaciones

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
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
                    Evolución y tendencia de la cartera
                  </h1>
                  <p className="text-sm text-slate-500">
                    {vistaPersonal
                      ? "Cómo venís: tus ingresos vs cierres por período"
                      : "Cómo venimos: ingresos vs cierres por período y cambio en el perfil del estudio"
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FiltroTiempo
                  periodos={PERIODOS_DISPONIBLES.map(p => ({ key: p.key, label: p.label }))}
                  periodoActual={periodoKey}
                />
              </div>
            </div>

            {/* Toggle — solo abogado */}
            {esAbogado && (
              <div className="mb-6">
                <ToggleVistaEvolucion vistaActual={vistaPersonal ? 'personal' : 'gerencial'} />
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard
                label="Ingresados"
                value={kpis.ingresados}
                variacion={kpis.variacionIngresos}
                icon={<ArrowUpRight className="h-5 w-5 text-blue-600" />}
                colorBg="bg-blue-50" colorBorder="border-blue-200" colorText="text-blue-600"
                comparativo={vistaPersonal && 'promedioIngresadosEstudio' in kpis
                  ? `Prom. estudio: ${kpis.promedioIngresadosEstudio}`
                  : undefined}
              />
              <KpiCard
                label="Cerrados"
                value={kpis.cerrados}
                variacion={kpis.variacionCierres}
                icon={<Scale className="h-5 w-5 text-emerald-600" />}
                colorBg="bg-emerald-50" colorBorder="border-emerald-200" colorText="text-emerald-600"
                comparativo={vistaPersonal && 'promedioCerradosEstudio' in kpis
                  ? `Prom. estudio: ${kpis.promedioCerradosEstudio}`
                  : undefined}
              />
              <KpiCard
                label="Balance Neto"
                value={kpis.balanceNeto}
                variacion={null}
                icon={kpis.balanceNeto > 0
                  ? <ArrowUpRight className="h-5 w-5 text-amber-600" />
                  : kpis.balanceNeto < 0
                  ? <ArrowDownRight className="h-5 w-5 text-emerald-600" />
                  : <Minus className="h-5 w-5 text-slate-500" />}
                colorBg={kpis.balanceNeto > 3 ? "bg-amber-50" : kpis.balanceNeto < 0 ? "bg-emerald-50" : "bg-slate-50"}
                colorBorder={kpis.balanceNeto > 3 ? "border-amber-200" : kpis.balanceNeto < 0 ? "border-emerald-200" : "border-slate-200"}
                colorText={kpis.balanceNeto > 3 ? "text-amber-600" : kpis.balanceNeto < 0 ? "text-emerald-600" : "text-slate-600"}
                prefijo={kpis.balanceNeto > 0 ? '+' : ''}
              />
              <KpiCard
                label={vistaPersonal ? "Mis casos activos" : "Cartera Activa"}
                value={kpis.carteraActiva}
                variacion={null}
                icon={<Layers className="h-5 w-5 text-indigo-600" />}
                colorBg="bg-indigo-50" colorBorder="border-indigo-200" colorText="text-indigo-600"
              />
            </div>

            {/* Tabla flujo — siempre visible */}
            <TablaFlujo datos={flujoMensual} />

            {/* Composición por tipo — solo vista gerencial */}
            {composicion && (
              <TablaComposicion datos={composicion} periodoLabel={periodoConfig.label} />
            )}

            {/* Observaciones */}
            {observaciones.length > 0 && (
              <Card className="mb-6 border-slate-200 shadow-sm">
                <CardHeader className="border-b bg-slate-50/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-50 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800">Observaciones</CardTitle>
                      <CardDescription>Conclusiones automáticas basadas en los datos del período</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {observaciones.map((obs, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                        obs.tipo === 'alerta' ? 'bg-amber-50 border-amber-200' :
                        obs.tipo === 'positivo' ? 'bg-emerald-50 border-emerald-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        {obs.tipo === 'alerta' && <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />}
                        {obs.tipo === 'positivo' && <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />}
                        {obs.tipo === 'info' && <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />}
                        <p className={`text-sm ${
                          obs.tipo === 'alerta' ? 'text-amber-800' :
                          obs.tipo === 'positivo' ? 'text-emerald-800' : 'text-blue-800'
                        }`}>{obs.texto}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metodología */}
            <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <p className="text-sm text-blue-900 font-semibold mb-2">📖 Metodología del Reporte</p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li><strong>Ingresos:</strong> Casos cuya <code>fechaInicio</code> cae dentro del período seleccionado.</li>
                <li><strong>Cierres:</strong> Casos cuya <code>fechaCierre</code> cae dentro del período.</li>
                <li><strong>Balance neto:</strong> Ingresos - Cierres. Positivo = acumulación de stock, negativo = reducción de cartera.</li>
                <li><strong>Variación %:</strong> Comparación con el período inmediatamente anterior de igual duración.</li>
                {!vistaPersonal && <li><strong>Composición:</strong> Distribución porcentual de ingresos por tipo, comparando período actual vs anterior.</li>}
                {vistaPersonal && <li><strong>Promedio estudio:</strong> Total del estudio dividido entre abogados activos, para el mismo período.</li>}
              </ul>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}

// ============================================================================
// KPI CARD — agrega prop comparativo opcional
// ============================================================================

function KpiCard({
  label, value, variacion, icon, colorBg, colorBorder, colorText, prefijo = '', comparativo
}: {
  label: string; value: number; variacion: number | null
  icon: React.ReactNode; colorBg: string; colorBorder: string; colorText: string
  prefijo?: string; comparativo?: string
}) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${colorBorder} ${colorBg}`}>
      <div className={`p-2.5 rounded-lg ${colorBg}`}>{icon}</div>
      <div>
        <p className={`text-2xl font-bold ${colorText}`}>{prefijo}{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
        {variacion !== null && (
          <p className={`text-[10px] font-medium mt-0.5 ${
            variacion > 0 ? 'text-emerald-600' : variacion < 0 ? 'text-red-600' : 'text-slate-400'
          }`}>
            {variacion > 0 ? '↑' : variacion < 0 ? '↓' : '='} {Math.abs(variacion)}% vs período anterior
          </p>
        )}
        {comparativo && (
          <p className="text-[10px] text-slate-400 mt-0.5">{comparativo}</p>
        )}
      </div>
    </div>
  )
}