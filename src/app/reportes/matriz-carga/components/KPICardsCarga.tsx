'use client'

import { Card } from "@/components/ui/card"
import { Briefcase, ListChecks, DollarSign } from "lucide-react"

const formatMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

type Props = {
  data: {
    totalCasosActivos: number
    totalTareasActivas: number
    totalCapital: number
  }
}

export function KPICardsCarga({ data }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-4 border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="w-4 h-4 text-indigo-500" />
          <p className="text-xs text-slate-500 font-medium">Expedientes activos</p>
        </div>
        <p className="text-3xl font-bold text-slate-800">{data.totalCasosActivos}</p>
        <p className="text-[10px] text-slate-400">expedientes en curso</p>
      </Card>

      <Card className="p-4 border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <ListChecks className="w-4 h-4 text-blue-500" />
          <p className="text-xs text-slate-500 font-medium">Tareas activas</p>
        </div>
        <p className="text-3xl font-bold text-slate-800">{data.totalTareasActivas}</p>
        <p className="text-[10px] text-slate-400">pendientes + en proceso + bloqueadas</p>
      </Card>

      <Card className="p-4 border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <p className="text-xs text-slate-500 font-medium">Capital en litigio</p>
        </div>
        <p className="text-3xl font-bold text-slate-800">{formatMoney(data.totalCapital)}</p>
        <p className="text-[10px] text-slate-400">monto total en disputa</p>
      </Card>
    </div>
  )
}