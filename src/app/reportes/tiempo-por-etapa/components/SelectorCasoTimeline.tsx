// app/reportes/tiempo-por-etapa/components/SelectorCasoTimeline.tsx
'use client'

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Timer, TrendingUp, Clock, FileText } from "lucide-react"

type RangoEstancamiento = 'normal' | 'atencion' | 'demorado' | 'critico'

interface CasoSimple {
  id: string
  numero: string
  titulo: string
  estado: string
  cliente: { nombre: string; apellido: string | null } | null
  diasSinMovimiento: number
  rango: RangoEstancamiento
}

interface TimelineEtapa {
  estado: string
  dias: number
  porcentaje: number
  esActual: boolean
}

interface CasoTimeline {
  id: string
  numero: string
  titulo: string
  estado: string
  tipo: string
  totalDias: number
  tiempos: TimelineEtapa[]
}

export function SelectorCasoTimeline({
  casos,
  casoActual,
  timelineCaso
}: {
  casos: CasoSimple[]
  casoActual?: string
  timelineCaso: CasoTimeline | null
}) {
  const router = useRouter()

  const handleChange = (casoId: string) => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set('casoId', casoId)
    router.push(`?${searchParams.toString()}`)
  }

  const casoSeleccionado = casos.find(c => c.id === casoActual)

  return (
    <Card className="mb-6 border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">
              Detalle de Expediente Individual
            </CardTitle>
            <CardDescription>
              Seleccioná un caso para ver su cronología de estados
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">

        {/* Selector */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2 bg-indigo-50 rounded-full text-indigo-600 hidden sm:block">
            <Search className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
              Buscar expediente
            </label>
            <Select value={casoActual} onValueChange={handleChange}>
              <SelectTrigger className="w-full border-slate-200 focus:ring-indigo-500">
                <SelectValue placeholder="Buscar por carátula o número..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {casos.map(caso => (
                  <SelectItem key={caso.id} value={caso.id}>
                    <div className="flex flex-col text-left">
                      <span className="font-medium text-slate-800 truncate max-w-[280px] sm:max-w-md">
                        {caso.titulo}
                      </span>
                      <span className="text-xs text-slate-500">
                        {caso.numero} • {caso.cliente?.nombre} {caso.cliente?.apellido || ''} • {caso.diasSinMovimiento}d sin movimiento
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Timeline del caso seleccionado */}
        {!casoActual && (
          <div className="text-center py-8 text-slate-400">
            <Search className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">Seleccioná un expediente para ver su cronología</p>
          </div>
        )}

        {casoActual && !timelineCaso && (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No se encontró el caso seleccionado</p>
          </div>
        )}

        {timelineCaso && (
          <div className="space-y-6 animate-in fade-in-50">

            {/* Info del caso seleccionado */}
            {casoSeleccionado && (
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 flex items-center justify-between">
                <span>
                  <strong>{casoSeleccionado.numero}</strong> · {casoSeleccionado.estado}
                </span>
                <span className="text-xs text-slate-400">
                  {casoSeleccionado.diasSinMovimiento} días sin movimiento
                </span>
              </div>
            )}

            {/* KPIs del caso */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-lg border border-blue-100 bg-blue-50/30">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Tiempo Total</p>
                  <p className="text-xl font-bold text-slate-800">{timelineCaso.totalDias} días</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg border border-emerald-100 bg-emerald-50/30">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Etapa Actual</p>
                  <p className="text-sm font-bold text-slate-800 truncate max-w-[150px]" title={timelineCaso.estado}>
                    {timelineCaso.estado}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg border border-slate-100">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Etapas Transitadas</p>
                  <p className="text-xl font-bold text-slate-800">{timelineCaso.tiempos.length}</p>
                </div>
              </div>
            </div>

            {/* Stepper vertical */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-4">
                Cronología de Estados — {timelineCaso.numero}
              </h3>

              <div className="relative border-l-2 border-slate-200 ml-3 space-y-0">
                {timelineCaso.tiempos.map((etapa, index) => {
                  const esActual = etapa.esActual
                  const esLargo = etapa.porcentaje > 40

                  return (
                    <div key={index} className="relative pl-8 pb-8 last:pb-0">
                      <span className={`absolute -left-[9px] top-0 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${
                        esActual ? "bg-blue-600" : "bg-slate-400"
                      }`}>
                        {esActual && <span className="h-2 w-2 rounded-full bg-white" />}
                      </span>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 -mt-1">
                        <div>
                          <h4 className={`text-sm font-bold ${esActual ? "text-blue-700" : "text-slate-700"}`}>
                            {etapa.estado}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] font-normal text-slate-500 bg-slate-100">
                              {etapa.porcentaje}% del tiempo total
                            </Badge>
                            {esActual && (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px]">
                                Actual
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 sm:mt-0 text-right">
                          <span className={`block text-lg font-bold ${esLargo ? 'text-amber-600' : 'text-slate-700'}`}>
                            {etapa.dias === 0 ? '<1' : etapa.dias}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            {etapa.dias === 1 ? 'Día' : 'Días'}
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-50 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            esActual ? "bg-blue-500" : esLargo ? "bg-amber-400" : "bg-emerald-400"
                          }`}
                          style={{ width: `${Math.max(etapa.porcentaje, 5)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}