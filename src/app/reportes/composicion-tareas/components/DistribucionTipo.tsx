'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Scale, Briefcase } from "lucide-react"

export function DistribucionTipo({ data, total }: { data: { procesales: number; internas: number }; total: number }) {
  const pctProcesal = total > 0 ? Math.round((data.procesales / total) * 100) : 0
  const pctInterna = total > 0 ? Math.round((data.internas / total) * 100) : 0

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-600" />
          Procesal vs Interna
        </CardTitle>
        <p className="text-xs text-slate-500">Distribución del trabajo entre tareas vinculadas al proceso judicial y tareas operativas.</p>
      </CardHeader>
      <CardContent>
        {/* Barra visual comparativa */}
        <div className="relative h-12 rounded-lg overflow-hidden bg-slate-100 mb-4 flex">
          {data.procesales > 0 && (
            <div
              className="bg-red-500 flex items-center justify-center text-white text-sm font-bold transition-all"
              style={{ width: `${pctProcesal}%` }}
            >
              {pctProcesal >= 10 && `${pctProcesal}%`}
            </div>
          )}
          {data.internas > 0 && (
            <div
              className="bg-blue-500 flex items-center justify-center text-white text-sm font-bold transition-all"
              style={{ width: `${pctInterna}%` }}
            >
              {pctInterna >= 10 && `${pctInterna}%`}
            </div>
          )}
        </div>

        {/* Tarjetas detalle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-red-50/50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-800">Procesales</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-700">{data.procesales}</span>
              <span className="text-sm text-red-600">tareas ({pctProcesal}%)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Audiencias, presentaciones, notificaciones, apelaciones, pericias, control de expediente.</p>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Internas</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-700">{data.internas}</span>
              <span className="text-sm text-blue-600">tareas ({pctInterna}%)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Reuniones con clientes, redacción, trámites administrativos, gestión financiera, reuniones de equipo.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}