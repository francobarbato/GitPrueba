// app/reportes/rendimiento/components/KPIsRendimiento.tsx
'use client'

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Target, DollarSign } from "lucide-react"

interface KPIsData {
  casosCerrados: number
  tasaExitoGlobal: number
  valorRecuperadoTotal: number
}

export function KPIsRendimiento({ data }: { data: KPIsData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Casos Cerrados</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{data.casosCerrados}</p>
              <p className="text-xs text-slate-500 mt-1">en el período</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tasa de Éxito</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{data.tasaExitoGlobal}%</p>
              <p className="text-xs text-slate-500 mt-1">favorables + acuerdos</p>
            </div>
            <div className="p-2.5 bg-emerald-100 rounded-lg">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-indigo-200 bg-indigo-50/30 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Valor Recuperado</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                ${(data.valorRecuperadoTotal / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-slate-500 mt-1">total período</p>
            </div>
            <div className="p-2.5 bg-indigo-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}