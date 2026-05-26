'use client'

// app/reportes/actividad-documental/components/RankingExpedientes.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

export type ExpedienteActividad = {
  id: string
  numero: string
  titulo: string
  cantidadDocumentos: number
  totalMB: number
}

function formatMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb.toFixed(1)} MB`
}

export function RankingExpedientes({ expedientes }: { expedientes: ExpedienteActividad[] }) {
  const top = expedientes
    .sort((a, b) => b.cantidadDocumentos - a.cantidadDocumentos)
    .slice(0, 5)

  if (top.length === 0) return null

  const maxDocs = top[0].cantidadDocumentos

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Expedientes con más movimiento
        </CardTitle>
        <p className="text-xs text-slate-500">
          Los expedientes que más documentación recibieron en el período — dónde se concentró la actividad del estudio.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.map((e, idx) => {
          const pct = maxDocs > 0 ? Math.round((e.cantidadDocumentos / maxDocs) * 100) : 0
          return (
            <div key={e.id} className="flex items-center gap-3">
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                idx === 0 ? 'bg-amber-100 text-amber-700'
                : idx === 1 ? 'bg-slate-200 text-slate-600'
                : idx === 2 ? 'bg-orange-100 text-orange-600'
                : 'bg-slate-100 text-slate-500'
              }`}>
                {idx + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono font-semibold text-indigo-600 shrink-0">{e.numero}</span>
                    <span className="font-medium text-slate-800 text-sm truncate">{e.titulo}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-slate-400">{formatMB(e.totalMB)}</span>
                    <span className="text-sm font-bold text-slate-800">
                      {e.cantidadDocumentos} doc{e.cantidadDocumentos !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}