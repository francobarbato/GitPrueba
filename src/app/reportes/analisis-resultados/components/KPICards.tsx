'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Percent, DollarSign, Clock } from "lucide-react"

type KPIData = {
  totalCerrados: number
  tasaExito: number
  tasaRecupero: number
  promedioDiasCierre: number
}

export function KPICards({ data }: { data: KPIData }) {
  const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Trophy className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Casos Cerrados</p>
              <p className="text-2xl font-bold text-slate-900">{data.totalCerrados}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${data.tasaExito >= 70 ? 'bg-emerald-100' : data.tasaExito >= 50 ? 'bg-amber-100' : 'bg-red-100'}`}>
              <Percent className={`w-5 h-5 ${data.tasaExito >= 70 ? 'text-emerald-600' : data.tasaExito >= 50 ? 'text-amber-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-slate-900">{data.tasaExito}%</p>
              <p className="text-[10px] text-slate-400">(Favorables + Acuerdos) / Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${data.tasaRecupero >= 70 ? 'bg-emerald-100' : data.tasaRecupero >= 50 ? 'bg-amber-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-5 h-5 ${data.tasaRecupero >= 70 ? 'text-emerald-600' : data.tasaRecupero >= 50 ? 'text-amber-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tasa de Recupero</p>
              <p className="text-2xl font-bold text-slate-900">{data.tasaRecupero}%</p>
              <p className="text-[10px] text-slate-400">Monto obtenido / Monto reclamado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Duración Promedio</p>
              <p className="text-2xl font-bold text-slate-900">{data.promedioDiasCierre}</p>
              <p className="text-[10px] text-slate-400">días hasta el cierre</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}