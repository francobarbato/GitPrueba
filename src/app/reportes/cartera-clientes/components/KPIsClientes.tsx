'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Users, RefreshCw, DollarSign, UserX } from "lucide-react"

type KPIsData = {
  totalClientes: number
  porcentajePersonas: number
  porcentajeEmpresas: number
  tasaRecurrencia: number
  capitalEnCartera: number
  clientesInactivos: number
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

export function KPIsClientes({ data, esGerencial }: { data: KPIsData; esGerencial: boolean }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${esGerencial ? "xl:grid-cols-4" : "xl:grid-cols-3"} gap-4 mb-6`}>

      {/* Total Clientes */}
      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Clientes</p>
              <p className="text-2xl font-bold text-slate-900">{data.totalClientes}</p>
              <p className="text-[10px] text-slate-400">
                {data.porcentajePersonas}% Personas · {data.porcentajeEmpresas}% Empresas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasa de Recurrencia */}
      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${data.tasaRecurrencia >= 30 ? "bg-emerald-100" : "bg-amber-100"}`}>
              <RefreshCw className={`w-5 h-5 ${data.tasaRecurrencia >= 30 ? "text-emerald-600" : "text-amber-600"}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tasa de Recurrencia</p>
              <p className="text-2xl font-bold text-slate-900">{data.tasaRecurrencia}%</p>
              <p className="text-[10px] text-slate-400">Clientes con más de 1 caso</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capital en Cartera — solo gerencial */}
      {esGerencial && (
        <Card className="bg-white border border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Capital en Cartera</p>
                <p className="text-2xl font-bold text-slate-900">{formatMoney(data.capitalEnCartera)}</p>
                <p className="text-[10px] text-slate-400">Montos en disputa de casos activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clientes Inactivos */}
      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${data.clientesInactivos > 0 ? "bg-amber-100" : "bg-slate-100"}`}>
              <UserX className={`w-5 h-5 ${data.clientesInactivos > 0 ? "text-amber-600" : "text-slate-400"}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Clientes Inactivos</p>
              <p className="text-2xl font-bold text-slate-900">{data.clientesInactivos}</p>
              <p className="text-[10px] text-slate-400">Sin casos activos actualmente</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}