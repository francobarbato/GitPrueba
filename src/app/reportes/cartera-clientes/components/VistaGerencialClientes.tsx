'use client'

// app/reportes/cartera-clientes/components/VistaGerencialClientes.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Clock, BarChart3, ExternalLink } from "lucide-react"
import Link from "next/link"

// ============================================================================
// TIPOS
// ============================================================================

export type ClienteGerencial = {
  id: string
  nombre: string
  tipoPersona: string
  antiguedadDias: number
  antiguedadLabel: string
  casosTotal: number
  casosActivos: number
  capitalEnLitigio: number
  capitalRecuperado: number
  capitalHistorico: number
  estaActivo: boolean
  abogadoResponsable: string
  abogadoResponsableId: string
  categoriaCantidad: string
}

export type DistribucionAbogado = {
  id: string
  nombre: string
  clientesActivos: number
  capitalEnLitigio: number
  totalClientes: number
}

// ============================================================================
// HELPERS
// ============================================================================

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

// ============================================================================
// TOP CLIENTES DEL ESTUDIO
// ============================================================================

function TopClientesEstudio({ clientes }: { clientes: ClienteGerencial[] }) {
  const top = clientes
    .filter(c => c.capitalEnLitigio > 0 && c.estaActivo)
    .sort((a, b) => b.capitalEnLitigio - a.capitalEnLitigio)
    .slice(0, 8)

  if (top.length === 0) return null

  const maxCapital = top[0].capitalEnLitigio

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Top clientes del estudio
        </CardTitle>
        <p className="text-xs text-slate-500">
          Clientes con mayor capital activo en el estudio ahora mismo.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.map((c, idx) => {
          const pct = maxCapital > 0 ? Math.round((c.capitalEnLitigio / maxCapital) * 100) : 0
          const badge = CATEGORIA_BADGES[c.categoriaCantidad] || CATEGORIA_BADGES.unico

          return (
            <div key={c.id} className="flex items-center gap-3">
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                idx === 0 ? 'bg-amber-100 text-amber-700'
                : idx === 1 ? 'bg-slate-200 text-slate-600'
                : idx === 2 ? 'bg-orange-100 text-orange-600'
                : 'bg-slate-100 text-slate-500'
              }`}>
                {idx + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-slate-800 text-sm truncate">{c.nombre}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">{c.abogadoResponsable}</span>
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
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// CLIENTES CON MAYOR ANTIGÜEDAD Y CONTINUIDAD
// ============================================================================

function ClientesAntiguosContinuos({ clientes }: { clientes: ClienteGerencial[] }) {
  const top = clientes
    .filter(c => c.estaActivo && c.antiguedadDias > 180)
    .sort((a, b) => b.antiguedadDias - a.antiguedadDias)
    .slice(0, 6)

  if (top.length === 0) return null

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Clientes más antiguos con actividad continua
        </CardTitle>
        <p className="text-xs text-slate-500">
          Los clientes con mayor antigüedad que siguen activos en el estudio — indicador de fidelización.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Antigüedad</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Casos totales</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Activos ahora</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capital activo</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Abogado</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {top.map((c, idx) => {
              const badge = CATEGORIA_BADGES[c.categoriaCantidad] || CATEGORIA_BADGES.unico
              return (
                <tr
                  key={c.id}
                  className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/20 transition-colors`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{c.nombre}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-medium text-indigo-700">
                    {c.antiguedadLabel}
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-slate-600">{c.casosTotal}</td>
                  <td className="px-3 py-3 text-center text-xs text-emerald-600 font-medium">{c.casosActivos}</td>
                  <td className="px-3 py-3 text-right text-xs font-medium text-slate-700">
                    {c.capitalEnLitigio > 0 ? formatMoneyCompact(c.capitalEnLitigio) : '—'}
                  </td>
                  <td className="px-3 py-3 text-left text-xs text-slate-500">{c.abogadoResponsable}</td>
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

// ============================================================================
// DISTRIBUCIÓN DE CARTERA POR ABOGADO
// ============================================================================

function DistribucionCarteraAbogado({ distribucion }: { distribucion: DistribucionAbogado[] }) {
  if (distribucion.length === 0) return null

  const maxCapital = Math.max(...distribucion.map(d => d.capitalEnLitigio), 1)
  const totalCapital = distribucion.reduce((s, d) => s + d.capitalEnLitigio, 0)

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Distribución de cartera por abogado
        </CardTitle>
        <p className="text-xs text-slate-500">
          Capital activo en litigio por abogado responsable.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {distribucion
          .sort((a, b) => b.capitalEnLitigio - a.capitalEnLitigio)
          .map(d => {
            const pct = totalCapital > 0 ? Math.round((d.capitalEnLitigio / totalCapital) * 100) : 0
            const barPct = maxCapital > 0 ? Math.round((d.capitalEnLitigio / maxCapital) * 100) : 0

            return (
              <div key={d.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-700 text-sm">{d.nombre}</span>
                    <span className="text-xs text-slate-400">
                      {d.clientesActivos} cliente{d.clientesActivos !== 1 ? 's' : ''} activo{d.clientesActivos !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{pct}%</span>
                    <span className="text-sm font-bold text-slate-800">
                      {formatMoneyCompact(d.capitalEnLitigio)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            )
          })}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function VistaGerencialClientes({
  clientes,
  distribucion,
}: {
  clientes: ClienteGerencial[]
  distribucion: DistribucionAbogado[]
}) {
  if (clientes.length === 0) {
    return (
      <div className="p-12 bg-white border border-slate-200 rounded-lg text-center">
        <p className="text-lg font-medium text-slate-600">Sin datos para la vista general</p>
        <p className="text-sm text-slate-400 mt-2">No hay clientes registrados en el sistema.</p>
      </div>
    )
  }

  return (
    <div>
      <TopClientesEstudio clientes={clientes} />
      <ClientesAntiguosContinuos clientes={clientes} />
      <DistribucionCarteraAbogado distribucion={distribucion} />
    </div>
  )
}