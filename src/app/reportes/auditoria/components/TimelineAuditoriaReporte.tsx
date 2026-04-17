'use client'

// app/reportes/auditoria/components/TimelineAuditoriaReporte.tsx

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  History, ShieldAlert, ChevronRight, User,
  FileText, CheckCircle2, DollarSign, Scale,
  MapPin, Lock, RotateCcw, AlertCircle, Clock, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { EventoAuditoria, EventosPorDia } from "../page"

// ============================================================================
// HELPERS
// ============================================================================

const ACCIONES_CRITICAS = ["MONTO_CHANGE", "JUZGADO_CHANGE", "UBICACION_CHANGE", "CIERRE", "REAPERTURA"]

function esCritico(accion: string) {
  return ACCIONES_CRITICAS.includes(accion)
}

function getLabel(accion: string) {
  switch (accion) {
    case "CREATE":           return "Creación"
    case "ESTADO_CHANGE":    return "Cambio de etapa"
    case "PRIORIDAD_CHANGE": return "Prioridad"
    case "JUZGADO_CHANGE":   return "Juzgado"
    case "UBICACION_CHANGE": return "Ubicación"
    case "MONTO_CHANGE":     return "Monto"
    case "CIERRE":           return "Cierre"
    case "REAPERTURA":       return "Reapertura"
    default:                 return "Actualización"
  }
}

function getIconoSmall(accion: string) {
  switch (accion) {
    case "CREATE":           return <FileText className="h-3 w-3" />
    case "ESTADO_CHANGE":    return <CheckCircle2 className="h-3 w-3" />
    case "PRIORIDAD_CHANGE": return <AlertCircle className="h-3 w-3" />
    case "JUZGADO_CHANGE":   return <Scale className="h-3 w-3" />
    case "UBICACION_CHANGE": return <MapPin className="h-3 w-3" />
    case "MONTO_CHANGE":     return <DollarSign className="h-3 w-3" />
    case "CIERRE":           return <Lock className="h-3 w-3" />
    case "REAPERTURA":       return <RotateCcw className="h-3 w-3" />
    default:                 return <Clock className="h-3 w-3" />
  }
}

function agruparPorCaso(eventos: EventoAuditoria[]): Map<string, EventoAuditoria[]> {
  const grupos = new Map<string, EventoAuditoria[]>()
  eventos.forEach(evento => {
    const key = evento.caso?.id || "sin-caso"
    if (!grupos.has(key)) grupos.set(key, [])
    grupos.get(key)!.push(evento)
  })
  return grupos
}

function getAutoresUnicos(eventos: EventoAuditoria[]): string[] {
  const nombres = new Set(eventos.map(e => `${e.usuario.nombre} ${e.usuario.apellido}`.trim()))
  return Array.from(nombres)
}

// ============================================================================
// TARJETA DE CASO — Modo fecha
// ============================================================================

