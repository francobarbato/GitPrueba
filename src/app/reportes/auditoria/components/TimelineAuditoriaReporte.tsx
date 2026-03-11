'use client'

// app/reportes/auditoria/components/TimelineAuditoriaReporte.tsx

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Clock, CheckCircle2, AlertCircle, FileText,
  MapPin, DollarSign, Scale, Lock, RotateCcw,
  User, History, ShieldAlert, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { EventoAuditoria } from "../page"

// ============================================================================
// HELPERS VISUALES
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

// Críticos: siempre amarillo uniforme, independiente de la acción
// No críticos: color propio por tipo de acción
function getEstilos(accion: string, critico: boolean) {
  if (critico) {
    return "border border-amber-300 bg-amber-50 border-l-4 border-l-amber-500"
  }
  switch (accion) {
    case "CREATE":           return "border border-green-200 bg-green-50"
    case "ESTADO_CHANGE":    return "border border-blue-200 bg-blue-50"
    case "PRIORIDAD_CHANGE": return "border border-orange-200 bg-orange-50"
    default:                 return "border border-slate-200 bg-slate-50"
  }
}

function getLabel(accion: string) {
  switch (accion) {
    case "CREATE":           return "Creación de expediente"
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

function agruparPorDia(eventos: EventoAuditoria[]) {
  const grupos = new Map<string, EventoAuditoria[]>()
  eventos.forEach(evento => {
    const fecha = new Date(evento.createdAt)
    const hoy = new Date()
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)

    let key: string
    if (fecha.toDateString() === hoy.toDateString()) key = "HOY"
    else if (fecha.toDateString() === ayer.toDateString()) key = "AYER"
    else key = format(fecha, "EEEE d 'de' MMMM yyyy", { locale: es })

    if (!grupos.has(key)) grupos.set(key, [])
    grupos.get(key)!.push(evento)
  })
  return grupos
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type Props = {
  eventos: EventoAuditoria[]
  currentPage: number
  totalPages: number
}

export function TimelineAuditoriaReporte({ eventos, currentPage, totalPages }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  if (eventos.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
        <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-medium text-slate-600">Sin eventos registrados</p>
        <p className="text-sm text-slate-400 mt-1">
          Probá cambiando los filtros o el rango de fechas
        </p>
      </div>
    )
  }

  const grupos = agruparPorDia(eventos)

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">

      {/* Timeline con scroll interno */}
      <div className="p-6 max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="space-y-6">
          {Array.from(grupos.entries()).map(([dia, eventosDelDia]) => (
            <div key={dia}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{dia}</span>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">{eventosDelDia.length} evento{eventosDelDia.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="relative border-l-2 border-slate-200 pl-6 space-y-3">
                {eventosDelDia.map(evento => (
                  <div key={evento.id} className="relative">
                    <div className={`absolute -left-[1.65rem] top-3 w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center ${esCritico(evento.accion) ? "border-amber-400" : "border-slate-200"}`}>
                      {getIcono(evento.accion)}
                    </div>
                    <EventoCard evento={evento} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paginación — Anterior solo aparece si no es página 1 */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="w-24">
            {currentPage > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                className="flex items-center gap-2 bg-white"
              >
                ← Anterior
              </Button>
            )}
          </div>

          <span className="text-sm font-medium text-slate-600">
            Página {currentPage} de {totalPages}
          </span>

          <div className="w-24 flex justify-end">
            {currentPage < totalPages && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                className="flex items-center gap-2 bg-white"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// CARD DE EVENTO
// ============================================================================

function EventoCard({ evento }: { evento: EventoAuditoria }) {
  const critico = esCritico(evento.accion)

  return (
    <div className={`p-4 rounded-lg ${getEstilos(evento.accion, critico)}`}>

      {/* FILA 1: Expediente + hora */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {evento.caso ? (
          <Link
            href={`/casos/${evento.caso.id}`}
            className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors leading-tight"
          >
            #{evento.caso.numero}
            <span className="font-normal text-slate-600 ml-1">
              — {evento.caso.titulo.length > 45
                ? evento.caso.titulo.slice(0, 45) + "..."
                : evento.caso.titulo}
            </span>
          </Link>
        ) : (
          <span className="text-sm font-medium text-slate-500">Sin expediente</span>
        )}
        <span className="text-xs text-slate-400 shrink-0 mt-0.5">
          {format(new Date(evento.createdAt), "HH:mm", { locale: es })}
        </span>
      </div>

      {/* FILA 2: Tipo de acción + badge crítico */}
      <div className="flex items-center gap-2 mb-2">
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

      {/* FILA 3: Descripción */}
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

      {/* Quién lo hizo */}
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-black/5">
        <User className="h-3 w-3 text-slate-400" />
        <span className="text-xs text-slate-500">
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