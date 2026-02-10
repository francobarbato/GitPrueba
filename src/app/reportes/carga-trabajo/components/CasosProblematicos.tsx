'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  Clock, 
  ArrowRightLeft,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface CasoProblematico {
  id: string
  numero: string
  titulo: string
  abogadoNombre: string
  abogadoId: string
  diasInactivo: number
  ultimaAccion: Date
}

const getSeveridad = (dias: number) => {
  if (dias > 90) return { label: 'CRÍTICO', color: 'bg-rose-100 text-rose-700 border-rose-200' }
  if (dias > 60) return { label: 'GRAVE', color: 'bg-amber-100 text-amber-700 border-amber-200' }
  return { label: 'ATENCIÓN', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
}

export function CasosProblematicos({ data }: { data: CasoProblematico[] }) {
  // Contar por severidad
  const criticos = data.filter(c => c.diasInactivo > 90).length
  const graves = data.filter(c => c.diasInactivo > 60 && c.diasInactivo <= 90).length

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                Gestión de Casos Problemáticos
              </CardTitle>
              <CardDescription>
                Casos con más de 45 días sin movimiento - Requieren acción
              </CardDescription>
            </div>
          </div>

          {/* Indicadores de severidad */}
          <div className="flex items-center gap-2">
            {criticos > 0 && (
              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs">
                {criticos} críticos
              </Badge>
            )}
            {graves > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                {graves} graves
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <th className="px-6 py-4 text-left font-semibold">Expediente</th>
                <th className="px-6 py-4 text-left font-semibold">Responsable</th>
                <th className="px-6 py-4 text-center font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Tiempo Inactivo
                  </div>
                </th>
                <th className="px-6 py-4 text-center font-semibold">Última Acción</th>
                <th className="px-6 py-4 text-center font-semibold">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((caso) => {
                const severidad = getSeveridad(caso.diasInactivo)
                
                return (
                  <tr 
                    key={caso.id} 
                    className={`hover:bg-slate-50 transition ${
                      caso.diasInactivo > 90 ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    {/* Expediente */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 line-clamp-1">
                          {caso.titulo}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {caso.numero}
                        </p>
                      </div>
                    </td>

                    {/* Responsable */}
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{caso.abogadoNombre}</p>
                    </td>

                    {/* Tiempo Inactivo */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-bold ${severidad.color}`}
                        >
                          {severidad.label}
                        </Badge>
                        <span className={`text-sm font-bold ${
                          caso.diasInactivo > 90 ? 'text-rose-600' :
                          caso.diasInactivo > 60 ? 'text-amber-600' :
                          'text-yellow-600'
                        }`}>
                          Hace {caso.diasInactivo} días
                        </span>
                      </div>
                    </td>

                    {/* Última Acción */}
                    <td className="px-6 py-4 text-center">
                      <p className="text-slate-600">
                        {format(new Date(caso.ultimaAccion), "d 'de' MMM yyyy", { locale: es })}
                      </p>
                    </td>

                    {/* Gestión */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs gap-1 h-8"
                          disabled
                          title="Funcionalidad próximamente"
                        >
                          <ArrowRightLeft className="h-3 w-3" />
                          Reasignar
                        </Button>
                        <Link href={`/casos/${caso.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-xs gap-1 h-8 text-slate-500 hover:text-slate-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {data.length === 0 && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-3">
              <Clock className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-slate-600 font-medium">Sin casos problemáticos</p>
            <p className="text-xs text-slate-500 mt-1">
              Todos los expedientes tienen actividad reciente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
