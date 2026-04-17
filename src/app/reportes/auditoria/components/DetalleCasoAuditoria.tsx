'use client'

// app/reportes/auditoria/components/DetalleCasoAuditoria.tsx

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Clock, CheckCircle2, AlertCircle, FileText,
  MapPin, DollarSign, Scale, Lock, RotateCcw,
  User, History, ShieldAlert, ArrowLeft, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter } from "lucide-react"
import type { EventoAuditoria } from "../page"

// ============================================================================
// HELPERS VISUALES (mismo que TimelineAuditoriaReporte)
// ============================================================================

function getIcono(accion: string) {
  switch (accion) {
    case "CREATE":           return <FileText className="h-4 w-4 text-green-600" />
    case "ESTADO_CHANGE":    return <CheckCircle2 className="h-4 w-4 text-blue-600" />
    case "PRIORIDAD_CHANGE": return <AlertCircle className="h-4 w-4 text-orange-500" />
    case "JUZGADO_CHANGE":   return <Scale className="h-4 w-4 text-amber-600" />
    case "UBICACION_CHANGE": return <MapPin className="h-4 w-4 text-amber-600" />
    case "MONTO_CHANGE":     return <DollarSign className="h-4 w-4 text-amber-600" />
    case "CIERRE":           return <Lock className="h-4 w-4 text-amber-600" />
    case "REAPERTURA":       return <RotateCcw className="h-4 w-4 text-amber-600" />
    default:                 return <Clock className="h-4 w-4 text-slate-500" />
  }
}

function getEstilos(accion: string, critico: boolean) {
  if (critico) return "border border-amber-300 bg-amber-50 border-l-4 border-l-amber-500"
  switch (accion) {
    case "CREATE":           return "border border-green-200 bg-green-50"
    case "ESTADO_CHANGE":    return "border border-blue-200 bg-blue-50"
    case "PRIORIDAD_CHANGE": return "border border-orange-200 bg-orange-50"
    default:                 return "border border-slate-200 bg-slate-50"
  }
}

function getLabel(accion: string) {
  switch (accion) {
    case "CREATE":           return "Creación de caso"
    case "ESTADO_CHANGE":    return "Cambio de etapa"
    case "PRIORIDAD_CHANGE": return "Cambio de prioridad"
    case "JUZGADO_CHANGE":   return "Modificación de juzgado"
    case "UBICACION_CHANGE": return "Modificación de ubicación"
    case "MONTO_CHANGE":     return "Modificación de monto"
    case "CIERRE":           return "Cierre de caso"
    case "REAPERTURA":       return "Reapertura de caso"
    default:                 return "Actualización"
  }
}

function esCritico(accion: string) {
  return ["MONTO_CHANGE", "JUZGADO_CHANGE", "UBICACION_CHANGE", "CIERRE", "REAPERTURA"].includes(accion)
}

const ACCIONES_DETALLE = [
  { value: "todos", label: "Todos los tipos" },
  { value: "criticos", label: "⚠ Solo críticos" },
  { value: "ESTADO_CHANGE", label: "Cambios de etapa" },
  { value: "MONTO_CHANGE", label: "Modificaciones de monto" },
  { value: "JUZGADO_CHANGE", label: "Modificaciones de juzgado" },
  { value: "UBICACION_CHANGE", label: "Modificaciones de ubicación" },
  { value: "CIERRE", label: "Cierres de caso" },
  { value: "REAPERTURA", label: "Reaperturas" },
  { value: "PRIORIDAD_CHANGE", label: "Cambios de prioridad" },
  { value: "CREATE", label: "Creaciones" },
]

// ============================================================================
// CARD DE EVENTO (igual que antes)
// ============================================================================

