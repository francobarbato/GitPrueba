'use client'

// app/reportes/cartera-fuero/components/MatrizFuero.tsx

import { useState, Fragment } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronRight, Scale, ArrowUpRight, Clock, DollarSign } from "lucide-react"
import type { CasoDetalle } from "../page"

export type FueroRow = {
  tipo: string
  tipoLabel: string
  cantidad: number
  pesoVolumen: number
  capitalEnLitigio: number
  ticketPromedio: number
  tasaActividad: number
  promedioDiasCierre: number | null
  distribucionEtapas: { etapa: string; cantidad: number; porcentaje: number }[]
  casosDetalle: CasoDetalle[]
}

const formatMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

export function MatrizFuero({ data }: { data: FueroRow[] }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const totalCapital = data.reduce((sum, r) => sum + r.capitalEnLitigio, 0)

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-600" />
          Matriz de Cartera por Fuero
        </CardTitle>
        <p className="text-xs text-slate-500">
          Cruce de volumen de trabajo vs. valor económico por materia. Click en una fila para ver los expedientes.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="w-8 px-4 py-3" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fuero</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expedientes</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">% Volumen</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capital en Litigio</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">% Capital</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket Prom.</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actividad 30d</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prom. Cierre</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const isExpanded = expandedRow === row.tipo
                const pesoCapital = totalCapital > 0 ? Math.round((row.capitalEnLitigio / totalCapital) * 100) : 0
                const diferencia = Math.abs(row.pesoVolumen - pesoCapital)
                const esDesbalanceado = diferencia > 20

                return (
                  <Fragment key={row.tipo}>
                    <tr
                      key={row.tipo}
                      onClick={() => setExpandedRow(isExpanded ? null : row.tipo)}
                      className={`border-b border-slate-100 cursor-pointer transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      } hover:bg-blue-50/50`}
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{row.tipoLabel}</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-700">{row.cantidad}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(row.pesoVolumen, 100)}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-600">{row.pesoVolumen}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">{formatMoney(row.capitalEnLitigio)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(pesoCapital, 100)}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-600">{pesoCapital}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">{formatMoney(row.ticketPromedio)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.tasaActividad >= 70 ? "bg-emerald-100 text-emerald-700"
                          : row.tasaActividad >= 40 ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                        }`}>
                          {row.tasaActividad}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {row.promedioDiasCierre !== null ? `${row.promedioDiasCierre} días` : "—"}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${row.tipo}-detail`}>
                        <td colSpan={9} className="bg-slate-50 border-b border-slate-200">
                          <div className="px-8 py-4 space-y-4">

                            {/* Insight + etapas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                                  Distribución por Etapa Procesal
                                </p>
                                <div className="space-y-2">
                                  {row.distribucionEtapas.length > 0 ? row.distribucionEtapas.map(etapa => (
                                    <div key={etapa.etapa} className="flex items-center gap-2">
                                      <span className="text-xs text-slate-600 w-40 truncate">{etapa.etapa}</span>
                                      <div className="flex-1 bg-slate-200 rounded-full h-2.5">
                                        <div className="bg-indigo-400 h-2.5 rounded-full" style={{ width: `${etapa.porcentaje}%` }} />
                                      </div>
                                      <span className="text-xs text-slate-500 w-16 text-right">
                                        {etapa.cantidad} ({etapa.porcentaje}%)
                                      </span>
                                    </div>
                                  )) : <p className="text-xs text-slate-400">Sin datos de etapas</p>}
                                </div>
                              </div>

                              <div className="p-3 bg-white rounded-lg border border-slate-200">
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Insight</p>
                                {esDesbalanceado ? (
                                  <p className="text-sm text-slate-700">
                                    {row.pesoVolumen > pesoCapital ? (
                                      <><span className="font-medium text-amber-600">⚠ Alto volumen, bajo valor.</span>{" "}
                                      {row.tipoLabel} representa el {row.pesoVolumen}% del trabajo pero solo el {pesoCapital}% del capital.</>
                                    ) : (
                                      <><span className="font-medium text-emerald-600">✦ Alta rentabilidad.</span>{" "}
                                      {row.tipoLabel} solo es el {row.pesoVolumen}% del volumen pero concentra el {pesoCapital}% del capital.</>
                                    )}
                                  </p>
                                ) : (
                                  <p className="text-sm text-slate-700">
                                    <span className="font-medium text-blue-600">≈ Equilibrado.</span>{" "}
                                    {row.tipoLabel} tiene proporción similar entre volumen ({row.pesoVolumen}%) y capital ({pesoCapital}%).
                                  </p>
                                )}
                                {row.tasaActividad < 40 && (
                                  <p className="text-sm text-red-600 mt-2">
                                    🔴 Baja actividad: solo el {row.tasaActividad}% con movimiento en 30 días.
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Expedientes del fuero */}
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                                Expedientes — {row.tipoLabel} ({row.casosDetalle.length})
                              </p>
                              <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                      <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expediente</th>
                                      <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Carátula</th>
                                      <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Etapa</th>
                                      <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capital</th>
                                      <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Duración</th>
                                      <th className="w-12 px-4 py-2" />
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.casosDetalle.map((caso, i) => (
                                      <tr key={caso.id} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                                        <td className="px-4 py-2.5">
                                          <span className="font-mono text-xs font-bold text-slate-700">#{caso.numero}</span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                          <span className="text-sm text-slate-700 line-clamp-1">
                                            {caso.titulo.length > 50 ? caso.titulo.slice(0, 50) + "..." : caso.titulo}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            {caso.estado}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                          {caso.montoDisputa > 0 ? (
                                            <span className="flex items-center justify-end gap-1 text-xs font-medium text-emerald-700">
                                              <DollarSign className="w-3 h-3" />
                                              {formatMoney(caso.montoDisputa)}
                                            </span>
                                          ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                          <span className="flex items-center justify-center gap-1 text-xs text-slate-500">
                                            <Clock className="w-3 h-3" />
                                            {caso.diasDuracion} días
                                          </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                          <Link
                                            href={`/casos/${caso.id}`}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-100"
                                            onClick={e => e.stopPropagation()}
                                          >
                                            Ver
                                            <ArrowUpRight className="w-3 h-3" />
                                          </Link>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}