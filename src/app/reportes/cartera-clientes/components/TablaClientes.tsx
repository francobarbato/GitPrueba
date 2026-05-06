'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, UserX, ExternalLink, UserPlus } from "lucide-react"
import Link from "next/link"

// ============================================================================
// TIPOS (deben coincidir con page.tsx)
// ============================================================================

type ClienteReporte = {
  id: string
  nombre: string
  tipoPersona: string
  tipoPersonaLabel: string
  antiguedadDias: number
  antiguedadLabel: string
  casosTotal: number
  casosActivos: number
  casosCerrados: number
  capitalEnLitigio: number
  capitalRecuperado: number
  capitalHistorico: number
  ultimoMovimiento: string | null
  ultimoMovimientoLabel: string
  tiempoInactivoLabel: string
  ultimoCierreLabel: string
  abogadoResponsable: string
  estaActivo: boolean
  categoriaCantidad: string
}

type Props = {
  clientesRecurrentes: ClienteReporte[]
  clientesInactivos: ClienteReporte[]
  clientesSinCasos: ClienteReporte[]
  esGerencial: boolean
}

// ============================================================================
// HELPERS
// ============================================================================

const formatMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

const formatMoneyCompact = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return formatMoney(n)
}

const CATEGORIA_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  frecuente: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Frecuente" },
  recurrente: { bg: "bg-blue-50", text: "text-blue-700", label: "Recurrente" },
  unico: { bg: "bg-slate-50", text: "text-slate-600", label: "Único" },
}

