'use client'

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Clock, XCircle, FileText, Scale, Briefcase } from "lucide-react"

// ============================================================================
// TIPOS
// ============================================================================

type TareaDetalle = {
  id: string
  titulo: string
  tipo: string
  categoria: string
  prioridad: string
  caso: string | null
  fechaVencimiento: string | null
  fechaCompletada: string | null
  diasEjecucion: number | null
  diasAtraso: number | null
}

type Props = {
  data: {
    enPlazo: TareaDetalle[]
    conDemora: TareaDetalle[]
    vencidas: TareaDetalle[]
  }
}

// ============================================================================
// CONSTANTES
// ============================================================================

const CATEGORIA_LABELS: Record<string, string> = {
  PRESENTACION_ESCRITO: "Presentación / Escrito", AUDIENCIA: "Audiencia",
  NOTIFICACION_CEDULA: "Notificación / Cédula", CONTROL_EXPEDIENTE: "Control de Expediente",
  APELACION_RECURSO: "Apelación / Recurso", PERICIA_PRUEBA: "Pericia / Prueba",
  REUNION_CLIENTE: "Reunión con Cliente", REDACCION_DOCUMENTACION: "Redacción / Documentación",
  TRAMITE_ADMINISTRATIVO: "Trámite Administrativo", REQUERIMIENTO_CLIENTE: "Req. al Cliente",
  GESTION_FINANCIERA: "Gestión Financiera", REUNION_EQUIPO: "Reunión de Equipo",
  VENCIMIENTO_PLAZO: "Vencimiento / Plazo",
}

const PRIORIDAD_CONFIG: Record<string, { label: string; color: string }> = {
  FATAL: { label: "Fatal", color: "bg-red-100 text-red-700 border-red-200" },
  ALTA:  { label: "Alta",  color: "bg-orange-100 text-orange-700 border-orange-200" },
  MEDIA: { label: "Media", color: "bg-blue-100 text-blue-700 border-blue-200" },
  BAJA:  { label: "Baja",  color: "bg-slate-100 text-slate-600 border-slate-200" },
}

type TabKey = "enPlazo" | "conDemora" | "vencidas"

// ============================================================================
// FILA DE TAREA
// ============================================================================

