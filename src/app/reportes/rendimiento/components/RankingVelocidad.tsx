'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface RendimientoAbogado {
  id: string
  nombre: string
  email: string
  casosCerrados: number
  tiempoPromedio: number
  tiempoMinimo: number
  tiempoMaximo: number
  posicionRanking: number
  tendencia: 'mejora' | 'estable' | 'empeora'
}

const getMedalColor = (posicion: number) => {
  switch (posicion) {
    case 1: return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' }
    case 2: return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' }
    case 3: return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' }
    default: return { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' }
  }
}

const getTendenciaIcon = (tendencia: string) => {
  switch (tendencia) {
    case 'mejora':
      return <TrendingDown className="h-4 w-4 text-emerald-500" />
    case 'empeora':
      return <TrendingUp className="h-4 w-4 text-rose-500" />
    default:
      return <Minus className="h-4 w-4 text-slate-400" />
  }
}

export function RankingVelocidad({ abogados }: { abogados: RendimientoAbogado[] }) {
  if (abogados.length === 0) return null

  return (
    <Card className="mb-6 border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-white pb-4">
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Ranking de Velocidad
          <Badge variant="outline" className="ml-2 text-xs font-normal">
            Top {abogados.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {abogados.map((abogado, index) => {
            const medalColor = getMedalColor(abogado.posicionRanking)
            
            return (
              <div 
                key={abogado.id}
                className={`relative p-4 rounded-lg border-2 ${medalColor.border} ${medalColor.bg} transition-all hover:shadow-md`}
              >
                {/* Posición */}
                <div className={`absolute -top-3 -left-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${medalColor.bg} ${medalColor.text} border-2 ${medalColor.border}`}>
                  {abogado.posicionRanking <= 3 ? (
                    <Medal className="h-4 w-4" />
                  ) : (
                    abogado.posicionRanking
                  )}
                </div>

                {/* Contenido */}
                <div className="pt-2">
                  <p className="font-bold text-slate-800 truncate" title={abogado.nombre}>
                    {abogado.nombre}
                  </p>
                  
                  <div className="mt-3 space-y-2">
                    {/* Tiempo Promedio */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Promedio:</span>
                      <span className="font-bold text-slate-800">
                        {abogado.tiempoPromedio} días
                      </span>
                    </div>

                    {/* Casos Cerrados */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Cerrados:</span>
                      <Badge variant="outline" className="text-xs">
                        {abogado.casosCerrados}
                      </Badge>
                    </div>

                    {/* Tendencia */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Tendencia:</span>
                      <div className="flex items-center gap-1">
                        {getTendenciaIcon(abogado.tendencia)}
                        <span className={`text-xs font-medium ${
                          abogado.tendencia === 'mejora' ? 'text-emerald-600' :
                          abogado.tendencia === 'empeora' ? 'text-rose-600' :
                          'text-slate-500'
                        }`}>
                          {abogado.tendencia === 'mejora' ? 'Mejora' :
                           abogado.tendencia === 'empeora' ? 'Empeora' : 'Estable'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Leyenda */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-emerald-500" />
            <span>Mejora = Más rápido que antes</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-rose-500" />
            <span>Empeora = Más lento que antes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
