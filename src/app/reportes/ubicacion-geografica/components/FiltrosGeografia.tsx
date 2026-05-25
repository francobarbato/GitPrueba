// app/reportes/ubicacion-geografica/components/FiltrosGeografia.tsx
'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const FUEROS = [
  { value: 'todos', label: 'Todos los fueros' },
  { value: 'LABORAL', label: 'Laboral' },
  { value: 'CIVIL_COMERCIAL', label: 'Civil y Comercial' },
  { value: 'FAMILIA', label: 'Familia' },
  { value: 'PENAL', label: 'Penal' },
  { value: 'SUCESIONES', label: 'Sucesiones' },
  { value: 'CONTENCIOSO_ADMINISTRATIVO', label: 'Cont. Administrativo' },
]

const ETAPAS = [
  { value: 'todas', label: 'Todas las etapas' },
  { value: 'Inicio / Demanda', label: 'Inicio / Demanda' },
  { value: 'Mediación / Previo', label: 'Mediación / Previo' },
  { value: 'Prueba (Oficios/Pericias)', label: 'Prueba' },
  { value: 'Alegatos / Conclusiones', label: 'Alegatos' },
  { value: 'Sentencia / Resolución', label: 'Sentencia' },
  { value: 'Apelación / Recurso', label: 'Apelación' },
  { value: 'Ejecución de Sentencia', label: 'Ejecución' },
]

interface Abogado {
  id: string
  nombre: string
}

export function FiltrosGeografia({
  abogados,
  mostrarFiltroAbogado = false,
}: {
  abogados?: Abogado[]
  mostrarFiltroAbogado?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const fueroActual = searchParams.get('fuero') || 'todos'
  const etapaActual = searchParams.get('etapa') || 'todas'
  const abogadoActual = searchParams.get('abogado') || 'todos'

  const hayFiltros = fueroActual !== 'todos' || etapaActual !== 'todas' || abogadoActual !== 'todos'

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'todos' || value === 'todas') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`?${params.toString()}`)
  }

  const limpiarFiltros = () => {
    router.push('?')
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Filter className="h-4 w-4" />
        <span className="text-xs font-medium">Filtrar:</span>
      </div>

      {/* Filtro por abogado — solo para Admin y Asistente */}
      {mostrarFiltroAbogado && abogados && abogados.length > 0 && (
        <Select value={abogadoActual} onValueChange={(v) => updateParam('abogado', v)}>
          <SelectTrigger className="w-[180px] h-8 text-xs border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos" className="text-xs">Todos los abogados</SelectItem>
            {abogados.map(ab => (
              <SelectItem key={ab.id} value={ab.id} className="text-xs">
                {ab.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={fueroActual} onValueChange={(v) => updateParam('fuero', v)}>
        <SelectTrigger className="w-[170px] h-8 text-xs border-slate-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FUEROS.map(f => (
            <SelectItem key={f.value} value={f.value} className="text-xs">
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={etapaActual} onValueChange={(v) => updateParam('etapa', v)}>
        <SelectTrigger className="w-[170px] h-8 text-xs border-slate-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ETAPAS.map(e => (
            <SelectItem key={e.value} value={e.value} className="text-xs">
              {e.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hayFiltros && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-slate-500 hover:text-slate-700 gap-1"
          onClick={limpiarFiltros}
        >
          <X className="h-3.5 w-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  )
}