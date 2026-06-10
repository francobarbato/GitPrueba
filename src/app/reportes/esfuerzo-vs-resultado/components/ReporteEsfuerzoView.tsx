'use client'

import { useEffect, useMemo, useState, useTransition } from "react"
import {
  getReporteEsfuerzoVsResultadoAction,
  type ClienteEsfuerzoResultado,
  type ReporteEsfuerzoVsResultado,
} from "src/lib/actions/reportes/getReporteEsfuerzoVsResultado"
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts"
import {
  Users, Briefcase, TrendingUp, Target,
  ArrowUpDown, AlertCircle, RefreshCw, Filter,
  Activity, FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// ============================================================================
// HELPERS
// ============================================================================

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0,
})

const fmtMonto = (n: number) => ARS.format(n)
const fmtNum = (n: number) => new Intl.NumberFormat("es-AR").format(n)
const fmtPct = (n: number) => `${n.toFixed(1)}%`

function nombreCliente(c: ClienteEsfuerzoResultado) {
  if (c.tipoPersona === "JURIDICA" && c.tipoSociedad) {
    return `${c.tipoSociedad} — ${c.nombre}`
  }
  return `${c.nombre}${c.apellido ? ` ${c.apellido}` : ""}`
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type SortKey =
  | "nombre" | "totalCasos" | "totalEventos" | "totalDocumentos"
  | "esfuerzoTotal" | "montoDisputaTotal" | "montoRecuperadoTotal" | "ratioRecuperacion"

export function ReporteEsfuerzoView() {
  const [data, setData] = useState<ReporteEsfuerzoVsResultado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [fechaDesde, setFechaDesde] = useState<string>("")
  const [fechaHasta, setFechaHasta] = useState<string>("")
  const [soloCerrados, setSoloCerrados] = useState<boolean>(true)

  const [sortKey, setSortKey] = useState<SortKey>("esfuerzoTotal")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const cargar = () => {
    setError(null)
    startTransition(async () => {
      const result = await getReporteEsfuerzoVsResultadoAction({
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        soloCerrados,
      })
      if ("error" in result) {
        setError(result.error)
        setData(null)
      } else {
        setData(result)
      }
    })
  }

  useEffect(() => { cargar() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const clientesOrdenados = useMemo(() => {
    if (!data) return []
    const arr = [...data.clientes]
    arr.sort((a, b) => {
      let av: any, bv: any
      if (sortKey === "nombre") {
        av = nombreCliente(a).toLowerCase()
        bv = nombreCliente(b).toLowerCase()
      } else {
        av = (a as any)[sortKey]
        bv = (b as any)[sortKey]
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return arr
  }, [data, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir(key === "nombre" ? "asc" : "desc")
    }
  }

  const dataScatter = useMemo(() => {
    if (!data) return []
    return data.clientes
      .filter(c => c.tieneMontoDisputa)
      .map(c => ({
        nombre: nombreCliente(c),
        esfuerzo: c.esfuerzoTotal,
        ratio: c.ratioRecuperacion,
        monto: c.montoRecuperadoTotal,
        casos: c.totalCasos,
      }))
  }, [data])

  const medianas = useMemo(() => {
    if (dataScatter.length === 0) return { esfuerzo: 0, ratio: 0 }
    const esfuerzos = [...dataScatter].map(d => d.esfuerzo).sort((a, b) => a - b)
    const ratios = [...dataScatter].map(d => d.ratio).sort((a, b) => a - b)
    const mid = Math.floor(esfuerzos.length / 2)
    return {
      esfuerzo: esfuerzos.length % 2 === 0 ? (esfuerzos[mid - 1] + esfuerzos[mid]) / 2 : esfuerzos[mid],
      ratio: ratios.length % 2 === 0 ? (ratios[mid - 1] + ratios[mid]) / 2 : ratios[mid],
    }
  }, [dataScatter])

  return (
    <div className="space-y-6">

      {/* ─── FILTROS ─── */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Alcance</label>
              <div className="flex items-center gap-3 h-[34px]">
                <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={soloCerrados}
                    onChange={e => setSoloCerrados(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  Solo casos cerrados
                </label>
              </div>
            </div>
            <button
              onClick={cargar}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 justify-center disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
              {isPending ? "Cargando..." : "Aplicar filtros"}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {soloCerrados
              ? "Mostrando solo casos cerrados — el monto recuperado es definitivo."
              : "Mostrando casos cerrados y activos — el monto recuperado puede ser parcial."}
          </p>
        </CardContent>
      </Card>

      {/* ─── ERROR ─── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">No se pudo generar el reporte</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ─── SIN DATOS ─── */}
      {data && data.clientes.length === 0 && !isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">No hay clientes con datos para mostrar</p>
          <p className="text-xs text-amber-700 mt-1">
            Probá ampliando el rango de fechas o desactivando "solo casos cerrados".
          </p>
        </div>
      )}

      {/* ─── KPIs (patrón unificado con cartera-fuero / evolución) ─── */}
      {data && data.clientes.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Clientes"
            value={fmtNum(data.resumen.totalClientes)}
            icon={<Users className="w-5 h-5 text-indigo-600" />}
            iconBg="bg-indigo-100"
          />
          <KpiCard
            label="Expedientes"
            value={fmtNum(data.resumen.totalCasos)}
            icon={<Briefcase className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-100"
          />
          <KpiCard
            label="Recuperado"
            value={fmtMonto(data.resumen.montoRecuperadoCartera)}
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-100"
          />
          <KpiCard
            label="Ratio cartera"
            value={fmtPct(data.resumen.ratioCarteraGlobal)}
            icon={<Target className="w-5 h-5 text-violet-600" />}
            iconBg="bg-violet-100"
          />
        </div>
      )}

      {/* ─── SCATTER ─── */}
      {data && dataScatter.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Esfuerzo vs Recuperación</CardTitle>
                <CardDescription>
                  Cada punto es un cliente. El eje X mide el esfuerzo (expedientes + eventos + documentos).
                  El eje Y mide el porcentaje recuperado sobre el monto en disputa.
                  Las líneas grises marcan la mediana de tu cartera.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 50, left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    dataKey="esfuerzo"
                    name="Esfuerzo"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    label={{ value: "Esfuerzo operativo", position: "insideBottom", offset: -10, fontSize: 12, fill: "#475569" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="ratio"
                    name="Recuperación"
                    unit="%"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    label={{ value: "Recuperación (%)", angle: -90, position: "insideLeft", fontSize: 12, fill: "#475569" }}
                  />
                  <ZAxis type="number" dataKey="monto" range={[60, 400]} name="Monto recuperado" />

                  <ReferenceLine x={medianas.esfuerzo} stroke="#94a3b8" strokeDasharray="4 4" />
                  <ReferenceLine y={medianas.ratio} stroke="#94a3b8" strokeDasharray="4 4" />

                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null
                      const p = payload[0].payload
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
                          <p className="font-semibold text-slate-800 mb-1">{p.nombre}</p>
                          <p className="text-slate-600">Esfuerzo: {fmtNum(p.esfuerzo)}</p>
                          <p className="text-slate-600">Ratio: {fmtPct(p.ratio)}</p>
                          <p className="text-slate-600">Recuperado: {fmtMonto(p.monto)}</p>
                          <p className="text-slate-600">Casos: {fmtNum(p.casos)}</p>
                        </div>
                      )
                    }}
                  />

                  <Scatter
                    name="Clientes"
                    data={dataScatter}
                    fill="#3b82f6"
                    fillOpacity={0.7}
                    stroke="#1e40af"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500">
              <div className="bg-slate-50 border border-slate-100 rounded p-2">
                <span className="font-semibold text-slate-700">Arriba-derecha:</span> alto esfuerzo + alta recuperación. Clientes estratégicos.
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded p-2">
                <span className="font-semibold text-slate-700">Arriba-izquierda:</span> bajo esfuerzo + alta recuperación. Casos eficientes.
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded p-2">
                <span className="font-semibold text-slate-700">Abajo-derecha:</span> alto esfuerzo + baja recuperación. Revisar dedicación.
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded p-2">
                <span className="font-semibold text-slate-700">Abajo-izquierda:</span> bajo esfuerzo + baja recuperación. Etapas iniciales o casos menores.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nota de clientes excluidos del scatter */}
      {data && data.clientes.length > 0 && dataScatter.length < data.clientes.length && (
        <p className="text-xs text-slate-400 italic">
          {data.clientes.length - dataScatter.length} cliente(s) no aparecen en el gráfico porque no tienen monto en disputa registrado.
          Sí figuran en la tabla.
        </p>
      )}

      {/* ─── TABLA ─── */}
      {data && data.clientes.length > 0 && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Detalle por cliente</CardTitle>
                  <CardDescription>{data.clientes.length} clientes en tu cartera con los filtros aplicados</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <Th label="Cliente" sortKey="nombre" current={sortKey} dir={sortDir} onSort={toggleSort} align="left" />
                  <Th label="Expedientes" sortKey="totalCasos" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label="Eventos" sortKey="totalEventos" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label="Documentos" sortKey="totalDocumentos" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label="Esfuerzo total" sortKey="esfuerzoTotal" current={sortKey} dir={sortDir} onSort={toggleSort} highlight />
                  <Th label="En disputa" sortKey="montoDisputaTotal" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label="Recuperado" sortKey="montoRecuperadoTotal" current={sortKey} dir={sortDir} onSort={toggleSort} highlight />
                  <Th label="Ratio" sortKey="ratioRecuperacion" current={sortKey} dir={sortDir} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {clientesOrdenados.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{nombreCliente(c)}</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {fmtNum(c.totalCasos)}
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({fmtNum(c.casosActivos)} act / {fmtNum(c.casosCerrados)} cer)
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">{fmtNum(c.totalEventos)}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{fmtNum(c.totalDocumentos)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900 bg-slate-50/50">{fmtNum(c.esfuerzoTotal)}</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {c.tieneMontoDisputa ? fmtMonto(c.montoDisputaTotal) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900 bg-slate-50/50">
                      {fmtMonto(c.montoRecuperadoTotal)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {c.tieneMontoDisputa ? (
                        <span className={`font-medium ${
                          c.ratioRecuperacion >= 75 ? "text-emerald-700" :
                          c.ratioRecuperacion >= 40 ? "text-amber-700" :
                          "text-red-700"
                        }`}>
                          {fmtPct(c.ratioRecuperacion)}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── METODOLOGÍA (en el mismo estilo que los otros reportes) ─── */}
      {data && data.clientes.length > 0 && (
        <div className="mt-2 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <p className="text-sm text-blue-900 font-semibold mb-2">📖 Metodología del Reporte</p>
          <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
            <li><strong>Esfuerzo operativo:</strong> suma directa de expedientes + eventos + documentos asociados al cliente.</li>
            <li><strong>Monto en disputa:</strong> suma del <code>montoDisputa</code> de los casos del cliente en el período.</li>
            <li><strong>Monto recuperado:</strong> suma del <code>montoFinal</code> de los casos cerrados del cliente.</li>
            <li><strong>Ratio de recuperación:</strong> (Recuperado / En disputa) × 100. Solo aplica a clientes con monto en disputa registrado.</li>
            <li><strong>Exclusiones:</strong> casos traspasados a otros estudios y clientes sin casos en el rango.</li>
            <li><strong>Vista por defecto:</strong> solo casos cerrados (el resultado es definitivo). Destildá para incluir casos activos con resultado parcial.</li>
          </ul>
        </div>
      )}

      {/* Loading placeholder */}
      {!data && !error && (
        <div className="text-center py-12 text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin opacity-50" />
          Cargando reporte...
        </div>
      )}

    </div>
  )
}

// ============================================================================
// KPI CARD — patrón unificado con cartera-fuero / evolución
// ============================================================================

function KpiCard({ label, value, icon, iconBg }: {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
}) {
  return (
    <Card className="bg-white border border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${iconBg} rounded-lg shrink-0`}>{icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// HEADER DE TABLA (ordenable)
// ============================================================================

function Th({ label, sortKey, current, dir, onSort, align = "right", highlight = false }: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: "asc" | "desc"
  onSort: (k: SortKey) => void
  align?: "left" | "right"
  highlight?: boolean
}) {
  const isActive = current === sortKey
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-3 py-2 text-xs font-semibold cursor-pointer select-none whitespace-nowrap
        ${align === "left" ? "text-left" : "text-right"}
        ${highlight ? "bg-blue-50/40" : ""}
        ${isActive ? "text-blue-700" : "text-slate-600 hover:text-slate-900"}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${isActive ? "opacity-100" : "opacity-30"}`} />
        {isActive && <span className="text-[10px]">{dir === "asc" ? "↑" : "↓"}</span>}
      </span>
    </th>
  )
}