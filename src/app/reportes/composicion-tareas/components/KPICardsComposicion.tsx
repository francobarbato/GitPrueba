'use client'

import { Card } from "@/components/ui/card"
import { ListChecks, Scale, Briefcase, Layers } from "lucide-react"

const CATEGORIA_LABELS: Record<string, string> = {
  PRESENTACION_ESCRITO: "Presentación / Escrito", AUDIENCIA: "Audiencia",
  NOTIFICACION_CEDULA: "Notificación / Cédula", CONTROL_EXPEDIENTE: "Control de Expediente",
  APELACION_RECURSO: "Apelación / Recurso", PERICIA_PRUEBA: "Pericia / Prueba",
  REUNION_CLIENTE: "Reunión con Cliente", REDACCION_DOCUMENTACION: "Redacción / Documentación",
  TRAMITE_ADMINISTRATIVO: "Trámite Administrativo", REQUERIMIENTO_CLIENTE: "Req. al Cliente",
  GESTION_FINANCIERA: "Gestión Financiera", REUNION_EQUIPO: "Reunión de Equipo",
  VENCIMIENTO_PLAZO: "Vencimiento / Plazo",
}

type Props = {
  data: {
    total: number
    porcentajeProcesal: number
    porcentajeInterna: number
    categoriaTop: { nombre: string; cantidad: number; porcentaje: number } | null
    cantidadCategorias: number
  }
}

export function KPICardsComposicion({ data }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="p-4 border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <ListChecks className="w-4 h-4 text-purple-500" />
          <p className="text-xs text-slate-500 font-medium">Total tareas</p>
        </div>
        <p className="text-3xl font-bold text-slate-800">{data.total}</p>
        <p className="text-[10px] text-slate-400">en el período seleccionado</p>
      </Card>

      <Card className="p-4 border-red-200 bg-red-50/30">
        <div className="flex items-center gap-2 mb-1">
          <Scale className="w-4 h-4 text-red-500" />
          <p className="text-xs text-slate-500 font-medium">Procesales</p>
        </div>
        <p className="text-3xl font-bold text-red-700">{data.porcentajeProcesal}%</p>
        <p className="text-[10px] text-slate-400">vinculadas al proceso judicial</p>
      </Card>

      <Card className="p-4 border-blue-200 bg-blue-50/30">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="w-4 h-4 text-blue-500" />
          <p className="text-xs text-slate-500 font-medium">Internas</p>
        </div>
        <p className="text-3xl font-bold text-blue-700">{data.porcentajeInterna}%</p>
        <p className="text-[10px] text-slate-400">gestión operativa del estudio</p>
      </Card>

      <Card className="p-4 border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-indigo-500" />
          <p className="text-xs text-slate-500 font-medium">Categoría dominante</p>
        </div>
        <p className="text-base font-bold text-slate-800 truncate">
          {data.categoriaTop ? (CATEGORIA_LABELS[data.categoriaTop.nombre] ?? data.categoriaTop.nombre) : "—"}
        </p>
        <p className="text-[10px] text-slate-400">
          {data.categoriaTop ? `${data.categoriaTop.porcentaje}% del total (${data.cantidadCategorias} categorías distintas)` : `${data.cantidadCategorias} categorías distintas`}
        </p>
      </Card>
    </div>
  )
}