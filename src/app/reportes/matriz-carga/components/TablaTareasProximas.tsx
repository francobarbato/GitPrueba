'use client'

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Search } from "lucide-react"
import Link from "next/link"
import type { TareaProximaVencer } from "../page"

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

export function TablaTareasProximas({ data }: { data: TareaProximaVencer[] }) {
  const [busquedaCaso, setBusquedaCaso] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [filtroCategoria, setFiltroCategoria] = useState("todos")
  const [filtroPrioridad, setFiltroPrioridad] = useState("todos")

  const categoriasPresentes = useMemo(() => {
    const set = new Set<string>()
    data.forEach(t => set.add(t.categoria))
    return Array.from(set).sort()
  }, [data])

  const prioridadesPresentes = useMemo(() => {
    const set = new Set<string>()
    data.forEach(t => set.add(t.prioridad))
    return ["FATAL", "ALTA", "MEDIA", "BAJA"].filter(p => set.has(p))
  }, [data])

  const datosFiltrados = useMemo(() => {
    return data.filter(t => {
      if (busquedaCaso.trim()) {
        if (!t.caso) return false
        if (!t.caso.toLowerCase().includes(busquedaCaso.trim().toLowerCase())) return false
      }
      if (filtroTipo !== "todos" && t.tipo !== filtroTipo) return false
      if (filtroCategoria !== "todos" && t.categoria !== filtroCategoria) return false
      if (filtroPrioridad !== "todos" && t.prioridad !== filtroPrioridad) return false
      return true
    })
  }, [data, busquedaCaso, filtroTipo, filtroCategoria, filtroPrioridad])

  if (data.length === 0) return null

  const hayFiltros = busquedaCaso.trim() !== "" || filtroTipo !== "todos" || filtroCategoria !== "todos" || filtroPrioridad !== "todos"
  const limpiar = () => { setBusquedaCaso(""); setFiltroTipo("todos"); setFiltroCategoria("todos"); setFiltroPrioridad("todos") }

  return (
    <Card className="bg-white border border-amber-200 mb-6">
      <CardHeader className="pb-3 bg-amber-50/50">
        <CardTitle className="text-base font-semibold text-amber-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          Tareas próximas a vencer
          <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">
            {hayFiltros ? `${datosFiltrados.length} de ${data.length}` : data.length}
          </span>
        </CardTitle>
        <p className="text-xs text-amber-600/70">
          Tareas activas que vencen en los próximos 7 días. Requieren atención para cumplir el plazo.
        </p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busquedaCaso}
              onChange={e => setBusquedaCaso(e.target.value)}
              placeholder="Buscar por expediente..."
              className="h-8 pl-8 pr-3 w-[180px] text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-white"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="PROCESAL">Procesal</SelectItem>
              <SelectItem value="INTERNA">Interna</SelectItem>
            </SelectContent>
          </Select>
          {categoriasPresentes.length > 1 && (
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-[190px] h-8 text-xs bg-white"><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {categoriasPresentes.map(c => <SelectItem key={c} value={c}>{CATEGORIA_LABELS[c] ?? c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {prioridadesPresentes.length > 1 && (
            <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
              <SelectTrigger className="w-[130px] h-8 text-xs bg-white"><SelectValue placeholder="Prioridad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {prioridadesPresentes.map(p => <SelectItem key={p} value={p}>{PRIORIDAD_CONFIG[p]?.label ?? p}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {hayFiltros && (
            <button onClick={limpiar} className="text-xs text-slate-500 hover:text-slate-700 underline">Limpiar</button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {datosFiltrados.length === 0 ? (
          <div className="py-8 text-center"><p className="text-sm text-slate-400">Sin resultados para los filtros seleccionados</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarea</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridad</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expediente</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vence</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wider">Días restantes</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.map((t, idx) => {
                  const prioCfg = PRIORIDAD_CONFIG[t.prioridad] ?? PRIORIDAD_CONFIG.MEDIA
                  return (
                    <tr key={t.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[220px] truncate">{t.titulo}</td>
                      <td className="px-3 py-3"><span className="text-xs text-slate-500">{CATEGORIA_LABELS[t.categoria] ?? t.categoria}</span></td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${prioCfg.color}`}>{prioCfg.label}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {t.caso ? (
                          <Link href={`/casos/${t.casoId}`} className="font-mono text-xs text-blue-600 font-bold hover:underline">{t.caso}</Link>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-500">
                        {new Date(t.fechaVencimiento).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          t.diasRestantes <= 1 ? "bg-red-100 text-red-700"
                          : t.diasRestantes <= 3 ? "bg-orange-100 text-orange-700"
                          : "bg-amber-100 text-amber-700"
                        }`}>
                          {t.diasRestantes === 0 ? "Hoy" : t.diasRestantes === 1 ? "Mañana" : `${t.diasRestantes} días`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}