'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Building2, Video, Scale, Globe } from "lucide-react"

const AMBITO_CONFIG: Record<string, { label: string; icono: any; color: string; descripcion: string }> = {
  ESTUDIO:   { label: "Estudio",   icono: Building2, color: "bg-indigo-50 text-indigo-700 border-indigo-200", descripcion: "Trabajo en las oficinas del estudio" },
  VIRTUAL:   { label: "Virtual",   icono: Video,     color: "bg-purple-50 text-purple-700 border-purple-200", descripcion: "Reuniones o tareas por videollamada" },
  TRIBUNAL:  { label: "Tribunal",  icono: Scale,     color: "bg-amber-50 text-amber-700 border-amber-200",    descripcion: "Presencia física en juzgados o tribunales" },
  EXTERIOR:  { label: "Exterior",  icono: Globe,     color: "bg-emerald-50 text-emerald-700 border-emerald-200", descripcion: "Otras ubicaciones externas" },
  OTRO:      { label: "Otro",      icono: MapPin,    color: "bg-slate-50 text-slate-700 border-slate-200",    descripcion: "Otro contexto no clasificado" },
}

export function DistribucionContexto({ data, total }: {
  data: { ambito: string; cantidad: number; porcentaje: number }[]
  total: number
}) {
  if (data.length === 0) return null

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-600" />
          Contexto físico del trabajo
        </CardTitle>
        <p className="text-xs text-slate-500">Dónde se desarrolla el trabajo del estudio según el ámbito de cada tarea.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.map(item => {
            const cfg = AMBITO_CONFIG[item.ambito] ?? AMBITO_CONFIG.OTRO
            const Icon = cfg.icono
            return (
              <div key={item.ambito} className={`p-3 rounded-lg border ${cfg.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{cfg.label}</span>
                </div>
                <p className="text-2xl font-bold">{item.cantidad}</p>
                <p className="text-xs opacity-70">{item.porcentaje}% del total</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}