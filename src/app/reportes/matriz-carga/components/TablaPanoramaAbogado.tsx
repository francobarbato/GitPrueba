'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Scale, Users, ChevronDown, ChevronRight } from "lucide-react"
import type { AbogadoPanorama } from "../page"

const formatMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

const PRIORIDAD_CONFIG: Record<string, { label: string; color: string }> = {
  FATAL: { label: "Fatal", color: "text-red-600" },
  ALTA:  { label: "Alta",  color: "text-orange-600" },
  MEDIA: { label: "Media", color: "text-blue-600" },
  BAJA:  { label: "Baja",  color: "text-slate-500" },
}

function DesgloseAbogado({ abogado }: { abogado: AbogadoPanorama }) {
  const estados = [
    { label: "Pendientes", valor: abogado.tareasPendientes, color: "bg-slate-100 text-slate-700" },
    { label: "En proceso", valor: abogado.tareasEnProceso, color: "bg-blue-100 text-blue-700" },
    { label: "Bloqueados", valor: abogado.tareasBloqueadas, color: "bg-red-100 text-red-700" },
  ].filter(e => e.valor > 0)

  const prioridades = [
    { key: "FATAL", valor: abogado.tareasFatal },
    { key: "ALTA", valor: abogado.tareasAlta },
    { key: "MEDIA", valor: abogado.tareasMedia },
    { key: "BAJA", valor: abogado.tareasBaja },
  ].filter(p => p.valor > 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Eventos por estado</p>
        <div className="flex flex-wrap gap-2">
          {estados.length === 0 ? (
            <p className="text-xs text-slate-400">Sin eventos activos</p>
          ) : (
            estados.map(e => (
              <div key={e.label} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${e.color}`}>{e.valor} {e.label}</div>
            ))
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Eventos por prioridad</p>
        <div className="flex flex-wrap gap-2">
          {prioridades.length === 0 ? (
            <p className="text-xs text-slate-400">Sin eventos activos</p>
          ) : (
            prioridades.map(p => {
              const cfg = PRIORIDAD_CONFIG[p.key]
              return (
                <div key={p.key} className="flex items-center gap-1.5 text-xs">
                  <span className={`font-bold ${cfg.color}`}>{p.valor}</span>
                  <span className="text-slate-500">{cfg.label}</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

function TablaRol({ titulo, icono: Icon, iconColor, data, expandedId, onToggle }: {
  titulo: string; icono: any; iconColor: string; data: AbogadoPanorama[]
  expandedId: string | null; onToggle: (id: string) => void
}) {
  if (data.length === 0) return null

  return (
    <div className="mb-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2 px-4">
        <Icon className={`w-4 h-4 ${iconColor}`} />{titulo}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <th className="w-8 px-4 py-3" />
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Profesional</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Eventos activos</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-red-600 uppercase tracking-wider">Bloqueados</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wider">Por vencer</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expedientes</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capital en litigio</th>
            </tr>
          </thead>
          <tbody>
            {data.map((ab, idx) => {
              const isExpanded = expandedId === ab.id
              return (
                <>
                  <tr
                    key={ab.id}
                    onClick={() => onToggle(ab.id)}
                    className={`border-b border-slate-100 cursor-pointer hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                  >
                    <td className="px-4 py-3 text-slate-400">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{ab.nombre}</td>
                    <td className="px-3 py-3 text-center font-bold text-slate-800">{ab.tareasActivas}</td>
                    <td className="px-3 py-3 text-center">
                      {ab.tareasBloqueadas > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          {ab.tareasBloqueadas}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {ab.tareasProximas > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          {ab.tareasProximas}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-medium text-slate-700">{ab.casosActivos}</td>
                    <td className="px-4 py-3 text-right text-slate-600 text-xs font-medium">
                      {ab.capitalEnLitigio > 0 ? formatMoney(ab.capitalEnLitigio) : "—"}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${ab.id}-detail`} className="bg-slate-50/70">
                      <td colSpan={7} className="px-8 py-5">
                        <DesgloseAbogado abogado={ab} />
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TablaPanoramaAbogado({ data, vistaGeneral }: { data: AbogadoPanorama[]; vistaGeneral: boolean }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id)

  const abogados = data.filter(p => p.rol === "ABOGADO")
  const asistentes = data.filter(p => p.rol === "ASISTENTE")

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Panorama del equipo
        </CardTitle>
        <p className="text-xs text-slate-500">
          Carga actual por profesional. Click en una fila para ver el desglose de eventos por estado y prioridad.
        </p>
      </CardHeader>
      <CardContent className="pt-2 px-0 pb-0">
        <TablaRol titulo="Abogados / Socios" icono={Scale} iconColor="text-indigo-500" data={abogados} expandedId={expandedId} onToggle={toggleExpand} />
        <TablaRol titulo="Asistentes / Administrativos" icono={Users} iconColor="text-slate-500" data={asistentes} expandedId={expandedId} onToggle={toggleExpand} />
      </CardContent>
    </Card>
  )
}