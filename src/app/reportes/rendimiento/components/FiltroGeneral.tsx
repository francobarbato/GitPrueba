// app/reportes/rendimiento/components/FiltrosGeneral.tsx
'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, Filter, X } from "lucide-react"

interface Props {
  periodoActual: string
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

export function FiltrosGeneral({ periodoActual, tiposDisponibles, tipoActual }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const aplicarFiltros = (nuevoPeriodo?: string, nuevoTipo?: string) => {
    const params = new URLSearchParams(searchParams.toString())

    const periodo = nuevoPeriodo ?? periodoActual
    const tipo = nuevoTipo ?? tipoActual

    if (periodo && periodo !== '90') {
      params.set('periodo', periodo)
    } else {
      params.delete('periodo')
    }
    if (tipo && tipo !== 'TODOS') {
      params.set('tipo', tipo)
    } else {
      params.delete('tipo')
    }

    const qs = params.toString()
    router.push(`/reportes/rendimiento${qs ? `?${qs}` : ''}`)
  }

  const periodos = [
    { value: '90', label: 'Último trimestre' },
    { value: '180', label: 'Último semestre' },
    { value: '365', label: 'Último año' },
  ]

  const hayFiltros = periodoActual !== '90' || !!tipoActual

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Filter className="h-4 w-4" />
        <span className="text-xs font-medium">Filtrar:</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Calendar className="h-4 w-4 text-slate-400" />
        <Select
          value={periodoActual}
          onValueChange={(value) => aplicarFiltros(value, tipoActual)}
        >
          <SelectTrigger className="w-[170px] h-8 text-xs border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodos.map(p => (
              <SelectItem key={p.value} value={p.value} className="text-xs">
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tiposDisponibles.length > 0 && (
        <Select
          value={tipoActual || 'TODOS'}
          onValueChange={(value) => aplicarFiltros(periodoActual, value)}
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

      {hayFiltros && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-slate-500 hover:text-slate-700 gap-1"
          onClick={() => {
            const params = new URLSearchParams()
            const vista = searchParams.get('vista')
            if (vista) params.set('vista', vista)
            const qs = params.toString()
            router.push(`/reportes/rendimiento${qs ? `?${qs}` : ''}`)
          }}
        >
          <X className="h-3.5 w-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  )
}