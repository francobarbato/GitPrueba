'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import type { FueroRow } from "./MatrizFuero"

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
]

const formatMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", notation: "compact", maximumFractionDigits: 1 }).format(n)

export function GraficosCartera({ data }: { data: FueroRow[] }) {
  // Datos para la torta de volumen
  const dataVolumen = data.map((r) => ({
    name: r.tipoLabel,
    value: r.cantidad,
  }))

  // Datos para la torta de capital
  const dataCapital = data.map((r) => ({
    name: r.tipoLabel,
    value: r.capitalEnLitigio,
  }))

  // Datos para el gráfico de barras comparativo
  const dataComparativo = data.map((r, i) => ({
    fuero: r.tipoLabel,
    "% Volumen": r.pesoVolumen,
    "% Capital":
      data.reduce((s, x) => s + x.capitalEnLitigio, 0) > 0
        ? Math.round(
            (r.capitalEnLitigio / data.reduce((s, x) => s + x.capitalEnLitigio, 0)) * 100
          )
        : 0,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-slate-800">{payload[0].name || payload[0].payload.fuero}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color || entry.fill }} className="mt-1">
            {entry.dataKey || "Valor"}: {typeof entry.value === "number" && entry.value > 1000
              ? formatMoney(entry.value)
              : entry.value}
            {entry.dataKey?.includes("%") ? "%" : ""}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Torta de Volumen */}
      <Card className="bg-white border border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">Distribución por Volumen</CardTitle>
          <p className="text-xs text-slate-400">Cantidad de casos por fuero</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={dataVolumen}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent || 0* 100).toFixed(0)}%`}
                labelLine={false}
                style={{ fontSize: "10px" }}
              >
                {dataVolumen.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Torta de Capital */}
      <Card className="bg-white border border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">Distribución por Capital</CardTitle>
          <p className="text-xs text-slate-400">Monto en disputa por fuero</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={dataCapital}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent || 0* 100).toFixed(0)}%`}
                labelLine={false}
                style={{ fontSize: "10px" }}
              >
                {dataCapital.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Barras Comparativas: Volumen vs Capital */}
      <Card className="bg-white border border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">Volumen vs. Capital</CardTitle>
          <p className="text-xs text-slate-400">Donde se detecta el desbalance</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dataComparativo} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} style={{ fontSize: "10px" }} />
              <YAxis type="category" dataKey="fuero" width={80} style={{ fontSize: "10px" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="% Volumen" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey="% Capital" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}