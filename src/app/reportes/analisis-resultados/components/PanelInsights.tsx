'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react"

type InsightsData = {
  motivoMasRapido: { motivo: string; dias: number } | null
  motivoMasLento: { motivo: string; dias: number } | null
  motivoMejorRecupero: { motivo: string; tasa: number } | null
  fueroPredominante: { tipo: string; cantidad: number } | null
  acuerdosVsSentencias: {
    acuerdosDias: number
    sentenciasDias: number
    acuerdosRecupero: number
    sentenciasRecupero: number
    hayDatos: boolean
  }
}

export function PanelInsights({ data }: { data: InsightsData }) {
  const insights: { icon: React.ReactNode; texto: string; tipo: 'positivo' | 'negativo' | 'neutro' }[] = []

  // Insight: Acuerdos vs Sentencias
  if (data.acuerdosVsSentencias.hayDatos) {
    const { acuerdosDias, sentenciasDias, acuerdosRecupero, sentenciasRecupero } = data.acuerdosVsSentencias
    
    if (acuerdosDias > 0 && sentenciasDias > 0) {
      const diferenciaDias = sentenciasDias - acuerdosDias
      const mejorRecupero = acuerdosRecupero >= sentenciasRecupero ? 'acuerdos' : 'sentencias'
      
      insights.push({
        icon: <Clock className="w-4 h-4" />,
        texto: `Los acuerdos se cierran en ${acuerdosDias} días promedio vs ${sentenciasDias} días de las sentencias (${diferenciaDias} días menos). ${
          mejorRecupero === 'acuerdos' 
            ? `Además recuperan mejor: ${acuerdosRecupero}% vs ${sentenciasRecupero}%.`
            : `Sin embargo, las sentencias recuperan más: ${sentenciasRecupero}% vs ${acuerdosRecupero}%.`
        }`,
        tipo: 'neutro'
      })
    }
  }

  // Insight: Motivo más rápido
  if (data.motivoMasRapido && data.motivoMasLento && data.motivoMasRapido.motivo !== data.motivoMasLento.motivo) {
    insights.push({
      icon: <TrendingUp className="w-4 h-4" />,
      texto: `La vía más rápida de cierre es "${data.motivoMasRapido.motivo}" con ${data.motivoMasRapido.dias} días promedio. La más lenta es "${data.motivoMasLento.motivo}" con ${data.motivoMasLento.dias} días.`,
      tipo: 'neutro'
    })
  }

  // Insight: Mejor recupero
  if (data.motivoMejorRecupero && data.motivoMejorRecupero.tasa > 0) {
    insights.push({
      icon: <DollarSign className="w-4 h-4" />,
      texto: `El mejor recupero económico se obtiene por "${data.motivoMejorRecupero.motivo}" con una tasa del ${data.motivoMejorRecupero.tasa}% del monto reclamado.`,
      tipo: data.motivoMejorRecupero.tasa >= 70 ? 'positivo' : 'neutro'
    })
  }

  // Insight: Fuero predominante en cerrados
  if (data.fueroPredominante) {
    insights.push({
      icon: <TrendingDown className="w-4 h-4" />,
      texto: `El fuero con más expedientes cerrados es ${data.fueroPredominante.tipo} (${data.fueroPredominante.cantidad} expedientes). Considerar si es por volumen o por velocidad de resolución.`,
      tipo: 'neutro'
    })
  }

  if (insights.length === 0) {
    return null
  }

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Insights Automáticos
        </CardTitle>
        <p className="text-xs text-slate-500">
          Conclusiones calculadas a partir de los datos de cierre del estudio.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                insight.tipo === 'positivo'
                  ? 'bg-emerald-50 border-emerald-200'
                  : insight.tipo === 'negativo'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className={`mt-0.5 flex-shrink-0 ${
                insight.tipo === 'positivo' ? 'text-emerald-600'
                : insight.tipo === 'negativo' ? 'text-red-600'
                : 'text-slate-500'
              }`}>
                {insight.icon}
              </div>
              <p className="text-sm text-slate-700">{insight.texto}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}