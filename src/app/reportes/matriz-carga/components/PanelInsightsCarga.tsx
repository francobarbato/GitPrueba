'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, Users, DollarSign, AlertTriangle, Briefcase } from "lucide-react"

type InsightsData = {
  abConMasCarga: { nombre: string; casos: number; tareas: number } | null
  abConMasCapital: { nombre: string; porcentaje: number } | null
  tareasProximasCount: number
  totalVencidas: number
}

export function PanelInsightsCarga({ data }: { data: InsightsData }) {
  const insights: { icon: any; text: string; color: string }[] = []

  if (data.abConMasCarga) {
    insights.push({
      icon: Users,
      text: `${data.abConMasCarga.nombre} tiene la mayor carga combinada con ${data.abConMasCarga.casos} casos activos y ${data.abConMasCarga.tareas} tareas en curso.`,
      color: "bg-blue-50 border-blue-200",
    })
  }

  if (data.abConMasCapital && data.abConMasCapital.porcentaje > 30) {
    insights.push({
      icon: DollarSign,
      text: `${data.abConMasCapital.nombre} concentra el ${data.abConMasCapital.porcentaje}% del capital total en litigio del estudio.`,
      color: "bg-emerald-50 border-emerald-200",
    })
  }

  if (data.tareasProximasCount > 0) {
    insights.push({
      icon: Briefcase,
      text: `Hay ${data.tareasProximasCount} tarea${data.tareasProximasCount !== 1 ? "s" : ""} que vence${data.tareasProximasCount !== 1 ? "n" : ""} en los próximos 7 días.`,
      color: "bg-amber-50 border-amber-200",
    })
  }

  if (data.totalVencidas > 0) {
    insights.push({
      icon: AlertTriangle,
      text: `Hay ${data.totalVencidas} tarea${data.totalVencidas !== 1 ? "s" : ""} vencida${data.totalVencidas !== 1 ? "s" : ""} sin resolver distribuida${data.totalVencidas !== 1 ? "s" : ""} en el equipo.`,
      color: "bg-red-50 border-red-200",
    })
  }

  if (insights.length === 0) return null

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Insights del Equipo
        </CardTitle>
        <p className="text-xs text-slate-500">
          Observaciones descriptivas sobre la distribución actual de trabajo.
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