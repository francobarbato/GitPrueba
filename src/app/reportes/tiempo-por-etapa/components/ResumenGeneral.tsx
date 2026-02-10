'use client'

import { Card, CardContent } from "@/components/ui/card"
import { 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Gauge
} from "lucide-react"

interface ResumenReporte {
  tiempoPromedioTotal: number
  etapaMasLenta: string
  etapaMasRapida: string
  casosAnalizados: number
  casosConCuelloBotella: number
  porcentajeCuellos: number
}

export function ResumenGeneral({ resumen }: { resumen: ResumenReporte }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      
      {/* Casos Analizados */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-50 rounded">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-xs text-slate-500">Casos Analizados</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{resumen.casosAnalizados}</p>
        </CardContent>
      </Card>

      {/* Tiempo Total Promedio */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-indigo-50 rounded">
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="text-xs text-slate-500">Tiempo Total Prom.</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{resumen.tiempoPromedioTotal}</p>
          <p className="text-xs text-slate-500">días promedio</p>
        </CardContent>
      </Card>

      {/* Etapa Más Lenta */}
      <Card className="border-slate-200 bg-red-50/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-100 rounded">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-xs text-slate-500">Etapa Más Lenta</span>
          </div>
          <p className="text-sm font-bold text-slate-900 truncate" title={resumen.etapaMasLenta}>
            {resumen.etapaMasLenta}
          </p>
        </CardContent>
      </Card>

      {/* Etapa Más Rápida */}
      <Card className="border-slate-200 bg-green-50/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-100 rounded">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-xs text-slate-500">Etapa Más Rápida</span>
          </div>
          <p className="text-sm font-bold text-slate-900 truncate" title={resumen.etapaMasRapida}>
            {resumen.etapaMasRapida}
          </p>
        </CardContent>
      </Card>

      {/* Cuellos de Botella */}
      <Card className={`border-slate-200 ${resumen.casosConCuelloBotella > 0 ? 'bg-amber-50/30' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded ${resumen.casosConCuelloBotella > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
              <AlertTriangle className={`h-4 w-4 ${resumen.casosConCuelloBotella > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            </div>
            <span className="text-xs text-slate-500">Cuellos de Botella</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{resumen.casosConCuelloBotella}</p>
          <p className="text-xs text-slate-500">etapas detectadas</p>
        </CardContent>
      </Card>

      {/* Porcentaje de Cuellos */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-slate-100 rounded">
              <Gauge className="h-4 w-4 text-slate-600" />
            </div>
            <span className="text-xs text-slate-500">% Cuellos</span>
          </div>
          <p className={`text-2xl font-bold ${
            resumen.porcentajeCuellos > 30 ? 'text-red-600' :
            resumen.porcentajeCuellos > 15 ? 'text-amber-600' :
            'text-green-600'
          }`}>
            {resumen.porcentajeCuellos}%
          </p>
          <p className="text-xs text-slate-500">del proceso</p>
        </CardContent>
      </Card>
    </div>
  )
}
