'use client'

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { User, Users } from "lucide-react"

interface ToggleVistaProps {
  vistaActual: 'personal' | 'general'
}

export function ToggleVista({ vistaActual }: ToggleVistaProps) {
  const router = useRouter()

  const cambiarVista = (vista: 'personal' | 'general') => {
    if (vista === 'general') {
      router.push('/reportes/ubicacion-geografica?vista=general')
    } else {
      router.push('/reportes/ubicacion-geografica')
    }
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
      <Button
        variant={vistaActual === 'personal' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => cambiarVista('personal')}
        className={`gap-2 ${
          vistaActual === 'personal' 
            ? 'bg-white shadow-sm' 
            : 'hover:bg-slate-200'
        }`}
      >
        <User className="h-4 w-4" />
        Mis Casos
      </Button>
      <Button
        variant={vistaActual === 'general' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => cambiarVista('general')}
        className={`gap-2 ${
          vistaActual === 'general' 
            ? 'bg-white shadow-sm' 
            : 'hover:bg-slate-200'
        }`}
      >
        <Users className="h-4 w-4" />
        Todo el Estudio
      </Button>
    </div>
  )
}
