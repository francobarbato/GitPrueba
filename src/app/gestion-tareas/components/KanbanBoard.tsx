'use client'

// src/app/tareas/components/KanbanBoard.tsx

import { useState, useTransition } from "react"
import {
  Clock, CheckCircle2, AlertTriangle, XCircle,
  Eye, ChevronRight, User, Briefcase, Calendar,
  Flag, Lock, RotateCcw, ShieldAlert
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cambiarEstadoTareaAction } from "src/lib/actions/tarea-actions"
import type { TareaConRelaciones } from "src/lib/actions/tarea-actions"
import type { EstadoTarea } from "@prisma/client"
import { format, isAfter, isBefore, addDays } from "date-fns"
import { es } from "date-fns/locale"

// ============================================================================
// HELPERS
// ============================================================================

const COLUMNAS: { estado: EstadoTarea; label: string; color: string; bg: string; border: string }[] = [
  { estado: "PENDIENTE",   label: "Pendiente",   color: "text-slate-600",  bg: "bg-slate-50",  border: "border-slate-200" },
  { estado: "EN_PROCESO",  label: "En Proceso",  color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200"  },
  { estado: "BLOQUEADA",   label: "Bloqueada",   color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200"   },
  { estado: "EN_REVISION", label: "En Revisión", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200" },
  { estado: "COMPLETADA",  label: "Completada",  color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200" },
]

const PRIORIDAD_CONFIG = {
  BAJA:  { label: "Baja",   color: "bg-slate-100 text-slate-600 border-slate-200" },
  MEDIA: { label: "Media",  color: "bg-blue-100 text-blue-700 border-blue-200"    },
  ALTA:  { label: "Alta",   color: "bg-orange-100 text-orange-700 border-orange-200" },
  FATAL: { label: "Fatal",  color: "bg-red-100 text-red-700 border-red-200"       },
}

const CATEGORIA_LABELS: Record<string, string> = {
  DOCUMENTACION:        "Documentación",
  GESTION_PROCESAL:     "Gestión Procesal",
  REUNION:              "Reunión",
  FINANCIERA:           "Financiera",
  TRAMITE_ADMINISTRATIVO: "Trámite Admin.",
  REQUERIMIENTO_CLIENTE: "Req. Cliente",
  OTRO:                 "Otro",
}

function getAlertaVencimiento(fechaVencimiento: string | null): "vencida" | "urgente" | "proxima" | null {
  if (!fechaVencimiento) return null
  const fecha = new Date(fechaVencimiento)
  const ahora = new Date()
  if (isBefore(fecha, ahora)) return "vencida"
  if (isBefore(fecha, addDays(ahora, 2))) return "urgente"
  if (isBefore(fecha, addDays(ahora, 7))) return "proxima"
  return null
}

// ============================================================================
// MODAL DE BLOQUEO
// ============================================================================

function ModalBloqueo({
  tareaId,
  onClose,
  onConfirm,
}: {
  tareaId: string
  onClose: () => void
  onConfirm: (motivo: string) => void
}) {
  const [motivo, setMotivo] = useState("")

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Motivo de bloqueo</h3>
        <p className="text-sm text-slate-500 mb-4">
          Explicá por qué esta tarea no puede avanzar. Esto quedará registrado.
        </p>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: Esperando respuesta del cliente, Juzgado de paro..."
          className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={!motivo.trim()}
            onClick={() => onConfirm(motivo)}
          >
            Confirmar bloqueo
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// CARD DE TAREA
// ============================================================================

function TareaCard({
  tarea,
  onEstadoChange,
}: {
  tarea: TareaConRelaciones
  onEstadoChange: (id: string, estado: EstadoTarea, motivo?: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const alerta = getAlertaVencimiento(tarea.fechaVencimiento)
  const prioridadCfg = PRIORIDAD_CONFIG[tarea.prioridad]
  const esProcesal = tarea.tipo === "PROCESAL"

  const bordeIzquierdo = esProcesal
    ? "border-l-4 border-l-red-500"
    : tarea.estado === "BLOQUEADA"
    ? "border-l-4 border-l-red-400"
    : alerta === "vencida"
    ? "border-l-4 border-l-red-400"
    : alerta === "urgente"
    ? "border-l-4 border-l-orange-400"
    : ""

  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all ${bordeIzquierdo}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {esProcesal && (
              <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold border border-red-200 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> PROCESAL
              </span>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${prioridadCfg.color}`}>
              {prioridadCfg.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
              {CATEGORIA_LABELS[tarea.categoria]}
            </span>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-600 shrink-0">
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
        </div>

        {/* Título */}
        <p className="text-sm font-semibold text-slate-800 mb-2 leading-tight">{tarea.titulo}</p>

        {/* Caso vinculado */}
        {tarea.caso && (
          <div className="flex items-center gap-1 mb-2">
            <Briefcase className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500 font-mono">{tarea.caso.numero}</span>
          </div>
        )}

        {/* Fecha vencimiento */}
        {tarea.fechaVencimiento && (
          <div className={`flex items-center gap-1 mb-2 text-xs font-medium ${
            alerta === "vencida" ? "text-red-600" :
            alerta === "urgente" ? "text-orange-600" :
            alerta === "proxima" ? "text-amber-600" :
            "text-slate-500"
          }`}>
            <Calendar className="w-3 h-3" />
            {alerta === "vencida" && "Vencida — "}
            {alerta === "urgente" && "Urgente — "}
            {format(new Date(tarea.fechaVencimiento), "d MMM yyyy", { locale: es })}
          </div>
        )}

        {/* Responsable */}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <User className="w-3 h-3 text-slate-400" />
          <span>{tarea.responsable.nombre} {tarea.responsable.apellido}</span>
          {tarea.responsable.rol === "ASISTENTE" && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">Asistente</span>
          )}
        </div>

        {/* Motivo bloqueo */}
        {tarea.estado === "BLOQUEADA" && tarea.motivoBloqueo && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700 flex items-start gap-1">
              <Lock className="w-3 h-3 mt-0.5 shrink-0" />
              <span className="italic">{tarea.motivoBloqueo}</span>
            </p>
          </div>
        )}

        {/* Descripción expandida */}
        {expanded && tarea.descripcion && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-600 leading-relaxed">{tarea.descripcion}</p>
            {tarea.lugarFisico && (
              <p className="text-xs text-slate-500 mt-1">📍 {tarea.lugarFisico}</p>
            )}
          </div>
        )}

        {/* Acciones de estado */}
        {tarea.estado !== "COMPLETADA" && tarea.estado !== "VENCIDA" && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
            {tarea.estado !== "EN_PROCESO" && (
              <button
                onClick={() => onEstadoChange(tarea.id, "EN_PROCESO")}
                className="text-[10px] px-2 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
              >
                En proceso
              </button>
            )}
            {tarea.estado !== "EN_REVISION" && (
              <button
                onClick={() => onEstadoChange(tarea.id, "EN_REVISION")}
                className="text-[10px] px-2 py-1 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 transition-colors border border-amber-200"
              >
                En revisión
              </button>
            )}
            {tarea.estado !== "BLOQUEADA" && (
              <button
                onClick={() => onEstadoChange(tarea.id, "BLOQUEADA")}
                className="text-[10px] px-2 py-1 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors border border-red-200"
              >
                Bloquear
              </button>
            )}
            <button
              onClick={() => onEstadoChange(tarea.id, "COMPLETADA")}
              className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors border border-green-200"
            >
              ✓ Completar
            </button>
          </div>
        )}

        {/* Reabrir si está completada */}
        {tarea.estado === "COMPLETADA" && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => onEstadoChange(tarea.id, "PENDIENTE")}
              className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors border border-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reabrir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// KANBAN BOARD
// ============================================================================

type Props = {
  tareas: TareaConRelaciones[]
}

export function KanbanBoard({ tareas: tareasIniciales }: Props) {
  const [tareas, setTareas] = useState(tareasIniciales)
  const [isPending, startTransition] = useTransition()
  const [modalBloqueo, setModalBloqueo] = useState<string | null>(null)
  const [estadoPendiente, setEstadoPendiente] = useState<EstadoTarea | null>(null)

  const handleEstadoChange = (tareaId: string, nuevoEstado: EstadoTarea, motivo?: string) => {
    if (nuevoEstado === "BLOQUEADA" && !motivo) {
      setModalBloqueo(tareaId)
      setEstadoPendiente(nuevoEstado)
      return
    }

    startTransition(async () => {
      const result = await cambiarEstadoTareaAction(tareaId, nuevoEstado, motivo)
      if (result.success) {
        setTareas(prev =>
          prev.map(t =>
            t.id === tareaId
              ? {
                  ...t,
                  estado: nuevoEstado,
                  motivoBloqueo: motivo ?? null,
                  fechaCompletada: nuevoEstado === "COMPLETADA" ? new Date().toISOString() : null,
                }
              : t
          )
        )
      }
    })
  }

  const confirmarBloqueo = (motivo: string) => {
    if (modalBloqueo && estadoPendiente) {
      handleEstadoChange(modalBloqueo, "BLOQUEADA", motivo)
      setModalBloqueo(null)
      setEstadoPendiente(null)
    }
  }

  // Filtrar vencidas aparte
  const tareasVencidas = tareas.filter(t => t.estado === "VENCIDA")
  const columnas = COLUMNAS.map(col => ({
    ...col,
    tareas: tareas.filter(t => t.estado === col.estado),
  }))

  return (
    <>
      {modalBloqueo && (
        <ModalBloqueo
          tareaId={modalBloqueo}
          onClose={() => { setModalBloqueo(null); setEstadoPendiente(null) }}
          onConfirm={confirmarBloqueo}
        />
      )}

      {/* Banner vencidas */}
      {tareasVencidas.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {tareasVencidas.length} tarea{tareasVencidas.length !== 1 ? "s" : ""} vencida{tareasVencidas.length !== 1 ? "s" : ""} sin resolver
          </p>
        </div>
      )}

      {/* Kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {columnas.map(col => (
          <div key={col.estado} className={`rounded-xl border ${col.border} ${col.bg} p-3`}>
            {/* Header columna */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold uppercase tracking-wide ${col.color}`}>
                {col.label}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
                {col.tareas.length}
              </span>
            </div>

            {/* Tarjetas */}
            <div className="space-y-3 min-h-[120px]">
              {col.tareas.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">Sin tareas</div>
              ) : (
                col.tareas.map(tarea => (
                  <TareaCard
                    key={tarea.id}
                    tarea={tarea}
                    onEstadoChange={handleEstadoChange}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Vencidas al fondo */}
      {tareasVencidas.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Vencidas ({tareasVencidas.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {tareasVencidas.map(tarea => (
              <TareaCard
                key={tarea.id}
                tarea={tarea}
                onEstadoChange={handleEstadoChange}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}