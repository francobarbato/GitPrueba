'use client'

import { Card } from "@/components/ui/card"
import { ListChecks, Layers } from "lucide-react"

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
    categoriaTop: { nombre: string; cantidad: number; porcentaje: number } | null
    cantidadCategorias: number
    totalCategoriasPosibles: number
  }
}

export function KPICardsComposicion({ data }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card className="p-4 border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <ListChecks className="w-4 h-4 text-purple-500" />
          <p className="text-xs text-slate-500 font-medium">Total registrado</p>
        </div>
        <p className="text-3xl font-bold text-slate-800">{data.total}</p>
        <p className="text-[10px] text-slate-400">
          eventos en el período seleccionado
          {" · "}
          <span className="text-slate-500 font-medium">
            {data.cantidadCategorias} de {data.totalCategoriasPosibles} categorías con actividad
          </span>
        </p>
      </Card>

      <Card className="p-4 border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-slate-500" />
          <p className="text-xs text-slate-500 font-medium">Categoría dominante</p>
        </div>
        <p className="text-xl font-bold text-slate-800 truncate">
          {data.categoriaTop ? (CATEGORIA_LABELS[data.categoriaTop.nombre] ?? data.categoriaTop.nombre) : "—"}
        </p>
        <p className="text-[10px] text-slate-400">
          {data.categoriaTop
            ? `${data.categoriaTop.cantidad} eventos · ${data.categoriaTop.porcentaje}% del total`
            : "sin datos"}
        </p>
      </Card>
    </div>
  )
}