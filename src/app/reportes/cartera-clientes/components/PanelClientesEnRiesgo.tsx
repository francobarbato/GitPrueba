'use client'

// app/reportes/cartera-clientes/components/PanelClientesEnRiesgo.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ExternalLink } from "lucide-react"
import Link from "next/link"

type ClienteRiesgo = {
  id: string
  nombre: string
  tipoPersona: string
  casosTotal: number
  casosCerrados: number
  capitalHistorico: number
  capitalRecuperado: number
  tiempoInactivoLabel: string
  ultimoCierreLabel: string
  ultimoMovimiento: string | null
}

const formatMoneyCompact = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

function getNivelRiesgo(tiempoInactivoLabel: string): 'alto' | 'medio' | 'bajo' {
  if (tiempoInactivoLabel.includes('año')) return 'alto'
  const meses = parseInt(tiempoInactivoLabel)
  if (!isNaN(meses) && tiempoInactivoLabel.includes('mes')) {
    return meses >= 6 ? 'alto' : meses >= 3 ? 'medio' : 'bajo'
  }
  return 'bajo'
}

export function PanelClientesEnRiesgo({ clientes }: { clientes: ClienteRiesgo[] }) {
  // Solo clientes inactivos con historial — al menos 1 caso cerrado y capital histórico
  const enRiesgo = clientes
    .filter(c => !c.ultimoMovimiento || c.casosCerrados > 0)
    .filter(c => c.capitalHistorico > 0 || c.casosTotal >= 2)
    .slice(0, 5)

  if (enRiesgo.length === 0) return null

  return (
    <Card className="bg-white border border-amber-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Clientes en riesgo de perder
        </CardTitle>
        <p className="text-xs text-slate-500">
          Clientes sin actividad reciente que tienen historial con el estudio. Vale la pena recontactarlos.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expedientes</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capital histórico</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Último cierre</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sin actividad</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {enRiesgo.map((c, idx) => {
              const nivel = getNivelRiesgo(c.tiempoInactivoLabel)
              return (
                <tr
                  key={c.id}
                  className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-amber-50/30 transition-colors`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{c.nombre}</span>
                      <span className="text-[10px] text-slate-400">
                        {c.tipoPersona === 'JURIDICA' ? 'Empresa' : 'Persona'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-slate-600">
                    {c.casosTotal} ({c.casosCerrados} cerrado{c.casosCerrados !== 1 ? 's' : ''})
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-medium text-slate-700">
                    {c.capitalHistorico > 0 ? formatMoneyCompact(c.capitalHistorico) : '—'}
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-slate-500">
                    {c.ultimoCierreLabel}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      nivel === 'alto'  ? 'bg-red-50 text-red-700 border border-red-100'
                      : nivel === 'medio' ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.tiempoInactivoLabel}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Link href={`/clientes/${c.id}`} className="text-indigo-600 hover:text-indigo-800">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}