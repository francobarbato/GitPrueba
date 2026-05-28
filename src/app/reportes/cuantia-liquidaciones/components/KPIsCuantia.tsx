// src/app/reportes/cuantia-liquidaciones/components/KPIsCuantia.tsx

import { Wallet, TrendingUp, FileText } from "lucide-react"

interface KPIsCuantiaProps {
  capitalTotal:           number
  honorariosProyectados:  number
  cantidadCalculos:       number
  porcentajeHonorarios:   number
}

const fmt = (n: number) =>
  `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function KPIsCuantia({
  capitalTotal,
  honorariosProyectados,
  cantidadCalculos,
  porcentajeHonorarios,
}: KPIsCuantiaProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* KPI estrella — Capital en expectativa */}
      <div className="lg:col-span-2 bg-slate-900 text-white rounded-xl shadow-md p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <Wallet className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
            Capital en Expectativa
          </p>
          <p className="text-3xl font-bold font-mono mt-1 break-words">
            {fmt(capitalTotal)}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Suma de los cálculos guardados y vinculados a expedientes activos según los filtros aplicados.
          </p>
        </div>
      </div>

      {/* Honorarios proyectados */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-emerald-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            Honorarios Proyectados
          </p>
          <p className="text-2xl font-bold font-mono mt-1 text-emerald-900 break-words">
            {fmt(honorariosProyectados)}
          </p>
          <p className="text-[11px] text-emerald-700/70 mt-2">
            Estimación al {(porcentajeHonorarios * 100).toFixed(0)}% del capital total.
          </p>
        </div>
      </div>

      {/* Cantidad de cálculos */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-slate-600" />
        </div>
        <div className="flex-1 flex items-baseline gap-2 flex-wrap">
          <span className="text-sm text-slate-500">Total de cálculos considerados:</span>
          <span className="text-lg font-bold text-slate-800">{cantidadCalculos}</span>
        </div>
      </div>

    </div>
  )
}