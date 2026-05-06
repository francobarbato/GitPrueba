'use client'

// app/reportes/auditoria/components/DetalleCasoAuditoria.tsx
//
// CAMBIO: agrega visualización de hitos de tareas (badge "EVENTO" + ícono
// distintivo + título de la tarea + categoría + acción destacada).

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Clock, CheckCircle2, AlertCircle, FileText,
  MapPin, DollarSign, Scale, Lock, RotateCcw,
  User, History, ShieldAlert, ArrowLeft, Calendar,
  ClipboardCheck, ClipboardX, Unlock, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Filter } from "lucide-react"
import type { EventoAuditoria } from "../page"

// ============================================================================
// HELPERS VISUALES
// ============================================================================

const ACCIONES_TAREA = [
  "TAREA_CREADA",
  "TAREA_ESTADO_CHANGE",
  "TAREA_COMPLETADA_CON_DEMORA",
  "TAREA_DESBLOQUEADA",
  "TAREA_VENCIDA_CERRADA_MANUAL",
]

const ACCIONES_CRITICAS = ["MONTO_CHANGE", "JUZGADO_CHANGE", "UBICACION_CHANGE", "CIERRE", "REAPERTURA"]

const CATEGORIA_LABELS: Record<string, string> = {
  PRESENTACION_ESCRITO: "Presentación / Escrito",
  AUDIENCIA: "Audiencia",
  NOTIFICACION_CEDULA: "Notificación / Cédula",
  CONTROL_EXPEDIENTE: "Control de Expediente",
  APELACION_RECURSO: "Apelación / Recurso",
  PERICIA_PRUEBA: "Pericia / Prueba",
  REUNION_CLIENTE: "Reunión con Cliente",
  REDACCION_DOCUMENTACION: "Redacción / Documentación",
  TRAMITE_ADMINISTRATIVO: "Trámite Administrativo",
  REQUERIMIENTO_CLIENTE: "Req. al Cliente",
  GESTION_FINANCIERA: "Gestión Financiera",
  REUNION_EQUIPO: "Reunión de Equipo",
  VENCIMIENTO_PLAZO: "Vencimiento / Plazo",
}

function esDeTarea(accion: string) {
  return ACCIONES_TAREA.includes(accion)
}

function esCritico(accion: string) {
  return ACCIONES_CRITICAS.includes(accion)
}

function getIcono(accion: string, estadoNuevo?: string | null) {
  switch (accion) {
    // Caso
    case "CREATE":           return <FileText className="h-4 w-4 text-green-600" />
    case "ESTADO_CHANGE":    return <CheckCircle2 className="h-4 w-4 text-blue-600" />
    case "PRIORIDAD_CHANGE": return <AlertCircle className="h-4 w-4 text-orange-500" />
    case "JUZGADO_CHANGE":   return <Scale className="h-4 w-4 text-amber-600" />
    case "UBICACION_CHANGE": return <MapPin className="h-4 w-4 text-amber-600" />
    case "MONTO_CHANGE":     return <DollarSign className="h-4 w-4 text-amber-600" />
    case "CIERRE":           return <Lock className="h-4 w-4 text-amber-600" />
    case "REAPERTURA":       return <RotateCcw className="h-4 w-4 text-amber-600" />
    // Tarea
    case "TAREA_CREADA":                  return <Sparkles className="h-4 w-4 text-indigo-600" />
    case "TAREA_ESTADO_CHANGE":
      if (estadoNuevo === "BLOQUEADA")    return <Lock className="h-4 w-4 text-indigo-600" />
      return <ClipboardCheck className="h-4 w-4 text-indigo-600" />
    case "TAREA_COMPLETADA_CON_DEMORA":   return <ClipboardCheck className="h-4 w-4 text-indigo-600" />
    case "TAREA_DESBLOQUEADA":            return <Unlock className="h-4 w-4 text-indigo-600" />
    case "TAREA_VENCIDA_CERRADA_MANUAL":  return <ClipboardX className="h-4 w-4 text-indigo-600" />
    default:                              return <Clock className="h-4 w-4 text-slate-500" />
  }
}

