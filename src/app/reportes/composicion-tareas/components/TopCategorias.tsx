'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Scale, Briefcase } from "lucide-react"
import type { CategoriaCount } from "../page"

const CATEGORIA_LABELS: Record<string, string> = {
  PRESENTACION_ESCRITO: "Presentación / Escrito", AUDIENCIA: "Audiencia",
  NOTIFICACION_CEDULA: "Notificación / Cédula", CONTROL_EXPEDIENTE: "Control de Expediente",
  APELACION_RECURSO: "Apelación / Recurso", PERICIA_PRUEBA: "Pericia / Prueba",
  REUNION_CLIENTE: "Reunión con Cliente", REDACCION_DOCUMENTACION: "Redacción / Documentación",
  TRAMITE_ADMINISTRATIVO: "Trámite Administrativo", REQUERIMIENTO_CLIENTE: "Req. al Cliente",
  GESTION_FINANCIERA: "Gestión Financiera", REUNION_EQUIPO: "Reunión de Equipo",
  VENCIMIENTO_PLAZO: "Vencimiento / Plazo",
}

export function TopCategorias({ data }: { data: CategoriaCount[] }) {
  if (data.length === 0) return null

  const maxCantidad = Math.max(...data.map(c => c.cantidad))

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Categorías más frecuentes
        </CardTitle>
        <p className="text-xs text-slate-500">
          Ranking de las categorías de tareas que más se realizan. El color indica si la categoría es procesal (rojo) o interna (azul).
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map(c => {
            const anchoBarra = (c.cantidad / maxCantidad) * 100
            const esProcesal = c.tipo === "PROCESAL"
            return (
              <div key={c.categoria} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {esProcesal ? (
                      <Scale className="w-3 h-3 text-red-500" />
                    ) : (
                      <Briefcase className="w-3 h-3 text-blue-500" />
                    )}
                    <span className="font-medium text-slate-700">{CATEGORIA_LABELS[c.categoria] ?? c.categoria}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{c.cantidad} tareas</span>
                    <span className="font-semibold text-slate-700 w-10 text-right">{c.porcentaje}%</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${esProcesal ? "bg-red-500" : "bg-blue-500"}`}
                    style={{ width: `${anchoBarra}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}