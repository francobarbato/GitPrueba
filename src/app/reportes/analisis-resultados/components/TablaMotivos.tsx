'use client'

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronRight, BarChart3, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// ============================================================================
// TIPOS
// ============================================================================

export type CasoDetalle = {
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
}

export type MotivoCierreRow = {
  motivo: string
  cantidad: number
  porcentaje: number
  montoReclamadoTotal: number
  montoObtenidoTotal: number
  tasaRecupero: number
  promedioDias: number
  casos: CasoDetalle[]
}

// ============================================================================
// COLORES POR MOTIVO
// ============================================================================

const MOTIVO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "FAVORABLE":    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "ACUERDO":      { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  "DESFAVORABLE": { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  "DESISTIMIENTO":{ bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  "ARCHIVO":      { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200" },
}

const DEFAULT_COLOR = { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" }

// ============================================================================
// SUB-COMPONENTE: Filtros inline + lista de casos dentro del expandible
// ============================================================================

function DetalleExpandido({ casos }: { casos: CasoDetalle[] }) {
  // const [filtroAbogado, setFiltroAbogado] = useState<string>("todos")
  const [filtroFuero, setFiltroFuero] = useState<string>("todos")

  // Opciones únicas para los selects
  // const abogados = useMemo(() => {
  //   const set = new Set(casos.map((c) => c.abogadoNombre))
  //   return Array.from(set).sort()
  // }, [casos])

  const fueros = useMemo(() => {
    const set = new Set(casos.map((c) => c.tipoLabel))
    return Array.from(set).sort()
  }, [casos])

  // Filtrado
  const casosFiltrados = useMemo(() => {
    return casos.filter((c) => {
      // if (filtroAbogado !== "todos" && c.abogadoNombre !== filtroAbogado) return false
      if (filtroFuero !== "todos" && c.tipoLabel !== filtroFuero) return false
      return true
    })
  }, [casos, filtroFuero])

  // const hayFiltrosActivos = filtroAbogado !== "todos" || filtroFuero !== "todos"

  const handleLimpiar = () => {
    // setFiltroAbogado("todos")
    setFiltroFuero("todos")
  }

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      {/* Filtros inline */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Expedientes ({casosFiltrados.length})
        </span>

        <div className="flex items-center gap-2 ml-auto">
          {/* Select Fuero */}
          {fueros.length > 1 && (
            <Select value={filtroFuero} onValueChange={setFiltroFuero}>
              <SelectTrigger className="h-7 text-xs w-[160px] bg-white">
                <SelectValue placeholder="Fuero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los fueros</SelectItem>
                {fueros.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
        </div>
      </div>

      {/* Tabla de casos */}
      {casosFiltrados.length > 0 ? (
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
              {casosFiltrados.map((caso) => (
                <tr key={caso.id} className="border-b border-slate-100 hover:bg-white/80">
                  <td className="px-3 py-2">
                    <Link
                      href={`/casos/${caso.id}`}
                      className="font-mono text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      {caso.numero}
                    </Link>
                  </td>
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
      ) : (
        <p className="text-xs text-slate-400 py-3 text-center">
          No hay expedientes que coincidan con los filtros seleccionados.
        </p>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

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
          Cómo terminan los expedientes del estudio. Click en una fila para ver los expedientes.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-8"></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Motivo de Cierre</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expedientes</th>
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
                    {/* Fila principal */}
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

                    {/* Fila expandida: filtros + lista de casos */}
                    {isExpanded && row.casos.length > 0 && (
                      <tr key={`${row.motivo}-detail`} className="bg-slate-50/70">
                        <td colSpan={8} className="px-8 py-4">
                          <DetalleExpandido casos={row.casos} />
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