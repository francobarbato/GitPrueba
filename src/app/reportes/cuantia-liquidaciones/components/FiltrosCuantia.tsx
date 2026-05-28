// src/app/reportes/cuantia-liquidaciones/components/FiltrosCuantia.tsx

"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { Filter } from "lucide-react"

interface AbogadoOption {
  id: string
  nombre: string | null
  apellido: string | null
}

interface FiltrosCuantiaProps {
  periodo: string
  tipo: string
  estado: string
  abogadoId: string
  abogadosDisponibles: AbogadoOption[]
  mostrarFiltroAbogado: boolean
}

export default function FiltrosCuantia({
  periodo, tipo, estado, abogadoId,
  abogadosDisponibles, mostrarFiltroAbogado,
}: FiltrosCuantiaProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Actualiza un parámetro de la URL preservando los demás
  const actualizar = useCallback((clave: string, valor: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!valor || valor === "") params.delete(clave)
    else params.set(clave, valor)
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  const Select = ({
    value, onChange, children,
  }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white"
    >
      {children}
    </select>
  )

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-slate-500" />
        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wide">Filtros</h3>
      </div>

      <div className={`grid gap-3 ${mostrarFiltroAbogado ? "grid-cols-1 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3"}`}>

        {/* Período */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase">Período</label>
          <Select value={periodo} onChange={(v) => actualizar("periodo", v)}>
            <option value="todo">Todo el historial</option>
            <option value="mes">Este mes</option>
            <option value="trimestre">Últimos 3 meses</option>
            <option value="anio">Este año</option>
          </Select>
        </div>

        {/* Tipo de cálculo */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase">Tipo de cálculo</label>
          <Select value={tipo} onChange={(v) => actualizar("tipo", v)}>
            <option value="todos">Todos los tipos</option>
            <option value="DESPIDO">Despido</option>
            <option value="LRT">Accidente LRT</option>
            <option value="CAPITALIZACION">Capitalización</option>
          </Select>
        </div>

        {/* Estado del expediente */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase">Estado del expediente</label>
          <Select value={estado} onChange={(v) => actualizar("estado", v)}>
            <option value="activos">Solo activos</option>
            <option value="todos">Activos y cerrados</option>
            <option value="cerrados">Solo cerrados</option>
          </Select>
        </div>

        {/* Abogado (solo para asistentes) */}
        {mostrarFiltroAbogado && (
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase">Abogado</label>
            <Select value={abogadoId} onChange={(v) => actualizar("abogadoId", v)}>
              <option value="">Todos los abogados</option>
              {abogadosDisponibles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} {a.apellido}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}