function FilaTarea({ t, tipoTab }: { t: TareaDetalle; tipoTab: TabKey }) {
  const prioCfg = PRIORIDAD_CONFIG[t.prioridad] ?? PRIORIDAD_CONFIG.MEDIA
  const fechaReferencia = tipoTab === "vencidas" ? t.fechaVencimiento : t.fechaCompletada
  const labelFecha = tipoTab === "vencidas" ? "Venció" : "Completada"

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          {t.tipo === "PROCESAL" ? (
            <Scale className="w-3 h-3 text-red-500 shrink-0" />
          ) : (
            <Briefcase className="w-3 h-3 text-blue-500 shrink-0" />
          )}
          <span className="font-medium text-slate-800 truncate">{t.titulo}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-xs text-slate-500">{CATEGORIA_LABELS[t.categoria] ?? t.categoria}</td>
      <td className="px-3 py-2.5 text-center">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${prioCfg.color}`}>{prioCfg.label}</span>
      </td>
      <td className="px-3 py-2.5 text-center">
        {t.caso ? (
          <span className="font-mono text-xs text-blue-600 font-bold">{t.caso}</span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-center text-xs text-slate-500">
        {fechaReferencia ? new Date(fechaReferencia).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
      </td>
      <td className="px-3 py-2.5 text-center">
        {tipoTab === "vencidas" && t.diasAtraso !== null ? (
          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">{t.diasAtraso}d atraso</span>
        ) : tipoTab === "conDemora" && t.diasAtraso !== null ? (
          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">+{t.diasAtraso}d</span>
        ) : t.diasEjecucion !== null ? (
          <span className="text-xs text-slate-500">{t.diasEjecucion}d</span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
    </tr>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function DetalleTareasTabs({ data }: Props) {
  // Default al primer tab que tenga datos
  const tabInicial: TabKey = data.enPlazo.length > 0 ? "enPlazo" : data.conDemora.length > 0 ? "conDemora" : "vencidas"
  const [tabActivo, setTabActivo] = useState<TabKey>(tabInicial)
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [filtroCategoria, setFiltroCategoria] = useState("todos")

  const tabs = [
    { key: "enPlazo" as TabKey, label: "En plazo", icon: CheckCircle2, count: data.enPlazo.length, activeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", iconColor: "text-emerald-500" },
    { key: "conDemora" as TabKey, label: "Con demora", icon: Clock, count: data.conDemora.length, activeColor: "bg-amber-50 text-amber-700 border-amber-200", iconColor: "text-amber-500" },
    { key: "vencidas" as TabKey, label: "Vencidas", icon: XCircle, count: data.vencidas.length, activeColor: "bg-red-50 text-red-700 border-red-200", iconColor: "text-red-500" },
  ]

  const tareasDelTab = data[tabActivo]

  // Categorías presentes en el tab activo (para no mostrar opciones vacías)
  const categoriasPresentes = useMemo(() => {
    const set = new Set<string>()
    tareasDelTab.forEach(t => set.add(t.categoria))
    return Array.from(set).sort()
  }, [tareasDelTab])

  // Aplicar filtros
  const tareasActivas = useMemo(() => {
    return tareasDelTab.filter(t => {
      if (filtroTipo !== "todos" && t.tipo !== filtroTipo) return false
      if (filtroCategoria !== "todos" && t.categoria !== filtroCategoria) return false
      return true
    })
  }, [tareasDelTab, filtroTipo, filtroCategoria])

  const hayFiltros = filtroTipo !== "todos" || filtroCategoria !== "todos"
  const ultimaColLabel = tabActivo === "vencidas" ? "Atraso" : tabActivo === "conDemora" ? "Días extra" : "Ejecución"

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          Detalle de tareas resueltas
        </CardTitle>
        <p className="text-xs text-slate-500">Listado de las tareas que conforman cada KPI. Hacé click en un tab para ver las tareas correspondientes.</p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 pb-3 border-b border-slate-100 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon
            const isActive = tabActivo === t.key
            const isDisabled = t.count === 0
            return (
              <button
                key={t.key}
                onClick={() => !isDisabled && (setTabActivo(t.key), setFiltroCategoria("todos"))}
                disabled={isDisabled}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap border ${
                  isActive
                    ? t.activeColor
                    : isDisabled
                      ? "text-slate-300 border-transparent cursor-not-allowed"
                      : "text-slate-500 border-transparent hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? t.iconColor : ""}`} />
                {t.label}
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-white/60" : "bg-slate-100 text-slate-500"
                }`}>{t.count}</span>
              </button>
            )
          })}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap bg-slate-50/50">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Tipo:</label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="PROCESAL">Procesal</SelectItem>
                <SelectItem value="INTERNA">Interna</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {categoriasPresentes.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Categoría:</label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="w-[200px] h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las categorías</SelectItem>
                  {categoriasPresentes.map(c => <SelectItem key={c} value={c}>{CATEGORIA_LABELS[c] ?? c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {hayFiltros && (
            <>
              <button onClick={() => { setFiltroTipo("todos"); setFiltroCategoria("todos") }} className="text-xs text-slate-500 hover:text-slate-700 underline">Limpiar</button>
              <span className="text-xs text-slate-400">{tareasActivas.length} de {tareasDelTab.length}</span>
            </>
          )}
        </div>

        {/* Tabla */}
        {tareasActivas.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{hayFiltros ? "Sin tareas para los filtros seleccionados" : "Sin tareas en esta categoría"}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarea</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridad</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expediente</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {tabActivo === "vencidas" ? "Venció" : "Completada"}
                  </th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{ultimaColLabel}</th>
                </tr>
              </thead>
              <tbody>
                {tareasActivas.map(t => <FilaTarea key={t.id} t={t} tipoTab={tabActivo} />)}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}