// app/reportes/evolucion-cartera/components/TablaFlujo.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Minus, BarChart3 } from "lucide-react"

interface PeriodoFlujo {
  periodo: string
  periodoKey: string
  ingresados: number
  cerrados: number
  balance: number
  carteraActiva: number
  variacionIngresos: number | null
  variacionCierres: number | null
}

function VariacionBadge({ valor }: { valor: number | null }) {
  if (valor === null) return <span className="text-xs text-slate-300">—</span>

  if (valor > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
        <ArrowUpRight className="h-3 w-3" /> +{valor}%
      </span>
    )
  }
  if (valor < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600">
        <ArrowDownRight className="h-3 w-3" /> {valor}%
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-400">
      <Minus className="h-3 w-3" /> 0%
    </span>
  )
}

function BalanceCell({ balance }: { balance: number }) {
  if (balance > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
        +{balance}
      </span>
    )
  }
  if (balance < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
        {balance}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
      0
    </span>
  )
}

export function TablaFlujo({ datos }: { datos: PeriodoFlujo[] }) {
  if (datos.length === 0) return null

  // Calcular totales
  const totalIngresados = datos.reduce((s, d) => s + d.ingresados, 0)
  const totalCerrados = datos.reduce((s, d) => s + d.cerrados, 0)
  const totalBalance = totalIngresados - totalCerrados
  const promedioMensualIng = datos.length > 0 ? Math.round(totalIngresados / datos.length * 10) / 10 : 0
  const promedioMensualCie = datos.length > 0 ? Math.round(totalCerrados / datos.length * 10) / 10 : 0

  return (
    <Card className="mb-6 border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                Flujo de Casos por Período
              </CardTitle>
              <CardDescription>
                Ingresos vs cierres mes a mes — ¿cerramos al ritmo que ingresamos?
              </CardDescription>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <span>Prom. mensual: <strong className="text-blue-600">{promedioMensualIng}</strong> ingresos</span>
            <span className="mx-2">·</span>
            <span><strong className="text-emerald-600">{promedioMensualCie}</strong> cierres</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="text-left p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Período
                </th>
                <th className="text-center p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Ingresados
                </th>
                <th className="text-center p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Cerrados
                </th>
                <th className="text-center p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Balance
                </th>
                <th className="text-center p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Cartera Activa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {datos.map((fila) => (
                <tr key={fila.periodoKey} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-700 capitalize">
                    {fila.periodo}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-lg font-bold text-blue-600">{fila.ingresados}</span>
                      <VariacionBadge valor={fila.variacionIngresos} />
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-lg font-bold text-emerald-600">{fila.cerrados}</span>
                      <VariacionBadge valor={fila.variacionCierres} />
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <BalanceCell balance={fila.balance} />
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-lg font-bold text-indigo-600">{fila.carteraActiva}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Fila de totales */}
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50/50 font-bold">
                <td className="p-4 text-slate-700 text-xs uppercase">Total / Acumulado</td>
                <td className="p-4 text-center text-blue-700">{totalIngresados}</td>
                <td className="p-4 text-center text-emerald-700">{totalCerrados}</td>
                <td className="p-4 text-center">
                  <BalanceCell balance={totalBalance} />
                </td>
                <td className="p-4 text-center text-indigo-700">
                  {datos[datos.length - 1]?.carteraActiva || 0}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}