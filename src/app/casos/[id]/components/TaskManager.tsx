"use client"

<<<<<<< Updated upstream
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CalendarIcon, Plus, Trash2, Edit2, CalendarClock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "src/lib/utils"
import { useToast } from "../../../hooks/use-toast"

interface Requirement {
  id: string
  description: string
  dueDate: Date | null
  isCompleted: boolean
}

interface TaskManagerProps {
  casoId: string
  requirements: any[]
}

export function TaskManager({ casoId, requirements: initialRequirements }: TaskManagerProps) {
  const [tareas, setTareas] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTarea, setEditingTarea] = useState<Requirement | null>(null)

  // Form state
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
=======
// src/app/casos/[id]/components/TaskManager.tsx
// Vista de agenda dentro del expediente. Click en una card abre el drawer completo
// con las mismas acciones que en /gestion-tareas (completar, bloquear, comentar, etc).

import { useState, useTransition, useEffect } from "react"
import { format, isBefore, addDays, isToday } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarClock, CheckCircle2, Clock, AlertTriangle,
  Lock, Unlock, User, ExternalLink,
  ChevronLeft, ChevronRight, Scale, MapPin,
  CheckCheck, XCircle, Trash2,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { TareaConRelaciones } from "src/lib/actions/tarea-actions"
import type { EstadoTarea } from "@prisma/client"
import {
  cambiarEstadoTareaAction, cerrarVencidaAction,
  eliminarTareaAction, getTareaDetalle,
} from "src/lib/actions/tarea-actions"
import { TareaDetalleDrawer } from "../../../gestion-tareas/components/TareaDetalleDrawer"

// ============================================================================
// HELPERS DE PRESENTACIÓN
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

// Mismo time-boxing que en Agenda: vencidas >30d van al histórico
const DIAS_VENCIDA_ACTIVA = 30

