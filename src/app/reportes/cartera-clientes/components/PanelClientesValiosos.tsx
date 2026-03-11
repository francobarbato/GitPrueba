'use client'

// app/reportes/cartera-clientes/components/PanelClientesValiosos.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, ExternalLink } from "lucide-react"
import Link from "next/link"

type ClienteValioso = {
  id: string
  nombre: string
  tipoPersona: string
  capitalEnLitigio: number
  casosActivos: number
  casosTotal: number
  categoriaCantidad: string
}

const formatMoneyCompact = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

const CATEGORIA_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  frecuente:  { bg: "bg-indigo-50", text: "text-indigo-700",  label: "Frecuente" },
  recurrente: { bg: "bg-blue-50",   text: "text-blue-700",    label: "Recurrente" },
  unico:      { bg: "bg-slate-50",  text: "text-slate-600",   label: "Único" },
}

export function PanelClientesValiosos({ clientes }: { clientes: ClienteValioso[] }) {
  if (clientes.length === 0) return null

  const top = clientes
    .filter(c => c.capitalEnLitigio > 0)
    .sort((a, b) => b.capitalEnLitigio - a.capitalEnLitigio)
    .slice(0, 5)

  if (top.length === 0) return null

  const maxCapital = top[0].capitalEnLitigio

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Clientes más valiosos
        </CardTitle>
        <p className="text-xs text-slate-500">
          Los clientes con mayor capital activo en tu cartera ahora mismo.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.map((c, idx) => {
          const pct = maxCapital > 0 ? Math.round((c.capitalEnLitigio / maxCapital) * 100) : 0
          const badge = CATEGORIA_BADGES[c.categoriaCantidad] || CATEGORIA_BADGES.unico

          return (
            <div key={c.id} className="flex items-center gap-3">
              {/* Ranking */}
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                idx === 0 ? 'bg-amber-100 text-amber-700'
                : idx === 1 ? 'bg-slate-200 text-slate-600'
                : idx === 2 ? 'bg-orange-100 text-orange-600'
                : 'bg-slate-100 text-slate-500'
              }`}>
                {idx + 1}
              </span>

              {/* Info + barra */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-slate-800 text-sm truncate">{c.nombre}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {c.casosActivos} caso{c.casosActivos !== 1 ? 's' : ''} activo{c.casosActivos !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-bold text-slate-800">
                      {formatMoneyCompact(c.capitalEnLitigio)}
                    </span>
                    <Link href={`/clientes/${c.id}`} className="text-indigo-600 hover:text-indigo-800">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}