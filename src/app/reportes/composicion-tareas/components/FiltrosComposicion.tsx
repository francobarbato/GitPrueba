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

const ROLES = [
  { value: "todos", label: "Todos los roles" },
  { value: "ABOGADO", label: "Solo abogados" },
  { value: "ASISTENTE", label: "Solo asistentes" },
]

export function FiltrosComposicion() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const periodoActual = searchParams.get("periodo") || "all"
  const rolActual = searchParams.get("rol") || "todos"

  const handlePeriodoChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") params.delete("periodo")
    else params.set("periodo", value)
    router.push(`?${params.toString()}`)
  }

  const handleRolChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "todos") params.delete("rol")
    else params.set("rol", value)
    router.push(`?${params.toString()}`)
  }

  const handleLimpiar = () => {
    router.push("?")
  }

  const hayFiltros = searchParams.has("periodo") || searchParams.has("rol")

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-slate-500">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtrar:</span>
      </div>

      <Select value={periodoActual} onValueChange={handlePeriodoChange}>
        <SelectTrigger className="w-[200px] h-9 text-sm bg-white"><SelectValue placeholder="Período" /></SelectTrigger>
        <SelectContent>
          {PERIODOS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={rolActual} onValueChange={handleRolChange}>
        <SelectTrigger className="w-[180px] h-9 text-sm bg-white"><SelectValue placeholder="Rol" /></SelectTrigger>
        <SelectContent>
          {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {hayFiltros && (
        <Button variant="ghost" size="sm" onClick={handleLimpiar} className="text-slate-500 hover:text-slate-700 gap-1 h-9">
          <X className="w-3.5 h-3.5" /> Limpiar
        </Button>
      )}
    </div>
  )
}