function esVencidaActiva(t: TareaConRelaciones): boolean {
  if (t.estado !== "VENCIDA") return false
  if (t.vencidaCerradaEn) return false
  if (!t.fechaVencimiento) return false
  const dias = Math.floor((Date.now() - new Date(t.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24))
  return dias <= DIAS_VENCIDA_ACTIVA
}

function esTerminalParaBoard(t: TareaConRelaciones): boolean {
  if (t.estado === "COMPLETADA") return true
  if (t.estado === "VENCIDA" && !!t.vencidaCerradaEn) return true
  // Vencida abandonada (>30d sin cerrar) también se considera terminal para la vista
  if (t.estado === "VENCIDA" && !esVencidaActiva(t)) return true
  return false
}

function getUrgencia(t: TareaConRelaciones): "vencida" | "urgente" | "proxima" | null {
  if (esTerminalParaBoard(t)) return null
  if (t.estado === "VENCIDA") return "vencida" // vencida activa (<30d, sin cerrar)
  if (!t.fechaVencimiento) return null
  const fecha = new Date(t.fechaVencimiento)
  const ahora = new Date()
  if (isBefore(fecha, ahora)) return "vencida"
  if (isBefore(fecha, addDays(ahora, 2))) return "urgente"
  if (isBefore(fecha, addDays(ahora, 7))) return "proxima"
  return null
}

// ============================================================================
// MODALES — reutilizados de TareasBoard (bloqueo/desbloqueo/cerrar vencida/eliminar)
// ============================================================================

function ModalBloqueo({ onClose, onConfirm }: { onClose: () => void; onConfirm: (m: string) => void }) {
  const [motivo, setMotivo] = useState("")
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Bloquear tarea</h3>
            <p className="text-sm text-slate-500 mt-1">¿Por qué no puede avanzar esta tarea?</p>
          </div>
        </div>
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)}
          placeholder="Ej: Esperando respuesta del cliente, Juzgado de paro..."
          className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-red-300" />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button disabled={!motivo.trim()} onClick={() => onConfirm(motivo)}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium">
            Confirmar bloqueo
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalDesbloqueo({ onClose, onConfirm }: { onClose: () => void; onConfirm: (m: string) => void }) {
  const [motivo, setMotivo] = useState("")
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Unlock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Desbloquear tarea</h3>
            <p className="text-sm text-slate-500 mt-1">¿Qué cambió para que pueda retomarse?</p>
          </div>
        </div>
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)}
          placeholder="Ej: El cliente envió la documentación, El juzgado retomó actividad..."
          className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-green-300" />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button disabled={!motivo.trim()} onClick={() => onConfirm(motivo)}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
            Confirmar desbloqueo
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalCerrarVencida({ onClose, onConfirm }: { onClose: () => void; onConfirm: (m: string) => void }) {
  const [motivo, setMotivo] = useState("")
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Cerrar tarea vencida sin cumplir</h3>
            <p className="text-sm text-slate-500 mt-1">La tarea quedará archivada como vencida no cumplida. Esta acción no se puede deshacer.</p>
          </div>
        </div>
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)}
          placeholder="Ej: El socio decidió darla por perdida, El plazo ya no tiene sentido..."
          className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-slate-400" />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button disabled={!motivo.trim()} onClick={() => onConfirm(motivo)}
            className="px-4 py-2 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium">
            Confirmar cierre
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalEliminar({ titulo, onClose, onConfirm }: { titulo: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Eliminar tarea</h3>
            <p className="text-sm text-slate-500 mt-1">
              Esta acción no se puede deshacer. ¿Confirmas que querés eliminar{" "}
              <span className="font-semibold text-slate-700">"{titulo.slice(0, 50)}{titulo.length > 50 ? "..." : ""}"</span>?
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Eliminar</button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MINI CALENDARIO (igual que antes)
// ============================================================================

function MiniCalendario({ tareas }: { tareas: TareaConRelaciones[] }) {
  const hoy = new Date()
  const [mesActual, setMesActual] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1))

  const diasEnMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).getDate()
  const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).getDay()
  const offset = primerDia === 0 ? 6 : primerDia - 1

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
        <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1))}
          className="p-1 rounded hover:bg-slate-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-sm font-semibold text-slate-700 capitalize">
          {format(mesActual, "MMMM yyyy", { locale: es })}
        </span>
        <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1))}
          className="p-1 rounded hover:bg-slate-100 transition-colors">
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
// CARD DE TAREA — ahora clickeable, abre el drawer
// ============================================================================

