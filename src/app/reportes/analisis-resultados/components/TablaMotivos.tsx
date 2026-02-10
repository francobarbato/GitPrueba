'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronRight, BarChart3 } from "lucide-react"

export type MotivoCierreRow = {
  motivo: string
  cantidad: number
  porcentaje: number
  montoReclamadoTotal: number
  montoObtenidoTotal: number
  tasaRecupero: number
  promedioDias: number
  // Detalle: casos individuales de este motivo
  casos: {
    id: string
    numero: string
    titulo: string
    tipo: string
    tipoLabel: string
    montoDisputa: number
    montoFinal: number
    diasDuracion: number
    fechaCierre: string
    abogadoNombre: string
  }[]
}

const MOTIVO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Sentencia favorable": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "Acuerdo/Conciliación": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Sentencia desfavorable": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Desistimiento": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Archivo": { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  "Prescripción": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  "Otro": { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
}

const DEFAULT_COLOR = { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" }

export function TablaMotivos({ data }: { data: MotivoCierreRow[] }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Resultados por Motivo de Cierre
        </CardTitle>
        <p className="text-xs text-slate-500">
          Cómo terminan los casos del estudio. Click en una fila para ver los expedientes.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-8"></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Motivo de Cierre</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Casos</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">% del Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reclamado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Obtenido</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recupero</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prom. Días</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const isExpanded = expandedRow === row.motivo
                const colors = MOTIVO_COLORS[row.motivo] || DEFAULT_COLOR

                return (
                  <>
                    <tr
                      key={row.motivo}
                      onClick={() => setExpandedRow(isExpanded ? null : row.motivo)}
                      className={`border-b border-slate-100 cursor-pointer transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      } hover:bg-blue-50/50`}
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {row.motivo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-slate-700">{row.cantidad}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(row.porcentaje, 100)}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-600">{row.porcentaje}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 text-xs">{formatMoney(row.montoReclamadoTotal)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700 text-xs">{formatMoney(row.montoObtenidoTotal)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.tasaRecupero >= 70 ? "bg-emerald-100 text-emerald-700"
                          : row.tasaRecupero >= 40 ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                        }`}>
                          {row.tasaRecupero}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{row.promedioDias} días</td>
                    </tr>

                    {/* Fila expandida: detalle de casos */}
                    {isExpanded && row.casos.length > 0 && (
                      <tr key={`${row.motivo}-detail`} className="bg-slate-50">
                        <td colSpan={8} className="px-8 py-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">
                            Expedientes cerrados por {row.motivo} ({row.casos.length})
                          </p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-200">
                                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Expediente</th>
                                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Carátula</th>
                                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Fuero</th>
                                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Abogado</th>
                                  <th className="text-right px-3 py-2 text-slate-500 font-semibold">Reclamado</th>
                                  <th className="text-right px-3 py-2 text-slate-500 font-semibold">Obtenido</th>
                                  <th className="text-center px-3 py-2 text-slate-500 font-semibold">Duración</th>
                                  <th className="text-center px-3 py-2 text-slate-500 font-semibold">Cierre</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.casos.map((caso) => (
                                  <tr key={caso.id} className="border-b border-slate-100 hover:bg-white/80">
                                    <td className="px-3 py-2 font-mono text-slate-600">{caso.numero}</td>
                                    <td className="px-3 py-2 text-slate-700 font-medium max-w-[200px] truncate">{caso.titulo}</td>
                                    <td className="px-3 py-2 text-slate-600">{caso.tipoLabel}</td>
                                    <td className="px-3 py-2 text-slate-600">{caso.abogadoNombre}</td>
                                    <td className="px-3 py-2 text-right text-slate-500">{formatMoney(caso.montoDisputa)}</td>
                                    <td className="px-3 py-2 text-right font-medium text-slate-700">{formatMoney(caso.montoFinal)}</td>
                                    <td className="px-3 py-2 text-center text-slate-600">{caso.diasDuracion} días</td>
                                    <td className="px-3 py-2 text-center text-slate-500">{caso.fechaCierre}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}