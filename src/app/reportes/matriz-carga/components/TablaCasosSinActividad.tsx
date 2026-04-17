'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import type { CasoSinActividad } from "../page"

const formatMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

export function TablaCasosSinActividad({ data }: { data: CasoSinActividad[] }) {
  if (data.length === 0) return null

  return (
    <Card className="bg-white border border-amber-200 mb-6">
      <CardHeader className="pb-3 bg-amber-50/50">
        <CardTitle className="text-base font-semibold text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Casos sin actividad operativa
          <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">
            {data.length}
          </span>
        </CardTitle>
        <p className="text-xs text-amber-600/70">
          Casos activos que no tienen ninguna tarea pendiente, en proceso o bloqueada. Podrían necesitar seguimiento.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expediente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Carátula</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Abogado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capital</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sin acción</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ir</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c, idx) => (
                <tr key={c.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-blue-600 font-bold">{c.numero}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium max-w-[200px] truncate">{c.titulo}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{c.tipo}</td>
                  <td className="px-3 py-3 text-slate-600">{c.abogado}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-600">
                    {c.capitalEnLitigio > 0 ? formatMoney(c.capitalEnLitigio) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                      c.diasDesdeUltimaAccion > 30 ? "bg-red-100 text-red-700"
                      : c.diasDesdeUltimaAccion > 14 ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                    }`}>
                      {c.diasDesdeUltimaAccion} días
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Link href={`/casos/${c.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}