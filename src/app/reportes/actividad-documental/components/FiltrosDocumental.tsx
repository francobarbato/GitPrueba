'use client'

// app/reportes/actividad-documental/components/FiltrosDocumental.tsx

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, Users, X } from "lucide-react"

export function FiltrosDocumental({
  abogados = []
}: {
  abogados?: { id: string; nombre: string }[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const periodoActual = searchParams.get("periodo") || "mes"
  const abogadoActual = searchParams.get("abogado") || "todos"

  const updateParam = (key: string, value: string, defecto: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === defecto) params.delete(key)
    else params.set(key, value)
    router.push(`?${params.toString()}`)
  }

  const hayFiltroAbogado = searchParams.has("abogado")

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-slate-500">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">Período:</span>
      </div>
      <Select value={periodoActual} onValueChange={(v) => updateParam("periodo", v, "mes")}>
        <SelectTrigger className="w-[190px] h-9 text-sm bg-white">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mes">Este mes</SelectItem>
          <SelectItem value="trimestre">Últimos 3 meses</SelectItem>
          <SelectItem value="semestre">Últimos 6 meses</SelectItem>
          <SelectItem value="anio">Último año</SelectItem>
          <SelectItem value="todo">Histórico completo</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtro por abogado */}
      {abogados.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-slate-500 ml-1">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Abogado:</span>
          </div>
          <Select value={abogadoActual} onValueChange={(v) => updateParam("abogado", v, "todos")}>
            <SelectTrigger className="w-[200px] h-9 text-sm bg-white">
              <SelectValue placeholder="Abogado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los abogados</SelectItem>
              {abogados.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {hayFiltroAbogado && (
        <Button
          variant="ghost" size="sm"
          onClick={() => updateParam("abogado", "todos", "todos")}
          className="text-slate-500 hover:text-slate-700 gap-1 h-9"
        >
          <X className="w-3.5 h-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  )
}