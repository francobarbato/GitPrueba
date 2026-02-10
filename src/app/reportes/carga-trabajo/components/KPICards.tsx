'use client'

import { Card, CardContent } from "@/components/ui/card"
import { 
  Activity, 
  Clock, 
  BarChart3, 
  AlertCircle 
} from "lucide-react"

// Definimos el tipo de datos
export interface KPIData {
  cargaTotal: number
  enDemora: number
  eficiencia: number
  altaPrioridad: number
}

// CORRECCIÓN AQUÍ: Definimos que el componente acepta 'data' Y 'esAdmin'
interface KPICardsProps {
  data: KPIData
  esAdmin: boolean
}

export function KPICards({ data, esAdmin }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* KPI 1: Carga Total */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {esAdmin ? "Carga Total" : "Tu Carga"}
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {data.cargaTotal}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                casos activos
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {esAdmin ? "Volumen de trabajo global" : "Tus expedientes en curso"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* KPI 2: En Demora */}
      <Card className={`shadow-sm ${
        data.enDemora > 0 
          ? 'border-amber-200 bg-amber-50/30' 
          : 'border-slate-200'
      }`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                En Demora
              </p>
              <p className={`text-3xl font-bold mt-1 ${
                data.enDemora > 0 ? 'text-amber-600' : 'text-slate-900'
              }`}>
                {data.enDemora}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                sin movimiento 45+ días
              </p>
            </div>
            <div className={`p-2.5 rounded-lg ${
              data.enDemora > 0 ? 'bg-amber-100' : 'bg-slate-100'
            }`}>
              <Clock className={`h-5 w-5 ${
                data.enDemora > 0 ? 'text-amber-600' : 'text-slate-500'
              }`} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className={`text-xs ${
              data.enDemora > 0 ? 'text-amber-700 font-medium' : 'text-slate-500'
            }`}>
              {data.enDemora > 0 
                ? 'Requiere atención inmediata' 
                : 'Sin casos demorados'
              }
            </span>
          </div>
        </CardContent>
      </Card>

      {/* KPI 3: Eficiencia */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Eficiencia
              </p>
              <p className={`text-3xl font-bold mt-1 ${
                data.eficiencia >= 10 ? 'text-emerald-600' :
                data.eficiencia >= 5 ? 'text-slate-900' :
                'text-slate-500'
              }`}>
                {data.eficiencia}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                tasa de resolución mensual
              </p>
            </div>
            <div className={`p-2.5 rounded-lg ${
              data.eficiencia >= 10 ? 'bg-emerald-50' : 'bg-slate-100'
            }`}>
              <BarChart3 className={`h-5 w-5 ${
                data.eficiencia >= 10 ? 'text-emerald-600' : 'text-slate-500'
              }`} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              % de rotación de cartera
            </span>
          </div>
        </CardContent>
      </Card>

      {/* KPI 4: Alta Prioridad */}
      <Card className={`shadow-sm ${
        data.altaPrioridad > 5 
          ? 'border-rose-200 bg-rose-50/30' 
          : 'border-slate-200'
      }`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Alta Prioridad
              </p>
              <p className={`text-3xl font-bold mt-1 ${
                data.altaPrioridad > 5 ? 'text-rose-600' : 'text-slate-900'
              }`}>
                {data.altaPrioridad}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                casos urgentes
              </p>
            </div>
            <div className={`p-2.5 rounded-lg ${
              data.altaPrioridad > 5 ? 'bg-rose-100' : 'bg-slate-100'
            }`}>
              <AlertCircle className={`h-5 w-5 ${
                data.altaPrioridad > 5 ? 'text-rose-600' : 'text-slate-500'
              }`} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className={`text-xs ${
              data.altaPrioridad > 5 ? 'text-rose-700 font-medium' : 'text-slate-500'
            }`}>
              {data.altaPrioridad > 5 
                ? 'Concentración alta de urgentes' 
                : 'Carga de urgentes controlada'
              }
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}