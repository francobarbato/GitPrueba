'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Scale, Briefcase } from "lucide-react"
import Link from "next/link"
import type { TareaProximaVencer } from "../page"

const PRIORIDAD_CONFIG: Record<string, { label: string; color: string }> = {
  FATAL: { label: "Fatal", color: "bg-red-100 text-red-700 border-red-200" },
  ALTA:  { label: "Alta",  color: "bg-orange-100 text-orange-700 border-orange-200" },
  MEDIA: { label: "Media", color: "bg-blue-100 text-blue-700 border-blue-200" },
  BAJA:  { label: "Baja",  color: "bg-slate-100 text-slate-600 border-slate-200" },
}

/**
 * Escala de color escalonada para "días restantes".
 * Gradiente: rojo oscuro (hoy) → rojo claro (mañana) → naranja (2-3d) → ámbar fuerte (4-5d) → ámbar claro (6-7d).
 * El salto progresivo evita el cambio brusco del antiguo "mañana rojo → 2 días naranja".
 */
function labelDias(dias: number): { texto: string; color: string } {
  if (dias === 0) return { texto: "Hoy",      color: "bg-red-600 text-white" }
  if (dias === 1) return { texto: "Mañana",   color: "bg-red-400 text-white" }
  if (dias <= 3)  return { texto: `${dias} días`, color: "bg-orange-400 text-white" }
  if (dias <= 5)  return { texto: `${dias} días`, color: "bg-amber-400 text-amber-900" }
  return                 { texto: `${dias} días`, color: "bg-amber-200 text-amber-900" }
}

export function PanelProximasVencer({ data }: { data: TareaProximaVencer[] }) {
  return (
    <Card className="bg-white border border-amber-200 shadow-lg">
      <CardHeader className="pb-3 bg-amber-50/50 border-b border-amber-100">
        <CardTitle className="text-sm font-semibold text-amber-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          Próximas a vencer
          {data.length > 0 && (
            <span className="ml-auto text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-bold">
              {data.length}
            </span>
          )}
        </CardTitle>
        <p className="text-[10px] text-amber-700/70">Próximos 7 días.</p>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="py-6 px-4 text-center">
            <p className="text-xs text-slate-400">No tenés eventos próximos a vencer.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[calc(100vh-220px)] overflow-y-auto">
            {data.map(t => {
              const diasLabel = labelDias(t.diasRestantes)
              const prioCfg = PRIORIDAD_CONFIG[t.prioridad] ?? PRIORIDAD_CONFIG.MEDIA
              return (
                <div key={t.id} className="p-3 hover:bg-slate-50/50 transition-colors">
                  {/* Fila superior: días + prioridad */}
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${diasLabel.color}`}>
                      {diasLabel.texto}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${prioCfg.color}`}>
                      {prioCfg.label}
                    </span>
                  </div>

                  {/* Título */}
                  <p className="text-sm font-medium text-slate-800 mb-1.5 leading-snug">
                    {t.titulo}
                  </p>

                  {/* Metadata secundaria */}
                  <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500">
                    {t.tipo === "PROCESAL" ? (
                      <span className="flex items-center gap-0.5 text-red-600">
                        <Scale className="w-2.5 h-2.5" /> Procesal
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-blue-600">
                        <Briefcase className="w-2.5 h-2.5" /> Interna
                      </span>
                    )}
                    {t.caso && (
                      <Link href={`/casos/${t.casoId}`} className="font-mono font-bold text-blue-600 hover:underline">
                        {t.caso}
                      </Link>
                    )}
                    <span className="text-slate-400">
                      {new Date(t.fechaVencimiento).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}