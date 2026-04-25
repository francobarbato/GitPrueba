'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Building2, Globe } from "lucide-react"

// ============================================================================
// CONFIG DE ÁMBITO — alineado con el enum real de Prisma (AmbitoTarea)
//
// El enum en BD es { INTERNO, EXTERNO }. Antes este componente tenía keys
// inventadas (ESTUDIO, VIRTUAL, TRIBUNAL, EXTERIOR) que nunca matcheaban,
// y todas las tareas caían al fallback "Otro" — provocando el bug de
// "Otro 30 / Otro 10" duplicado en pantalla.
// ============================================================================

const AMBITO_CONFIG: Record<string, { label: string; icono: any; color: string; descripcion: string }> = {
  INTERNO: {
    label: "Interno",
    icono: Building2,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    descripcion: "Trabajo en las oficinas del estudio o vía plataformas internas",
  },
  EXTERNO: {
    label: "Externo",
    icono: Globe,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    descripcion: "Trabajo fuera del estudio — tribunales, reuniones externas, etc.",
  },
  // Fallback para valores inesperados (tareas antiguas sin ámbito definido, datos corruptos, etc.)
  OTRO: {
    label: "Sin clasificar",
    icono: MapPin,
    color: "bg-slate-50 text-slate-700 border-slate-200",
    descripcion: "Eventos sin ámbito registrado",
  },
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
        <p className="text-xs text-slate-500">Dónde se desarrolla el trabajo del estudio según el ámbito de cada evento.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <p className="text-[10px] opacity-60 mt-1">{cfg.descripcion}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}