function getEstilos(accion: string, critico: boolean) {
  if (critico) return "border border-amber-300 bg-amber-50 border-l-4 border-l-amber-500"
  // Eventos de tarea: estilo indigo distintivo
  if (esDeTarea(accion)) return "border border-indigo-200 bg-indigo-50/50 border-l-4 border-l-indigo-400"
  switch (accion) {
    case "CREATE":           return "border border-green-200 bg-green-50"
    case "ESTADO_CHANGE":    return "border border-blue-200 bg-blue-50"
    case "PRIORIDAD_CHANGE": return "border border-orange-200 bg-orange-50"
    default:                 return "border border-slate-200 bg-slate-50"
  }
}

function getLabel(accion: string, estadoNuevo?: string | null) {
  switch (accion) {
    // Caso
    case "CREATE":           return "Creación de caso"
    case "ESTADO_CHANGE":    return "Cambio de etapa"
    case "PRIORIDAD_CHANGE": return "Cambio de prioridad"
    case "JUZGADO_CHANGE":   return "Modificación de juzgado"
    case "UBICACION_CHANGE": return "Modificación de ubicación"
    case "MONTO_CHANGE":     return "Modificación de monto"
    case "CIERRE":           return "Cierre de caso"
    case "REAPERTURA":       return "Reapertura de caso"
    // Tarea
    case "TAREA_CREADA":                  return "Evento creado"
    case "TAREA_ESTADO_CHANGE":
      if (estadoNuevo === "COMPLETADA")   return "Evento completado"
      if (estadoNuevo === "BLOQUEADA")    return "Evento bloqueado"
      return "Evento — cambio de estado"
    case "TAREA_COMPLETADA_CON_DEMORA":   return "Evento completado con demora"
    case "TAREA_DESBLOQUEADA":            return "Evento desbloqueado"
    case "TAREA_VENCIDA_CERRADA_MANUAL":  return "Evento vencido cerrado"
    default:                              return "Actualización"
  }
}

const ACCIONES_DETALLE = [
  { value: "todos",     label: "Todos los tipos",                grupo: "general" },
  { value: "criticos",  label: "⚠ Solo críticos",                grupo: "general" },
  { value: "eventos",   label: "Solo eventos (tareas)",          grupo: "general" },
  // Caso
  { value: "ESTADO_CHANGE",     label: "Cambios de etapa",           grupo: "caso" },
  { value: "MONTO_CHANGE",      label: "Modificaciones de monto",    grupo: "caso" },
  { value: "JUZGADO_CHANGE",    label: "Modificaciones de juzgado",  grupo: "caso" },
  { value: "UBICACION_CHANGE",  label: "Modificaciones de ubicación",grupo: "caso" },
  { value: "CIERRE",            label: "Cierres de caso",            grupo: "caso" },
  { value: "REAPERTURA",        label: "Reaperturas",                grupo: "caso" },
  { value: "PRIORIDAD_CHANGE",  label: "Cambios de prioridad",       grupo: "caso" },
  { value: "CREATE",            label: "Creaciones",                 grupo: "caso" },
  // Tarea
  { value: "TAREA_CREADA",                  label: "Eventos creados",            grupo: "tarea" },
  { value: "TAREA_ESTADO_CHANGE",           label: "Eventos completados / bloqueados", grupo: "tarea" },
  { value: "TAREA_COMPLETADA_CON_DEMORA",   label: "Eventos completados con demora",  grupo: "tarea" },
  { value: "TAREA_DESBLOQUEADA",            label: "Eventos desbloqueados",      grupo: "tarea" },
  { value: "TAREA_VENCIDA_CERRADA_MANUAL",  label: "Eventos vencidos cerrados",  grupo: "tarea" },
]

// ============================================================================
// CARD DE EVENTO
// ============================================================================

