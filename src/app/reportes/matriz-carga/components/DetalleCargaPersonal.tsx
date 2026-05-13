'use client'

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, ListChecks, ChevronDown, ChevronRight, Clock } from "lucide-react"
import Link from "next/link"
import type { CasoActivoDetalle, TareaActivaDetalle } from "../page"
import { useRouter } from "next/navigation"

const formatMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

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

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  PENDIENTE:  { label: "Pendiente",  color: "bg-slate-100 text-slate-600" },
  EN_PROCESO: { label: "En proceso", color: "bg-blue-100 text-blue-700" },
  BLOQUEADA:  { label: "Bloqueado",  color: "bg-red-100 text-red-700" },
  VENCIDA:    { label: "Vencida",    color: "bg-red-100 text-red-700 font-bold" },
}

const ORDEN_ESTADO: Record<string, number> = {
  VENCIDA: 0, EN_PROCESO: 1, PENDIENTE: 2, BLOQUEADA: 3,
}

export function DetalleCargaPersonal({ casos, tareas }: { casos: CasoActivoDetalle[]; tareas: TareaActivaDetalle[] }) {
  const router = useRouter()
  const [casosExpandido, setCasosExpandido] = useState(false)
  const [tareasExpandido, setTareasExpandido] = useState(false)

  const [filtroCasoTipo, setFiltroCasoTipo] = useState("todos")
  const [filtroTareaTipo, setFiltroTareaTipo] = useState("todos")
  const [filtroTareaCat, setFiltroTareaCat] = useState("todos")

  const tiposCasoPresentes = useMemo(() => {
    const set = new Set<string>()
    casos.forEach(c => set.add(c.tipo))
    return Array.from(set).sort()
  }, [casos])

  const categoriasTareaPresentes = useMemo(() => {
    const set = new Set<string>()
    tareas.forEach(t => set.add(t.categoria))
    return Array.from(set).sort()
  }, [tareas])

  const previewCasos = useMemo(() => {
    const porTipo = new Map<string, number>()
    for (const c of casos) porTipo.set(c.tipo, (porTipo.get(c.tipo) ?? 0) + 1)
    return Array.from(porTipo.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
  }, [casos])

  const previewTareas = useMemo(() => {
    let pendientes = 0
    let enProceso = 0
    let vencidos = 0
    for (const t of tareas) {
      if (t.estado === "PENDIENTE") pendientes++
      else if (t.estado === "EN_PROCESO") enProceso++
      else if (t.estado === "VENCIDA") vencidos++
    }
    return { pendientes, enProceso, vencidos }
  }, [tareas])

  const casosFiltrados = useMemo(() => {
    if (filtroCasoTipo === "todos") return casos
    return casos.filter(c => c.tipo === filtroCasoTipo)
  }, [casos, filtroCasoTipo])

  const tareasFiltradas = useMemo(() => {
    return tareas.filter(t => {
      if (t.estado === "BLOQUEADA") return false
      if (filtroTareaTipo !== "todos" && t.tipo !== filtroTareaTipo) return false
      if (filtroTareaCat !== "todos" && t.categoria !== filtroTareaCat) return false
      return true
    })
  }, [tareas, filtroTareaTipo, filtroTareaCat])

  const hayFiltroCasos = filtroCasoTipo !== "todos"
  const hayFiltroTareas = filtroTareaTipo !== "todos" || filtroTareaCat !== "todos"

  return (
    <div className="space-y-4 mb-6">
      {/* ── Mis expedientes activos ── */}
      <Card className="bg-white border border-slate-200">
        <button
          onClick={() => setCasosExpandido(!casosExpandido)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors text-left"
        >
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <Briefcase className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="text-base font-semibold text-slate-800">Mis expedientes activos</span>
            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold">{casos.length}</span>
            {!casosExpandido && previewCasos.length > 0 && (
              <div className="flex items-center gap-1.5 ml-2 flex-wrap">
                <span className="text-xs text-slate-300">·</span>
                {previewCasos.map((p, idx) => (
                  <span key={p.tipo} className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{p.cantidad}</span> {p.tipo}
                    {idx < previewCasos.length - 1 && <span className="ml-1.5 text-slate-300">·</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
          {casosExpandido ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
        </button>
        {casosExpandido && (
          <CardContent className="pt-0 px-0 pb-0">
            {tiposCasoPresentes.length > 1 && (
              <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                <Select value={filtroCasoTipo} onValueChange={setFiltroCasoTipo}>
                  <SelectTrigger className="w-[180px] h-8 text-xs bg-white"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los tipos</SelectItem>
                    {tiposCasoPresentes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                {hayFiltroCasos && (
                  <button onClick={() => setFiltroCasoTipo("todos")} className="text-xs text-slate-500 hover:text-slate-700 underline">Limpiar</button>
                )}
                {hayFiltroCasos && (
                  <span className="text-xs text-slate-400">{casosFiltrados.length} de {casos.length}</span>
                )}
              </div>
            )}
            {casosFiltrados.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                {hayFiltroCasos ? "Sin expedientes para el filtro seleccionado" : "Sin expedientes activos"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expediente</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Carátula</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capital</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {casosFiltrados.map((c, idx) => (
                      <tr key={c.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                        <td className="px-4 py-2.5"><span className="font-mono text-xs text-blue-600 font-bold">{c.numero}</span></td>
                        <td className="px-4 py-2.5 text-slate-800 font-medium max-w-[250px] truncate">{c.titulo}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-500">{c.tipo}</td>
                        <td className="px-4 py-2.5 text-right text-xs text-slate-600">{c.capitalEnLitigio > 0 ? formatMoney(c.capitalEnLitigio) : "—"}</td>
                        <td className="px-3 py-2.5 text-center">
                          <Link href={`/casos/${c.id}`} className="text-blue-600 hover:underline text-xs font-medium">Ver</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── Mis eventos activos ── */}
      <Card className="bg-white border border-slate-200">
        <button
          onClick={() => setTareasExpandido(!tareasExpandido)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors text-left"
        >
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <ListChecks className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="text-base font-semibold text-slate-800">Mis eventos activos</span>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">{tareas.length}</span>
            {!tareasExpandido && tareas.length > 0 && (
              <div className="flex items-center gap-1.5 ml-2 flex-wrap">
                <span className="text-xs text-slate-300">·</span>
                {previewTareas.vencidos > 0 && (
                  <span className="text-xs text-slate-500">
                    <span className="font-semibold text-red-700">{previewTareas.vencidos}</span> vencido{previewTareas.vencidos !== 1 ? "s" : ""}
                  </span>
                )}
                {previewTareas.pendientes > 0 && (
                  <>
                    {previewTareas.vencidos > 0 && <span className="text-xs text-slate-300">·</span>}
                    <span className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{previewTareas.pendientes}</span> pendiente{previewTareas.pendientes !== 1 ? "s" : ""}
                    </span>
                  </>
                )}
                {previewTareas.enProceso > 0 && (
                  <>
                    {(previewTareas.vencidos > 0 || previewTareas.pendientes > 0) && <span className="text-xs text-slate-300">·</span>}
                    <span className="text-xs text-slate-500">
                      <span className="font-semibold text-blue-700">{previewTareas.enProceso}</span> en proceso
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          {tareasExpandido ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
        </button>
        {tareasExpandido && (
          <CardContent className="pt-0 px-0 pb-0">
            <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
              <Select value={filtroTareaTipo} onValueChange={setFiltroTareaTipo}>
                <SelectTrigger className="w-[140px] h-8 text-xs bg-white"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="PROCESAL">Procesal</SelectItem>
                  <SelectItem value="INTERNA">Interna</SelectItem>
                </SelectContent>
              </Select>
              {categoriasTareaPresentes.length > 1 && (
                <Select value={filtroTareaCat} onValueChange={setFiltroTareaCat}>
                  <SelectTrigger className="w-[200px] h-8 text-xs bg-white"><SelectValue placeholder="Categoría" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las categorías</SelectItem>
                    {categoriasTareaPresentes.map(c => <SelectItem key={c} value={c}>{CATEGORIA_LABELS[c] ?? c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {hayFiltroTareas && (
                <>
                  <button
                    onClick={() => { setFiltroTareaTipo("todos"); setFiltroTareaCat("todos") }}
                    className="text-xs text-slate-500 hover:text-slate-700 underline"
                  >
                    Limpiar
                  </button>
                  <span className="text-xs text-slate-400">{tareasFiltradas.length} de {tareas.length}</span>
                </>
              )}
            </div>
            {tareasFiltradas.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                {hayFiltroTareas ? "Sin eventos para los filtros seleccionados" : "Sin eventos activos"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Evento</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridad</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vence</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expediente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...tareasFiltradas]
                      .sort((a, b) => (ORDEN_ESTADO[a.estado] ?? 4) - (ORDEN_ESTADO[b.estado] ?? 4))
                      .map((t, idx) => {
                        const prioCfg = PRIORIDAD_CONFIG[t.prioridad] ?? PRIORIDAD_CONFIG.MEDIA
                        const estadoCfg = ESTADO_LABELS[t.estado] ?? ESTADO_LABELS.PENDIENTE
                        return (
                          <tr
                            key={t.id}
                            onClick={() => router.push(`/gestion-tareas?tareaAbierta=${t.id}`)}
                            className={`border-b border-slate-100 cursor-pointer hover:bg-blue-50/40 group transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                          >
                            <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[220px] truncate group-hover:text-blue-700 transition-colors">
                              {t.titulo}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${estadoCfg.color}`}>
                                {estadoCfg.label}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${prioCfg.color}`}>
                                {prioCfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center text-xs text-slate-500">
                              {t.fechaVencimiento ? (
                                <span className="flex items-center justify-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {new Date(t.fechaVencimiento).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                                </span>
                              ) : "—"}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-slate-500">
                              {CATEGORIA_LABELS[t.categoria] ?? t.categoria}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {t.caso ? (
                                <Link
                                  href={`/casos/${t.casoId}`}
                                  onClick={e => e.stopPropagation()}
                                  className="font-mono text-xs text-blue-600 font-bold hover:underline"
                                >
                                  {t.caso}
                                </Link>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}