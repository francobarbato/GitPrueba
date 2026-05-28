// src/app/reportes/cuantia-liquidaciones/components/DistribucionTipo.tsx

"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface DataItem {
  tipo: "DESPIDO" | "LRT" | "CAPITALIZACION"
  label: string
  color: string
  cantidad: number
  monto: number
  porcentaje: number
}

interface DistribucionTipoProps {
  data: DataItem[]
  capitalTotal: number
}

const fmt = (n: number) =>
  `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function DistribucionTipo({ data, capitalTotal }: DistribucionTipoProps) {
  // Solo mostramos en la dona los tipos con monto > 0 (que tienen presencia real)
  const dataNoCero = data.filter(d => d.monto > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">

      {/* Dona */}
      <div className="relative w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataNoCero}
              dataKey="monto"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {dataNoCero.map((d) => (
                <Cell key={d.tipo} fill={d.color} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [fmt(Number(value)), name]}
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "none",
                borderRadius: 8,
                color: "white",
                fontSize: 12,
              }}
              labelStyle={{ color: "white" }}
              itemStyle={{ color: "white" }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Texto central de la dona — total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">Total</span>
          <span className="text-sm font-bold text-slate-800 font-mono">
            ${capitalTotal.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Tabla acompañante */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500 uppercase">
            <tr>
              <th className="text-left py-2 font-semibold">Tipo</th>
              <th className="text-right py-2 font-semibold">Cant.</th>
              <th className="text-right py-2 font-semibold">Monto</th>
              <th className="text-right py-2 font-semibold">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((d) => (
              <tr key={d.tipo} className={d.monto === 0 ? "opacity-40" : ""}>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="font-medium text-slate-700">{d.label}</span>
                  </div>
                </td>
                <td className="text-right py-2.5 font-mono text-slate-600">{d.cantidad}</td>
                <td className="text-right py-2.5 font-mono font-bold text-slate-800 text-xs">
                  {fmt(d.monto)}
                </td>
                <td className="text-right py-2.5 font-mono text-slate-500">
                  {d.porcentaje.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-300">
            <tr className="bg-slate-50">
              <td className="py-2.5 font-bold text-slate-800">TOTAL</td>
              <td className="text-right py-2.5 font-mono font-bold text-slate-800">
                {data.reduce((acc, d) => acc + d.cantidad, 0)}
              </td>
              <td className="text-right py-2.5 font-mono font-bold text-slate-900 text-xs">
                {fmt(capitalTotal)}
              </td>
              <td className="text-right py-2.5 font-mono font-bold text-slate-800">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}