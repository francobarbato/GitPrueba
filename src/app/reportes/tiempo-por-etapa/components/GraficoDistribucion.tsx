'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

interface TiempoPorEtapa {
  etapa: string
  diasPromedio: number
  diasMinimo: number
  diasMaximo: number
  cantidadCasos: number
  porcentajeDelTotal: number
  esCuelloBotella: boolean
}

export function GraficoDistribucion({ tiempos }: { tiempos: TiempoPorEtapa[] }) {
  if (tiempos.length === 0) {
    return null
  }

  // Encontrar el máximo para escalar las barras
  const maxDias = Math.max(...tiempos.map(t => t.diasPromedio))

  // Colores para las barras
  const getBarColor = (etapa: TiempoPorEtapa, index: number) => {
    if (etapa.esCuelloBotella) return 'bg-amber-500'
    
    // Gradiente de colores según posición
    const colores = [
      'bg-red-500',
      'bg-orange-500', 
      'bg-amber-400',
      'bg-yellow-400',
      'bg-lime-400',
      'bg-green-400',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-blue-500'
    ]
    
    // Mapear índice al array de colores (de rojo a azul)
    const colorIndex = Math.floor((index / tiempos.length) * colores.length)
    return colores[Math.min(colorIndex, colores.length - 1)]
  }

  return (
    <Card className="mb-6 border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">
              Distribución Visual de Tiempos
            </CardTitle>
            <CardDescription>
              Comparación gráfica del tiempo promedio por etapa
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {tiempos.map((etapa, index) => {
            const porcentajeAncho = (etapa.diasPromedio / maxDias) * 100
            
            return (
              <div key={etapa.etapa} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                      {etapa.etapa}
                    </span>
                    {etapa.esCuelloBotella && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                        Cuello
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {etapa.diasPromedio} días
                  </span>
                </div>
                
                <div className="relative">
                  {/* Barra de fondo */}
                  <div className="w-full bg-slate-100 rounded-lg h-8 overflow-hidden">
                    {/* Barra de progreso */}
                    <div 
                      className={`h-8 rounded-lg transition-all duration-500 flex items-center justify-end pr-2 ${
                        etapa.esCuelloBotella 
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                          : `bg-gradient-to-r from-indigo-400 to-indigo-600`
                      }`}
                      style={{ width: `${Math.max(porcentajeAncho, 5)}%` }}
                    >
                      {porcentajeAncho > 20 && (
                        <span className="text-xs font-medium text-white">
                          {etapa.porcentajeDelTotal}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Info adicional al hover */}
                  <div className="absolute -bottom-5 left-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-500">
                    Rango: {etapa.diasMinimo} - {etapa.diasMaximo} días | {etapa.cantidadCasos} casos
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Leyenda */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-indigo-400 to-indigo-600" />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-amber-400 to-amber-500" />
            <span>Cuello de Botella (+1.5x promedio)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
