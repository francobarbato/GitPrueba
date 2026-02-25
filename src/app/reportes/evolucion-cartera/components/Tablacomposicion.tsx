// app/reportes/evolucion-cartera/components/TablaComposicion.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Minus, Layers } from "lucide-react"

interface ComposicionTipo {
  tipo: string
  tipoLabel: string
  cantidadAnterior: number
  cantidadActual: number
  porcentajeAnterior: number
  porcentajeActual: number
  variacionPuntos: number
  tendencia: 'sube' | 'baja' | 'estable'
}

const tipoColors: Record<string, string> = {
  'LABORAL': 'bg-blue-100 text-blue-700 border-blue-200',
  'CIVIL_COMERCIAL': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'FAMILIA': 'bg-pink-100 text-pink-700 border-pink-200',
  'SUCESIONES': 'bg-amber-100 text-amber-700 border-amber-200',
  'CONTENCIOSO_ADMINISTRATIVO': 'bg-purple-100 text-purple-700 border-purple-200',
  'PENAL': 'bg-red-100 text-red-700 border-red-200',
}

function TendenciaIndicator({ tendencia, puntos }: { tendencia: string; puntos: number }) {
  if (tendencia === 'sube') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
        <ArrowUpRight className="h-3.5 w-3.5" />
        +{puntos}pp
      </span>
    )
  }
  if (tendencia === 'baja') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
        <ArrowDownRight className="h-3.5 w-3.5" />
        {puntos}pp
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
      <Minus className="h-3.5 w-3.5" />
      Estable
    </span>
  )
}

export function TablaComposicion({
  datos,
  periodoLabel
}: {
  datos: ComposicionTipo[]
  periodoLabel: string
}) {
  if (datos.length === 0) {
    return (
      <Card className="mb-6 border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center text-slate-400">
          No hay datos de composición para el período seleccionado.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Layers className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">
              Composición por Tipo de Caso
            </CardTitle>
            <CardDescription>
              ¿Qué tipo de casos están entrando? ¿Está cambiando el perfil del estudio?
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="text-left p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Tipo de Caso
                </th>
                <th className="text-center p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Período Anterior
                </th>
                <th className="text-center p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Período Actual
                </th>
                <th className="text-center p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  % Anterior
                </th>
                <th className="text-center p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  % Actual
                </th>
                <th className="text-center p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Tendencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {datos.map((fila) => {
                const colorClass = tipoColors[fila.tipo] || 'bg-slate-100 text-slate-700 border-slate-200'

                return (
                  <tr key={fila.tipo} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
                        {fila.tipoLabel}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-slate-500 font-medium">{fila.cantidadAnterior}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-slate-800 font-bold">{fila.cantidadActual}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-slate-400">{fila.porcentajeAnterior}%</span>
                    </td>
                    <td className="p-4 text-center">
                      {/* Barra visual + porcentaje */}
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${fila.porcentajeActual}%` }}
                          />
                        </div>
                        <span className="text-slate-800 font-bold w-10 text-right">{fila.porcentajeActual}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <TendenciaIndicator tendencia={fila.tendencia} puntos={fila.variacionPuntos} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}