'use client'

// app/reportes/cartera-fuero/components/ToggleVista.tsx

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { User, Users } from "lucide-react"

type Props = {
  vistaActual: string
}

export function ToggleVista({ vistaActual }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const cambiarVista = (nueva: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("vista", nueva)
    // Limpiar filtros específicos de cada vista al cambiar
    params.delete("etapa")
    params.delete("colega")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="inline-flex items-center bg-slate-100 rounded-lg p-1 gap-1">
      <button
        onClick={() => cambiarVista("personal")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          vistaActual === "personal"
            ? "bg-white text-slate-800 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <User className="w-3.5 h-3.5" />
        Mi cartera
      </button>
      <button
        onClick={() => cambiarVista("general")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          vistaActual === "general"
            ? "bg-white text-slate-800 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        Vista general
      </button>
    </div>
  )
}