// app/reportes/tiempo-por-etapa/components/AnalisisPorTipoCaso.tsx
'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Scale, TrendingUp, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import Link from "next/link"

type RangoEstancamiento = 'normal' | 'atencion' | 'demorado' | 'critico'

interface CasoEnEtapa {
  id: string
  numero: string
  titulo: string
  diasEnEstado: number
  diasSinMovimiento: number
  rango: RangoEstancamiento
}

interface DistribucionTipo {
  etapa: string
  cantidad: number
  porcentaje: number
  promedioHistorico: number
  casos: CasoEnEtapa[]
}

interface AnalisisTipo {
  tipo: string
  totalCasos: number
  distribucion: DistribucionTipo[]
}

const tipoConfig: Record<string, { color: string; bgColor: string; borderColor: string; label: string }> = {
  'LABORAL':                      { color: 'text-blue-700',    bgColor: 'bg-blue-50',    borderColor: 'border-blue-200',    label: 'Laboral' },
  'CIVIL_COMERCIAL':              { color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', label: 'Civil y Comercial' },
  'FAMILIA':                      { color: 'text-pink-700',    bgColor: 'bg-pink-50',    borderColor: 'border-pink-200',    label: 'Familia' },
  'SUCESIONES':                   { color: 'text-amber-700',   bgColor: 'bg-amber-50',   borderColor: 'border-amber-200',   label: 'Sucesiones' },
  'CONTENCIOSO_ADMINISTRATIVO':   { color: 'text-purple-700',  bgColor: 'bg-purple-50',  borderColor: 'border-purple-200',  label: 'Contencioso Administrativo' },
  'PENAL':                        { color: 'text-red-700',     bgColor: 'bg-red-50',     borderColor: 'border-red-200',     label: 'Penal' },
  'OTRO':                         { color: 'text-slate-700',   bgColor: 'bg-slate-50',   borderColor: 'border-slate-200',   label: 'Otro' },
}

const getConfig = (tipo: string) => tipoConfig[tipo] || tipoConfig['OTRO']

function EtapaConDesplegable({ dist, totalCasos, index }: { dist: DistribucionTipo; totalCasos: number; index: number }) {
  const [abierto, setAbierto] = useState(false)
  const porcentaje = Math.round((dist.cantidad / totalCasos) * 100)

  return (
    <div className="rounded-lg border bg-white border-slate-200 overflow-hidden">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500 w-6">#{index + 1}</span>
          <span className="font-medium text-slate-800 text-sm">{dist.etapa}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-lg font-bold text-slate-800">{dist.cantidad}</span>
            <span className="text-xs text-slate-500 ml-1">casos</span>
            <span className="text-xs text-slate-400 ml-2">{porcentaje}%</span>
          </div>
          {abierto ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      <div className="px-3 pb-2">
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${porcentaje}%` }} />
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Tiempo promedio histórico: {dist.promedioHistorico > 0 ? `${dist.promedioHistorico} días` : 'Sin datos'}
        </div>
      </div>

      {abierto && dist.casos.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Expedientes en esta etapa</p>
            <div className="space-y-1.5">
              {dist.casos.map(caso => (
                <Link
                  key={caso.id}
                  href={`/casos/${caso.id}`}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-white border border-transparent hover:border-slate-200 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-mono font-medium text-slate-700">{caso.numero}</p>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{caso.titulo}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                        {caso.diasEnEstado}d en etapa
                      </Badge>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {caso.diasSinMovimiento}d sin movimiento
                      </p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AnalisisPorTipoCaso({ datos }: { datos: AnalisisTipo[] }) {
  if (datos.length === 0) return null

  return (
    <Card className="mb-6 border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Scale className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">Análisis por Tipo de Caso</CardTitle>
            <CardDescription>Distribución de etapas según el tipo/fuero del expediente</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {datos.map(analisis => {
            const config = getConfig(analisis.tipo)
            const etapaPrincipal = analisis.distribucion[0]

            return (
              <Card key={analisis.tipo} className={`border ${config.borderColor} ${config.bgColor}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className={`${config.color} ${config.borderColor}`}>{config.label}</Badge>
                    <span className="text-xs text-slate-500">{analisis.totalCasos} casos</span>
                  </div>
                  {etapaPrincipal && (
                    <>
                      <div className="text-xs text-slate-600 mb-1">Etapa con más casos:</div>
                      <div className="font-medium text-slate-900 text-sm">{etapaPrincipal.etapa}</div>
                      <div className="text-xs text-slate-500 mt-1">{etapaPrincipal.cantidad} casos ({etapaPrincipal.porcentaje}%)</div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Tabs defaultValue={datos[0]?.tipo} className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            {datos.map(analisis => (
              <TabsTrigger key={analisis.tipo} value={analisis.tipo} className="text-xs">
                {getConfig(analisis.tipo).label}
              </TabsTrigger>
            ))}
          </TabsList>
          {datos.map(analisis => (
            <TabsContent key={analisis.tipo} value={analisis.tipo}>
              <div className="space-y-3">
                {analisis.distribucion.map((dist, index) => (
                  <EtapaConDesplegable key={dist.etapa} dist={dist} totalCasos={analisis.totalCasos} index={index} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {datos.length > 1 && (
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <p className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Observaciones
            </p>
            <p className="text-sm text-indigo-800">
              Los casos de <strong>{getConfig(datos[0]?.tipo).label}</strong> representan la mayor proporción
              de expedientes activos ({datos[0]?.totalCasos} casos).
              {datos.length > 1 && (
                <> En comparación, <strong>{getConfig(datos[datos.length - 1]?.tipo).label}</strong> tiene {datos[datos.length - 1]?.totalCasos} casos activos.</>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}