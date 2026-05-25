'use client'

// app/reportes/analisis-resultados/components/TablaMotivosGerencial.tsx
// Vista gerencial: expand muestra desglose por abogado, no casos individuales

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronRight, BarChart3 } from "lucide-react"

// ============================================================================
// TIPOS
// ============================================================================

export type AbogadoDesglose = {
  id: string
  nombre: string
  cantidad: number
  montoReclamado: number
  montoObtenido: number
  tasaRecupero: number
  promedioDias: number
}

export type MotivoCierreGerencial = {
  motivo: string
  cantidad: number
  porcentaje: number
  montoReclamadoTotal: number
  montoObtenidoTotal: number
  tasaRecupero: number
  promedioDias: number
  porAbogado: AbogadoDesglose[]
}

// ============================================================================
// COLORES
// ============================================================================

const MOTIVO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "FAVORABLE":     { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "ACUERDO":       { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  "DESFAVORABLE":  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  "DESISTIMIENTO": { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  "ARCHIVO":       { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200" },
}

const DEFAULT_COLOR = { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" }

// ============================================================================
// DESGLOSE POR ABOGADO (expand)
// ============================================================================

function DesgloseAbogados({
  porAbogado,
  totalCasos,
  filtroAbogadoId,
}: {
  porAbogado: AbogadoDesglose[]
  totalCasos: number
  filtroAbogadoId: string
}) {
  const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(n)

  const filas = filtroAbogadoId === "todos"
    ? porAbogado
    : porAbogado.filter((a) => a.id === filtroAbogadoId)

  if (filas.length === 0) {
    return (
      <p className="text-xs text-slate-400 py-3 text-center">
        No hay datos para el abogado seleccionado en este motivo.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left px-3 py-2 text-slate-500 font-semibold">Abogado</th>
            <th className="text-center px-3 py-2 text-slate-500 font-semibold">Casos</th>
            <th className="text-center px-3 py-2 text-slate-500 font-semibold">% del motivo</th>
            <th className="text-right px-3 py-2 text-slate-500 font-semibold">Reclamado</th>
            <th className="text-right px-3 py-2 text-slate-500 font-semibold">Obtenido</th>
            <th className="text-center px-3 py-2 text-slate-500 font-semibold">Recupero</th>
            <th className="text-center px-3 py-2 text-slate-500 font-semibold">Prom. días</th>
          </tr>
        </thead>
        <tbody>
          {filas
            .sort((a, b) => b.cantidad - a.cantidad)
            .map((ab) => {
              const pct = totalCasos > 0 ? Math.round((ab.cantidad / totalCasos) * 100) : 0
              return (
                <tr
                  key={ab.id}
                  className="border-b border-slate-100 hover:bg-white/80"
                >
                  <td className="px-3 py-2 font-medium text-slate-700">{ab.nombre}</td>
                  <td className="px-3 py-2 text-center font-semibold text-slate-800">
                    {ab.cantidad}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-14 bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-indigo-400 h-1.5 rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-slate-500">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500">
                    {formatMoney(ab.montoReclamado)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-slate-700">
                    {formatMoney(ab.montoObtenido)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        ab.tasaRecupero >= 70
                          ? "bg-emerald-100 text-emerald-700"
                          : ab.tasaRecupero >= 40
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {ab.tasaRecupero}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-slate-600">
                    {ab.promedioDias > 0 ? `${ab.promedioDias} días` : "—"}
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function TablaMotivosGerencial({
  data,
  filtroAbogadoId = "todos",
}: {
  data: MotivoCierreGerencial[]
  filtroAbogadoId?: string
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Resultados por Motivo de Cierre
        </CardTitle>
        <p className="text-xs text-slate-500">
          Cómo terminan los casos del estudio. Click en una fila para ver el desglose por abogado.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="w-8 px-4 py-3" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Motivo de Cierre
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Casos
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  % del Total
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Reclamado
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Obtenido
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Recupero
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Prom. Días
                </th>
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
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          {row.motivo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-slate-700">
                        {row.cantidad}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-indigo-500 h-2 rounded-full"
                              style={{ width: `${Math.min(row.porcentaje, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600">
                            {row.porcentaje}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 text-xs">
                        {formatMoney(row.montoReclamadoTotal)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700 text-xs">
                        {formatMoney(row.montoObtenidoTotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            row.tasaRecupero >= 70
                              ? "bg-emerald-100 text-emerald-700"
                              : row.tasaRecupero >= 40
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {row.tasaRecupero}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {row.promedioDias} días
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${row.motivo}-detail`} className="bg-slate-50/70">
                        <td colSpan={8} className="px-8 py-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                            Desglose por abogado — {row.cantidad} casos
                          </p>
                          <DesgloseAbogados
                            porAbogado={row.porAbogado}
                            totalCasos={row.cantidad}
                            filtroAbogadoId={filtroAbogadoId}
                          />
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