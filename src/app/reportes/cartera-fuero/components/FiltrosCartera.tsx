'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, X } from "lucide-react"

type Abogado = {
  id: string
  nombre: string
}

export function FiltrosCartera({ abogados = [] }: { abogados?: Abogado[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const abogadoActual = searchParams.get("abogado") || "todos"

  const handleAbogadoChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "todos") {
      params.delete("abogado")
    } else {
      params.set("abogado", value)
    }
    router.push(`?${params.toString()}`)
  }

  const handleLimpiar = () => {
    router.push("?")
  }

  const hayFiltrosActivos = searchParams.has("abogado")

  if (abogados.length === 0) return null

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-slate-500">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtrar:</span>
      </div>

      <Select value={abogadoActual} onValueChange={handleAbogadoChange}>
        <SelectTrigger className="w-[200px] h-9 text-sm bg-white">
          <SelectValue placeholder="Abogado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los abogados</SelectItem>
          {abogados.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hayFiltrosActivos && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLimpiar}
          className="text-slate-500 hover:text-slate-700 gap-1 h-9"
        >
          <X className="w-3.5 h-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  )
}