'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Scale } from "lucide-react"

export type FueroResultado = {
  tipoLabel: string
  totalCerrados: number
  favorables: number
  acuerdos: number
  desfavorables: number
  otros: number
  tasaExito: number
  promedioDias: number
}

export function TablaFueroResultados({ data }: { data: FueroResultado[] }) {
  if (data.length === 0) return null

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-600" />
          Resultados por Fuero
        </CardTitle>
        <p className="text-xs text-slate-500">
          ¿En qué materia tenemos mejor tasa de éxito? ¿Cuál tarda más en resolverse?
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fuero</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cerrados</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-emerald-600 uppercase tracking-wider">Favorables</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-blue-600 uppercase tracking-wider">Acuerdos</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-red-600 uppercase tracking-wider">Desfav.</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Otros</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasa Éxito</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prom. Días</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={row.tipoLabel}
                  className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">{row.tipoLabel}</td>
                  <td className="px-4 py-3 text-center font-medium text-slate-700">{row.totalCerrados}</td>
                  <td className="px-3 py-3 text-center text-emerald-600 font-medium">{row.favorables}</td>
                  <td className="px-3 py-3 text-center text-blue-600 font-medium">{row.acuerdos}</td>
                  <td className="px-3 py-3 text-center text-red-600 font-medium">{row.desfavorables}</td>
                  <td className="px-3 py-3 text-center text-slate-500">{row.otros}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-14 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            row.tasaExito >= 70 ? 'bg-emerald-500' : row.tasaExito >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(row.tasaExito, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{row.tasaExito}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{row.promedioDias} días</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}