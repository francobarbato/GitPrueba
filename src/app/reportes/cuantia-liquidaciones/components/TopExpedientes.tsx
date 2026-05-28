// src/app/reportes/cuantia-liquidaciones/components/TopExpedientes.tsx

import Link from "next/link"
import { Briefcase, Truck, Scale } from "lucide-react"

interface ExpedienteItem {
  casoId: string
  numero: string
  titulo: string
  cliente: string
  abogado: string
  estaCerrado: boolean
  tipos: string[]
  cantidad: number
  montoTotal: number
}

interface TopExpedientesProps {
  expedientes: ExpedienteItem[]
}

const fmt = (n: number) =>
  `$${n.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`

const TIPO_ICON = {
  DESPIDO: Briefcase,
  LRT: Truck,
  CAPITALIZACION: Scale,
} as const

export default function TopExpedientes({ expedientes }: TopExpedientesProps) {
  if (expedientes.length === 0) {
    return (
      <p className="text-center text-xs text-slate-400 py-6">
        Sin datos en el período.
      </p>
    )
  }

  // Para escalar la barra de cuantía relativa: el primero ocupa el 100%, los demás proporcional
  const max = expedientes[0]?.montoTotal ?? 1

  return (
    <ol className="space-y-2">
      {expedientes.map((e, idx) => {
        const ancho = max > 0 ? (e.montoTotal / max) * 100 : 0
        return (
          <li key={e.casoId} className="relative">
            <Link
              href={`/casos/${e.casoId}`}
              className="block p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              {/* Barra de cuantía relativa (fondo) */}
              <div
                className="absolute inset-y-0 left-0 bg-amber-50 rounded-lg pointer-events-none"
                style={{ width: `${ancho}%` }}
                aria-hidden
              />

              <div className="relative flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{e.numero}</p>
                  <p className="text-[11px] text-slate-500 truncate">{e.titulo}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {e.cliente} · {e.abogado}
                  </p>

                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {e.tipos.map((t) => {
                      const Icon = TIPO_ICON[t as keyof typeof TIPO_ICON]
                      return Icon ? (
                        <span
                          key={t}
                          className="inline-flex items-center gap-0.5 text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-full"
                          title={t}
                        >
                          <Icon size={9} />
                        </span>
                      ) : null
                    })}
                    {e.cantidad > 1 && (
                      <span className="text-[10px] text-slate-400">· {e.cantidad} cálculos</span>
                    )}
                    {e.estaCerrado && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                        Cerrado
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-slate-900 font-mono mt-1">
                    {fmt(e.montoTotal)}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}