function TareaCard({ tarea, onClick }: { tarea: TareaConRelaciones; onClick: () => void }) {
  const estadoCfg = ESTADO_CONFIG[tarea.estado] ?? ESTADO_CONFIG.PENDIENTE
  const prioridadCfg = PRIORIDAD_CONFIG[tarea.prioridad] ?? PRIORIDAD_CONFIG.MEDIA
  const urgencia = getUrgencia(tarea)
  const esProcesal = tarea.tipo === "PROCESAL"
  const esCompletada = tarea.estado === "COMPLETADA"
  const esVencidaCerrada = tarea.estado === "VENCIDA" && !!tarea.vencidaCerradaEn
  const esVencidaAbandonada = tarea.estado === "VENCIDA" && !tarea.vencidaCerradaEn && !esVencidaActiva(tarea)
  const lugarLimpio = tarea.lugarFisico?.replace(/^\[.*?\]\s?/, "") ?? null

  const bordeIzquierdo =
    tarea.estado === "VENCIDA" || urgencia === "vencida" ? "border-l-4 border-l-red-500" :
    urgencia === "urgente" ? "border-l-4 border-l-orange-400" :
    esProcesal || tarea.prioridad === "FATAL" ? "border-l-4 border-l-red-400" :
    tarea.estado === "BLOQUEADA" ? "border-l-4 border-l-red-400" : ""

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all ${bordeIzquierdo}`}
    >
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
          {esVencidaCerrada && (
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200 font-medium">
              Cerrada sin cumplir
            </span>
          )}
        </div>

        {/* Título */}
        <p className="text-sm font-semibold text-slate-800 mb-1.5 hover:text-blue-600 transition-colors">
          {tarea.titulo}
        </p>

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
            <p className="text-xs text-red-700">
              {tarea.motivoBloqueo.slice(0, 120)}{tarea.motivoBloqueo.length > 120 ? "..." : ""}
            </p>
          </div>
        )}

        {/* Motivo cierre vencida */}
        {esVencidaCerrada && tarea.motivoCierreVencida && (
          <div className="flex items-start gap-1.5 mb-2 p-2 bg-slate-100 rounded-lg border border-slate-200">
            <XCircle className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600">
              {tarea.motivoCierreVencida.slice(0, 120)}{tarea.motivoCierreVencida.length > 120 ? "..." : ""}
            </p>
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
            {tarea.estado === "VENCIDA" && !esVencidaCerrada && "Vencida — "}
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

        {/* Actores — una sola vez, sin duplicar */}
        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">Asignado a:</span>
            <span className="font-medium">{tarea.responsable.nombre} {tarea.responsable.apellido}</span>
          </div>
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

        {/* Fecha completada / abandonada */}
        {esCompletada && tarea.fechaCompletada && (
          <p className="text-[10px] text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completada el {format(new Date(tarea.fechaCompletada), "d MMM yyyy", { locale: es })}
            {tarea.fechaVencimiento && new Date(tarea.fechaCompletada) > new Date(tarea.fechaVencimiento) && (
              <span className="text-amber-600 font-medium ml-1">· con demora</span>
            )}
          </p>
        )}
        {esVencidaAbandonada && tarea.fechaVencimiento && (
          <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Vencida sin resolver hace{" "}
            {Math.floor((Date.now() - new Date(tarea.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24))} días
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
  currentUserId: string
}

export function TaskManager({ casoId, tareas: tareasIniciales, puedeCrear, currentUserId }: Props) {
  const [tareas, setTareas] = useState(tareasIniciales)
  useEffect(() => { setTareas(tareasIniciales) }, [tareasIniciales])

  const [filtro, setFiltro] = useState<"activas" | "completadas">("activas")
  const [isPending, startTransition] = useTransition()

  // Drawer + modales
  const [drawerTarea, setDrawerTarea] = useState<TareaConRelaciones | null>(null)
  const [modalBloqueo, setModalBloqueo] = useState<string | null>(null)
  const [modalDesbloqueo, setModalDesbloqueo] = useState<string | null>(null)
  const [modalCerrarVencida, setModalCerrarVencida] = useState<string | null>(null)
  const [modalEliminar, setModalEliminar] = useState<{ id: string; titulo: string } | null>(null)

  // Separar: activas (no terminales para board) vs terminadas (completadas, vencidas cerradas, vencidas abandonadas)
  const tareasActivas = tareas.filter(t => !esTerminalParaBoard(t))
  const tareasTerminadas = tareas.filter(t => esTerminalParaBoard(t))
>>>>>>> Stashed changes

  const { toast } = useToast()

  useEffect(() => {
    const formattedReqs = initialRequirements.map((r) => ({
      ...r,
      dueDate: r.dueDate ? new Date(r.dueDate) : null,
    }))
    setTareas(formattedReqs)
  }, [initialRequirements])

<<<<<<< Updated upstream
  // Cargar tareas
  const cargarTareas = async () => {
    try {
      console.log("[v0] Fetching tasks for case:", casoId)
      setLoading(true)
      const res = await fetch(`/api/tareas?casoId=${casoId}`)
      if (!res.ok) throw new Error("Error al cargar tareas")
      const data = await res.json()
      console.log("[v0] Tasks loaded:", data)

      // Convertir fechas de string a Date
      const tareasFormateadas = data.map((t: any) => ({
        ...t,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
      }))

      setTareas(tareasFormateadas)
    } catch (error) {
      console.error("[v0] Error cargando tareas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Crear o editar tarea
  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({
        title: "Error",
        description: "La descripción es requerida",
        variant: "destructive",
      })
      return
=======
  const tareasOrdenadas = [...tareasMostradas].sort((a, b) => {
    if (filtro === "completadas") {
      const fa = a.fechaCompletada ? new Date(a.fechaCompletada).getTime()
        : a.vencidaCerradaEn ? new Date(a.vencidaCerradaEn).getTime()
        : a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : 0
      const fb = b.fechaCompletada ? new Date(b.fechaCompletada).getTime()
        : b.vencidaCerradaEn ? new Date(b.vencidaCerradaEn).getTime()
        : b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : 0
      return fb - fa
    }
    const urgenciaOrden = { vencida: 0, urgente: 1, proxima: 2 }
    const ua = getUrgencia(a)
    const ub = getUrgencia(b)
    const oa = ua ? urgenciaOrden[ua] : 3
    const ob = ub ? urgenciaOrden[ub] : 3
    if (oa !== ob) return oa - ob
    if (a.fechaVencimiento && b.fechaVencimiento) {
      return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
>>>>>>> Stashed changes
    }

    console.log("[v0] Submitting task:", { description, dueDate, editingTarea })
    setSubmitting(true)
    try {
      if (editingTarea) {
        // Editar tarea existente
        const res = await fetch(`/api/tareas/${editingTarea.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "editar",
            description,
            dueDate: dueDate?.toISOString(),
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          console.error("[v0] Error response:", error)
          throw new Error(error.error || "Error al editar tarea")
        }

        toast({
          title: "Tarea actualizada",
          description: "La tarea se actualizó correctamente",
        })
      } else {
        // Crear nueva tarea
        console.log("[v0] Creating new task for case:", casoId)
        const res = await fetch("/api/tareas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            casoId,
            description,
            dueDate: dueDate?.toISOString(),
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          console.error("[v0] Error response:", error)
          throw new Error(error.error || "Error al crear tarea")
        }

        const newTask = await res.json()
        console.log("[v0] Task created successfully:", newTask)

        toast({
          title: "Tarea creada",
          description: "La tarea se creó correctamente y aparecerá en los reportes",
        })
      }

      // Resetear form y recargar
      setDescription("")
      setDueDate(undefined)
      setDialogOpen(false)
      setEditingTarea(null)
      await cargarTareas()
    } catch (error: any) {
      console.error("[v0] Error al guardar tarea:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la tarea",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Completar/reactivar tarea
  const toggleComplete = async (tarea: Requirement) => {
    try {
      console.log("[v0] Toggling task completion:", tarea.id, !tarea.isCompleted)
      const action = tarea.isCompleted ? "reactivar" : "completar"
      const res = await fetch(`/api/tareas/${tarea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) throw new Error("Error al actualizar tarea")

      await cargarTareas()

      toast({
        title: tarea.isCompleted ? "Tarea reactivada" : "Tarea completada",
        description: tarea.isCompleted ? "La tarea se reactivó correctamente" : "La tarea se marcó como completada",
      })
    } catch (error) {
      console.error("[v0] Error al cambiar estado:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive",
      })
    }
  }

  // Eliminar tarea
  const handleDelete = async (tareaId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta tarea?")) return

    try {
      console.log("[v0] Deleting task:", tareaId)
      const res = await fetch(`/api/tareas/${tareaId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Error al eliminar tarea")

      await cargarTareas()

      toast({
        title: "Tarea eliminada",
        description: "La tarea se eliminó correctamente",
      })
    } catch (error) {
      console.error("[v0] Error al eliminar:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      })
    }
  }

  // Abrir diálogo para editar
  const openEditDialog = (tarea: Requirement) => {
    setEditingTarea(tarea)
    setDescription(tarea.description)
    setDueDate(tarea.dueDate || undefined)
    setDialogOpen(true)
  }

  // Cerrar diálogo y resetear
  const closeDialog = () => {
    setDialogOpen(false)
    setEditingTarea(null)
    setDescription("")
    setDueDate(undefined)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const handleOpenDrawer = async (tarea: TareaConRelaciones) => {
    // Si ya hay un drawer abierto con OTRA tarea, lo cerramos primero
    // para que el Sheet desmonte el contenido viejo. Si no, el cambio de
    // tarea es invisible porque `open` sigue en true.
    if (drawerTarea && drawerTarea.id !== tarea.id) {
      setDrawerTarea(null)
    }
    try {
      const fresh = await getTareaDetalle(tarea.id)
      // setTimeout(0) asegura que el null anterior se aplique antes del nuevo set
      setTimeout(() => setDrawerTarea(fresh ?? tarea), 0)
    } catch {
      setTimeout(() => setDrawerTarea(tarea), 0)
    }
  }
 

  const handleCloseDrawer = () => setDrawerTarea(null)

  const handleCambioEstado = (tareaId: string, nuevoEstado: EstadoTarea, motivo?: string) => {
    if (nuevoEstado === "BLOQUEADA" && !motivo) { setModalBloqueo(tareaId); return }
    if (nuevoEstado === "PENDIENTE" && !motivo) {
      const t = tareas.find(x => x.id === tareaId)
      if (t?.estado === "BLOQUEADA") { setModalDesbloqueo(tareaId); return }
    }
    startTransition(async () => {
      const result = await cambiarEstadoTareaAction(tareaId, nuevoEstado, motivo)
      if (result.success) {
        setTareas(prev => prev.map(t => t.id === tareaId ? {
          ...t,
          estado: nuevoEstado,
          motivoBloqueo: nuevoEstado === "BLOQUEADA" ? (motivo ?? null) : t.motivoBloqueo,
          motivoDesbloqueo: (nuevoEstado === "PENDIENTE" && t.estado === "BLOQUEADA") ? (motivo ?? null) : t.motivoDesbloqueo,
          fechaCompletada: nuevoEstado === "COMPLETADA" ? new Date().toISOString() : t.fechaCompletada,
        } : t))
        setDrawerTarea(prev => prev?.id === tareaId ? {
          ...prev,
          estado: nuevoEstado,
          motivoBloqueo: nuevoEstado === "BLOQUEADA" ? (motivo ?? null) : prev.motivoBloqueo,
          motivoDesbloqueo: (nuevoEstado === "PENDIENTE" && prev.estado === "BLOQUEADA") ? (motivo ?? null) : prev.motivoDesbloqueo,
          fechaCompletada: nuevoEstado === "COMPLETADA" ? new Date().toISOString() : prev.fechaCompletada,
        } : prev)
      }
    })
    setModalBloqueo(null); setModalDesbloqueo(null)
  }

  const handleCerrarVencida = (tareaId: string) => setModalCerrarVencida(tareaId)

  const confirmarCerrarVencida = (motivo: string) => {
    if (!modalCerrarVencida) return
    const tareaId = modalCerrarVencida
    setModalCerrarVencida(null)
    startTransition(async () => {
      const result = await cerrarVencidaAction(tareaId, motivo)
      if (result.success) {
        const ahora = new Date().toISOString()
        setTareas(prev => prev.map(t => t.id === tareaId ? {
          ...t, vencidaCerradaEn: ahora, vencidaCerradaPorId: currentUserId, motivoCierreVencida: motivo,
        } : t))
        setDrawerTarea(prev => prev?.id === tareaId ? {
          ...prev, vencidaCerradaEn: ahora, vencidaCerradaPorId: currentUserId, motivoCierreVencida: motivo,
        } : prev)
      }
    })
  }

  const handleEdit = () => {
    // Edición avanzada vive en /gestion-tareas — redirigimos ahí.
    // Esto mantiene la UX del expediente enfocada en consulta + acciones rápidas.
    window.location.href = `/gestion-tareas?caso=${casoId}`
  }

  const handleDelete = (tareaId: string) => {
    const t = tareas.find(x => x.id === tareaId)
    if (t) setModalEliminar({ id: tareaId, titulo: t.titulo })
  }

  const confirmarEliminar = () => {
    if (!modalEliminar) return
    const { id } = modalEliminar
    setModalEliminar(null)
    startTransition(async () => {
      const result = await eliminarTareaAction(id)
      if (result.success) {
        setTareas(prev => prev.filter(t => t.id !== id))
        setDrawerTarea(prev => prev?.id === id ? null : prev)
      }
    })
  }

  return (
<<<<<<< Updated upstream
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={() => setEditingTarea(null)}>
              <Plus className="h-4 w-4" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTarea ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
              <DialogDescription>
                {editingTarea
                  ? "Modifica los detalles de la tarea"
                  : "Agrega una nueva tarea con fecha de vencimiento para generar alertas automáticas en los reportes"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Input
                  id="description"
                  placeholder="Ej: Presentar documentación en juzgado"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dueDate} onSelect={(date) => setDueDate(date ?? undefined)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Guardando..." : editingTarea ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tareas.length === 0 ? (
        <div className="text-center py-16">
          <CalendarClock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">La agenda está vacía</p>
          <p className="text-sm text-slate-400">Agrega una tarea para activar las alertas automáticas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tareas.map((tarea) => (
            <div
              key={tarea.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border hover:bg-slate-50 transition",
                tarea.isCompleted && "bg-muted/50",
              )}
            >
              <Checkbox checked={tarea.isCompleted} onCheckedChange={() => toggleComplete(tarea)} className="mt-1" />

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium text-slate-700",
                    tarea.isCompleted && "line-through text-muted-foreground",
                  )}
                >
                  {tarea.description}
                </p>

                {tarea.dueDate && (
                  <span
                    className={cn(
                      "inline-block px-2 py-1 rounded text-xs font-medium mt-1",
                      tarea.isCompleted ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-700",
                    )}
                  >
                    Vence: {format(tarea.dueDate, "PPP", { locale: es })}
                  </span>
                )}
              </div>

              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(tarea)} disabled={tarea.isCompleted}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(tarea.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
=======
    <div className="space-y-6">
      {modalBloqueo && <ModalBloqueo onClose={() => setModalBloqueo(null)} onConfirm={m => handleCambioEstado(modalBloqueo, "BLOQUEADA", m)} />}
      {modalDesbloqueo && <ModalDesbloqueo onClose={() => setModalDesbloqueo(null)} onConfirm={m => handleCambioEstado(modalDesbloqueo, "PENDIENTE", m)} />}
      {modalCerrarVencida && <ModalCerrarVencida onClose={() => setModalCerrarVencida(null)} onConfirm={confirmarCerrarVencida} />}
      {modalEliminar && <ModalEliminar titulo={modalEliminar.titulo} onClose={() => setModalEliminar(null)} onConfirm={confirmarEliminar} />}

      <TareaDetalleDrawer
        tarea={drawerTarea}
        open={!!drawerTarea}
        onClose={handleCloseDrawer}
        onChangeEstado={handleCambioEstado}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCerrarVencida={handleCerrarVencida}
        currentUserId={currentUserId}
      />

      {/* Alerta de tareas vencidas/urgentes */}
      {tareasConAlerta.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {tareasConAlerta.length} tarea{tareasConAlerta.length !== 1 ? "s" : ""} requiere{tareasConAlerta.length !== 1 ? "n" : ""} atención urgente en este expediente
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
                Crear / editar en Agenda
              </Button>
            </Link>
          )}

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Hacé clic en cualquier tarea para ver el detalle completo, comentar o gestionar su estado.
          </p>
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
                <TareaCard key={tarea.id} tarea={tarea} onClick={() => handleOpenDrawer(tarea)} />
              ))}
            </div>
          )}
        </div>
      </div>
>>>>>>> Stashed changes
    </div>
  )
}
