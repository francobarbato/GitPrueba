'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Scale, Briefcase } from "lucide-react"

/**
 * Distribuye 100% entre dos valores garantizando suma exacta = 100 (cuando total > 0).
 * Si redondeando independientemente sumaría 99 o 101, ajusta al que tiene mayor parte fraccional.
 */
function porcentajesExactos2(v1: number, v2: number): [number, number] {
  const total = v1 + v2
  if (total === 0) return [0, 0]
  const exacto1 = (v1 / total) * 100
  const piso1 = Math.floor(exacto1)
  const piso2 = 100 - piso1 // garantiza que sumen 100
  // Si el redondeo "natural" quiere subir a v2, lo hacemos ahí en vez de en v1
  const fraccion1 = exacto1 - piso1
  if (fraccion1 >= 0.5 && piso1 < 100) return [piso1 + 1, piso2 - 1]
  return [piso1, piso2]
}

export function DistribucionTipo({ data, total }: { data: { procesales: number; internas: number }; total: number }) {
  const [pctProcesal, pctInterna] = porcentajesExactos2(data.procesales, data.internas)

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-600" />
          Procesal vs Interna
        </CardTitle>
        <p className="text-xs text-slate-500">Distribución del trabajo entre eventos vinculados al proceso judicial y eventos operativos.</p>
      </CardHeader>
      <CardContent>
        {/* Barra visual comparativa */}
        <div className="relative h-12 rounded-lg overflow-hidden bg-slate-100 mb-4 flex">
          {data.procesales > 0 && (
            <div
              className="bg-indigo-500 flex items-center justify-center text-white text-sm font-bold transition-all"
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
          <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-800">Procesales</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-700">{data.procesales}</span>
              <span className="text-sm text-indigo-600">eventos ({pctProcesal}%)</span>
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
              <span className="text-sm text-blue-600">eventos ({pctInterna}%)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Reuniones con clientes, redacción, trámites administrativos, gestión financiera, reuniones de equipo.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}