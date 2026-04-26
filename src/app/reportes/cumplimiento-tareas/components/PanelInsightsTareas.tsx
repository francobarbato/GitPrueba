'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, TrendingUp, AlertTriangle, Clock, Award } from "lucide-react"

type InsightsData = {
  mejorCumplimiento: { nombre: string; tasa: number; promDias: number } | null
  peorCumplimiento: { nombre: string; tasa: number } | null
  prioridadMasRapida: { prioridad: string; dias: number } | null
  totalVencidas: number
}

const PRIORIDAD_LABELS: Record<string, string> = {
  FATAL: "Fatal", ALTA: "Alta", MEDIA: "Media", BAJA: "Baja",
}

// Umbral por debajo del cual consideramos que un cumplimiento es problemático
// y vale la pena señalarlo como insight accionable. Si la tasa es 95%, no tiene
// sentido mostrar un insight alarmante solo porque es "la más baja".
const UMBRAL_PEOR_CUMPLIMIENTO = 70

export function PanelInsightsTareas({ data, vistaGeneral }: { data: InsightsData; vistaGeneral: boolean }) {
  const insights: { icon: any; text: string; color: string }[] = []

  if (vistaGeneral && data.mejorCumplimiento) {
    insights.push({
      icon: Award,
      text: `${data.mejorCumplimiento.nombre} tiene la mejor tasa de cumplimiento en plazo con ${data.mejorCumplimiento.tasa}% y un promedio de ${data.mejorCumplimiento.promDias} días por evento.`,
      color: "bg-emerald-50 border-emerald-200",
    })
  }

  // Solo mostrar insight de "peor cumplimiento" si realmente hay un problema
  if (vistaGeneral && data.peorCumplimiento && data.peorCumplimiento.tasa < UMBRAL_PEOR_CUMPLIMIENTO) {
    insights.push({
      icon: TrendingUp,
      text: `${data.peorCumplimiento.nombre} tiene la tasa de cumplimiento más baja con ${data.peorCumplimiento.tasa}%. Podría requerir redistribución de carga o seguimiento más cercano.`,
      color: "bg-amber-50 border-amber-200",
    })
  }

  if (data.prioridadMasRapida) {
    insights.push({
      icon: Clock,
      text: `Los eventos de prioridad "${PRIORIDAD_LABELS[data.prioridadMasRapida.prioridad] ?? data.prioridadMasRapida.prioridad}" se resuelven más rápido, con ${data.prioridadMasRapida.dias} días promedio de ejecución.`,
      color: "bg-blue-50 border-blue-200",
    })
  }

  if (data.totalVencidas > 0) {
    insights.push({
      icon: AlertTriangle,
      text: `Hay ${data.totalVencidas} evento${data.totalVencidas !== 1 ? "s" : ""} vencido${data.totalVencidas !== 1 ? "s" : ""} sin completar que requiere${data.totalVencidas !== 1 ? "n" : ""} atención del equipo.`,
      color: "bg-red-50 border-red-200",
    })
  }

  if (insights.length === 0) return null

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Insights Automáticos
        </CardTitle>
        <p className="text-xs text-slate-500">
          Conclusiones calculadas a partir del historial de eventos del estudio.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${insight.color}`}>
            <insight.icon className="w-4 h-4 mt-0.5 shrink-0 text-slate-600" />
            <p className="text-sm text-slate-700">{insight.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}