function EventoCard({ evento }: { evento: EventoAuditoria }) {
  const critico = esCritico(evento.accion)
  const esTarea = esDeTarea(evento.accion)

  return (
    <div className={`p-4 rounded-lg ${getEstilos(evento.accion, critico)}`}>
      {/* FILA 1: Hora + tipo de acción + badge EVENTO si aplica */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Badge EVENTO si la acción proviene de una tarea */}
          {esTarea && (
            <span className="text-[10px] px-2 py-0.5 bg-indigo-600 text-white rounded-full font-bold tracking-wider flex items-center gap-1">
              <ClipboardCheck className="w-3 h-3" />
              EVENTO
            </span>
          )}
          <span className={`text-xs font-semibold uppercase tracking-wide ${
            critico ? "text-amber-700" : esTarea ? "text-indigo-700" : "text-slate-500"
          }`}>
            {getLabel(evento.accion, evento.estadoNuevo)}
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

      {/* FILA 2: Información de la TAREA cuando aplica
          Estructura solicitada: primero título, después categoría, después la acción
          destacada (la acción ya va en el header arriba con uppercase). Acá ponemos
          el título de la tarea + categoría como contexto de qué evento estamos viendo. */}
      {esTarea && evento.tarea ? (
        <div className="mb-2">
          <p className="text-sm font-bold text-slate-800">{evento.tarea.titulo}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {CATEGORIA_LABELS[evento.tarea.categoria] ?? evento.tarea.categoria}
            {evento.tarea.tipo === "PROCESAL" && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-200 font-medium">PROCESAL</span>
            )}
          </p>
        </div>
      ) : (
        /* Para eventos de caso: el texto de la bitácora (como antes) */
        <p className={`text-sm ${critico ? "text-amber-900" : "text-slate-700"}`}>{evento.texto}</p>
      )}

      {/* Transición de estados — solo para eventos de caso (las tareas ya tienen su propia descripción) */}
      {!esTarea && evento.estadoAnterior && evento.estadoNuevo && (
        <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
          <span className="px-2 py-0.5 bg-slate-200 rounded">{evento.estadoAnterior}</span>
          <span>→</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{evento.estadoNuevo}</span>
        </div>
      )}

      {/* Texto descriptivo del evento de tarea (cuando hay) */}
      {esTarea && evento.texto && (
        <p className="text-xs text-slate-600 mt-2 italic">{evento.texto}</p>
      )}

      {/* Observación / detalle */}
      {evento.detalle && (
        <p className={`text-xs mt-2 border-l-2 pl-2 ${
          critico ? "border-amber-400 text-amber-700" :
          esTarea ? "border-indigo-300 text-indigo-700" :
                    "border-slate-300 text-slate-500"
        }`}>
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

  const eventosFiltrados = eventos.filter(e => {
    if (filtroAccionDetalle === "todos") return true
    if (filtroAccionDetalle === "criticos") return ACCIONES_CRITICAS.includes(e.accion)
    if (filtroAccionDetalle === "eventos") return esDeTarea(e.accion)
    return e.accion === filtroAccionDetalle
  })

  const cantidadCriticos = eventos.filter(e => ACCIONES_CRITICAS.includes(e.accion)).length
  const cantidadEventos = eventos.filter(e => esDeTarea(e.accion)).length

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

  const accionesGenerales = ACCIONES_DETALLE.filter(a => a.grupo === "general")
  const accionesCaso = ACCIONES_DETALLE.filter(a => a.grupo === "caso")
  const accionesTarea = ACCIONES_DETALLE.filter(a => a.grupo === "tarea")

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
            {cantidadEventos > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 text-center min-w-[80px]">
                <p className="text-2xl font-bold text-indigo-700">{cantidadEventos}</p>
                <p className="text-xs text-indigo-600">evento{cantidadEventos !== 1 ? "s" : ""}</p>
              </div>
            )}
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
            <SelectTrigger className="text-sm h-8 w-[220px]">
              <SelectValue placeholder="Tipo de acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {accionesGenerales.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase tracking-wider text-slate-400">Expediente</SelectLabel>
                {accionesCaso.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase tracking-wider text-slate-400">Eventos</SelectLabel>
                {accionesTarea.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectGroup>
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
            {eventosFiltrados.map(evento => {
              const esTarea = esDeTarea(evento.accion)
              const critico = esCritico(evento.accion)
              return (
                <div key={evento.id} className="relative">
                  <div className={`absolute -left-[1.65rem] top-3 w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center ${
                    critico  ? "border-amber-400" :
                    esTarea  ? "border-indigo-400" :
                               "border-slate-200"
                  }`}>
                    {getIcono(evento.accion, evento.estadoNuevo)}
                  </div>
                  <EventoCard evento={evento} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}