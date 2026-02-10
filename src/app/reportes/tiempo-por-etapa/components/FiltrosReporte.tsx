'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, X, Calendar } from "lucide-react"
import { useState } from "react"

interface FiltrosReporteProps {
  tiposDisponibles: string[]
  filtroTipoActual?: string
  filtroDesde?: string
  filtroHasta?: string
}

export function FiltrosReporte({ 
  tiposDisponibles, 
  filtroTipoActual,
  filtroDesde,
  filtroHasta
}: FiltrosReporteProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [tipo, setTipo] = useState(filtroTipoActual || 'TODOS')
  const [desde, setDesde] = useState(filtroDesde || '')
  const [hasta, setHasta] = useState(filtroHasta || '')

  const aplicarFiltros = () => {
    const params = new URLSearchParams()
    
    if (tipo && tipo !== 'TODOS') {
      params.set('tipo', tipo)
    }
    if (desde) {
      params.set('desde', desde)
    }
    if (hasta) {
      params.set('hasta', hasta)
    }

    router.push(`/reportes/tiempo-por-etapa?${params.toString()}`)
  }

  const limpiarFiltros = () => {
    setTipo('TODOS')
    setDesde('')
    setHasta('')
    router.push('/reportes/tiempo-por-etapa')
  }

  const hayFiltrosActivos = filtroTipoActual || filtroDesde || filtroHasta

  return (
    <Card className="mb-6 border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Filtros del Reporte</span>
          {hayFiltrosActivos && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={limpiarFiltros}
              className="ml-auto text-slate-500 hover:text-slate-700"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro por Tipo de Caso */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Tipo de Caso</label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los tipos</SelectItem>
                {tiposDisponibles.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Fecha Desde */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Casos desde</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtro Fecha Hasta */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Casos hasta</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Botón Aplicar */}
          <div className="flex items-end">
            <Button 
              onClick={aplicarFiltros}
              className="w-full h-9 bg-indigo-600 hover:bg-indigo-700"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
