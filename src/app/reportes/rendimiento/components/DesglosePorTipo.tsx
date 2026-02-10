'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Scale, Trophy, Clock } from "lucide-react"

interface DesgloseTipo {
  tipo: string
  casosCerrados: number
  tiempoPromedio: number
  abogadoMasRapido: string
  abogadoMasRapidoTiempo: number
}

// Colores por tipo de caso
const tipoColors: Record<string, string> = {
  'LABORAL': 'bg-blue-50 border-blue-200 text-blue-700',
  'CIVIL': 'bg-emerald-50 border-emerald-200 text-emerald-700',
  'COMERCIAL': 'bg-purple-50 border-purple-200 text-purple-700',
  'FAMILIA': 'bg-pink-50 border-pink-200 text-pink-700',
  'PENAL': 'bg-rose-50 border-rose-200 text-rose-700',
  'SUCESIONES': 'bg-amber-50 border-amber-200 text-amber-700',
}

const getTipoColor = (tipo: string) => {
  return tipoColors[tipo.toUpperCase()] || 'bg-slate-50 border-slate-200 text-slate-700'
}

export function DesglosePorTipo({ data }: { data: DesgloseTipo[] }) {
  if (data.length === 0) return null

  // Encontrar el tipo más rápido y el más lento
  const tipoMasRapido = [...data].sort((a, b) => a.tiempoPromedio - b.tiempoPromedio)[0]
  const tipoMasLento = [...data].sort((a, b) => b.tiempoPromedio - a.tiempoPromedio)[0]

  return (
    <Card className="mb-6 border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Scale className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                Rendimiento por Tipo de Caso
              </CardTitle>
              <CardDescription>
                Comparativa de tiempos de resolución según la materia
              </CardDescription>
            </div>
          </div>

          {/* Indicadores rápidos */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            {tipoMasRapido && (
              <div className="flex items-center gap-1 text-emerald-600">
                <Trophy className="h-3 w-3" />
                <span>Más rápido: <strong>{tipoMasRapido.tipo}</strong> ({tipoMasRapido.tiempoPromedio}d)</span>
              </div>
            )}
            {tipoMasLento && tipoMasLento.tipo !== tipoMasRapido?.tipo && (
              <div className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3 w-3" />
                <span>Más lento: <strong>{tipoMasLento.tipo}</strong> ({tipoMasLento.tiempoPromedio}d)</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, index) => {
            const colorClass = getTipoColor(item.tipo)
            const esMasRapido = item.tipo === tipoMasRapido?.tipo
            const esMasLento = item.tipo === tipoMasLento?.tipo && data.length > 1

            return (
              <div 
                key={item.tipo}
                className={`p-4 rounded-lg border-2 ${colorClass} relative overflow-hidden`}
              >
                {/* Badge de posición */}
                {esMasRapido && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-emerald-500 text-white text-xs">
                      <Trophy className="h-3 w-3 mr-1" />
                      Más rápido
                    </Badge>
                  </div>
                )}

                {/* Tipo de caso */}
                <h3 className="font-bold text-lg mb-3">{item.tipo}</h3>

                {/* Métricas */}
                <div className="space-y-3">
                  {/* Casos cerrados */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-70">Casos cerrados:</span>
                    <span className="font-bold">{item.casosCerrados}</span>
                  </div>

                  {/* Tiempo promedio */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-70">Tiempo promedio:</span>
                    <span className="font-bold text-lg">{item.tiempoPromedio} días</span>
                  </div>

                  {/* Barra visual */}
                  <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${
                        esMasRapido ? 'bg-emerald-500' :
                        esMasLento ? 'bg-amber-500' :
                        'bg-current opacity-50'
                      }`}
                      style={{ 
                        width: `${Math.min((item.tiempoPromedio / (tipoMasLento?.tiempoPromedio || 100)) * 100, 100)}%` 
                      }}
                    />
                  </div>

                  {/* Abogado más rápido en este tipo */}
                  {item.abogadoMasRapido !== 'N/A' && (
                    <div className="pt-2 border-t border-current/20">
                      <p className="text-xs opacity-70">Más eficiente en {item.tipo}:</p>
                      <p className="text-sm font-medium">
                        {item.abogadoMasRapido}
                        <span className="opacity-70"> ({item.abogadoMasRapidoTiempo}d)</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Insight */}
        {data.length > 1 && tipoMasRapido && tipoMasLento && tipoMasRapido.tipo !== tipoMasLento.tipo && (
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <p className="text-sm text-indigo-800">
              <strong>Insight:</strong>{' '}
              Los casos de <strong>{tipoMasRapido.tipo}</strong> se resuelven en promedio{' '}
              <strong>{tipoMasLento.tiempoPromedio - tipoMasRapido.tiempoPromedio} días más rápido</strong>{' '}
              que los de {tipoMasLento.tipo}.
              {tipoMasRapido.abogadoMasRapido !== 'N/A' && (
                <> El más eficiente en {tipoMasRapido.tipo} es <strong>{tipoMasRapido.abogadoMasRapido}</strong>.</>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
