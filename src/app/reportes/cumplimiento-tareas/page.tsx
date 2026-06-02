// app/reportes/cumplimiento-tareas/page.tsx

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { differenceInDays, differenceInHours, subDays } from "date-fns"
import { ArrowLeft, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { redirect, notFound } from "next/navigation"

import { KPICardsTareas } from "./components/KPICardsTareas"
import { TablaCumplimientoPersona } from "./components/TablaCumplimientoPersona"
import { TablaPrioridades } from "./components/TablaPrioridades"
import { DetalleTareasTabs } from "./components/Detalletareastabs"
import { PanelInsightsTareas } from "./components/PanelInsightsTareas"
import { FiltrosPeriodoTareas } from "./components/FiltrosPeriodoTareas"
import { ToggleVistaTareas } from "./components/ToggleVistaTareas"
import { NotaContextoPeriodo } from "@/app/reportes/components/NotaContextoPeriodo"

// ============================================================================
// TIPOS (sin cambios)
// ============================================================================

type TareaRaw = {
  id: string
  titulo: string
  tipo: string
  categoria: string
  prioridad: string
  estado: string
  fechaVencimiento: Date | null
  fechaCompletada: Date | null
  createdAt: Date
  responsable: { id: string; nombre: string | null; apellido: string | null; rol: string }
  caso: { numero: string } | null
}

// ============================================================================
// HELPERS DE CÁLCULO (sin cambios)
// ============================================================================

function calcularTasaCumplimiento(enPlazo: number, conDemora: number, vencidas: number): number {
  const total = enPlazo + conDemora + vencidas
  if (total === 0) return 0
  return Math.round((enPlazo / total) * 100)
}

function calcularDiasEjecucion(createdAt: Date, completadaAt: Date): number | "<1" {
  const horas = differenceInHours(completadaAt, createdAt)
  if (horas < 0) return "<1"
  if (horas < 24) return "<1"
  return differenceInDays(completadaAt, createdAt)
}

// ============================================================================
// QUERY PRINCIPAL (sin cambios)
// ============================================================================

async function getCumplimientoTareas(periodoDias?: number, abogadoId?: string) {
  const whereClause: any = {}
  if (abogadoId) whereClause.responsableId = abogadoId
 
  if (periodoDias) {
    const fechaDesde = subDays(new Date(), periodoDias)

      whereClause.OR = [
      {
        estado: "COMPLETADA",
        fechaCompletada: { gte: fechaDesde },
      },
      {
        estado: "VENCIDA",
        fechaVencimiento: { gte: fechaDesde },
      },
    ]
  } else {
    // Sin filtro de período: traemos todas las terminales (mismo criterio).
    whereClause.estado = { in: ["COMPLETADA", "VENCIDA"] }
  }
 
  const tareas: TareaRaw[] = await prisma.tarea.findMany({
    where: whereClause,
    select: {
      id: true, titulo: true, tipo: true, categoria: true, prioridad: true, estado: true,
      fechaVencimiento: true, fechaCompletada: true, createdAt: true,
      responsable: { select: { id: true, nombre: true, apellido: true, rol: true } },
      caso: { select: { numero: true } },
    },
    orderBy: { createdAt: "desc" },
  })
 
  if (tareas.length === 0) {
    return {
      kpis: { enPlazo: 0, conDemora: 0, vencidas: 0 },
      porPersona: [], porPrioridad: [], listaPersonas: [], tareasRaw: [],
      detalleTareas: { enPlazo: [], conDemora: [], vencidas: [] },
      insights: { mejorCumplimiento: null, peorCumplimiento: null, prioridadMasRapida: null, totalVencidas: 0 },
    }
  }

  if (tareas.length === 0) {
    return {
      kpis: { enPlazo: 0, conDemora: 0, vencidas: 0 },
      porPersona: [], porPrioridad: [], listaPersonas: [], tareasRaw: [],
      detalleTareas: { enPlazo: [], conDemora: [], vencidas: [] },
      insights: { mejorCumplimiento: null, peorCumplimiento: null, prioridadMasRapida: null, totalVencidas: 0 },
    }
  }

  const completadas = tareas.filter(t => t.estado === "COMPLETADA")
  const vencidas = tareas.filter(t => t.estado === "VENCIDA")
  const completadasConPlazo = completadas.filter(t => t.fechaCompletada && t.fechaVencimiento)
  const completadasEnPlazo = completadasConPlazo.filter(t => new Date(t.fechaCompletada!) <= new Date(t.fechaVencimiento!))
  const completadasConDemora = completadasConPlazo.filter(t => new Date(t.fechaCompletada!) > new Date(t.fechaVencimiento!))

  const mapearDetalle = (t: TareaRaw) => {
    const diasEjec = t.fechaCompletada ? calcularDiasEjecucion(t.createdAt, t.fechaCompletada) : null
    const diasAtraso = t.estado === "VENCIDA" && t.fechaVencimiento
      ? differenceInDays(new Date(), t.fechaVencimiento)
      : (t.estado === "COMPLETADA" && t.fechaCompletada && t.fechaVencimiento && new Date(t.fechaCompletada) > new Date(t.fechaVencimiento)
        ? differenceInDays(t.fechaCompletada, t.fechaVencimiento) : null)
    return {
      id: t.id, titulo: t.titulo, tipo: t.tipo, categoria: t.categoria, prioridad: t.prioridad,
      caso: t.caso?.numero ?? null,
      fechaVencimiento: t.fechaVencimiento ? t.fechaVencimiento.toISOString() : null,
      fechaCompletada: t.fechaCompletada ? t.fechaCompletada.toISOString() : null,
      diasEjecucion: diasEjec,
      diasAtraso: diasAtraso !== null && diasAtraso > 0 ? diasAtraso : null,
    }
  }

  const detalleTareas = {
    enPlazo: completadasEnPlazo.map(mapearDetalle).sort((a, b) => (b.fechaCompletada ?? "").localeCompare(a.fechaCompletada ?? "")),
    conDemora: completadasConDemora.map(mapearDetalle).sort((a, b) => (b.fechaCompletada ?? "").localeCompare(a.fechaCompletada ?? "")),
    vencidas: vencidas.map(mapearDetalle).sort((a, b) => (b.fechaVencimiento ?? "").localeCompare(a.fechaVencimiento ?? "")),
  }

  const porPersonaMap = new Map<string, {
    id: string; nombre: string; rol: string
    completadas: number; enPlazo: number; conDemora: number; vencidas: number; diasEjecucion: number[]
  }>()
  for (const t of tareas) {
    if (t.estado !== "COMPLETADA" && t.estado !== "VENCIDA") continue
    const id = t.responsable.id
    if (!porPersonaMap.has(id)) {
      const nombre = t.responsable.nombre && t.responsable.apellido ? `${t.responsable.nombre} ${t.responsable.apellido}` : "Sin nombre"
      porPersonaMap.set(id, { id, nombre, rol: t.responsable.rol, completadas: 0, enPlazo: 0, conDemora: 0, vencidas: 0, diasEjecucion: [] })
    }
    const p = porPersonaMap.get(id)!
    if (t.estado === "COMPLETADA") {
      p.completadas++
      if (t.fechaCompletada && t.fechaVencimiento) {
        if (new Date(t.fechaCompletada) <= new Date(t.fechaVencimiento)) p.enPlazo++
        else p.conDemora++
      }
      if (t.fechaCompletada) {
        const dias = differenceInDays(t.fechaCompletada, t.createdAt)
        if (dias >= 0) p.diasEjecucion.push(dias)
      }
    } else if (t.estado === "VENCIDA") {
      p.vencidas++
    }
  }
  const porPersona = Array.from(porPersonaMap.values()).map(p => ({
    ...p,
    total: p.completadas + p.vencidas,
    tasaCumplimiento: calcularTasaCumplimiento(p.enPlazo, p.conDemora, p.vencidas),
    promedioDias: p.diasEjecucion.length > 0 ? Math.round(p.diasEjecucion.reduce((a, b) => a + b, 0) / p.diasEjecucion.length) : 0,
  })).sort((a, b) => b.total - a.total)
  const listaPersonas = porPersona.map(p => ({ id: p.id, nombre: p.nombre }))

  const prioridades = ["FATAL", "ALTA", "MEDIA", "BAJA"] as const
  const porPrioridad = prioridades.map(prio => {
    const dePrioridad = tareas.filter(t => t.prioridad === prio && (t.estado === "COMPLETADA" || t.estado === "VENCIDA"))
    if (dePrioridad.length === 0) return null
    const comp = dePrioridad.filter(t => t.estado === "COMPLETADA")
    const venc = dePrioridad.filter(t => t.estado === "VENCIDA")
    const compConPlazo = comp.filter(t => t.fechaCompletada && t.fechaVencimiento)
    const enPlazo = compConPlazo.filter(t => new Date(t.fechaCompletada!) <= new Date(t.fechaVencimiento!))
    const conDemora = compConPlazo.filter(t => new Date(t.fechaCompletada!) > new Date(t.fechaVencimiento!))
    const diasArr = comp.filter(t => t.fechaCompletada).map(t => differenceInDays(t.fechaCompletada!, t.createdAt)).filter(d => d >= 0)
    return {
      prioridad: prio, total: dePrioridad.length,
      completadas: comp.length, enPlazo: enPlazo.length, conDemora: conDemora.length, vencidas: venc.length,
      tasaCumplimiento: calcularTasaCumplimiento(enPlazo.length, conDemora.length, venc.length),
      promedioDias: diasArr.length > 0 ? Math.round(diasArr.reduce((a, b) => a + b, 0) / diasArr.length) : 0,
    }
  }).filter(Boolean) as any[]

  const tareasRaw = tareas.filter(t => t.estado === "COMPLETADA" || t.estado === "VENCIDA").map(t => ({
    prioridad: t.prioridad, tipo: t.tipo, categoria: t.categoria, estado: t.estado,
    responsableId: t.responsable.id,
    fechaCompletada: t.fechaCompletada ? t.fechaCompletada.toISOString() : null,
    fechaVencimiento: t.fechaVencimiento ? t.fechaVencimiento.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }))

  const personasConCompletadas = porPersona.filter(p => p.completadas >= 2)
  const mejorCumplimiento = personasConCompletadas.length > 0 ? [...personasConCompletadas].sort((a, b) => b.tasaCumplimiento - a.tasaCumplimiento)[0] : null
  const peorCumplimiento = personasConCompletadas.length >= 2 ? [...personasConCompletadas].sort((a, b) => a.tasaCumplimiento - b.tasaCumplimiento)[0] : null
  const prioridadesConDatos = porPrioridad.filter((p: any) => p.promedioDias > 0)
  const prioridadMasRapida = prioridadesConDatos.length > 0 ? [...prioridadesConDatos].sort((a: any, b: any) => a.promedioDias - b.promedioDias)[0] : null

  return {
    kpis: {
      enPlazo: completadasEnPlazo.length,
      conDemora: completadasConDemora.length,
      vencidas: vencidas.length,
    },
    porPersona, porPrioridad, listaPersonas, tareasRaw, detalleTareas,
    insights: {
      mejorCumplimiento: mejorCumplimiento ? { nombre: mejorCumplimiento.nombre, tasa: mejorCumplimiento.tasaCumplimiento, promDias: mejorCumplimiento.promedioDias } : null,
      peorCumplimiento: peorCumplimiento && peorCumplimiento.id !== mejorCumplimiento?.id ? { nombre: peorCumplimiento.nombre, tasa: peorCumplimiento.tasaCumplimiento } : null,
      prioridadMasRapida: prioridadMasRapida ? { prioridad: prioridadMasRapida.prioridad, dias: prioridadMasRapida.promedioDias } : null,
      totalVencidas: vencidas.length,
    },
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type PageProps = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }

export default async function CumplimientoTareasPage({ searchParams }: PageProps) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")
  const userRol = user.rol?.toUpperCase()
  if (userRol === 'CLIENTE' || userRol === 'ADMIN') notFound()

  const params = await searchParams
  const vistaParam = typeof params.vista === "string" ? params.vista : undefined
  const vistaGeneral = vistaParam === "general"
  const periodoParam = typeof params.periodo === "string" ? params.periodo : undefined
  const periodoDias = periodoParam ? parseInt(periodoParam, 10) : undefined
  const periodoValido = periodoDias && !isNaN(periodoDias) && periodoDias > 0 ? periodoDias : undefined
  const abogadoId = vistaGeneral ? undefined : user.id

  // ═══ NUEVO: en paralelo, traemos los eventos supervisados ═══
  // Solo se usa en vista personal. Si el usuario está en vista general,
  // no hay supervisor concreto que mostrar (eso será otro reporte).
const datos = await getCumplimientoTareas(periodoValido, abogadoId)


  const PERIODO_LABELS: Record<string, string> = { "90": "últimos 90 días", "180": "últimos 180 días", "365": "último año" }
  const subtitulo = vistaGeneral
    ? periodoParam && PERIODO_LABELS[periodoParam] ? `Desempeño del equipo — ${PERIODO_LABELS[periodoParam]}` : "Desempeño operativo del equipo completo"
    : periodoParam && PERIODO_LABELS[periodoParam] ? `Mis resultados — ${PERIODO_LABELS[periodoParam]}` : "Análisis de mis eventos completados y su cumplimiento"
    // Rango para la nota contextual: solo si el usuario eligió un período.
let desdeISO: string | null = null
let hastaISO: string | null = null
let rangoLabelNota: string | null = null
if (periodoValido) {
  const hoyDate = new Date()
  const desdeDate = subDays(hoyDate, periodoValido)
  desdeISO = desdeDate.toISOString()
  hastaISO = hoyDate.toISOString()
  rangoLabelNota = PERIODO_LABELS[String(periodoValido)] ?? `últimos ${periodoValido} días`
}
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Link href="/reportes"><Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 gap-2"><ArrowLeft className="w-4 h-4" /> Volver</Button></Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ClipboardCheck className="h-6 w-6 text-blue-600" />Cumplimiento de Plazos</h1>
                  <p className="text-sm text-slate-500">{subtitulo}</p>
                </div>
              </div>
            </div>
            <div className="mb-6"><ToggleVistaTareas vistaActual={vistaGeneral ? "general" : "personal"} /></div>
            <div className="flex items-center gap-3 mb-6 flex-wrap"><FiltrosPeriodoTareas /></div>

            {desdeISO && hastaISO && rangoLabelNota && (
              <NotaContextoPeriodo
                desde={desdeISO}
                hasta={hastaISO}
                rangoLabel={rangoLabelNota}
              />
            )}
            <KPICardsTareas data={datos.kpis} />

            {!vistaGeneral && (datos.detalleTareas.enPlazo.length > 0 || datos.detalleTareas.conDemora.length > 0 || datos.detalleTareas.vencidas.length > 0) && (
              <DetalleTareasTabs data={datos.detalleTareas} />
            )}

            {vistaGeneral && datos.porPersona.length > 0 && <TablaCumplimientoPersona data={datos.porPersona} />}

            {datos.porPrioridad.length > 0 && (
              <TablaPrioridades
                data={datos.porPrioridad}
                vistaGeneral={vistaGeneral}
                listaPersonas={vistaGeneral ? datos.listaPersonas : undefined}
                tareasRaw={vistaGeneral ? datos.tareasRaw : undefined}
              />
            )}

            {(datos.porPersona.length > 0 || datos.porPrioridad.length > 0) && (
              <PanelInsightsTareas data={datos.insights} vistaGeneral={vistaGeneral} />
            )}

            <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 mb-1">Metodología del Reporte</p>
              <p className="text-xs text-slate-500">
                <strong>Enfoque histórico:</strong> Este reporte analiza eventos terminados (cumplidos y vencidos), no los activos.{" "}
                <strong>En plazo:</strong> Completados antes o en la fecha de vencimiento.{" "}
                <strong>Con demora:</strong> Completados después de la fecha de vencimiento.{" "}
                <strong>Vencidos:</strong> Eventos cuyo plazo expiró sin completarse.{" "}
                <strong>Tasa de cumplimiento:</strong> Proporción de eventos completados en plazo sobre el total resuelto (en plazo + con demora + vencidos).{" "}
                 Los tiempos reflejan plazos internos del estudio y no contemplan plazos procesales externos.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}