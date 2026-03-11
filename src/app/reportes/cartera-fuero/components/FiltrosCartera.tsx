'use client'

// app/reportes/cartera-fuero/components/FiltrosCartera.tsx

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Filter, X } from "lucide-react"

type Props = {
  vista: string
  etapas: string[]
  colegas: { id: string; nombre: string }[]
}

export function FiltrosCartera({ vista, etapas, colegas }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const etapaActual = searchParams.get("etapa") || "todas"
  const colegaActual = searchParams.get("colega") || "todos"

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === "todas" || value === "todos") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const limpiar = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("etapa")
    params.delete("colega")
    router.push(`${pathname}?${params.toString()}`)
  }

  const hayFiltros = (vista === "personal" && etapaActual !== "todas") ||
                     (vista === "general" && colegaActual !== "todos")

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-slate-500">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtrar:</span>
      </div>

      {vista === "personal" && (
        <Select value={etapaActual} onValueChange={(v) => updateParam("etapa", v)}>
          <SelectTrigger className="h-9 text-sm bg-white min-w-[220px] w-auto">
            <SelectValue placeholder="Todas las etapas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las etapas</SelectItem>
            {etapas.map(e => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {vista === "general" && (
        <Select value={colegaActual} onValueChange={(v) => updateParam("colega", v)}>
          <SelectTrigger className="h-9 text-sm bg-white min-w-[200px] w-auto">
            <SelectValue placeholder="Todo el estudio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo el estudio</SelectItem>
            {colegas.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hayFiltros && (
        <Button
          variant="ghost"
          size="sm"
          onClick={limpiar}
          className="text-slate-500 hover:text-slate-700 gap-1 h-9"
        >
          <X className="w-3.5 h-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  )
}