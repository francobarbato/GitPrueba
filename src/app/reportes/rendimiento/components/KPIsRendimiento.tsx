'use client'

import { Card, CardContent } from "@/components/ui/card"
import { 
  CheckCircle2, 
  Clock, 
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react"

interface KPIsData {
  casosCerradosPeriodo: number
  tiempoPromedioResolucion: number
  mejorAbogado: string
  mejorTiempo: number
  comparativaAnterior: number
}

export function KPIsRendimiento({ data }: { data: KPIsData }) {
  // Determinar si la comparativa es positiva (mejoró = número negativo)
  const mejoro = data.comparativaAnterior < 0
  const empeoro = data.comparativaAnterior > 0
  const estable = data.comparativaAnterior === 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Casos Cerrados en el Período */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Casos Cerrados
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {data.casosCerradosPeriodo}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                en este período
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiempo Promedio de Resolución */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Tiempo Promedio
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {data.tiempoPromedioResolucion}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                días para cerrar
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparativa vs Período Anterior */}
      <Card className={`shadow-sm ${
        mejoro ? 'border-emerald-200 bg-emerald-50/30' :
        empeoro ? 'border-amber-200 bg-amber-50/30' :
        'border-slate-200'
      }`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                vs Período Anterior
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className={`text-3xl font-bold ${
                  mejoro ? 'text-emerald-600' :
                  empeoro ? 'text-amber-600' :
                  'text-slate-600'
                }`}>
                  {mejoro ? '' : empeoro ? '+' : ''}{data.comparativaAnterior}%
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {mejoro ? 'Más rápido' : empeoro ? 'Más lento' : 'Sin cambios'}
              </p>
            </div>
            <div className={`p-2.5 rounded-lg ${
              mejoro ? 'bg-emerald-100' :
              empeoro ? 'bg-amber-100' :
              'bg-slate-100'
            }`}>
              {mejoro ? (
                <TrendingDown className="h-5 w-5 text-emerald-600" />
              ) : empeoro ? (
                <TrendingUp className="h-5 w-5 text-amber-600" />
              ) : (
                <Minus className="h-5 w-5 text-slate-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abogado Más Rápido */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-amber-50/50 to-white">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Más Eficiente
              </p>
              <p className="text-lg font-bold text-slate-900 mt-1 truncate max-w-[150px]" title={data.mejorAbogado}>
                {data.mejorAbogado}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {data.mejorTiempo > 0 ? `${data.mejorTiempo} días promedio` : 'Sin datos'}
              </p>
            </div>
            <div className="p-2.5 bg-amber-100 rounded-lg">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
