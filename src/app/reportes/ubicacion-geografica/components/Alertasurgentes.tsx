// app/reportes/ubicacion-geografica/components/AlertaUrgentes.tsx
'use client'

import { AlertTriangle, MapPin, ChevronRight } from "lucide-react"

interface CasoUrgente {
  id: string
  titulo: string
  numero: string
  tipo: string
  ciudad: string
  distanciaKm: number
  clasificacion: string
}

export function AlertaUrgentes({
  casosUrgentes,
  totalCasos,
}: {
  casosUrgentes: CasoUrgente[]
  totalCasos: number
}) {
  if (casosUrgentes.length === 0) return null

  const enLargaDistancia = casosUrgentes.filter(c => c.distanciaKm > 400)
  const enMediaDistancia = casosUrgentes.filter(c => c.distanciaKm > 100 && c.distanciaKm <= 400)

  return (
    <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 overflow-hidden">
      {/* Barra superior con ícono y resumen */}
      <div className="flex items-center gap-3 px-5 py-3 bg-amber-100 border-b border-amber-200">
        <div className="p-1.5 bg-amber-500 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-900">
            ⚠ {casosUrgentes.length} {casosUrgentes.length === 1 ? 'caso de prioridad alta' : 'casos de prioridad alta'} en zonas que requieren viaje
          </p>
          <p className="text-xs text-amber-700">
            {casosUrgentes.length} de {totalCasos} casos activos fueron marcados como prioridad alta por el abogado
          </p>
        </div>
      </div>

      {/* Detalle de urgentes */}
      <div className="px-5 py-3 space-y-2">
        {/* Resumen por distancia */}
        {enLargaDistancia.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-800">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold border border-red-200">
              <MapPin className="h-3 w-3" />
              Larga distancia
            </span>
            <span>{enLargaDistancia.length} {enLargaDistancia.length === 1 ? 'caso' : 'casos'} — requiere viaje</span>
          </div>
        )}
        {enMediaDistancia.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-800">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-semibold border border-amber-300">
              <MapPin className="h-3 w-3" />
              Media distancia
            </span>
            <span>{enMediaDistancia.length} {enMediaDistancia.length === 1 ? 'caso' : 'casos'}</span>
          </div>
        )}

        {/* Lista de casos urgentes */}
        <div className="mt-2 space-y-1.5">
          {casosUrgentes.map(caso => (
            <a
              key={caso.id}
              href={`/casos/${caso.id}`}
              className="flex items-center justify-between p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400">{caso.numero}</span>
                <span className="text-sm font-medium text-slate-800">{caso.titulo}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                  {caso.tipo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{caso.ciudad} · {caso.distanciaKm} km</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-amber-500 transition" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}