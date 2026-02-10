'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertTriangle, Clock, TrendingUp } from "lucide-react"

interface TiempoPorEtapa {
  etapa: string
  diasPromedio: number
  diasMinimo: number
  diasMaximo: number
  cantidadCasos: number
  porcentajeDelTotal: number
  esCuelloBotella: boolean
}

export function TablaPromediosPorEtapa({ tiempos }: { tiempos: TiempoPorEtapa[] }) {
  if (tiempos.length === 0) {
    return null
  }

  return (
    <Card className="mb-6 border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Clock className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">
              Tiempo Promedio por Etapa Procesal
            </CardTitle>
            <CardDescription>
              Ordenado de mayor a menor duración promedio
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-[40px]">#</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead className="text-center">Promedio</TableHead>
              <TableHead className="text-center">Rango</TableHead>
              <TableHead className="text-center">Casos</TableHead>
              <TableHead className="text-center">% del Total</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiempos.map((etapa, index) => (
              <TableRow 
                key={etapa.etapa}
                className={etapa.esCuelloBotella ? 'bg-amber-50/50' : ''}
              >
                <TableCell className="font-medium text-slate-500">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {etapa.esCuelloBotella && (
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    )}
                    <span className="font-medium text-slate-900">{etapa.etapa}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`text-lg font-bold ${
                    etapa.esCuelloBotella ? 'text-amber-600' : 'text-slate-800'
                  }`}>
                    {etapa.diasPromedio}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">días</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-xs text-slate-500">
                    {etapa.diasMinimo} - {etapa.diasMaximo} días
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs">
                    {etapa.cantidadCasos}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full ${
                          etapa.esCuelloBotella ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(etapa.porcentajeDelTotal, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 w-8">
                      {etapa.porcentajeDelTotal}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {etapa.esCuelloBotella ? (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                      Cuello de Botella
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                      Normal
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
