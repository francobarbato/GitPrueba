'use client'

// app/reportes/evolucion-cartera/components/ToggleVistaEvolucion.tsx

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { User, Users } from "lucide-react"

export function ToggleVistaEvolucion({ vistaActual }: { vistaActual: 'personal' | 'gerencial' }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const cambiarVista = (vista: 'personal' | 'gerencial') => {
    const params = new URLSearchParams(searchParams.toString())
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
        Mis expedientes
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