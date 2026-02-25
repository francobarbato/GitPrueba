// app/reportes/evolucion-cartera/components/FiltroTiempo.tsx
'use client'

import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface Periodo {
  key: string
  label: string
}

export function FiltroTiempo({
  periodos,
  periodoActual
}: {
  periodos: Periodo[]
  periodoActual: string
}) {
  const router = useRouter()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set('periodo', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-slate-400" />
      <Select value={periodoActual} onValueChange={handleChange}>
        <SelectTrigger className="w-[200px] border-slate-200 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periodos.map(p => (
            <SelectItem key={p.key} value={p.key}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}