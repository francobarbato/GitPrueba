'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react"

interface TiempoEtapa {
  estado: string
  dias: number
  porcentaje: number
  fechaInicio: Date
  fechaFin: Date
  esActual: boolean
  esDemorado: boolean
  tiempoEsperado?: number
  desvio?: number
}

interface Metricas  {
  etapaMasLarga: TiempoEtapa
  etapaConMayorDesvio: TiempoEtapa | null
  promedioRealPorEtapa: number
  promedioEsperadoGeneral: number | null
  desvioGeneral: number | null
  etapasCompletadas: number
  etapasConDemora: number
}

interface DatosReporte  {
  tiempos: TiempoEtapa[]
  totalDias: number
  metricas: Metricas
}

interface Caso  {
  numero: string
  titulo: string
  estado: string
  tipo: string
  cliente: { nombre: string; apellido: string | null } | null
}

function formatearFecha(fecha: Date): string {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function TimelineChartMejorado({ datos, caso }: { datos: DatosReporte; caso: Caso }) {

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
      
      {/* Columna Principal: Timeline */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Timeline de Etapas */}
        <Card className="shadow-md border-slate-200">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">
                    Timeline de Etapas Procesales
                  </CardTitle>
                  <CardDescription>
                    Distribución temporal con comparativa vs promedio del estudio
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {datos.tiempos.map((etapa, index) => {
                const tieneDesvio = etapa.desvio !== undefined && etapa.desvio !== null
                const desvioPositivo = tieneDesvio && etapa.desvio! > 0
                const desvioSignificativo = tieneDesvio && Math.abs(etapa.desvio!) > (etapa.tiempoEsperado || 0) * 0.2

                return (
                  <div key={index} className="relative group">
                    {/* Header de la etapa */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        {etapa.esActual ? (
                          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        ) : etapa.esDemorado ? (
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800 text-base">
                              {etapa.estado}
                            </span>
                            
                            {etapa.esActual && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                EN CURSO
                              </Badge>
                            )}
                            
                            {etapa.esDemorado && !etapa.esActual && (
                              <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                                DEMORADA
                              </Badge>
                            )}
                          </div>
                          
                          {/* Fechas */}
                          <p className="text-xs text-slate-500 mt-1">
                            {formatearFecha(etapa.fechaInicio)} → {formatearFecha(etapa.fechaFin)}
                          </p>
                        </div>
                      </div>

                      {/* Días y comparación */}
                      <div className="text-right ml-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-800">
                            {etapa.dias}
                          </span>
                          <span className="text-sm text-slate-500">días</span>
                        </div>
                        
                        {etapa.tiempoEsperado && (
                          <div className="mt-1 text-xs text-slate-500">
                            Esperado: {etapa.tiempoEsperado}d
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso con comparación */}
                    <div className="space-y-2">
                      {/* Barra principal */}
                      <div className="relative">
                        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-4 rounded-full transition-all duration-500 ${
                              etapa.esDemorado 
                                ? 'bg-amber-500' 
                                : etapa.esActual 
                                ? 'bg-blue-500' 
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${etapa.porcentaje}%` }}
                          ></div>
                        </div>
                        
                        {/* Indicador de tiempo esperado */}
                        {etapa.tiempoEsperado && etapa.porcentaje > 0 && (
                          <div 
                            className="absolute top-0 h-4 w-0.5 bg-slate-400"
                            style={{ 
                              left: `${Math.min(
                                (etapa.tiempoEsperado / datos.totalDias) * 100, 
                                100
                              )}%` 
                            }}
                            title={`Tiempo esperado: ${etapa.tiempoEsperado} días`}
                          />
                        )}
                      </div>

                      {/* Información de desvío */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          {etapa.porcentaje}% del tiempo total
                        </span>
                        
                        {tieneDesvio && desvioSignificativo && (
                          <div className={`flex items-center gap-1 font-semibold ${
                            desvioPositivo ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {desvioPositivo ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {desvioPositivo ? '+' : ''}{etapa.desvio}d vs esperado
                          </div>
                        )}
                        
                        {tieneDesvio && !desvioSignificativo && Math.abs(etapa.desvio!) > 0 && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Minus className="w-3 h-3" />
                            Dentro del rango normal
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Separador entre etapas */}
                    {index < datos.tiempos.length - 1 && (
                      <div className="flex items-center gap-2 my-4">
                        <div className="flex-1 border-t border-dashed border-slate-200"></div>
                        <span className="text-xs text-slate-400">↓</span>
                        <div className="flex-1 border-t border-dashed border-slate-200"></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ranking de Etapas */}
        <Card className="shadow-md border-slate-200">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-bold text-slate-800">
              Ranking de Duración por Etapa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[...datos.tiempos]
                .sort((a, b) => b.dias - a.dias)
                .slice(0, 5)
                .map((etapa, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-slate-200 text-slate-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{etapa.estado}</p>
                      <p className="text-xs text-slate-500">{etapa.porcentaje}% del total</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-800">{etapa.dias}</p>
                      <p className="text-xs text-slate-500">días</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Columna Lateral: Métricas y Resumen */}
      <div className="space-y-6">
        
        {/* Resumen del Caso */}
        <Card className="shadow-md border-slate-200 bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-slate-800">
              Expediente Analizado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Número</p>
              <p className="font-mono text-sm font-bold text-slate-800">
                {caso.numero}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Carátula</p>
              <p className="text-sm text-slate-700 line-clamp-2">
                {caso.titulo}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Tipo</p>
                <Badge variant="outline" className="text-xs">
                  {caso.tipo}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Estado</p>
                <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {caso.estado}
                </Badge>
              </div>
            </div>
            {caso.cliente && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Cliente</p>
                <p className="text-sm text-slate-700">
                  {caso.cliente.nombre} {caso.cliente.apellido}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Métricas Clave */}
        <Card className="shadow-md border-slate-200">
          <CardHeader className="pb-4 border-b bg-slate-50/50">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Métricas Clave
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            
            {/* Tiempo Total */}
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-xs text-slate-600 mb-1">Tiempo Total del Caso</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-indigo-600">
                  {datos.totalDias}
                </span>
                <span className="text-sm text-slate-600">días</span>
              </div>
            </div>

            {/* Etapas Completadas */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Etapas Completadas</span>
              <span className="text-xl font-bold text-emerald-600">
                {datos.metricas.etapasCompletadas}
              </span>
            </div>

            {/* Etapas con Demora */}
            {datos.metricas.etapasConDemora > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Etapas Demoradas
                </span>
                <span className="text-xl font-bold text-amber-600">
                  {datos.metricas.etapasConDemora}
                </span>
              </div>
            )}

            {/* Promedio Real */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Promedio por Etapa</span>
              <div className="text-right">
                <span className="text-lg font-bold text-slate-800">
                  {datos.metricas.promedioRealPorEtapa}
                </span>
                <span className="text-xs text-slate-500 ml-1">días</span>
              </div>
            </div>

            {/* Comparación con Estudio */}
            {datos.metricas.promedioEsperadoGeneral && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-2">Promedio del Estudio</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-700">
                    {datos.metricas.promedioEsperadoGeneral}
                  </span>
                  <span className="text-xs text-slate-500">días</span>
                </div>
                {datos.metricas.desvioGeneral !== null && (
                  <p className={`text-xs font-semibold mt-1 ${
                    datos.metricas.desvioGeneral > 20 ? 'text-red-600' :
                    datos.metricas.desvioGeneral > 0 ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                    {datos.metricas.desvioGeneral > 0 ? '+' : ''}
                    {datos.metricas.desvioGeneral}% de diferencia
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas y Observaciones */}
        {(datos.metricas.etapaConMayorDesvio || datos.metricas.etapasConDemora > 0) && (
          <Card className="shadow-md border-amber-200 bg-amber-50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Puntos de Atención
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {datos.metricas.etapaMasLarga && (
                <div className="text-sm">
                  <p className="font-semibold text-amber-900">Etapa más extensa:</p>
                  <p className="text-amber-800">
                    {datos.metricas.etapaMasLarga.estado} ({datos.metricas.etapaMasLarga.dias} días)
                  </p>
                </div>
              )}
              
              {datos.metricas.etapaConMayorDesvio && (
                <div className="text-sm">
                  <p className="font-semibold text-amber-900">Mayor desvío detectado:</p>
                  <p className="text-amber-800">
                    {datos.metricas.etapaConMayorDesvio.estado} 
                    ({datos.metricas.etapaConMayorDesvio.desvio! > 0 ? '+' : ''}
                    {datos.metricas.etapaConMayorDesvio.desvio} días vs esperado)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}