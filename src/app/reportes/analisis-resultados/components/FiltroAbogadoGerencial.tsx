'use client'

// app/reportes/analisis-resultados/components/FiltroAbogadoGerencial.tsx
// Filtro de abogado exclusivo de la vista gerencial — separado del FiltroPeriodo

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users } from "lucide-react"

type Abogado = { id: string; nombre: string }

export function FiltroAbogadoGerencial({ abogados }: { abogados: Abogado[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const abogadoActual = searchParams.get('abogado') || 'todos'

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'todos') {
      params.delete('abogado')
    } else {
      params.set('abogado', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Users className="w-4 h-4 text-slate-400" />
      <Select value={abogadoActual} onValueChange={handleChange}>
        <SelectTrigger className="w-[200px] h-9 text-sm bg-white">
          <SelectValue placeholder="Todos los abogados" />
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
    </div>
  )
}