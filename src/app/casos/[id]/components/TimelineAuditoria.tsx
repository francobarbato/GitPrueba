'use client'

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, CheckCircle2, AlertCircle, FileText, User } from "lucide-react"

type BitacoraItem = {
  id: string
  texto: string
  accion: string
  estadoAnterior?: string | null
  estadoNuevo?: string | null
  createdAt: Date
  usuario: {
    nombre: string
    apellido: string
  }
}

export function TimelineAuditoria({ bitacoras }: { bitacoras: BitacoraItem[] }) {
  const getIcono = (accion: string) => {
    switch (accion) {
      case "CREATE": return <FileText className="h-5 w-5 text-green-600" />
      case "ESTADO_CHANGE": return <CheckCircle2 className="h-5 w-5 text-blue-600" />
      case "PRIORIDAD_CHANGE": return <AlertCircle className="h-5 w-5 text-orange-600" />
      default: return <Clock className="h-5 w-5 text-slate-600" />
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">Timeline del Caso</h3>
      
      <div className="relative border-l-2 border-slate-200 pl-6 space-y-6">
        {bitacoras.map((item, index) => (
          <div key={item.id} className="relative">
            {/* Punto en la línea */}
            <div className="absolute -left-[1.6rem] top-1 w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
              {getIcono(item.accion)}
            </div>

            {/* Contenido */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-slate-900">{item.texto}</p>
                <span className="text-xs text-slate-500">
                  {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                </span>
              </div>

              {item.estadoAnterior && item.estadoNuevo && (
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                  <span className="px-2 py-1 bg-slate-200 rounded">{item.estadoAnterior}</span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{item.estadoNuevo}</span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <User className="h-3 w-3" />
                <span>{item.usuario.nombre} {item.usuario.apellido}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}