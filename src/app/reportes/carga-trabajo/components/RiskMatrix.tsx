import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, Activity, BarChart3, ArrowUpRight } from "lucide-react"

// Definimos la estructura de datos
interface RiskProps {
  data: {
    id: string
    expediente: string
    caratula: string
    cliente: string
    complejidad: string
    ultimoMovimiento: string
    diasInactivo: number
    estado: string
  }[]
}

export function RiskMatrix({ data }: RiskProps) {
  // Calculamos contadores para el resumen del header
  const criticos = data.filter((d) => d.estado === "Crítico").length
  const atencion = data.filter((d) => d.estado === "Atención").length

  return (
    <Card className="shadow-md border-slate-200 mt-6">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Casos con plazos criticos</CardTitle>
              <CardDescription>Identificación de casos críticos por complejidad e inactividad.</CardDescription>
            </div>
          </div>
          <div className="flex gap-2 text-xs font-medium">
            {criticos > 0 && (
              <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded border border-rose-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {criticos} Críticos
              </span>
            )}
            {atencion > 0 && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded border border-amber-200 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {atencion} Atención
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b font-semibold">
              <tr>
                <th className="px-6 py-4">Expediente / Carátula</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-center">Complejidad</th>
                <th className="px-6 py-4 text-center">Último Movimiento</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((caso) => (
                <tr key={caso.id} className="hover:bg-slate-50 transition duration-150 group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{caso.caratula}</div>
                    <div className="text-xs text-slate-500 font-mono">{caso.expediente}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{caso.cliente}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge
                      variant="outline"
                      className={`
                        ${caso.complejidad === "Alta" ? "border-purple-200 text-purple-700 bg-purple-50" : caso.complejidad === "Media" ? "border-blue-200 text-blue-700 bg-blue-50" : "border-slate-200 text-slate-600 bg-slate-50"}
                    `}
                    >
                      {caso.complejidad}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-slate-700 font-medium">{caso.ultimoMovimiento}</div>
                    <div
                      className={`text-xs font-bold ${
                        caso.diasInactivo > 45
                          ? "text-rose-600"
                          : caso.diasInactivo > 15
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      Hace {caso.diasInactivo} días
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {caso.estado === "Crítico" ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> CRÍTICO
                        </span>
                      ) : caso.estado === "Atención" ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
                          <Clock className="w-3 h-3" /> ATENCIÓN
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <BarChart3 className="w-3 h-3" /> AL DÍA
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-blue-600 transition group-hover:translate-x-1">
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