function EventoCard({ evento }: { evento: EventoAuditoria }) {
  const critico = esCritico(evento.accion)

  return (
    <div className={`p-4 rounded-lg ${getEstilos(evento.accion, critico)}`}>
      {/* FILA 1: Hora + tipo de acción */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold uppercase tracking-wide ${critico ? "text-amber-700" : "text-slate-500"}`}>
            {getLabel(evento.accion)}
          </span>
          {critico && (
            <span className="text-[10px] px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Crítico
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 shrink-0">
          {format(new Date(evento.createdAt), "HH:mm", { locale: es })}
        </span>
      </div>

      {/* FILA 2: Descripción */}
      <p className={`text-sm ${critico ? "text-amber-900" : "text-slate-700"}`}>{evento.texto}</p>

      {/* Transición de estados */}
      {evento.estadoAnterior && evento.estadoNuevo && (
        <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
          <span className="px-2 py-0.5 bg-slate-200 rounded">{evento.estadoAnterior}</span>
          <span>→</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{evento.estadoNuevo}</span>
        </div>
      )}

      {/* Observación */}
      {evento.detalle && (
        <p className={`text-xs mt-2 border-l-2 pl-2 ${critico ? "border-amber-400 text-amber-700" : "border-slate-300 text-slate-500"}`}>
          <span className="font-semibold not-italic">Observación:</span>{" "}
          <span className="italic">{evento.detalle.replace("Motivo: ", "")}</span>
        </p>
      )}

      {/* Autor */}
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-black/5">
        <User className="h-3 w-3 text-slate-400" />
        <span className="text-xs font-medium text-slate-600">
          {evento.usuario.nombre} {evento.usuario.apellido}
        </span>
        {evento.usuario.rol === "ASISTENTE" && (
          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
            Asistente
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type Props = {
  eventos: EventoAuditoria[]
  casoNumero: string
  casoTitulo: string
  casoId: string
  fechaLabel: string
  fechaParam: string
}

export function DetalleCasoAuditoria({ eventos, casoNumero, casoTitulo, casoId, fechaLabel, fechaParam }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filtroAccionDetalle = searchParams.get("accionDetalle") || "todos"

  const ACCIONES_CRITICAS = ["MONTO_CHANGE", "JUZGADO_CHANGE", "UBICACION_CHANGE", "CIERRE", "REAPERTURA"]

  const eventosFiltrados = eventos.filter(e => {
    if (filtroAccionDetalle === "todos") return true
    if (filtroAccionDetalle === "criticos") return ACCIONES_CRITICAS.includes(e.accion)
    return e.accion === filtroAccionDetalle
  })

  const cantidadCriticos = eventos.filter(e => ACCIONES_CRITICAS.includes(e.accion)).length

  const volver = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("vista")
    params.delete("casoId")
    params.delete("accionDetalle")
    router.push(`${pathname}?${params.toString()}`)
  }

  const setFiltroDetalle = (valor: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (valor === "todos") params.delete("accionDetalle")
    else params.set("accionDetalle", valor)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-4">

      {/* Header de Vista 2 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={volver}
              className="text-slate-500 hover:text-slate-800 gap-2 mt-0.5 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-500 capitalize">{fechaLabel}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {casoNumero}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">{casoTitulo}</p>
            </div>
          </div>

          {/* KPIs de este caso */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-slate-800">{eventos.length}</p>
              <p className="text-xs text-slate-500">movimiento{eventos.length !== 1 ? "s" : ""}</p>
            </div>
            {cantidadCriticos > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-center min-w-[80px]">
                <p className="text-2xl font-bold text-amber-700">{cantidadCriticos}</p>
                <p className="text-xs text-amber-600">crítico{cantidadCriticos !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        </div>

        {/* Filtro de tipo de acción dentro del detalle */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Select value={filtroAccionDetalle} onValueChange={setFiltroDetalle}>
            <SelectTrigger className="text-sm h-8 w-[200px]">
              <SelectValue placeholder="Tipo de acción" />
            </SelectTrigger>
            <SelectContent>
              {ACCIONES_DETALLE.map(a => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtroAccionDetalle !== "todos" && (
            <span className="text-xs text-slate-400">
              {eventosFiltrados.length} de {eventos.length} eventos
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      {eventosFiltrados.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-600">Sin eventos para este filtro</p>
          <p className="text-sm text-slate-400 mt-1">Probá cambiando el tipo de acción</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="relative border-l-2 border-slate-200 pl-6 space-y-3">
            {eventosFiltrados.map(evento => (
              <div key={evento.id} className="relative">
                <div className={`absolute -left-[1.65rem] top-3 w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center ${esCritico(evento.accion) ? "border-amber-400" : "border-slate-200"}`}>
                  {getIcono(evento.accion)}
                </div>
                <EventoCard evento={evento} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}