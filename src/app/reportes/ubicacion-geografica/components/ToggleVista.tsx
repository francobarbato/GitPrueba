'use client'

// app/reportes/ubicacion-geografica/components/ToggleVista.tsx

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { User, Users } from "lucide-react"

interface ToggleVistaProps {
  vistaActual: 'personal' | 'general'
}

export function ToggleVista({ vistaActual }: ToggleVistaProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const cambiarVista = (vista: 'personal' | 'general') => {
    const params = new URLSearchParams(searchParams.toString())
    // Limpiar filtros de la otra vista al cambiar
    params.delete('fuero')
    params.delete('etapa')
    params.delete('abogado')
    if (vista === 'general') {
      params.set('vista', 'general')
    } else {
      params.delete('vista')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="inline-flex items-center bg-slate-100 rounded-lg p-1 gap-1">
      <button
        onClick={() => cambiarVista('personal')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          vistaActual === 'personal'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <User className="w-3.5 h-3.5" />
        Mis casos
      </button>
      <button
        onClick={() => cambiarVista('general')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          vistaActual === 'general'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        Vista general
      </button>
    </div>
  )
}