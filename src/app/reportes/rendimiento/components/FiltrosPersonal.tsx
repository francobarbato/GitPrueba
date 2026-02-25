// app/reportes/rendimiento/components/FiltrosPersonal.tsx
'use client'

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Filter, Search, X } from "lucide-react"

interface Props {
  desdeActual?: string
  hastaActual?: string
  tiposDisponibles: string[]
  tipoActual?: string
}

const TIPOS_LABEL: Record<string, string> = {
  'LABORAL': 'Laboral',
  'CIVIL_COMERCIAL': 'Civil y Comercial',
  'FAMILIA': 'Familia',
  'PENAL': 'Penal',
  'SUCESIONES': 'Sucesiones',
  'CONTENCIOSO_ADMINISTRATIVO': 'Cont. Administrativo',
}

export function FiltrosPersonal({ desdeActual, hastaActual, tiposDisponibles, tipoActual }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Estado local para los date inputs
  const [desde, setDesde] = useState(desdeActual || '')
  const [hasta, setHasta] = useState(hastaActual || '')

  const aplicarFechas = () => {
    if (!desde || !hasta) return

    const params = new URLSearchParams(searchParams.toString())
    params.set('desde', desde)
    params.set('hasta', hasta)
    // Eliminar periodo si se usa rango personalizado
    params.delete('periodo')

    const qs = params.toString()
    router.push(`/reportes/rendimiento?${qs}`)
  }

  const aplicarTipo = (nuevoTipo: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nuevoTipo && nuevoTipo !== 'TODOS') {
      params.set('tipo', nuevoTipo)
    } else {
      params.delete('tipo')
    }
    const qs = params.toString()
    router.push(`/reportes/rendimiento?${qs}`)
  }

  const limpiar = () => {
    setDesde('')
    setHasta('')
    // Mantener solo vista=personal
    router.push('/reportes/rendimiento')
  }

  const hayFiltros = !!desdeActual || !!hastaActual || !!tipoActual

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Filter className="h-4 w-4" />
        <span className="text-xs font-medium">Filtrar:</span>
      </div>

      {/* Desde */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500">Desde</span>
        <Input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="h-8 w-[145px] text-xs border-slate-200"
        />
      </div>

      {/* Hasta */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500">Hasta</span>
        <Input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="h-8 w-[145px] text-xs border-slate-200"
        />
      </div>

      {/* Botón buscar */}
      <Button
        variant="default"
        size="sm"
        className="h-8 text-xs gap-1"
        onClick={aplicarFechas}
        disabled={!desde || !hasta}
      >
        <Search className="h-3.5 w-3.5" />
        Buscar
      </Button>

      {/* Tipo de caso */}
      {tiposDisponibles.length > 0 && (
        <Select
          value={tipoActual || 'TODOS'}
          onValueChange={aplicarTipo}
        >
          <SelectTrigger className="w-[170px] h-8 text-xs border-slate-200">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS" className="text-xs">Todos los tipos</SelectItem>
            {tiposDisponibles.map(tipo => (
              <SelectItem key={tipo} value={tipo} className="text-xs">
                {TIPOS_LABEL[tipo] || tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Limpiar */}
      {hayFiltros && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-slate-500 hover:text-slate-700 gap-1"
          onClick={limpiar}
        >
          <X className="h-3.5 w-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  )
}