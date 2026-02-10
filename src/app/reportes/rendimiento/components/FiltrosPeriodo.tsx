'use client'

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter } from "lucide-react"

interface FiltrosPeriodoProps {
  periodoActual: string
  tiposDisponibles: string[]
  tipoActual?: string
}

export function FiltrosPeriodo({ periodoActual, tiposDisponibles, tipoActual }: FiltrosPeriodoProps) {
  const router = useRouter()

  const aplicarFiltros = (nuevoPeriodo?: string, nuevoTipo?: string) => {
    const params = new URLSearchParams()
    
    const periodo = nuevoPeriodo ?? periodoActual
    const tipo = nuevoTipo ?? tipoActual

    if (periodo && periodo !== '90') {
      params.set('periodo', periodo)
    }
    if (tipo && tipo !== 'TODOS') {
      params.set('tipo', tipo)
    }

    const queryString = params.toString()
    router.push(`/reportes/rendimiento${queryString ? `?${queryString}` : ''}`)
  }

  const periodos = [
    { value: '30', label: 'Últimos 30 días' },
    { value: '90', label: 'Últimos 90 días' },
    { value: '180', label: 'Últimos 6 meses' },
    { value: '365', label: 'Último año' },
  ]

  return (
    <Card className="mb-6 border-slate-200">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filtros:</span>
          </div>

          {/* Selector de Período */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Select 
              value={periodoActual} 
              onValueChange={(value) => aplicarFiltros(value, tipoActual)}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodos.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Tipo de Caso */}
          {tiposDisponibles.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Tipo:</span>
              <Select 
                value={tipoActual || 'TODOS'} 
                onValueChange={(value) => aplicarFiltros(periodoActual, value)}
              >
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los tipos</SelectItem>
                  {tiposDisponibles.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Botón limpiar si hay filtros activos */}
          {(periodoActual !== '90' || tipoActual) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/reportes/rendimiento')}
              className="text-slate-500 hover:text-slate-700"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
