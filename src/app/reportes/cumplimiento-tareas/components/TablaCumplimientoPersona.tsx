'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Scale, Users } from "lucide-react"

type PersonaData = {
  id: string
  nombre: string
  rol: string
  total: number
  completadas: number
  enPlazo: number
  conDemora: number
  vencidas: number
  tasaCumplimiento: number
  promedioDias: number
}

function TablaPersonas({ titulo, icono: Icon, iconColor, data }: {
  titulo: string; icono: any; iconColor: string; data: PersonaData[]
}) {
  if (data.length === 0) return null

  return (
    <div className="mb-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />{titulo}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resueltas</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-emerald-600 uppercase tracking-wider">En plazo</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wider">Con demora</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-red-600 uppercase tracking-wider">Vencidas</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasa cumpl.</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prom. días</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, idx) => (
              <tr key={p.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                <td className="px-4 py-3 font-semibold text-slate-800">{p.nombre}</td>
                <td className="px-3 py-3 text-center font-medium text-slate-700">{p.completadas}</td>
                <td className="px-3 py-3 text-center text-emerald-600 font-medium">{p.enPlazo}</td>
                <td className="px-3 py-3 text-center text-amber-600 font-medium">{p.conDemora}</td>
                <td className="px-3 py-3 text-center">
                  {p.vencidas > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{p.vencidas}</span>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-14 bg-slate-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${p.tasaCumplimiento >= 70 ? "bg-emerald-500" : p.tasaCumplimiento >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(p.tasaCumplimiento, 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{p.tasaCumplimiento}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-slate-600">{p.promedioDias > 0 ? `${p.promedioDias} días` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TablaCumplimientoPersona({ data }: { data: PersonaData[] }) {
  if (data.length === 0) return null

  const abogados = data.filter(p => p.rol === "ABOGADO")
  const asistentes = data.filter(p => p.rol === "ASISTENTE")

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Cumplimiento por persona
        </CardTitle>
        <p className="text-xs text-slate-500">Resultado histórico de tareas resueltas por cada miembro del equipo.</p>
      </CardHeader>
      <CardContent className="pt-2">
        <TablaPersonas titulo="Abogados / Socios" icono={Scale} iconColor="text-indigo-500" data={abogados} />
        <TablaPersonas titulo="Asistentes / Administrativos" icono={Users} iconColor="text-slate-500" data={asistentes} />
      </CardContent>
    </Card>
  )
}