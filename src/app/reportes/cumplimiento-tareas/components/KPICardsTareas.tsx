'use client'

import { Card } from "@/components/ui/card"
import { CheckCircle2, Clock, XCircle } from "lucide-react"

type Props = {
  data: {
    enPlazo: number
    conDemora: number
    vencidas: number
  }
}

export function KPICardsTareas({ data }: Props) {
  const total = data.enPlazo + data.conDemora + data.vencidas
  const tasaEnPlazo = total > 0 ? Math.round((data.enPlazo / total) * 100) : 0
  const tasaConDemora = total > 0 ? Math.round((data.conDemora / total) * 100) : 0
  const tasaVencidas = total > 0 ? Math.round((data.vencidas / total) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-4 border-emerald-200 bg-emerald-50/30">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <p className="text-xs text-slate-500 font-medium">Cumplidas en plazo</p>
        </div>
        <p className="text-3xl font-bold text-emerald-700">{data.enPlazo}</p>
        {total > 0 && <p className="text-[10px] text-emerald-600">{tasaEnPlazo}% del total resuelto</p>}
      </Card>

      <Card className="p-4 border-amber-200 bg-amber-50/30">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-amber-500" />
          <p className="text-xs text-slate-500 font-medium">Cumplidas con demora</p>
        </div>
        <p className="text-3xl font-bold text-amber-700">{data.conDemora}</p>
        {total > 0 && <p className="text-[10px] text-amber-600">{tasaConDemora}% completadas fuera de plazo</p>}
      </Card>

      <Card className={`p-4 ${data.vencidas > 0 ? "border-red-200 bg-red-50/30" : "border-slate-200"}`}>
        <div className="flex items-center gap-2 mb-1">
          <XCircle className={`w-4 h-4 ${data.vencidas > 0 ? "text-red-500" : "text-slate-400"}`} />
          <p className={`text-xs font-medium ${data.vencidas > 0 ? "text-red-600" : "text-slate-500"}`}>Incumplidas</p>
        </div>
        <p className={`text-3xl font-bold ${data.vencidas > 0 ? "text-red-700" : "text-slate-800"}`}>{data.vencidas}</p>
        {total > 0 && <p className={`text-[10px] ${data.vencidas > 0 ? "text-red-500" : "text-slate-400"}`}>{tasaVencidas}% vencidas sin completar</p>}
      </Card>
    </div>
  )
}