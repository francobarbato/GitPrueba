'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Scale,
  AlertTriangle,
  Clock,
  TrendingUp
} from "lucide-react"

interface TiempoPorEtapa {
  etapa: string
  diasPromedio: number
  diasMinimo: number
  diasMaximo: number
  cantidadCasos: number
  porcentajeDelTotal: number
  esCuelloBotella: boolean
}

interface TiempoPorTipoCaso {
  tipoCaso: string
  etapas: TiempoPorEtapa[]
  tiempoTotalPromedio: number
  cantidadCasos: number
}

// Mapeo de tipos a colores e iconos
const tipoConfig: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  'LABORAL': { color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  'CIVIL': { color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'COMERCIAL': { color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  'FAMILIA': { color: 'text-pink-700', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  'PENAL': { color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  'SUCESIONES': { color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  'OTRO': { color: 'text-slate-700', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
}

const getConfigForTipo = (tipo: string) => {
  return tipoConfig[tipo] || tipoConfig['OTRO']
}

export function ComparativaPorTipo({ datos }: { datos: TiempoPorTipoCaso[] }) {
  if (datos.length === 0) {
    return null
  }

  return (
    <Card className="mb-6 border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Scale className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">
              Comparativa por Tipo de Caso
            </CardTitle>
            <CardDescription>
              Análisis de tiempos según la materia/fuero del expediente
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        
        {/* Vista de tarjetas resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {datos.map(tipo => {
            const config = getConfigForTipo(tipo.tipoCaso)
            const etapaCuello = tipo.etapas.find(e => e.esCuelloBotella)
            
            return (
              <Card 
                key={tipo.tipoCaso} 
                className={`border ${config.borderColor} ${config.bgColor}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className={`${config.color} ${config.borderColor}`}>
                      {tipo.tipoCaso}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {tipo.cantidadCasos} casos
                    </span>
                  </div>
                  
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-3xl font-bold ${config.color}`}>
                      {tipo.tiempoTotalPromedio}
                    </span>
                    <span className="text-sm text-slate-500">días promedio</span>
                  </div>

                  {/* Etapa más lenta */}
                  <div className="text-xs text-slate-600 mb-2">
                    <span className="font-medium">Etapa más lenta:</span>{' '}
                    {tipo.etapas[0]?.etapa || 'N/A'} ({tipo.etapas[0]?.diasPromedio || 0}d)
                  </div>

                  {/* Indicador de cuello de botella */}
                  {etapaCuello && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 mt-2 pt-2 border-t border-amber-200/50">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Cuello en: {etapaCuello.etapa}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabs con detalle por tipo */}
        <Tabs defaultValue={datos[0]?.tipoCaso} className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            {datos.map(tipo => (
              <TabsTrigger 
                key={tipo.tipoCaso} 
                value={tipo.tipoCaso}
                className="text-xs"
              >
                {tipo.tipoCaso}
              </TabsTrigger>
            ))}
          </TabsList>

          {datos.map(tipo => (
            <TabsContent key={tipo.tipoCaso} value={tipo.tipoCaso}>
              <div className="space-y-3">
                {tipo.etapas.map((etapa, index) => (
                  <div 
                    key={etapa.etapa}
                    className={`p-3 rounded-lg border ${
                      etapa.esCuelloBotella 
                        ? 'bg-amber-50 border-amber-200' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 w-6">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-slate-800">
                          {etapa.etapa}
                        </span>
                        {etapa.esCuelloBotella && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            Cuello
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-slate-800">
                          {etapa.diasPromedio}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">días</span>
                      </div>
                    </div>
                    
                    {/* Barra de progreso */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full ${
                            etapa.esCuelloBotella ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${etapa.porcentajeDelTotal}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-10 text-right">
                        {etapa.porcentajeDelTotal}%
                      </span>
                    </div>
                    
                    <div className="mt-1 text-xs text-slate-500">
                      Rango: {etapa.diasMinimo} - {etapa.diasMaximo} días | {etapa.cantidadCasos} casos analizados
                    </div>
                  </div>
                ))}

                {tipo.etapas.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No hay datos suficientes para este tipo de caso
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Insights automáticos */}
        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
          <p className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights Detectados
          </p>
          <ul className="text-sm text-indigo-800 space-y-1">
            {datos.length > 0 && (
              <li>
                • Los casos de <strong>{datos[0].tipoCaso}</strong> tienen el mayor tiempo promedio total ({datos[0].tiempoTotalPromedio} días)
              </li>
            )}
            {datos.length > 1 && (
              <li>
                • Los casos de <strong>{datos[datos.length - 1].tipoCaso}</strong> son los más rápidos ({datos[datos.length - 1].tiempoTotalPromedio} días)
              </li>
            )}
            {datos.some(t => t.etapas.some(e => e.esCuelloBotella)) && (
              <li>
                • Se detectaron cuellos de botella en: {' '}
                <strong>
                  {datos
                    .filter(t => t.etapas.some(e => e.esCuelloBotella))
                    .map(t => t.tipoCaso)
                    .join(', ')}
                </strong>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
