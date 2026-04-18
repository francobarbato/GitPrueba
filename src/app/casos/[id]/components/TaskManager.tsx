'use client'

// src/app/casos/[id]/components/TaskManager.tsx
// SOLO LECTURA — informativo del caso. Para crear/editar ir a /gestion-tareas

import { useState } from "react"
import { format, isBefore, addDays, isToday } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarClock, CheckCircle2, Clock, AlertTriangle,
  ShieldAlert, Lock, Unlock, User, ExternalLink,
  ChevronLeft, ChevronRight, Scale, MapPin
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { TareaConRelaciones } from "src/lib/actions/tarea-actions"

// ============================================================================
// HELPERS
// ============================================================================

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  PENDIENTE:  { label: "Pendiente",  color: "text-slate-600",  bg: "bg-slate-100",  dot: "bg-slate-400"  },
  EN_PROCESO: { label: "En proceso", color: "text-blue-700",   bg: "bg-blue-100",   dot: "bg-blue-500"   },
  BLOQUEADA:  { label: "Bloqueada",  color: "text-red-700",    bg: "bg-red-100",    dot: "bg-red-500"    },
  COMPLETADA: { label: "Completada", color: "text-green-700",  bg: "bg-green-100",  dot: "bg-green-500"  },
  VENCIDA:    { label: "Vencida",    color: "text-red-700",    bg: "bg-red-100",    dot: "bg-red-600"    },
}

const PRIORIDAD_CONFIG: Record<string, { label: string; color: string }> = {
  BAJA:  { label: "Baja",  color: "text-slate-500"  },
  MEDIA: { label: "Media", color: "text-blue-600"   },
  ALTA:  { label: "Alta",  color: "text-orange-600" },
  FATAL: { label: "Fatal", color: "text-red-600"    },
}

const CATEGORIA_LABELS: Record<string, string> = {
  PRESENTACION_ESCRITO:    "Presentación / Escrito",
  AUDIENCIA:               "Audiencia",
  NOTIFICACION_CEDULA:     "Notificación / Cédula",
  CONTROL_EXPEDIENTE:      "Control de Expediente",
  APELACION_RECURSO:       "Apelación / Recurso",
  REUNION_CLIENTE:         "Reunión con Cliente",
  REDACCION_DOCUMENTACION: "Redacción / Documentación",
  TRAMITE_ADMINISTRATIVO:  "Trámite Administrativo",
  REQUERIMIENTO_CLIENTE:   "Req. al Cliente",
  GESTION_FINANCIERA:      "Gestión Financiera",
  REUNION_EQUIPO:          "Reunión de Equipo",
  PERICIA_PRUEBA:          "Pericia / Prueba",
  VENCIMIENTO_PLAZO: "Vencimiento / Plazo",
}

// Urgencia visual para tareas activas (no terminales)
function getUrgencia(t: TareaConRelaciones): "vencida" | "urgente" | "proxima" | null {
  if (t.estado === "COMPLETADA" || t.estado === "VENCIDA") return null
  if (!t.fechaVencimiento) return null
  const fecha = new Date(t.fechaVencimiento)
  const ahora = new Date()
  if (isBefore(fecha, ahora)) return "vencida"
  if (isBefore(fecha, addDays(ahora, 2))) return "urgente"
  if (isBefore(fecha, addDays(ahora, 7))) return "proxima"
  return null
}

// ============================================================================
// MINI CALENDARIO
// ============================================================================

