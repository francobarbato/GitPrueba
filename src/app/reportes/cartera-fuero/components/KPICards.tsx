'use client'

// app/reportes/cartera-fuero/components/KPICards.tsx

import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, DollarSign, TrendingUp, Scale } from "lucide-react"

type KPIData = {
  totalCasosActivos: number
  capitalTotalEnLitigio: number
  ticketPromedioGlobal: number
  fueroConMasVolumen: string
  fueroConMasValor: string
}

type Props = {
  data: KPIData
  vista?: string
  colegaNombre?: string
}

export function KPICards({ data, vista = "personal", colegaNombre }: Props) {
  const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

  const labelCasos = vista === "general"
    ? colegaNombre ? `Expedientes activos de ${colegaNombre}` : "Expedientes activos en el estudio"
    : "Expedientes Activos"

  const labelCapital = vista === "general"
    ? colegaNombre ? "Capital en litigio" : "Capital total del estudio"
    : "Capital en Litigio"

  const labelTicket = "Ticket Promedio"

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{labelCasos}</p>
              <p className="text-2xl font-bold text-slate-900">{data.totalCasosActivos}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{labelCapital}</p>
              <p className="text-xl font-bold text-slate-900">{formatMoney(data.capitalTotalEnLitigio)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{labelTicket}</p>
              <p className="text-xl font-bold text-slate-900">{formatMoney(data.ticketPromedioGlobal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Scale className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Fuero Dominante</p>
              <p className="text-sm font-bold text-slate-900">
                Vol: <span className="text-blue-600">{data.fueroConMasVolumen}</span>
              </p>
              <p className="text-sm font-bold text-slate-900">
                $: <span className="text-emerald-600">{data.fueroConMasValor}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}