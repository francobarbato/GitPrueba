'use client'

// app/reportes/analisis-resultados/components/ToggleVistaResultados.tsx

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { User, Users } from "lucide-react"

export function ToggleVistaResultados({ vistaActual }: { vistaActual: 'personal' | 'gerencial' }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const cambiarVista = (vista: 'personal' | 'gerencial') => {
    const params = new URLSearchParams(searchParams.toString())
    // Al cambiar vista limpiar filtro de abogado — cada vista maneja el suyo
    params.delete('abogado')
    if (vista === 'gerencial') {
      params.set('vista', 'gerencial')
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
        onClick={() => cambiarVista('gerencial')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          vistaActual === 'gerencial'
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