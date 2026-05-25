// app/reportes/rendimiento/components/ToggleVista.tsx
'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { User, Users } from "lucide-react"

export function ToggleVista({ vistaActual }: { vistaActual: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const cambiarVista = (vista: string) => {
    // Al cambiar de vista, limpiar filtros de la otra vista
    const params = new URLSearchParams()

    if (vista === 'general') {
      params.set('vista', 'general')
      // Mantener tipo si existe
      const tipo = searchParams.get('tipo')
      if (tipo) params.set('tipo', tipo)
      // No llevar desde/hasta a la general
    } else {
      // personal es default, no necesita param
      const tipo = searchParams.get('tipo')
      if (tipo) params.set('tipo', tipo)
      // No llevar periodo a la personal
    }

    const qs = params.toString()
    router.push(`/reportes/rendimiento${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
      <button
        onClick={() => cambiarVista('personal')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          vistaActual === 'personal'
            ? 'bg-white text-purple-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <User className="h-3.5 w-3.5" />
        Mi Actividad
      </button>
      <button
        onClick={() => cambiarVista('general')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          vistaActual === 'general'
            ? 'bg-white text-purple-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Users className="h-3.5 w-3.5" />
        Vista General
      </button>
    </div>
  )
}