'use client'

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Scale, Briefcase } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { TareaProximaVencer } from "../page"

const PRIORIDAD_CONFIG: Record<string, { label: string; color: string }> = {
  FATAL: { label: "Fatal", color: "bg-red-100 text-red-700 border-red-200" },
  ALTA:  { label: "Alta",  color: "bg-orange-100 text-orange-700 border-orange-200" },
  MEDIA: { label: "Media", color: "bg-blue-100 text-blue-700 border-blue-200" },
  BAJA:  { label: "Baja",  color: "bg-slate-100 text-slate-600 border-slate-200" },
}

// Etiquetas de categorías. Misma fuente de verdad que en otros componentes.
const CATEGORIA_LABELS: Record<string, string> = {
  PRESENTACION_ESCRITO: "Presentación / Escrito",
  AUDIENCIA: "Audiencia",
  NOTIFICACION_CEDULA: "Notificación / Cédula",
  CONTROL_EXPEDIENTE: "Control de Expediente",
  APELACION_RECURSO: "Apelación / Recurso",
  PERICIA_PRUEBA: "Pericia / Prueba",
  REUNION_CLIENTE: "Reunión con Cliente",
  REDACCION_DOCUMENTACION: "Redacción / Documentación",
  TRAMITE_ADMINISTRATIVO: "Trámite Administrativo",
  REQUERIMIENTO_CLIENTE: "Req. al Cliente",
  GESTION_FINANCIERA: "Gestión Financiera",
  REUNION_EQUIPO: "Reunión de Equipo",
  VENCIMIENTO_PLAZO: "Vencimiento / Plazo",
}

/**
 * Escala de color escalonada para "días restantes".
 */
function labelDias(dias: number): { texto: string; color: string } {
  if (dias === 0) return { texto: "Hoy",      color: "bg-red-600 text-white" }
  if (dias === 1) return { texto: "Mañana",   color: "bg-red-400 text-white" }
  if (dias <= 3)  return { texto: `${dias} días`, color: "bg-orange-400 text-white" }
  if (dias <= 5)  return { texto: `${dias} días`, color: "bg-amber-400 text-amber-900" }
  return                 { texto: `${dias} días`, color: "bg-amber-200 text-amber-900" }
}

export function PanelProximasVencer({ data }: { data: TareaProximaVencer[] }) {
  const router = useRouter()

  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [filtroCategoria, setFiltroCategoria] = useState("todos")

  // Categorías que efectivamente aparecen en los datos. No mostramos opciones
  // vacías en el dropdown — solo las que tienen al menos un evento próximo.
  const categoriasPresentes = useMemo(() => {
    const set = new Set<string>()
    data.forEach(t => set.add(t.categoria))
    return Array.from(set).sort()
  }, [data])

  const datosFiltrados = useMemo(() => {
    return data.filter(t => {
      if (filtroTipo !== "todos" && t.tipo !== filtroTipo) return false
      if (filtroCategoria !== "todos" && t.categoria !== filtroCategoria) return false
      return true
    })
  }, [data, filtroTipo, filtroCategoria])

  const hayFiltros = filtroTipo !== "todos" || filtroCategoria !== "todos"

  const abrirDrawer = (tareaId: string) => {
    router.push(`/gestion-tareas?tareaAbierta=${tareaId}`)
  }

  return (
    <Card className="bg-white border border-amber-200 shadow-lg">
      <CardHeader className="pb-3 bg-amber-50/50 border-b border-amber-100">
        <CardTitle className="text-sm font-semibold text-amber-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          Próximos eventos a vencer
          {data.length > 0 && (
            <span className="ml-auto text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-bold">
              {hayFiltros ? `${datosFiltrados.length} de ${data.length}` : data.length}
            </span>
          )}
        </CardTitle>
        <p className="text-[10px] text-amber-700/70">Próximos 7 días.</p>

        {/* ═══ FILTROS ═══
            Cada select en su propia línea con label arriba.
            Las labels describen qué selecciona el filtro, no dicen "Tipo:". */}
        {data.length > 0 && (
          <div className="mt-3 space-y-2">
            <div>
              <label className="text-[10px] font-semibold text-amber-900/80 uppercase tracking-wider block mb-1">
                Procesales o internas
              </label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-full h-8 text-xs bg-white border-amber-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los eventos</SelectItem>
                  <SelectItem value="PROCESAL">Solo procesales</SelectItem>
                  <SelectItem value="INTERNA">Solo internas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {categoriasPresentes.length > 1 && (
              <div>
                <label className="text-[10px] font-semibold text-amber-900/80 uppercase tracking-wider block mb-1">
                  Categoría del evento
                </label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger className="w-full h-8 text-xs bg-white border-amber-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las categorías</SelectItem>
                    {categoriasPresentes.map(c => (
                      <SelectItem key={c} value={c}>
                        {CATEGORIA_LABELS[c] ?? c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {hayFiltros && (
              <button
                onClick={() => { setFiltroTipo("todos"); setFiltroCategoria("todos") }}
                className="text-[10px] text-amber-700 hover:text-amber-900 underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="py-6 px-4 text-center">
            <p className="text-xs text-slate-400">No tenés eventos próximos a vencer.</p>
          </div>
        ) : datosFiltrados.length === 0 ? (
          <div className="py-6 px-4 text-center">
            <p className="text-xs text-slate-400">Sin eventos para los filtros seleccionados.</p>
            <button
              onClick={() => { setFiltroTipo("todos"); setFiltroCategoria("todos") }}
              className="mt-2 text-xs text-amber-700 hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[calc(100vh-340px)] overflow-y-auto">
            {datosFiltrados.map(t => {
              const diasLabel = labelDias(t.diasRestantes)
              const prioCfg = PRIORIDAD_CONFIG[t.prioridad] ?? PRIORIDAD_CONFIG.MEDIA
              return (
                <div
                  key={t.id}
                  onClick={() => abrirDrawer(t.id)}
                  className="p-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      abrirDrawer(t.id)
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${diasLabel.color}`}>
                      {diasLabel.texto}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${prioCfg.color}`}>
                      {prioCfg.label}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-800 mb-1.5 leading-snug group-hover:text-blue-700 transition-colors">
                    {t.titulo}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500">
                    {t.tipo === "PROCESAL" ? (
                      <span className="flex items-center gap-0.5 text-red-600">
                        <Scale className="w-2.5 h-2.5" /> Procesal
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-blue-600">
                        <Briefcase className="w-2.5 h-2.5" /> Interna
                      </span>
                    )}
                    {/* Categoría del evento — útil ahora que filtramos por ella */}
                    <span className="text-slate-500">
                      {CATEGORIA_LABELS[t.categoria] ?? t.categoria}
                    </span>
                    {t.caso && (
                      <Link
                        href={`/casos/${t.casoId}`}
                        onClick={e => e.stopPropagation()}
                        className="font-mono font-bold text-blue-600 hover:underline"
                      >
                        {t.caso}
                      </Link>
                    )}
                    <span className="text-slate-400">
                      {new Date(t.fechaVencimiento).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}