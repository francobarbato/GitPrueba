'use client'

// app/reportes/tiempo-por-etapa/components/CasosAgrupadosPorEtapa.tsx

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChevronDown, ChevronUp, ExternalLink, Layers } from "lucide-react"
import Link from "next/link"

// ============================================================================
// ORDEN PROCESAL — los grupos se muestran en este orden
// ============================================================================

export const ORDEN_ETAPAS = [
  'Inicio / Demanda',
  'Mediación / Previo',
  'Prueba (Oficios/Pericias)',
  'Alegatos / Conclusiones',
  'Sentencia de 1ra Instancia',
  'Apelación / 2da Instancia',
  'Ejecución de Sentencia',
]

// ============================================================================
// TIPOS
// ============================================================================

export type CasoEnEtapa = {
  id: string
  numero: string
  titulo: string
  tipo: string
  diasTotales: number        // desde fechaInicio del caso
  diasEnEstado: number       // desde fechaUltimoCambioEstado
}

export type GrupoEtapa = {
  etapa: string
  casos: CasoEnEtapa[]
}

type Props = {
  grupos: GrupoEtapa[]
  totalCasos: number
}

// ============================================================================
// CONFIG FUEROS
// ============================================================================

const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  LABORAL:                    { label: 'Laboral',              color: 'bg-blue-100 text-blue-700' },
  CIVIL_COMERCIAL:            { label: 'Civil y Comercial',    color: 'bg-emerald-100 text-emerald-700' },
  FAMILIA:                    { label: 'Familia',              color: 'bg-pink-100 text-pink-700' },
  SUCESIONES:                 { label: 'Sucesiones',           color: 'bg-amber-100 text-amber-700' },
  CONTENCIOSO_ADMINISTRATIVO: { label: 'Cont. Administrativo', color: 'bg-purple-100 text-purple-700' },
  PENAL:                      { label: 'Penal',                color: 'bg-red-100 text-red-700' },
  OTRO:                       { label: 'Otro',                 color: 'bg-slate-100 text-slate-600' },
}

function getTipoConfig(tipo: string) {
  return TIPO_CONFIG[tipo] || TIPO_CONFIG.OTRO
}

// ============================================================================
// GRUPO COLAPSABLE
// ============================================================================

function GrupoEtapaItem({ grupo, totalCasos }: { grupo: GrupoEtapa; totalCasos: number }) {
  const [abierto, setAbierto] = useState(false)
  const pct = totalCasos > 0 ? Math.round((grupo.casos.length / totalCasos) * 100) : 0

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-800 text-sm">{grupo.etapa}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700">
            {grupo.casos.length}
            <span className="text-xs font-normal text-slate-400 ml-1">
              caso{grupo.casos.length !== 1 ? 's' : ''} · {pct}%
            </span>
          </span>
          {abierto
            ? <ChevronUp className="h-4 w-4 text-slate-400" />
            : <ChevronDown className="h-4 w-4 text-slate-400" />
          }
        </div>
      </button>

      {/* Barra proporcional */}
      <div className="px-4 pb-2">
        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
          <div
            className="h-1 rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Tabla de casos */}
      {abierto && (
        <div className="border-t border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Expediente
                </th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Fuero
                </th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Días en etapa
                </th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Días totales
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {grupo.casos.map((caso, idx) => {
                const tipoConf = getTipoConfig(caso.tipo)
                return (
                  <tr
                    key={caso.id}
                    className={`border-b border-slate-50 last:border-0 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    } hover:bg-indigo-50/20 transition-colors`}
                  >
                    {/* Expediente */}
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-mono font-medium text-slate-600">{caso.numero}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[260px]">{caso.titulo}</p>
                    </td>

                    {/* Fuero */}
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${tipoConf.color}`}>
                        {tipoConf.label}
                      </span>
                    </td>

                    {/* Días en etapa */}
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-sm font-bold text-indigo-700">{caso.diasEnEstado}</span>
                      <span className="text-xs text-slate-400 ml-1">días</span>
                    </td>

                    {/* Días totales desde inicio */}
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-sm font-bold text-slate-600">{caso.diasTotales}</span>
                      <span className="text-xs text-slate-400 ml-1">días</span>
                    </td>

                    {/* Link */}
                    <td className="px-3 py-2.5 text-center">
                      <Link
                        href={`/casos/${caso.id}`}
                        className="text-indigo-600 hover:text-indigo-800"
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
      )}
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function CasosAgrupadosPorEtapa({ grupos, totalCasos }: Props) {
  if (grupos.length === 0) return null

  // Ordenar grupos según orden procesal — etapas no reconocidas van al final
  const gruposOrdenados = [...grupos].sort((a, b) => {
    const ia = ORDEN_ETAPAS.indexOf(a.etapa)
    const ib = ORDEN_ETAPAS.indexOf(b.etapa)
    if (ia === -1 && ib === -1) return a.etapa.localeCompare(b.etapa)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  return (
    <Card className="mb-6 border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Layers className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                Casos activos por etapa
              </CardTitle>
              <CardDescription>
                ¿En qué etapa están los casos y cuánto tiempo llevan ahí?
              </CardDescription>
            </div>
          </div>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
            {totalCasos} caso{totalCasos !== 1 ? 's' : ''} activo{totalCasos !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {gruposOrdenados.map(grupo => (
          <GrupoEtapaItem key={grupo.etapa} grupo={grupo} totalCasos={totalCasos} />
        ))}
      </CardContent>
    </Card>
  )
}