function MiniCalendario({ tareas }: { tareas: TareaConRelaciones[] }) {
  const hoy = new Date()
  const [mesActual, setMesActual] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1))

  const diasEnMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).getDate()
  const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).getDay()
  const offset = primerDia === 0 ? 6 : primerDia - 1

  // Indexar tareas activas por día del mes
  const tareasPorDia = new Map<number, TareaConRelaciones[]>()
  tareas.forEach(t => {
    if (!t.fechaVencimiento) return
    const fecha = new Date(t.fechaVencimiento)
    if (fecha.getFullYear() === mesActual.getFullYear() && fecha.getMonth() === mesActual.getMonth()) {
      const dia = fecha.getDate()
      if (!tareasPorDia.has(dia)) tareasPorDia.set(dia, [])
      tareasPorDia.get(dia)!.push(t)
    }
  })

  const diasSemana = ["L", "M", "M", "J", "V", "S", "D"]

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1))} className="p-1 rounded hover:bg-slate-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-sm font-semibold text-slate-700 capitalize">
          {format(mesActual, "MMMM yyyy", { locale: es })}
        </span>
        <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1))} className="p-1 rounded hover:bg-slate-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {diasSemana.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} />)}

        {Array.from({ length: diasEnMes }).map((_, i) => {
          const dia = i + 1
          const tareasDelDia = tareasPorDia.get(dia) ?? []
          const esHoy = isToday(new Date(mesActual.getFullYear(), mesActual.getMonth(), dia))

          // Determinar color del punto
          const tieneFatalOVencida = tareasDelDia.some(t =>
            t.prioridad === "FATAL" || t.estado === "VENCIDA" || getUrgencia(t) === "vencida"
          )
          const tieneUrgente = tareasDelDia.some(t => getUrgencia(t) === "urgente")

          return (
            <div key={dia} className={`relative flex flex-col items-center py-1 rounded-lg text-xs transition-colors ${
              esHoy ? "bg-blue-600 text-white font-bold"
              : tareasDelDia.length > 0 ? "bg-slate-50 hover:bg-slate-100 cursor-default"
              : "text-slate-500"
            }`}>
              <span>{dia}</span>
              {tareasDelDia.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {esHoy ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  ) : tieneFatalOVencida ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  ) : tieneUrgente ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] text-slate-500">Fatal / Vencida</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-[10px] text-slate-500">Urgente (48hs)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-[10px] text-slate-500">Tarea pendiente</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// CARD DE TAREA (solo lectura)
// ============================================================================

function TareaCardReadOnly({ tarea }: { tarea: TareaConRelaciones }) {
  const estadoCfg = ESTADO_CONFIG[tarea.estado] ?? ESTADO_CONFIG.PENDIENTE
  const prioridadCfg = PRIORIDAD_CONFIG[tarea.prioridad] ?? PRIORIDAD_CONFIG.MEDIA
  const urgencia = getUrgencia(tarea)
  const esProcesal = tarea.tipo === "PROCESAL"
  const esTerminal = tarea.estado === "COMPLETADA" || tarea.estado === "VENCIDA"
  const lugarLimpio = tarea.lugarFisico?.replace(/^\[.*?\]\s?/, "") ?? null

  const bordeIzquierdo =
    tarea.estado === "VENCIDA" || urgencia === "vencida" ? "border-l-4 border-l-red-500" :
    urgencia === "urgente" ? "border-l-4 border-l-orange-400" :
    esProcesal || tarea.prioridad === "FATAL" ? "border-l-4 border-l-red-400" :
    tarea.estado === "BLOQUEADA" ? "border-l-4 border-l-red-400" : ""

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 ${bordeIzquierdo}`}>
      <div className="flex-1 min-w-0">
        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {esProcesal && (
            <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold border border-red-200 flex items-center gap-1">
              <Scale className="w-3 h-3" /> PROCESAL
            </span>
          )}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${estadoCfg.bg} ${estadoCfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dot}`} />
            {estadoCfg.label}
          </span>
          <span className={`text-[10px] font-semibold ${prioridadCfg.color}`}>
            {prioridadCfg.label}
          </span>
        </div>

        {/* Título */}
        <p className="text-sm font-semibold text-slate-800 mb-1.5">{tarea.titulo}</p>

        {/* Descripción */}
        {tarea.descripcion && (
          <p className="text-xs text-slate-500 mb-2 leading-relaxed line-clamp-2">
            {tarea.descripcion}
          </p>
        )}

        {/* Motivo bloqueo */}
        {tarea.estado === "BLOQUEADA" && tarea.motivoBloqueo && (
          <div className="flex items-start gap-1.5 mb-2 p-2 bg-red-50 rounded-lg border border-red-200">
            <Lock className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700">{tarea.motivoBloqueo.slice(0, 120)}{tarea.motivoBloqueo.length > 120 ? "..." : ""}</p>
          </div>
        )}

        {/* Motivo desbloqueo */}
        {tarea.motivoDesbloqueo && tarea.estado !== "BLOQUEADA" && (
          <div className="flex items-start gap-1.5 mb-2 p-2 bg-green-50 rounded-lg border border-green-200">
            <Unlock className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
            <div className="text-xs">
              <span className="text-green-700 font-medium">Desbloqueada: </span>
              <span className="text-green-600">{tarea.motivoDesbloqueo.slice(0, 120)}{tarea.motivoDesbloqueo.length > 120 ? "..." : ""}</span>
            </div>
          </div>
        )}

        {/* Fecha vencimiento */}
        {tarea.fechaVencimiento && (
          <div className={`flex items-center gap-1 text-xs font-medium mb-2 ${
            tarea.estado === "VENCIDA" || urgencia === "vencida" ? "text-red-600" :
            urgencia === "urgente" ? "text-orange-600" :
            urgencia === "proxima" ? "text-amber-600" :
            "text-slate-500"
          }`}>
            <Clock className="w-3 h-3" />
            {tarea.estado === "VENCIDA" && "Vencida — "}
            {urgencia === "vencida" && tarea.estado !== "VENCIDA" && "Plazo vencido — "}
            {urgencia === "urgente" && "Urgente — "}
            Vence: {format(new Date(tarea.fechaVencimiento), "d 'de' MMMM yyyy", { locale: es })}
          </div>
        )}

        {/* Lugar */}
        {lugarLimpio && lugarLimpio !== "Estudio Jurídico" && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500">{lugarLimpio}</span>
          </div>
        )}

        {/* Actores */}
        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              <span className="text-slate-400">Asignado a:</span>
              <span className="font-medium">{tarea.responsable.nombre} {tarea.responsable.apellido}</span>
            </div>
            {tarea.creadorId !== tarea.responsableId && (
              <div className="flex items-center gap-1 text-slate-400">
                <span>Creada por: {tarea.creador.nombre} {tarea.creador.apellido}</span>
              </div>
            )}
          {tarea.creadorId !== tarea.responsableId && (
            <span className="text-slate-400">
              creada por {tarea.creador.nombre} {tarea.creador.apellido}
            </span>
          )}
          {tarea.supervisor && tarea.supervisorId !== tarea.creadorId && (
            <span className="text-slate-400">
              supervisa {tarea.supervisor.nombre} {tarea.supervisor.apellido}
            </span>
          )}
        </div>

        {/* Fecha completada */}
        {tarea.estado === "COMPLETADA" && tarea.fechaCompletada && (
          <p className="text-[10px] text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completada el {format(new Date(tarea.fechaCompletada), "d MMM yyyy", { locale: es })}
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type Props = {
  casoId: string
  tareas: TareaConRelaciones[]
  puedeCrear: boolean
}

export function TaskManager({ casoId, tareas, puedeCrear }: Props) {
  const [filtro, setFiltro] = useState<"activas" | "completadas">("activas")

  // Separar por estado terminal
  const tareasActivas = tareas.filter(t => t.estado !== "COMPLETADA" && t.estado !== "VENCIDA")
  const tareasTerminadas = tareas.filter(t => t.estado === "COMPLETADA" || t.estado === "VENCIDA")

  const tareasFatalesOProcesales = tareasActivas.filter(t => t.prioridad === "FATAL" || t.tipo === "PROCESAL")
  const tareasConAlerta = tareasActivas.filter(t => {
    const u = getUrgencia(t)
    return u === "vencida" || u === "urgente"
  })

  const tareasMostradas = filtro === "activas" ? tareasActivas : tareasTerminadas

  // Ordenar: vencidas/urgentes primero, luego por fecha
  const tareasOrdenadas = [...tareasMostradas].sort((a, b) => {
    if (filtro === "completadas") {
      // Completadas: más recientes primero
      const fa = a.fechaCompletada ? new Date(a.fechaCompletada).getTime() : 0
      const fb = b.fechaCompletada ? new Date(b.fechaCompletada).getTime() : 0
      return fb - fa
    }
    // Activas: por urgencia y fecha
    const urgenciaOrden = { vencida: 0, urgente: 1, proxima: 2 }
    const ua = getUrgencia(a)
    const ub = getUrgencia(b)
    const oa = ua ? urgenciaOrden[ua] : 3
    const ob = ub ? urgenciaOrden[ub] : 3
    if (oa !== ob) return oa - ob
    if (a.fechaVencimiento && b.fechaVencimiento) {
      return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
    }
    if (a.fechaVencimiento) return -1
    if (b.fechaVencimiento) return 1
    return 0
  })

  return (
    <div className="space-y-6">

      {/* Alerta de tareas vencidas/urgentes */}
      {tareasConAlerta.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {tareasConAlerta.length} tarea{tareasConAlerta.length !== 1 ? "s" : ""} requiere{tareasConAlerta.length !== 1 ? "n" : ""} atención urgente en este caso
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda: calendario + KPIs + acceso */}
        <div className="space-y-4">
          <MiniCalendario tareas={tareasActivas} />

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-slate-800">{tareasActivas.length}</p>
              <p className="text-xs text-slate-500">Activas</p>
            </div>
            <div className={`border rounded-xl p-3 text-center ${tareasFatalesOProcesales.length > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
              <p className={`text-2xl font-bold ${tareasFatalesOProcesales.length > 0 ? "text-red-700" : "text-slate-800"}`}>
                {tareasFatalesOProcesales.length}
              </p>
              <p className={`text-xs ${tareasFatalesOProcesales.length > 0 ? "text-red-600" : "text-slate-500"}`}>Procesales / Fatal</p>
            </div>
          </div>

          {puedeCrear && (
            <Link href={`/gestion-tareas?caso=${casoId}`}>
              <Button variant="outline" className="w-full gap-2 text-sm">
                <ExternalLink className="w-4 h-4" />
                Gestionar agenda
              </Button>
            </Link>
          )}
        </div>

        {/* Columna derecha: lista de tareas */}
        <div className="lg:col-span-2 space-y-4">

          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            <button onClick={() => setFiltro("activas")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filtro === "activas" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              Activas ({tareasActivas.length})
            </button>
            <button onClick={() => setFiltro("completadas")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filtro === "completadas" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              Finalizadas ({tareasTerminadas.length})
            </button>
          </div>

          {tareasOrdenadas.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
              <CalendarClock className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">
                {filtro === "activas" ? "No hay actividad en este expediente" : "No hay actividades finalizadas"}
              </p>
              {filtro === "activas" && puedeCrear && (
                <Link href={`/gestion-tareas?caso=${casoId}`}>
                  <Button variant="ghost" size="sm" className="mt-2 gap-1 text-blue-600">
                    <ExternalLink className="w-3 h-3" /> Gestionar agenda para este expediente
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {tareasOrdenadas.map(tarea => (
                <TareaCardReadOnly key={tarea.id} tarea={tarea} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}