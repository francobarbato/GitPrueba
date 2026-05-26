'use client'

// app/reportes/actividad-documental/components/ActividadTemporal.tsx
// Gráfico de barras que se adapta a la granularidad: por día (mes actual) o por mes (períodos largos).

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarRange } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts"

export type PuntoTemporal = {
  clave: string       // "2026-05-23" o "2026-05"
  label: string       // etiqueta corta para el eje X ("23" o "May 26")
  tooltipLabel: string // etiqueta completa para el tooltip ("Vie 23 May" o "Mayo 2026")
  cantidad: number
  totalMB: number
}

function formatMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb.toFixed(1)} MB`
}

function TooltipPersonalizado({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as PuntoTemporal
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-slate-800 mb-1">{d.tooltipLabel}</p>
      <p className="text-slate-600">{d.cantidad} documento{d.cantidad !== 1 ? 's' : ''}</p>
      <p className="text-slate-400">{formatMB(d.totalMB)}</p>
    </div>
  )
}

export function ActividadTemporal({
  puntos,
  granularidad
}: {
  puntos: PuntoTemporal[]
  granularidad: 'dia' | 'mes'
}) {
  if (puntos.length === 0) return null

  const subtitulo = granularidad === 'dia'
    ? "Documentos subidos por día — muestra los picos de trabajo del mes."
    : "Documentos subidos por mes — muestra el ritmo de trabajo del estudio."

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-blue-600" />
          Ritmo de actividad documental
        </CardTitle>
        <p className="text-xs text-slate-500">{subtitulo}</p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={puntos} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                interval={granularidad === 'dia' ? 2 : 0}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} maxBarSize={64}>
                {puntos.map((_, i) => (
                  <Cell key={i} fill="#4f46e5" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}