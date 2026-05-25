// app/reportes/tiempo-por-etapa/components/DistribucionActual.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Layers, TrendingUp } from "lucide-react"

interface DistribucionEtapa {
  etapa: string
  cantidadCasos: number
  porcentaje: number
  promedioHistorico: number
}

export function DistribucionActual({
  distribucion,
  totalCasos
}: {
  distribucion: DistribucionEtapa[]
  totalCasos: number
}) {
  if (distribucion.length === 0) return null

  const etapaMayorConcentracion = distribucion[0]
  const alertaConcentracion = etapaMayorConcentracion && etapaMayorConcentracion.porcentaje > 40

  return (
    <Card className="mb-6 border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Layers className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                Distribución de Casos Activos por Etapa
              </CardTitle>
              <CardDescription>
                Panorama general: ¿en qué etapas están tus casos ahora mismo?
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {totalCasos} casos activos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {distribucion.map((etapa) => {
            const esAlta = etapa.porcentaje > 30

            return (
              <div key={etapa.etapa} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 min-w-[200px]">
                      {etapa.etapa}
                    </span>
                    {esAlta && (
                      <Badge className="bg-amber-100 text-amber-700 text-xs border-none">
                        Alta concentración
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">
                      {etapa.cantidadCasos} casos
                    </span>
                    <span className="text-lg font-bold text-slate-900 w-14 text-right">
                      {etapa.porcentaje}%
                    </span>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="relative">
                  <div className="w-full bg-slate-100 rounded-lg h-10 overflow-hidden">
                    <div
                      className={`h-10 rounded-lg transition-all duration-500 flex items-center justify-between px-3 ${
                        esAlta
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                          : 'bg-gradient-to-r from-indigo-400 to-indigo-600'
                      }`}
                      style={{ width: `${Math.max(etapa.porcentaje, 8)}%` }}
                    >
                      <span className="text-xs font-medium text-white">
                        {etapa.cantidadCasos} casos
                      </span>
                      {etapa.porcentaje > 15 && (
                        <span className="text-xs font-medium text-white">
                          {etapa.porcentaje}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info adicional */}
                <div className="mt-1 text-xs text-slate-500">
                  Tiempo promedio histórico en esta etapa: {etapa.promedioHistorico > 0 ? `${etapa.promedioHistorico} días` : 'Sin datos'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Alerta de concentración */}
        {alertaConcentracion && (
          <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Concentración Detectada
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  Tenés un {etapaMayorConcentracion.porcentaje}% de tus casos activos en <strong>{etapaMayorConcentracion.etapa}</strong>.
                  {etapaMayorConcentracion.porcentaje > 40 && ' Esto puede indicar un cuello de botella en esa fase del proceso.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}