function TarjetaCaso({
  casoId, casoNumero, casoTitulo, eventos, onVerDetalle,
}: {
  casoId: string; casoNumero: string; casoTitulo: string
  eventos: EventoAuditoria[]; onVerDetalle: () => void
}) {
  const criticos = eventos.filter(e => esCritico(e.accion))
  const autores = getAutoresUnicos(eventos)
  const tiposUnicos = Array.from(new Set(eventos.map(e => e.accion)))
  const horas = eventos.map(e => new Date(e.createdAt).getTime()).sort((a, b) => a - b)
  const horaInicio = format(new Date(horas[0]), "HH:mm", { locale: es })
  const horaFin = format(new Date(horas[horas.length - 1]), "HH:mm", { locale: es })
  const tieneCriticos = criticos.length > 0

  return (
    <div
      className={`bg-white border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group ${
        tieneCriticos ? "border-amber-300 hover:border-amber-400" : "border-slate-200 hover:border-slate-300"
      }`}
      onClick={onVerDetalle}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-base font-bold text-slate-800">{casoNumero}</span>
            {tieneCriticos && (
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold flex items-center gap-1 border border-amber-200">
                <ShieldAlert className="w-3 h-3" />
                {criticos.length} crítico{criticos.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate mb-3">{casoTitulo}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tiposUnicos.map(accion => (
              <span
                key={accion}
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                  esCritico(accion)
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {getIconoSmall(accion)}
                {getLabel(accion)}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <User className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500">{autores.join(" · ")}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-800">{eventos.length}</p>
            <p className="text-xs text-slate-400">movimiento{eventos.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-mono">{horaInicio} — {horaFin}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TARJETA ÚNICA DE CASO — Modo caso (con días listados adentro)
// ============================================================================

function TarjetaCasoConDias({
  casoBuscado, eventosCasoAgrupados, onVerDia,
}: {
  casoBuscado: { id: string; numero: string; titulo: string }
  eventosCasoAgrupados: EventosPorDia[]
  onVerDia: (fecha: string) => void
}) {
  const totalEventos = eventosCasoAgrupados.reduce((acc, d) => acc + d.eventos.length, 0)
  const totalCriticos = eventosCasoAgrupados.reduce(
    (acc, d) => acc + d.eventos.filter(e => esCritico(e.accion)).length, 0
  )

  if (eventosCasoAgrupados.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-medium text-slate-600">Sin actividad registrada para este caso</p>
        <p className="text-sm text-slate-400 mt-1">Probá ajustando el rango de fechas</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header de la tarjeta */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{casoBuscado.numero}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{casoBuscado.titulo}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-center min-w-[70px]">
              <p className="text-xl font-bold text-slate-800">{totalEventos}</p>
              <p className="text-xs text-slate-500">eventos</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-center min-w-[70px]">
              <p className="text-xl font-bold text-slate-800">{eventosCasoAgrupados.length}</p>
              <p className="text-xs text-slate-500">día{eventosCasoAgrupados.length !== 1 ? "s" : ""}</p>
            </div>
            {totalCriticos > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-center min-w-[70px]">
                <p className="text-xl font-bold text-amber-700">{totalCriticos}</p>
                <p className="text-xs text-amber-600">crítico{totalCriticos !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de días */}
      <div className="divide-y divide-slate-100">
        {eventosCasoAgrupados.map((dia) => {
          const criticosDia = dia.eventos.filter(e => esCritico(e.accion))
          const tiposDia = Array.from(new Set(dia.eventos.map(e => e.accion)))
          const autoresDia = getAutoresUnicos(dia.eventos)
          const horas = dia.eventos.map(e => new Date(e.createdAt).getTime()).sort((a, b) => a - b)
          const horaInicio = format(new Date(horas[0]), "HH:mm", { locale: es })
          const horaFin = format(new Date(horas[horas.length - 1]), "HH:mm", { locale: es })

          return (
            <div
              key={dia.fecha}
              className="px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors group"
              onClick={() => onVerDia(dia.fecha)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Fecha */}
                  <div className="flex items-center gap-2 shrink-0 w-48">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm font-medium text-slate-700 capitalize">{dia.fechaLabel}</span>
                  </div>

                  {/* Tipos de acción */}
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {tiposDia.map(accion => (
                      <span
                        key={accion}
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                          esCritico(accion)
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {getIconoSmall(accion)}
                        {getLabel(accion)}
                      </span>
                    ))}
                    {criticosDia.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold border border-amber-200">
                        <ShieldAlert className="w-3 h-3" />
                        {criticosDia.length} crítico{criticosDia.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Autor */}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{autoresDia.join(", ")}</span>
                  </div>
                  {/* Hora y cantidad */}
                  <span className="text-xs text-slate-400 font-mono">{horaInicio}{horas.length > 1 ? ` — ${horaFin}` : ""}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-slate-700">{dia.eventos.length}</span>
                    <span className="text-xs text-slate-400">evento{dia.eventos.length !== 1 ? "s" : ""}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type Props = {
  eventos: EventoAuditoria[]
  currentPage: number
  totalPages: number
  modoBusqueda: "fecha" | "caso"
  eventosCasoAgrupados: EventosPorDia[]
  casoBuscado: { id: string; numero: string; titulo: string } | null
}

export function TimelineAuditoriaReporte({
  eventos, currentPage, totalPages,
  modoBusqueda, eventosCasoAgrupados, casoBuscado
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const verDetalleCaso = (casoId: string, fecha?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("vista", "detalle")
    params.set("casoId", casoId)
    // Si viene de modo caso con un día específico, seteamos fecha exacta
    if (fecha) {
      params.set("fecha", fecha)
      params.delete("modo")
      params.delete("desde")
      params.delete("hasta")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // ---- MODO CASO ----
  if (modoBusqueda === "caso" && casoBuscado) {
    return (
      <TarjetaCasoConDias
        casoBuscado={casoBuscado}
        eventosCasoAgrupados={eventosCasoAgrupados}
        onVerDia={(fecha) => verDetalleCaso(casoBuscado.id, fecha)}
      />
    )
  }

  // ---- MODO FECHA ----
  if (eventos.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
        <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-medium text-slate-600">Sin eventos registrados</p>
        <p className="text-sm text-slate-400 mt-1">Probá cambiando los filtros o el rango de fechas</p>
      </div>
    )
  }

  const gruposPorCaso = agruparPorCaso(eventos)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from(gruposPorCaso.entries()).map(([casoId, eventosDelCaso]) => {
          const caso = eventosDelCaso[0]?.caso
          if (!caso) return null
          return (
            <TarjetaCaso
              key={casoId}
              casoId={casoId}
              casoNumero={caso.numero}
              casoTitulo={caso.titulo}
              eventos={eventosDelCaso}
              onVerDetalle={() => verDetalleCaso(casoId)}
            />
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div className="w-28">
            {currentPage > 1 && (
              <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} className="flex items-center gap-2">
                ← Anterior
              </Button>
            )}
          </div>
          <span className="text-sm font-medium text-slate-600">Página {currentPage} de {totalPages}</span>
          <div className="w-28 flex justify-end">
            {currentPage < totalPages && (
              <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} className="flex items-center gap-2">
                Siguiente <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}