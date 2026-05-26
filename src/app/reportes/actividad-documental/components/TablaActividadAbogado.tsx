'use client'

// app/reportes/actividad-documental/components/TablaActividadAbogado.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export type ActividadAbogado = {
  id: string
  nombre: string
  totalDocumentos: number
  totalMB: number
  pdf: number
  word: number
  excel: number
  imagen: number
  otros: number
  expedientesDistintos: number
}

function formatMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb.toFixed(1)} MB`
}

export function TablaActividadAbogado({ abogados }: { abogados: ActividadAbogado[] }) {
  if (abogados.length === 0) {
    return (
      <div className="p-12 bg-white border border-slate-200 rounded-lg text-center">
        <p className="text-lg font-medium text-slate-600">Sin actividad documental en el período</p>
        <p className="text-sm text-slate-400 mt-2">Ningún abogado subió documentos en el rango seleccionado.</p>
      </div>
    )
  }

  // Orden descendente por volumen de documentos.
  const ordenados = [...abogados].sort((a, b) => b.totalDocumentos - a.totalDocumentos)

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Actividad documental por abogado
        </CardTitle>
        <p className="text-xs text-slate-500">
          Volumen de documentos subidos por cada abogado en el período, desglosado por tipo de archivo.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Abogado</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Documentos</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expedientes</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Volumen</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">PDF</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Word</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Excel</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Imagen</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Otros</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((a, idx) => (
                <tr
                  key={a.id}
                  className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/20 transition-colors`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">{a.nombre}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-bold text-indigo-700">{a.totalDocumentos}</span>
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-slate-600">{a.expedientesDistintos}</td>
                  <td className="px-3 py-3 text-right text-xs font-medium text-slate-700">{formatMB(a.totalMB)}</td>
                  <td className="px-3 py-3 text-center text-xs text-slate-600">{a.pdf || '—'}</td>
                  <td className="px-3 py-3 text-center text-xs text-slate-600">{a.word || '—'}</td>
                  <td className="px-3 py-3 text-center text-xs text-slate-600">{a.excel || '—'}</td>
                  <td className="px-3 py-3 text-center text-xs text-slate-600">{a.imagen || '—'}</td>
                  <td className="px-3 py-3 text-center text-xs text-slate-600">{a.otros || '—'}</td>
                </tr>
              ))}
            </tbody>
            {/* Fila de totales */}
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <td className="px-4 py-3 text-xs text-slate-700 uppercase">Total estudio</td>
                <td className="px-3 py-3 text-center text-indigo-700">{ordenados.reduce((s, a) => s + a.totalDocumentos, 0)}</td>
                <td className="px-3 py-3 text-center text-xs text-slate-600">—</td>
                <td className="px-3 py-3 text-right text-xs text-slate-700">{formatMB(ordenados.reduce((s, a) => s + a.totalMB, 0))}</td>
                <td className="px-3 py-3 text-center text-xs text-slate-600">{ordenados.reduce((s, a) => s + a.pdf, 0)}</td>
                <td className="px-3 py-3 text-center text-xs text-slate-600">{ordenados.reduce((s, a) => s + a.word, 0)}</td>
                <td className="px-3 py-3 text-center text-xs text-slate-600">{ordenados.reduce((s, a) => s + a.excel, 0)}</td>
                <td className="px-3 py-3 text-center text-xs text-slate-600">{ordenados.reduce((s, a) => s + a.imagen, 0)}</td>
                <td className="px-3 py-3 text-center text-xs text-slate-600">{ordenados.reduce((s, a) => s + a.otros, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}