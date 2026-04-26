'use client'

import { Card } from "@/components/ui/card"
import { CheckCircle2, Clock, XCircle } from "lucide-react"

type Props = {
  data: {
    enPlazo: number
    conDemora: number
    vencidas: number
  }
}

/**
 * Calcula porcentajes enteros que SIEMPRE suman 100% (o 0% si total=0).
 * Usa el método "largest remainder": redondea hacia abajo y asigna los
 * puntos restantes a las categorías con mayor parte fraccional.
 * Evita el bug de Math.round independiente que puede dar 99% o 101%.
 */
function porcentajesExactos(valores: number[]): number[] {
  const total = valores.reduce((a, b) => a + b, 0)
  if (total === 0) return valores.map(() => 0)

  const exactos = valores.map(v => (v / total) * 100)
  const basePisos = exactos.map(Math.floor)
  const sumaPisos = basePisos.reduce((a, b) => a + b, 0)
  const puntosFaltantes = 100 - sumaPisos

  // Ordenar por parte fraccional descendente para distribuir los puntos faltantes
  const indicesPorFraccion = exactos
    .map((v, i) => ({ i, fraccion: v - Math.floor(v) }))
    .sort((a, b) => b.fraccion - a.fraccion)
    .slice(0, puntosFaltantes)
    .map(x => x.i)

  return basePisos.map((piso, i) => (indicesPorFraccion.includes(i) ? piso + 1 : piso))
}

export function KPICardsTareas({ data }: Props) {
  const total = data.enPlazo + data.conDemora + data.vencidas
  const [pctEnPlazo, pctConDemora, pctVencidas] = porcentajesExactos([
    data.enPlazo,
    data.conDemora,
    data.vencidas,
  ])

  return (
   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  {/* Card: Cumplidas en plazo */}
  <Card className="p-4 border border-slate-200 rounded-xl bg-white">
    <div className="flex items-center gap-2 mb-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      <p className="text-xs text-slate-500 font-medium">En plazo</p>
    </div>
    
    {total > 0 && (
      <p className="text-3xl font-bold text-slate-950 mb-1">
        {pctEnPlazo}%
      </p>
    )}
    
    <p className="text-xs text-slate-600">
      Representa <span className="font-medium">{data.enPlazo} eventos</span> de un total de {total}.
    </p>
  </Card>

  {/* Card: Cumplidas con demora */}
  <Card className="p-4 border border-slate-200 rounded-xl bg-white">
    <div className="flex items-center gap-2 mb-2">
      <Clock className="w-4 h-4 text-amber-500" />
      <p className="text-xs text-slate-500 font-medium">Con demora</p>
    </div>
    
    {total > 0 && (
      <p className="text-3xl font-bold text-slate-950 mb-1">
        {pctConDemora}%
      </p>
    )}
    
    <p className="text-xs text-slate-600">
      Representa <span className="font-medium">{data.conDemora} eventos</span> fuera de plazo.
    </p>
  </Card>

{/* Card: Vencidas */}
  <Card className="p-4 border border-slate-200 rounded-xl bg-white">
    <div className="flex items-center gap-2 mb-2">
      <XCircle className={`w-4 h-4 ${data.vencidas > 0 ? "text-red-500" : "text-slate-400"}`} />
      <p className={`text-xs font-medium ${data.vencidas > 0 ? "text-red-600" : "text-slate-500"}`}>Vencidas</p>
    </div>
    
    {total > 0 && (
      <p className="text-3xl font-bold text-slate-950 mb-1">
        {pctVencidas}%
      </p>
    )}
    
    <p className="text-xs text-slate-600">
      Representa <span className="font-medium text-slate-700">{data.vencidas} eventos</span> de un total de {total}.
    </p>
  </Card>
</div>
  )
}