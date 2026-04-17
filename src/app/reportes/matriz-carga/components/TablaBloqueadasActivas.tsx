'use client'

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, Scale, Briefcase, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import type { TareaBloqueadaDetalle } from "../page"

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

export function TablaBloqueadasActivas({ data }: { data: TareaBloqueadaDetalle[] }) {
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [filtroCategoria, setFiltroCategoria] = useState("todos")

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

  return (
    <Card className="bg-white border border-red-200 mb-6">
      <CardHeader className="pb-3 bg-red-50/50 border-b border-red-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-red-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              Tareas bloqueadas activas
              <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">
                {hayFiltros ? `${datosFiltrados.length} de ${data.length}` : data.length}
              </span>
            </CardTitle>
            <p className="text-xs text-red-700/70">Tareas que no pueden avanzar hasta que se destraben. Requieren intervención.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
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
            <button onClick={() => { setFiltroTipo("todos"); setFiltroCategoria("todos") }} className="text-xs text-slate-500 hover:text-slate-700 underline">Limpiar</button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {datosFiltrados.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Sin tareas para los filtros seleccionados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarea</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Motivo del bloqueo</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridad</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expediente</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vence</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-red-600 uppercase tracking-wider">Bloqueada hace</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.map((t, idx) => {
                  const prioCfg = PRIORIDAD_CONFIG[t.prioridad] ?? PRIORIDAD_CONFIG.MEDIA
                  return (
                    <tr key={t.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="flex items-start gap-2">
                          {t.tipo === "PROCESAL" ? (
                            <Scale className="w-3 h-3 text-red-500 mt-1 shrink-0" />
                          ) : (
                            <Briefcase className="w-3 h-3 text-blue-500 mt-1 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">{t.titulo}</p>
                            <p className="text-[10px] text-slate-400">{CATEGORIA_LABELS[t.categoria] ?? t.categoria}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600 max-w-[280px]">
                        {t.motivoBloqueo ? (
                          <div className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                            <span className="break-words">{t.motivoBloqueo}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin motivo registrado</span>
                        )}
                      </td>
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
                      <td className="px-3 py-3 text-center text-xs text-slate-500">
                        {t.fechaVencimiento ? (
                          <span className="flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(t.fechaVencimiento).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs font-bold text-red-700">
                          {t.diasDesdeUltimoCambio === 0 ? "Hoy" : `${t.diasDesdeUltimoCambio} ${t.diasDesdeUltimoCambio === 1 ? "día" : "días"}`}
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