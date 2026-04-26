'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, X } from "lucide-react"

const PERIODOS = [
  { value: "90", label: "Último trimestre" },
  { value: "180", label: "Último semestre" },
  { value: "365", label: "Último año" },
  { value: "all", label: "Todo el historial" },
]

export function FiltrosPeriodoTareas() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const periodoActual = searchParams.get("periodo") || "all"

  const handlePeriodoChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("periodo")
    } else {
      params.set("periodo", value)
    }
    router.push(`?${params.toString()}`)
  }

  const handleLimpiar = () => {
    const params = new URLSearchParams()
    const vistaActual = searchParams.get("vista")
    if (vistaActual) params.set("vista", vistaActual)
    router.push(`?${params.toString()}`)
  }

  const hayFiltrosActivos = searchParams.has("periodo")

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-slate-500">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtrar:</span>
      </div>

      <Select value={periodoActual} onValueChange={handlePeriodoChange}>
        <SelectTrigger className="w-[200px] h-9 text-sm bg-white">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {PERIODOS.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hayFiltrosActivos && (
        <Button variant="ghost" size="sm" onClick={handleLimpiar} className="text-slate-500 hover:text-slate-700 gap-1 h-9">
          <X className="w-3.5 h-3.5" /> Limpiar
        </Button>
      )}
    </div>
  )
}