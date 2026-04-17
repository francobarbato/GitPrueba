'use client'

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Flag } from "lucide-react"
import { differenceInDays } from "date-fns"

// ============================================================================
// TIPOS
// ============================================================================

type PrioridadData = {
  prioridad: string; total: number; completadas: number; enPlazo: number; conDemora: number; vencidas: number
  tasaCumplimiento: number; promedioDias: number
}

type PersonaFiltro = { id: string; nombre: string }

type TareaRawPrioridad = {
  prioridad: string; estado: string; responsableId: string
  tipo?: string; categoria?: string
  fechaCompletada: string | null; fechaVencimiento: string | null; createdAt: string
}

// ============================================================================
// CONSTANTES
// ============================================================================

const PRIORIDAD_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  FATAL: { label: "Fatal", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  ALTA:  { label: "Alta",  color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  MEDIA: { label: "Media", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  BAJA:  { label: "Baja",  color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
}

const CATEGORIA_LABELS: Record<string, string> = {
  PRESENTACION_ESCRITO: "Presentación / Escrito", AUDIENCIA: "Audiencia",
  NOTIFICACION_CEDULA: "Notificación / Cédula", CONTROL_EXPEDIENTE: "Control de Expediente",
  APELACION_RECURSO: "Apelación / Recurso", PERICIA_PRUEBA: "Pericia / Prueba",
  REUNION_CLIENTE: "Reunión con Cliente", REDACCION_DOCUMENTACION: "Redacción / Documentación",
  TRAMITE_ADMINISTRATIVO: "Trámite Administrativo", REQUERIMIENTO_CLIENTE: "Req. al Cliente",
  GESTION_FINANCIERA: "Gestión Financiera", REUNION_EQUIPO: "Reunión de Equipo",
  VENCIMIENTO_PLAZO: "Vencimiento / Plazo",
}

const PRIORIDADES_ORDEN = ["FATAL", "ALTA", "MEDIA", "BAJA"]

// ============================================================================
// HELPER: recalcular métricas filtradas
// ============================================================================

function calcularPrioridadFiltrada(tareasRaw: TareaRawPrioridad[], filtroPersona: string, filtroTipo: string, filtroCat: string): PrioridadData[] {
  const filtradas = tareasRaw.filter(t => {
    if (filtroPersona !== "todos" && t.responsableId !== filtroPersona) return false
    if (filtroTipo !== "todos" && t.tipo !== filtroTipo) return false
    if (filtroCat !== "todos" && t.categoria !== filtroCat) return false
    return true
  })

  return PRIORIDADES_ORDEN.map(prio => {
    const dePrioridad = filtradas.filter(t => t.prioridad === prio)
    if (dePrioridad.length === 0) return null

    const comp = dePrioridad.filter(t => t.estado === "COMPLETADA")
    const venc = dePrioridad.filter(t => t.estado === "VENCIDA")
    const compConPlazo = comp.filter(t => t.fechaCompletada && t.fechaVencimiento)
    const enPlazo = compConPlazo.filter(t => new Date(t.fechaCompletada!) <= new Date(t.fechaVencimiento!))
    const conDemora = compConPlazo.filter(t => new Date(t.fechaCompletada!) > new Date(t.fechaVencimiento!))
    const diasArr = comp.filter(t => t.fechaCompletada).map(t => {
      const diff = differenceInDays(new Date(t.fechaCompletada!), new Date(t.createdAt))
      return diff >= 0 ? diff : 0
    })

    return {
      prioridad: prio, total: dePrioridad.length,
      completadas: comp.length, enPlazo: enPlazo.length, conDemora: conDemora.length, vencidas: venc.length,
      tasaCumplimiento: compConPlazo.length > 0 ? Math.round((enPlazo.length / compConPlazo.length) * 100) : 0,
      promedioDias: diasArr.length > 0 ? Math.round(diasArr.reduce((a, b) => a + b, 0) / diasArr.length) : 0,
    }
  }).filter(Boolean) as PrioridadData[]
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function TablaPrioridades({ data, vistaGeneral = false, listaPersonas, tareasRaw }: {
  data: PrioridadData[]
  vistaGeneral?: boolean
  listaPersonas?: PersonaFiltro[]
  tareasRaw?: TareaRawPrioridad[]
}) {
  const [filtroPersona, setFiltroPersona] = useState("todos")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [filtroCat, setFiltroCat] = useState("todos")

  const hayFiltros = filtroPersona !== "todos" || filtroTipo !== "todos" || filtroCat !== "todos"

  const datosVisibles = useMemo(() => {
    if (!vistaGeneral || !tareasRaw || !hayFiltros) return data
    return calcularPrioridadFiltrada(tareasRaw, filtroPersona, filtroTipo, filtroCat)
  }, [data, vistaGeneral, tareasRaw, filtroPersona, filtroTipo, filtroCat, hayFiltros])

  const categoriasPresentes = useMemo(() => {
    if (!tareasRaw) return []
    const set = new Set<string>()
    tareasRaw.forEach(t => { if (t.categoria) set.add(t.categoria) })
    return Array.from(set).sort()
  }, [tareasRaw])

  if (data.length === 0) return null

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Flag className="w-5 h-5 text-indigo-600" />
              Resultado por prioridad
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              {vistaGeneral
                ? "Cómo se resolvieron las tareas según su nivel de prioridad."
                : "Resultado de tus tareas agrupadas por prioridad."}
            </p>
          </div>
          {vistaGeneral && listaPersonas && listaPersonas.length > 0 && (
            <Select value={filtroPersona} onValueChange={setFiltroPersona}>
              <SelectTrigger className="w-[200px] h-9 text-sm bg-white">
                <SelectValue placeholder="Todas las personas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las personas</SelectItem>
                {listaPersonas.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        {vistaGeneral && tareasRaw && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-white"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="PROCESAL">Procesal</SelectItem>
                <SelectItem value="INTERNA">Interna</SelectItem>
              </SelectContent>
            </Select>
            {categoriasPresentes.length > 1 && (
              <Select value={filtroCat} onValueChange={setFiltroCat}>
                <SelectTrigger className="w-[200px] h-8 text-xs bg-white"><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las categorías</SelectItem>
                  {categoriasPresentes.map(c => <SelectItem key={c} value={c}>{CATEGORIA_LABELS[c] ?? c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {hayFiltros && (
              <button onClick={() => { setFiltroPersona("todos"); setFiltroTipo("todos"); setFiltroCat("todos") }} className="text-xs text-slate-500 hover:text-slate-700 underline">Limpiar</button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridad</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resueltas</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-emerald-600 uppercase tracking-wider">En plazo</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wider">Con demora</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-red-600 uppercase tracking-wider">Vencidas</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasa cumpl.</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prom. días</th>
              </tr>
            </thead>
            <tbody>
              {datosVisibles.map((row, idx) => {
                const cfg = PRIORIDAD_CONFIG[row.prioridad] || PRIORIDAD_CONFIG.MEDIA
                return (
                  <tr key={row.prioridad} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
                    </td>
                    <td className="px-3 py-3 text-center font-medium text-slate-700">{row.completadas}</td>
                    <td className="px-3 py-3 text-center text-emerald-600 font-medium">{row.enPlazo}</td>
                    <td className="px-3 py-3 text-center text-amber-600 font-medium">{row.conDemora}</td>
                    <td className="px-3 py-3 text-center">
                      {row.vencidas > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{row.vencidas}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-14 bg-slate-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${row.tasaCumplimiento >= 70 ? "bg-emerald-500" : row.tasaCumplimiento >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(row.tasaCumplimiento, 100)}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-600">{row.tasaCumplimiento}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{row.promedioDias > 0 ? `${row.promedioDias} días` : "—"}</td>
                  </tr>
                )
              })}
              {datosVisibles.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">Sin tareas resueltas para los filtros seleccionados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}