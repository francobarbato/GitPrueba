'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, X, Search } from "lucide-react"
import { useState } from "react"

export function FiltrosClientes({ 
  abogados = [],
  mostrarFiltroAbogado = false
}: { 
  abogados?: { id: string; nombre: string }[]
  mostrarFiltroAbogado?: boolean 
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const tipoActual = searchParams.get("tipo") || "todos"
  const estadoActual = searchParams.get("estado") || "todos"
  const busquedaActual = searchParams.get("q") || ""
  const abogadoActual = searchParams.get("abogado") || "todos"

  const [busquedaLocal, setBusquedaLocal] = useState(busquedaActual)

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "todos" || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`?${params.toString()}`)
  }

  const handleBuscar = () => {
    updateParam("q", busquedaLocal.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBuscar()
  }

  const handleLimpiar = () => {
    setBusquedaLocal("")
    router.push("?")
  }

  const hayFiltrosActivos =
    searchParams.has("tipo") || searchParams.has("estado") || 
    searchParams.has("q") || searchParams.has("abogado")

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-slate-500">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtrar:</span>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder="Buscar por nombre..."
            value={busquedaLocal}
            onChange={(e) => setBusquedaLocal(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9 text-sm pl-8 w-[200px] bg-white"
          />
        </div>
        {busquedaLocal && busquedaLocal !== busquedaActual && (
          <Button size="sm" onClick={handleBuscar} className="h-9 text-xs">
            Buscar
          </Button>
        )}
      </div>

      {/* Tipo de cliente */}
      <Select value={tipoActual} onValueChange={(v) => updateParam("tipo", v)}>
        <SelectTrigger className="w-[170px] h-9 text-sm bg-white">
          <SelectValue placeholder="Tipo de cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los tipos</SelectItem>
          <SelectItem value="FISICA">Persona Física</SelectItem>
          <SelectItem value="JURIDICA">Persona Jurídica</SelectItem>
        </SelectContent>
      </Select>

      {/* Estado */}
      <Select value={estadoActual} onValueChange={(v) => updateParam("estado", v)}>
        <SelectTrigger className="w-[160px] h-9 text-sm bg-white">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="activos">Activos</SelectItem>
          <SelectItem value="inactivos">Inactivos</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtro Abogado — solo Admin y Asistente */}
      {mostrarFiltroAbogado && abogados.length > 0 && (
        <Select value={abogadoActual} onValueChange={(v) => updateParam("abogado", v)}>
          <SelectTrigger className="w-[180px] h-9 text-sm bg-white">
            <SelectValue placeholder="Abogado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los abogados</SelectItem>
            {abogados.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Limpiar */}
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