const TIPO_BADGES: Record<string, { bg: string; text: string }> = {
  FISICA: { bg: "bg-slate-100", text: "text-slate-600" },
  JURIDICA: { bg: "bg-purple-50", text: "text-purple-700" },
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function TablaClientes({ clientesRecurrentes, clientesInactivos, clientesSinCasos, esGerencial }: Props) {
  const [tabActiva, setTabActiva] = useState<"recurrentes" | "inactivos" | "nuevos">("recurrentes")


  const tabs = [
  {
    key: "recurrentes" as const,
    label: "Clientes con casos en curso",
    icon: <RefreshCw className="w-4 h-4" />,
    count: clientesRecurrentes.length,
  },
  {
    key: "inactivos" as const,
    label: "Clientes sin expedientes activos",
    icon: <UserX className="w-4 h-4" />,
    count: clientesInactivos.length,
  },
  {
    key: "nuevos" as const,
    label: "Clientes sin casos",
    icon: <UserPlus className="w-4 h-4" />,   // agregar UserPlus al import
    count: clientesSinCasos.length,
  },
]

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-0">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTabActiva(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tabActiva === tab.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tabActiva === tab.key ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
          {tabActiva === "recurrentes" && (
              <TablaRecurrentes clientes={clientesRecurrentes} esGerencial={esGerencial} />
            )}
            {tabActiva === "inactivos" && (
              <TablaInactivos clientes={clientesInactivos} esGerencial={esGerencial} />
            )}
            {tabActiva === "nuevos" && (
              <TablaSinCasos clientes={clientesSinCasos} esGerencial={esGerencial} />
            )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// TAB 1: CLIENTES RECURRENTES
// ============================================================================

function TablaRecurrentes({ clientes, esGerencial }: { clientes: ClienteReporte[]; esGerencial: boolean }) {
  if (clientes.length === 0) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No hay clientes recurrentes</p>
        <p className="text-sm text-slate-400 mt-1">
          Los clientes con 2 o más casos aparecerán aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Antigüedad</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Casos</th>
            {esGerencial ? (
              <>
                <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capital en Litigio</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recuperado</th>
              </>
            ) : (
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Abogado Resp.</th>
            )}
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Último Mov.</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"></th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c, idx) => {
            const catBadge = CATEGORIA_BADGES[c.categoriaCantidad] || CATEGORIA_BADGES.unico
            const tipoBadge = TIPO_BADGES[c.tipoPersona] || TIPO_BADGES.FISICA

            return (
              <tr
                key={c.id}
                className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/30 transition-colors`}
              >
                {/* Nombre + badge categoría */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{c.nombre}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${catBadge.bg} ${catBadge.text}`}>
                      {catBadge.label}
                    </span>
                  </div>
                </td>

                {/* Tipo persona */}
                <td className="px-3 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${tipoBadge.bg} ${tipoBadge.text}`}>
                    {c.tipoPersona === "JURIDICA" ? "Empresa" : "Persona"}
                  </span>
                </td>

                {/* Antigüedad */}
                <td className="px-3 py-3 text-center text-xs text-slate-600">{c.antiguedadLabel}</td>

                {/* Casos total / activos */}
                <td className="px-3 py-3 text-center">
                  <span className="text-sm font-medium text-slate-700">{c.casosTotal}</span>
                  {c.casosActivos > 0 && (
                    <span className="text-[10px] text-emerald-600 ml-1">({c.casosActivos} activos)</span>
                  )}
                </td>

                {/* Columnas condicionales por rol */}
                {esGerencial ? (
                  <>
                    <td className="px-3 py-3 text-right text-xs font-medium text-slate-700">
                      {c.capitalEnLitigio > 0 ? formatMoneyCompact(c.capitalEnLitigio) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-slate-600">
                      {c.capitalRecuperado > 0 ? formatMoneyCompact(c.capitalRecuperado) : "—"}
                    </td>
                  </>
                ) : (
                  <td className="px-3 py-3 text-left text-xs text-slate-600">{c.abogadoResponsable}</td>
                )}

                {/* Último movimiento */}
                <td className="px-3 py-3 text-center text-xs text-slate-500">{c.ultimoMovimientoLabel}</td>

                {/* Acción */}
                <td className="px-3 py-3 text-center">
                  <Link
                    href={`/clientes/${c.id}`}
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
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
// TAB 2: CLIENTES INACTIVOS
// ============================================================================

function TablaInactivos({ clientes, esGerencial }: { clientes: ClienteReporte[]; esGerencial: boolean }) {
  if (clientes.length === 0) {
    return (
      <div className="p-8 text-center">
        <UserX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No hay clientes inactivos</p>
        <p className="text-sm text-slate-400 mt-1">
          Todos los clientes con casos tienen al menos uno activo.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Casos Cerrados</th>
            {esGerencial ? (
              <>
                <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capital Histórico</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recuperado</th>
              </>
            ) : (
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Abogado Resp.</th>
            )}
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Último Cierre</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiempo Inactivo</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"></th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c, idx) => {
            const tipoBadge = TIPO_BADGES[c.tipoPersona] || TIPO_BADGES.FISICA

            return (
              <tr
                key={c.id}
                className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/30 transition-colors`}
              >
                {/* Nombre */}
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800 text-sm">{c.nombre}</p>
                </td>

                {/* Tipo */}
                <td className="px-3 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${tipoBadge.bg} ${tipoBadge.text}`}>
                    {c.tipoPersona === "JURIDICA" ? "Empresa" : "Persona"}
                  </span>
                </td>

                {/* Casos cerrados */}
                <td className="px-3 py-3 text-center font-medium text-slate-700">{c.casosCerrados}</td>

                {/* Columnas condicionales */}
                {esGerencial ? (
                  <>
                    <td className="px-3 py-3 text-right text-xs font-medium text-slate-700">
                      {c.capitalHistorico > 0 ? formatMoneyCompact(c.capitalHistorico) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-slate-600">
                      {c.capitalRecuperado > 0 ? formatMoneyCompact(c.capitalRecuperado) : "—"}
                    </td>
                  </>
                ) : (
                  <td className="px-3 py-3 text-left text-xs text-slate-600">{c.abogadoResponsable}</td>
                )}

                {/* Último cierre */}
                <td className="px-3 py-3 text-center text-xs text-slate-500">{c.ultimoCierreLabel}</td>

                {/* Tiempo inactivo */}
                <td className="px-3 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    parseInt(c.tiempoInactivoLabel) >= 12 || c.tiempoInactivoLabel.includes("año")
                      ? "bg-red-50 text-red-700"
                      : c.tiempoInactivoLabel.includes("mes")
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {c.tiempoInactivoLabel}
                  </span>
                </td>

                {/* Acción */}
                <td className="px-3 py-3 text-center">
                  <Link
                    href={`/clientes/${c.id}`}
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// TABLA DE CLIENTES SIN CASOS
  function TablaSinCasos({ clientes, esGerencial }: { clientes: ClienteReporte[]; esGerencial: boolean }) {
  if (clientes.length === 0) {
    return (
      <div className="p-8 text-center">
        <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No hay clientes sin casos</p>
        <p className="text-sm text-slate-400 mt-1">
          Todos los clientes registrados tienen al menos un caso asociado.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Antigüedad</th>
            {esGerencial && (
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Abogado Resp.</th>
            )}
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Registrado</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"></th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c, idx) => {
            const tipoBadge = TIPO_BADGES[c.tipoPersona] || TIPO_BADGES.FISICA
            return (
              <tr
                key={c.id}
                className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/30 transition-colors`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800 text-sm">{c.nombre}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                      Nuevo
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${tipoBadge.bg} ${tipoBadge.text}`}>
                    {c.tipoPersona === "JURIDICA" ? "Empresa" : "Persona"}
                  </span>
                </td>
                <td className="px-3 py-3 text-center text-xs text-slate-600">{c.antiguedadLabel}</td>
                {esGerencial && (
                  <td className="px-3 py-3 text-left text-xs text-slate-600">{c.abogadoResponsable}</td>
                )}
                <td className="px-3 py-3 text-center text-xs text-slate-400">
                  Sin casos registrados
                </td>
                <td className="px-3 py-3 text-center">
                  <Link href={`/clientes/${c.id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}