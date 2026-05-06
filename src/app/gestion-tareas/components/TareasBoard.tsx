"use client"

import { useState, useTransition, useMemo, useRef, useEffect, useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
  ShieldAlert, Lock, Unlock, User, Briefcase,
  Clock, AlertTriangle, ChevronRight, Scale,
  MapPin, Filter, MoreVertical, Pencil, Trash2,
  History, X, Eye, Sparkles, CheckCheck, Lock as LockIcon, Search,
  CheckCircle2, XCircle
} from "lucide-react"
import {
  cambiarEstadoTareaAction, eliminarTareaAction, editarTareaAction,
  marcarTareasComoVistasAction, getTareaDetalle, cerrarVencidaAction, marcarTareaComoLeidaAction, 
} from "src/lib/actions/tarea-actions"
import type { TareaConRelaciones } from "src/lib/actions/tarea-actions"
import type { EstadoTarea, PrioridadTarea } from "@prisma/client"
import { format, isToday, isTomorrow, isBefore, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { TareaDetalleDrawer } from "./TareaDetalleDrawer" 
import { CalendarioCarga } from "./CalendarioCarga"
import { getCargaResponsableAction } from "src/lib/actions/getCargaResponsable"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info } from "lucide-react"
import { ABRIR_TAREA_DRAWER_EVENT } from "@/app/components/header"
import { dispatchNotificationsRefresh } from "@/app/components/header"

// ============================================================================
// TIME-BOXING — Configuración
// ============================================================================
// Una vencida "activa" es una vencida no cerrada Y con <= 30 días desde el vencimiento.
// Pasado ese plazo, la tarea pasa automáticamente al histórico como "vencida abandonada".
// La lógica es client-side: la DB no cambia nada, solo cambia dónde la mostramos.
const DIAS_VENCIDA_ACTIVA = 30

function esVencidaActiva(t: TareaConRelaciones): boolean {
  if (t.estado !== "VENCIDA") return false
  if (t.vencidaCerradaEn) return false // ya cerrada manualmente
  if (!t.fechaVencimiento) return false
  const dias = differenceInDays(new Date(), new Date(t.fechaVencimiento))
  return dias <= DIAS_VENCIDA_ACTIVA
}

function esVencidaHistorica(t: TareaConRelaciones): boolean {
  if (t.estado !== "VENCIDA") return false
  if (t.vencidaCerradaEn) return true // cerrada manualmente → histórico
  if (!t.fechaVencimiento) return true
  const dias = differenceInDays(new Date(), new Date(t.fechaVencimiento))
  return dias > DIAS_VENCIDA_ACTIVA // abandonada → histórico
}

// ============================================================================
// HELPERS
// ============================================================================

type Urgencia = "vencida" | "hoy" | "manana" | "tres_dias" | "semana" | "quince" | "normal"

function getUrgencia(t: TareaConRelaciones): Urgencia {
  if (t.estado === "COMPLETADA") return "normal"
  if (!t.fechaVencimiento) return "normal"
  const partes = t.fechaVencimiento.split("T")[0].split("-")
  const f = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
  const ahora = new Date()
  const dias = differenceInDays(f, ahora)
  if (isBefore(f, ahora)) return "vencida"
  if (isToday(f)) return "hoy"
  if (isTomorrow(f)) return "manana"
  if (dias <= 3) return "tres_dias"
  if (dias <= 7) return "semana"
  if (dias <= 15) return "quince"
  return "normal"
}

function getEtiquetaTiempo(t: TareaConRelaciones): { color: string; bg: string } {
  if (t.estado === "COMPLETADA") return { color: "text-slate-400", bg: "bg-transparent" }
  if (!t.fechaVencimiento) return { color: "text-slate-400", bg: "bg-transparent" }
  const partes = t.fechaVencimiento.split("T")[0].split("-")
  const f = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
  const ahora = new Date()
  const dias = differenceInDays(f, ahora)
  if (isBefore(f, ahora)) return { color: "text-red-700",    bg: "bg-red-100" }
  if (isToday(f))         return { color: "text-red-700",    bg: "bg-red-100" }
  if (isTomorrow(f))      return { color: "text-orange-700", bg: "bg-orange-100" }
  if (dias <= 3)          return { color: "text-orange-600", bg: "bg-orange-50" }
  if (dias <= 7)          return { color: "text-amber-700",  bg: "bg-amber-50" }
  if (dias <= 15)         return { color: "text-slate-700",  bg: "bg-slate-100" }
  return                         { color: "text-slate-500",  bg: "bg-slate-50" }
}

function getEtiquetaFecha(t: TareaConRelaciones): { linea1: string; linea2: string | null } | null {
  if (t.estado === "COMPLETADA") return null
  if (!t.fechaVencimiento) return null
  const partes = t.fechaVencimiento.split("T")[0].split("-")
  const f = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
  const dias = differenceInDays(f, new Date())
  const fecha = format(f, "d MMM", { locale: es })
  const hora = format(f, "HH:mm")
  if (isBefore(f, new Date())) return { linea1: `Venció el ${fecha}`, linea2: null }
  if (isToday(f)) return { linea1: `Vence hoy — ${hora}`, linea2: null }
  if (isTomorrow(f)) return { linea1: `Vence mañana`, linea2: hora }
  return { linea1: `Vence el ${fecha}`, linea2: `en ${dias} días` }
}

const ESTADO_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  PENDIENTE: { label: "Pendiente", dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100" },
  EN_PROCESO: { label: "En proceso", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-100" },
  BLOQUEADA: { label: "Bloqueada", dot: "bg-amber-50", text: "text-amber-700", bg: "bg-amber-500" },
  COMPLETADA: { label: "Completada", dot: "bg-green-500", text: "text-green-700", bg: "bg-green-100" },
  VENCIDA: { label: "Vencida", dot: "bg-red-600", text: "text-red-700", bg: "bg-red-100" },
}

const PRIORIDAD_BADGE: Record<string, { label: string; bg: string; text: string; border: string; icon: boolean }> = {
  FATAL: { label: "FATAL", bg: "bg-orange-600",  text: "text-white",       border: "border-orange-600", icon: true },
  ALTA:  { label: "ALTA",  bg: "bg-yellow-100",  text: "text-yellow-800",  border: "border-yellow-300", icon: false },
}

const CATEGORIA_CONFIG: Record<string, { label: string; tipo: "PROCESAL" | "INTERNA" }> = {
  PRESENTACION_ESCRITO: { label: "Presentación / Escrito", tipo: "PROCESAL" },
  AUDIENCIA: { label: "Audiencia", tipo: "PROCESAL" },
  NOTIFICACION_CEDULA: { label: "Notificación / Cédula", tipo: "PROCESAL" },
  CONTROL_EXPEDIENTE: { label: "Control de Expediente", tipo: "PROCESAL" },
  APELACION_RECURSO: { label: "Apelación / Recurso", tipo: "PROCESAL" },
  PERICIA_PRUEBA: { label: "Pericia / Prueba", tipo: "PROCESAL" },
  REUNION_CLIENTE: { label: "Reunión con Cliente", tipo: "INTERNA" },
  REDACCION_DOCUMENTACION: { label: "Redacción / Documentación", tipo: "INTERNA" },
  TRAMITE_ADMINISTRATIVO: { label: "Trámite Administrativo", tipo: "INTERNA" },
  REQUERIMIENTO_CLIENTE: { label: "Req. al Cliente", tipo: "INTERNA" },
  GESTION_FINANCIERA: { label: "Gestión Financiera", tipo: "INTERNA" },
  REUNION_EQUIPO: { label: "Reunión de Equipo", tipo: "INTERNA" },
  VENCIMIENTO_PLAZO: { label: "Vencimiento / Plazo", tipo: "INTERNA" },
}

const CATEGORIAS_FLUJO_COMPLETO: Set<string> = new Set([
  "PRESENTACION_ESCRITO",
  "APELACION_RECURSO",
  "PERICIA_PRUEBA",
  "REDACCION_DOCUMENTACION",
  "REQUERIMIENTO_CLIENTE",
])

const URGENCIA_ORDEN: Record<Urgencia, number> = { vencida: 0, hoy: 1, manana: 2, tres_dias: 3, semana: 4, quince: 5, normal: 6 }

function getTipoNovedad(
  t: TareaConRelaciones,
  ultimoAcceso: string | null,
  currentUserId: string,
  tareasLeidasLocalmente?: Set<string>
): "nueva" | "editada" | null {
  // ═══ NUEVO: si la tarea fue marcada como leída en esta sesión, ya no es novedad ═══
  if (tareasLeidasLocalmente?.has(t.id)) return null
 
  if (!ultimoAcceso) return "nueva"
  if (new Date(t.updatedAt) <= new Date(ultimoAcceso)) return null
  if (t.creadorId === currentUserId) {
    const diffMs = Math.abs(new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime())
    if (diffMs < 5000) return null
  }
  if (new Date(t.createdAt) > new Date(ultimoAcceso)) return "nueva"
  return "editada"
}

// ============================================================================
// MODALES
// ============================================================================
function ModalEliminar({ titulo, onClose, onConfirm }: { titulo: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"><Trash2 className="w-5 h-5 text-red-600" /></div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Eliminar tarea</h3>
            <p className="text-sm text-slate-500 mt-1">Esta acción no se puede deshacer. ¿Confirmas que querés eliminar <span className="font-semibold text-slate-700">"{titulo.slice(0, 50)}{titulo.length > 50 ? "..." : ""}"</span>?</p>
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

function ModalBloqueo({ onClose, onConfirm }: { onClose: () => void; onConfirm: (m: string) => void }) {
  const [motivo, setMotivo] = useState("")
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-start gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"><Lock className="w-5 h-5 text-red-600" /></div><div><h3 className="text-base font-bold text-slate-800">Bloquear tarea</h3><p className="text-sm text-slate-500 mt-1">¿Por qué no puede avanzar esta tarea?</p></div></div>
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: Esperando respuesta del cliente, Juzgado de paro..." className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-red-300" />
        <div className="flex justify-end gap-2 mt-4"><button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button><button disabled={!motivo.trim()} onClick={() => onConfirm(motivo)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium">Confirmar bloqueo</button></div>
      </div>
    </div>
  )
}

function ModalDesbloqueo({ onClose, onConfirm }: { onClose: () => void; onConfirm: (m: string) => void }) {
  const [motivo, setMotivo] = useState("")
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-start gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0"><Unlock className="w-5 h-5 text-green-600" /></div><div><h3 className="text-base font-bold text-slate-800">Desbloquear tarea</h3><p className="text-sm text-slate-500 mt-1">¿Qué cambió para que pueda retomarse?</p></div></div>
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: El cliente envió la documentación, El juzgado retomó actividad..." className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-green-300" />
        <div className="flex justify-end gap-2 mt-4"><button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button><button disabled={!motivo.trim()} onClick={() => onConfirm(motivo)} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">Confirmar desbloqueo</button></div>
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
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          placeholder="Ej: El socio decidió darla por perdida, El plazo ya no tiene sentido, La contraparte retiró la demanda..."
          className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button
            disabled={!motivo.trim()}
            onClick={() => onConfirm(motivo)}
            className="px-4 py-2 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium"
          >
            Confirmar cierre
          </button>
        </div>
      </div>
    </div>
  )
}

const PRIORIDADES_EDIT: { value: PrioridadTarea; label: string }[] = [
  { value: "BAJA", label: "Baja" }, { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" }, { value: "FATAL", label: "Fatal — Plazo improrrogable" },
]

const MODALIDADES_LUGAR_EDIT = [
  { value: "ESTUDIO", label: "En el Estudio" }, { value: "TRIBUNAL", label: "Juzgado / Tribunal" },
  { value: "VIRTUAL", label: "Virtual (Zoom/Meet)" }, { value: "EXTERNO", label: "Otro lugar físico" },
]

function CampoInmutable({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-400 block mb-1 flex items-center gap-1">
        <LockIcon className="w-3 h-3" /> {label}
      </label>
      <div className="w-full border border-slate-100 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed">
        {valor}
      </div>
    </div>
  )
}

function dateToISOEdit(d: Date | undefined): string {
  if (!d) return ""
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}
 
function isoToDateEdit(s: string): Date | undefined {
  if (!s) return undefined
  const [y, m, d] = s.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}
 
function ModalEditar({ tarea, onClose, onSaved, currentUserId, usuarios }: {
  tarea: TareaConRelaciones; onClose: () => void; onSaved: (t: TareaConRelaciones) => void
  currentUserId: string; usuarios?: { id: string; nombre: string | null; apellido: string | null; rol: string }[]
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
 
  const esCreadorOSupervisor = tarea.creadorId === currentUserId || tarea.supervisorId === currentUserId
 
  const [titulo, setTitulo] = useState(tarea.titulo)
  const [prioridad, setPrioridad] = useState<PrioridadTarea>(tarea.prioridad)
  const [responsableId, setResponsableId] = useState(tarea.responsableId)
  const [descripcion, setDescripcion] = useState(tarea.descripcion ?? "")
  const [fechaVencimiento, setFecha] = useState(tarea.fechaVencimiento ? tarea.fechaVencimiento.split("T")[0] : "")
  const detectarModalidad = (lugar: string | null): string => {
    if (!lugar || lugar === "Estudio Jurídico") return "ESTUDIO"
    if (lugar.startsWith("[TRIBUNAL]")) return "TRIBUNAL"
    if (lugar.startsWith("[VIRTUAL]")) return "VIRTUAL"
    if (lugar.startsWith("[EXTERNO]")) return "EXTERNO"
    return "ESTUDIO"
  }
  const [modalidadLugar, setModalidad] = useState(detectarModalidad(tarea.lugarFisico))
  const [detalleLugar, setDetalle] = useState(tarea.lugarFisico?.replace(/^\[.*?\]\s?/, "").replace("Estudio Jurídico", "") ?? "")
 
  const categoriaCfg = CATEGORIA_CONFIG[tarea.categoria]
 
  // ═══ Carga del responsable para el calendario ═══
  // Misma lógica que en NuevaTareaModal: cuando cambia el responsable elegido,
  // traemos la carga vía server action. El responsable puede cambiarse solo si
  // sos creador/supervisor; si no, queda fijo y muestra la carga del responsable
  // actual (sigue siendo útil para reagendar).
  const [cargaResponsable, setCargaResponsable] = useState<Record<string, number>>({})
  const [cargaLoading, setCargaLoading] = useState(false)
 
  useEffect(() => {
    if (!responsableId) {
      setCargaResponsable({})
      return
    }


    let cancelado = false
    setCargaLoading(true)
    getCargaResponsableAction(responsableId, 180)
      .then(result => {
        if (cancelado) return
        if (result.error) {
          console.error("Error cargando agenda del responsable:", result.error)
          setCargaResponsable({})
        } else {
          setCargaResponsable(result.carga)
        }
      })
      .finally(() => {
        if (!cancelado) setCargaLoading(false)
      })
    return () => { cancelado = true }
  }, [responsableId])
 
  const responsableObj = usuarios?.find(u => u.id === responsableId)
 
  const handleSave = () => {
    if (esCreadorOSupervisor && !titulo.trim()) { setError("El título es obligatorio"); return }
    startTransition(async () => {
      const lugarFinal = modalidadLugar === "ESTUDIO" ? "Estudio Jurídico" : `[${modalidadLugar}] ${detalleLugar}`.trim()
      const datos: any = { descripcion: descripcion || undefined, fechaVencimiento: fechaVencimiento || null, lugarFisico: lugarFinal }
      if (esCreadorOSupervisor) {
        datos.titulo = titulo.trim()
        datos.prioridad = prioridad
        if (responsableId !== tarea.responsableId) { datos.responsableId = responsableId; datos.supervisorId = currentUserId }
      }
      const result = await editarTareaAction(tarea.id, datos)
      if (result.error) { setError(result.error) } else {
        onSaved({ ...tarea, ...(esCreadorOSupervisor ? { titulo, prioridad, responsableId } : {}), descripcion: descripcion || null, fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento).toISOString() : null, lugarFisico: lugarFinal })
        onClose()
      }
    })
  }
 
  return (
    // ─── ÚNICO CAMBIO DE LAYOUT: max-w-lg → max-w-3xl ───
    // Necesario para que entre el calendario inline cómodo. Mismo ancho que
    // NuevaTareaModal, así editar y crear se sienten consistentes.
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Editar Tarea</h2>
            <p className="text-xs text-slate-400 mt-0.5">{esCreadorOSupervisor ? "Vista de creador — podés editar todo" : "Vista de responsable — campos operativos"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <CampoInmutable label="Tipo" valor={tarea.tipo === "PROCESAL" ? "⚖️ Procesal" : "🏢 Interna"} />
            <CampoInmutable label="Categoría" valor={categoriaCfg?.label ?? tarea.categoria} />
          </div>
          {(tarea.caso || tarea.cliente) && (
            <div className="grid grid-cols-2 gap-3">
              {tarea.caso && <CampoInmutable label="Expediente" valor={`${tarea.caso.numero} — ${tarea.caso.titulo.slice(0, 30)}`} />}
              {tarea.cliente && <CampoInmutable label="Cliente" valor={`${tarea.cliente.nombre} ${tarea.cliente.apellido ?? ""}`} />}
            </div>
          )}
          <div className="border-t border-slate-100 pt-4" />
          {esCreadorOSupervisor ? (
            <>
              <div><label className="text-xs font-semibold text-slate-600 block mb-1">Título *</label><input value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-slate-600 block mb-1">Prioridad</label><select value={prioridad} onChange={e => setPrioridad(e.target.value as PrioridadTarea)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">{PRIORIDADES_EDIT.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
                {usuarios && usuarios.length > 0 && (
                  <div><label className="text-xs font-semibold text-slate-600 block mb-1">Responsable</label><select value={responsableId} onChange={e => setResponsableId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">{usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido} {u.id === currentUserId ? "(Yo)" : ""}</option>)}</select></div>
                )}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <CampoInmutable label="Título" valor={tarea.titulo} />
              <CampoInmutable label="Prioridad" valor={PRIORIDADES_EDIT.find(p => p.value === tarea.prioridad)?.label ?? tarea.prioridad} />
            </div>
          )}
          <div className="border-t border-slate-100 pt-4" />
 
          {/* ═══ CALENDARIO INLINE (reemplaza el <input type="date"> viejo) ═══
              Mismo patrón que NuevaTareaModal. Si hay responsable identificado,
              mostramos su nombre al costado del label para dejar claro de quién
              es la carga que se está visualizando. */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Vencimiento / Plazo
              {responsableObj && (
                <span className="ml-2 text-[10px] text-slate-400 font-normal italic">
                  Mostrando carga de {responsableObj.nombre} {responsableObj.apellido}
                </span>
              )}
            </label>
            <CalendarioCarga
              selected={isoToDateEdit(fechaVencimiento)}
              onSelect={d => setFecha(dateToISOEdit(d))}
              carga={cargaResponsable}
              loading={cargaLoading}
            />
          </div>
 
          <div><label className="text-xs font-semibold text-slate-600 block mb-1">Lugar o Modalidad</label><div className="flex gap-2"><select value={modalidadLugar} onChange={e => setModalidad(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white w-[180px]">{MODALIDADES_LUGAR_EDIT.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>{modalidadLugar !== "ESTUDIO" && (<input value={detalleLugar} onChange={e => setDetalle(e.target.value)} placeholder={modalidadLugar === "VIRTUAL" ? "Link de la reunión..." : "Dirección o detalle..."} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />)}</div></div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600">Descripción / Instrucciones</label>
              <span className={`text-[10px] font-medium ${300 - descripcion.length < 50 ? "text-amber-600" : "text-slate-400"}`}>{descripcion.length}/300</span>
            </div>
            <textarea value={descripcion} onChange={e => { if (e.target.value.length <= 300) setDescripcion(e.target.value) }} maxLength={300} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-white text-slate-600">Cancelar</button>
          <button onClick={handleSave} disabled={isPending} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">{isPending ? "Guardando..." : "Guardar cambios"}</button>
        </div>
      </div>
    </div>
  )
}

function DropdownMenu({ onEdit, onDelete, puedeEditar, puedeEliminar }: { onEdit: () => void; onDelete: () => void; puedeEditar: boolean; puedeEliminar: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener("mousedown", handleClick); return () => document.removeEventListener("mousedown", handleClick) }, [])
  if (!puedeEditar && !puedeEliminar) return null
  return (
    <div ref={ref} className="relative">
      <button onClick={e => { e.stopPropagation(); setOpen(!open) }} className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"><MoreVertical className="w-4 h-4" /></button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
          {puedeEditar && <button onClick={e => { e.stopPropagation(); onEdit(); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"><Pencil className="w-3.5 h-3.5 text-slate-400" /> Editar tarea</button>}
          {puedeEliminar && <button onClick={e => { e.stopPropagation(); onDelete(); setOpen(false) }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors ${puedeEditar ? "border-t border-slate-100" : ""}`}><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>}
        </div>
      )}
    </div>
  )
}

function TareaCard({ tarea, onChange, onEdit, onDelete, onOpenDrawer, onCerrarVencida, soloLectura = false, currentUserId, tipoNovedad = null }: {
  tarea: TareaConRelaciones
  onChange: (id: string, estado: EstadoTarea, motivo?: string) => void
  onEdit: (tarea: TareaConRelaciones) => void
  onDelete: (id: string) => void
  onOpenDrawer: (tarea: TareaConRelaciones) => void
  onCerrarVencida: (id: string) => void
  soloLectura?: boolean
  currentUserId: string
  tipoNovedad?: "nueva" | "editada" | null
}) {
  const estadoCfg = ESTADO_CONFIG[tarea.estado] ?? ESTADO_CONFIG.PENDIENTE
  const categoriaCfg = CATEGORIA_CONFIG[tarea.categoria] ?? { label: tarea.categoria, tipo: "INTERNA" as const }
  const urgencia = getUrgencia(tarea)
  const etiquetaT = getEtiquetaTiempo(tarea)
  const etiquetaF = getEtiquetaFecha(tarea)
  const esProcesal = tarea.tipo === "PROCESAL"
  const esMia = tarea.responsableId === tarea.creadorId
  const lugarLimpio = tarea.lugarFisico?.replace(/^\[.*?\]\s?/, "") ?? null
  const esCreador = tarea.creadorId === currentUserId
  const esSupervisor = tarea.supervisorId === currentUserId
  const esResponsable = tarea.responsableId === currentUserId
  const puedeEditar = esCreador || esSupervisor || esResponsable
  const puedeEliminar = esCreador

  const esCompletada = tarea.estado === "COMPLETADA"
  const esVencidaCerrada = tarea.estado === "VENCIDA" && !!tarea.vencidaCerradaEn
  const esVencidaAbandonada = esVencidaHistorica(tarea) && !tarea.vencidaCerradaEn
  const esVencidaAbierta = tarea.estado === "VENCIDA" && !tarea.vencidaCerradaEn && esVencidaActiva(tarea)
  const esTerminal = esCompletada || esVencidaCerrada || esVencidaAbandonada

  const bordeIzq =
    urgencia === "vencida" || urgencia === "hoy" ? "border-l-4 border-l-red-500" :
    urgencia === "manana" || urgencia === "tres_dias" ? "border-l-4 border-l-yellow-400" :
    tarea.prioridad === "FATAL" ? "border-l-4 border-l-orange-500" :
    tarea.estado === "BLOQUEADA" ? "border-l-4 border-l-amber-400" :
    esProcesal ? "border-l-4 border-l-indigo-400" : ""

  const bordeNovedad = tipoNovedad === "nueva" ? "border-blue-300 ring-1 ring-blue-200"
    : tipoNovedad === "editada" ? "border-amber-300 ring-1 ring-amber-200"
    : "border-slate-200"

  const prioridadBadge = PRIORIDAD_BADGE[tarea.prioridad] ?? null

  const handleHeaderClick = () => onOpenDrawer(tarea)

  return (
    <div className={`bg-white border rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all ${bordeIzq} ${bordeNovedad}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {prioridadBadge && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 shrink-0 ${prioridadBadge.bg} ${prioridadBadge.text} ${prioridadBadge.border}`}>
                {prioridadBadge.icon && <ShieldAlert className="w-3 h-3" />} {prioridadBadge.label}
              </span>
            )}
            {tipoNovedad === "nueva" && <span className="text-[10px] px-2 py-0.5 bg-blue-500 text-white rounded-full font-bold flex items-center gap-1 shrink-0 animate-pulse"><Sparkles className="w-3 h-3" /> NUEVA</span>}
            {tipoNovedad === "editada" && <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold flex items-center gap-1 shrink-0 border border-amber-200"><Pencil className="w-3 h-3" /> EDITADA</span>}
            {esProcesal && <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold border border-indigo-200 flex items-center gap-1 shrink-0"><Scale className="w-3 h-3" /> PROCESAL</span>}                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200 shrink-0">{categoriaCfg.label}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0 ${estadoCfg.bg} ${estadoCfg.text}`}><span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dot}`} />{estadoCfg.label}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {etiquetaF && (
              <div
                onClick={handleHeaderClick}
                className={`text-right px-2 py-1 rounded-lg cursor-pointer hover:brightness-95 transition ${etiquetaT.bg}`}
              >
                <p className={`text-[11px] font-bold leading-tight ${etiquetaT.color}`}>{etiquetaF.linea1}</p>
                {etiquetaF.linea2 && <p className={`text-[10px] leading-tight ${etiquetaT.color} opacity-75`}>{etiquetaF.linea2}</p>}
              </div>
            )}
            {!esTerminal && <DropdownMenu onEdit={() => onEdit(tarea)} onDelete={() => onDelete(tarea.id)} puedeEditar={puedeEditar && !esVencidaAbierta} puedeEliminar={puedeEliminar} />}
          </div>
        </div>

        <p
          onClick={handleHeaderClick}
          className="text-sm font-semibold text-slate-800 mb-1.5 leading-snug cursor-pointer hover:text-blue-600 transition-colors"
        >
          {tarea.titulo}
        </p>

        {lugarLimpio && lugarLimpio !== "Estudio Jurídico" && <div className="flex items-center gap-1 mb-1.5"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-xs text-slate-600 font-medium truncate">{lugarLimpio}</span></div>}
        {tarea.caso && <div className="flex items-center gap-1 mb-1.5"><Briefcase className="w-3 h-3 text-slate-400 shrink-0" /><span className="font-mono text-xs font-bold text-blue-600">{tarea.caso.numero}</span><span className="text-slate-300">—</span><span className="text-xs text-slate-500 truncate">{tarea.caso.titulo.slice(0, 35)}</span></div>}
        {tarea.descripcion && <p className="text-xs text-slate-500 mb-2 leading-relaxed line-clamp-3">{tarea.descripcion}</p>}
        <div className="flex flex-col gap-0.5 mb-2">
          {!esMia && <p className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3 text-slate-400 shrink-0" />Solicitado por: <span className="font-medium text-slate-700">{tarea.creador.nombre} {tarea.creador.apellido}</span></p>}
          {tarea.supervisor && <p className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3 text-slate-400 shrink-0" />Supervisor: <span className="font-medium text-slate-700">{tarea.supervisor.nombre} {tarea.supervisor.apellido}</span></p>}
          {tarea.cliente && <p className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3 text-slate-400 shrink-0" /><span className="truncate">{tarea.cliente.nombre} {tarea.cliente.apellido}</span></p>}
        </div>
          {tarea.estado === "BLOQUEADA" && tarea.motivoBloqueo && <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-1.5"><Lock className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" /><p className="text-xs text-amber-700">{tarea.motivoBloqueo.slice(0, 150)}{tarea.motivoBloqueo.length > 150 ? "..." : ""}</p></div>}        {tarea.motivoDesbloqueo && tarea.estado !== "BLOQUEADA" && <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-start gap-1.5"><Unlock className="w-3 h-3 text-green-500 mt-0.5 shrink-0" /><div className="text-xs"><span className="text-green-700 font-medium">Desbloqueada: </span><span className="text-green-600">{tarea.motivoDesbloqueo.slice(0, 150)}{tarea.motivoDesbloqueo.length > 150 ? "..." : ""}</span></div></div>}

        {esVencidaCerrada && tarea.motivoCierreVencida && (
          <div className="mb-2 p-2 bg-slate-100 border border-slate-200 rounded-lg flex items-start gap-1.5">
            <XCircle className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-700 font-medium">Cerrada sin cumplir: </span>
              <span className="text-slate-600">{tarea.motivoCierreVencida.slice(0, 150)}{tarea.motivoCierreVencida.length > 150 ? "..." : ""}</span>
            </div>
          </div>
        )}

        {!soloLectura && !esTerminal && (esResponsable || (esVencidaAbierta && (esSupervisor || esCreador))) && (
          <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100" onClick={e => e.stopPropagation()}>

            {/* Acciones SOLO del responsable */}
            {esResponsable && tarea.estado === "PENDIENTE" && (
              <>
                {CATEGORIAS_FLUJO_COMPLETO.has(tarea.categoria) ? (
                  <button onClick={e => { e.stopPropagation(); onChange(tarea.id, "EN_PROCESO") }} className="text-[10px] px-2 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 border border-blue-200 transition-colors">En proceso</button>
                ) : (
                  <button onClick={e => { e.stopPropagation(); onChange(tarea.id, "COMPLETADA") }} className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 border border-green-200 transition-colors font-semibold">Completar</button>
                )}
                <button onClick={e => { e.stopPropagation(); onChange(tarea.id, "BLOQUEADA") }} className="text-[10px] px-2 py-1 bg-white text-slate-600 rounded-md hover:bg-slate-50 border border-slate-300 transition-colors flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Bloquear</button>
              </>
            )}
            {esResponsable && tarea.estado === "EN_PROCESO" && (
              <>
                <button onClick={e => { e.stopPropagation(); onChange(tarea.id, "COMPLETADA") }} className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 border border-green-200 transition-colors font-semibold">Completar</button>
                <button onClick={e => { e.stopPropagation(); onChange(tarea.id, "BLOQUEADA") }} className="text-[10px] px-2 py-1 bg-white text-slate-600 rounded-md hover:bg-slate-50 border border-slate-300 transition-colors flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Bloquear</button>
              </>
            )}
            {esResponsable && tarea.estado === "BLOQUEADA" && (
              <button onClick={e => { e.stopPropagation(); onChange(tarea.id, "PENDIENTE") }} className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 border border-green-200 transition-colors flex items-center gap-1 font-medium"><Unlock className="w-3 h-3" /> Desbloquear</button>
            )}
            {esResponsable && esVencidaAbierta && (
              <button
                onClick={e => { e.stopPropagation(); onChange(tarea.id, "COMPLETADA") }}
                className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 border border-green-200 transition-colors font-semibold flex items-center gap-1"
                title="La tarea se marcará como completada con demora"
              >
                <CheckCheck className="w-3 h-3" /> Completar con demora
              </button>
            )}

            {/* Cerrar vencida sin cumplir — responsable + supervisor + creador */}
            {esVencidaAbierta && (esResponsable || esSupervisor || esCreador) && (
              <button
                onClick={e => { e.stopPropagation(); onCerrarVencida(tarea.id) }}
                className="text-[10px] px-2 py-1 bg-white text-slate-600 rounded-md hover:bg-slate-50 border border-slate-300 transition-colors flex items-center gap-1"
                title="Archivar como vencida no cumplida"
              >
                <XCircle className="w-3 h-3" /> Cerrar sin cumplir
              </button>
            )}
          </div>
        )}

        {/* PISTA VISUAL — cuando NO sos responsable y la tarea no es vencida */}
        {!soloLectura && !esTerminal && !esResponsable && !esVencidaAbierta && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 italic flex items-center gap-1">
              <Eye className="w-3 h-3 shrink-0" />
              Solo el responsable puede gestionar el estado
            </p>
          </div>
        )}

        {esTerminal && (
          <div className="pt-2 border-t border-slate-100">
            {esCompletada ? (
              <p className="text-[11px] text-green-700 flex items-center gap-1.5">
                <CheckCheck className="w-3 h-3 shrink-0" />
                <span className="font-medium">Completada</span>
                {tarea.fechaCompletada && (
                  <span className="text-green-600/70">· {format(new Date(tarea.fechaCompletada), "d MMM yyyy", { locale: es })}</span>
                )}
                {tarea.fechaCompletada && tarea.fechaVencimiento &&
                  new Date(tarea.fechaCompletada) > new Date(tarea.fechaVencimiento) && (
                  <span className="text-amber-600 font-medium">· con demora</span>
                )}
              </p>
            ) : esVencidaCerrada ? (
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <XCircle className="w-3 h-3 shrink-0 text-slate-400" />
                <span className="font-medium">Vencida cerrada</span>
                {tarea.vencidaCerradaEn && (
                  <span className="text-slate-400">· {format(new Date(tarea.vencidaCerradaEn), "d MMM yyyy", { locale: es })}</span>
                )}
              </p>
            ) : (
              // Vencida abandonada (>30d sin acción)
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0 text-slate-400" />
                <span className="font-medium">Vencida sin resolver</span>
                {tarea.fechaVencimiento && (
                  <span className="text-slate-400">· hace {differenceInDays(new Date(), new Date(tarea.fechaVencimiento))} días</span>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

type TipoFiltro = "TODOS" | "PROCESAL" | "INTERNA"
type CatFiltro = "TODOS" | keyof typeof CATEGORIA_CONFIG

function TabsFiltro({ tareas, tipoActivo, catActiva, onTipo, onCat }: { tareas: TareaConRelaciones[]; tipoActivo: TipoFiltro; catActiva: CatFiltro; onTipo: (t: TipoFiltro) => void; onCat: (c: CatFiltro) => void }) {
  const todasLasCategorias = Object.keys(CATEGORIA_CONFIG) as (keyof typeof CATEGORIA_CONFIG)[]

  const conteoPorCategoria = useMemo(() => {
    const conteo: Record<string, number> = {}
    todasLasCategorias.forEach(c => {
      conteo[c] = tareas.filter(t => t.categoria === c).length
    })
    return conteo
  }, [tareas])

  const procesales = todasLasCategorias.filter(c => CATEGORIA_CONFIG[c].tipo === "PROCESAL")
  const internas = todasLasCategorias.filter(c => CATEGORIA_CONFIG[c].tipo === "INTERNA")

  const [abierto, setAbierto] = useState(false)
  const refDropdown = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (refDropdown.current && !refDropdown.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    if (abierto) {
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }
  }, [abierto])

  const triggerLabel = catActiva === "TODOS"
    ? (tipoActivo === "TODOS" ? "Todas las categorías" : tipoActivo === "PROCESAL" ? "Todas las procesales" : "Todas las internas")
    : CATEGORIA_CONFIG[catActiva as keyof typeof CATEGORIA_CONFIG]?.label ?? "Todas las categorías"

  const hayFiltroCat = catActiva !== "TODOS"

  const renderOpcion = (c: keyof typeof CATEGORIA_CONFIG) => {
    const cfg = CATEGORIA_CONFIG[c]
    const cantidad = conteoPorCategoria[c] ?? 0
    const tieneItems = cantidad > 0
    const esSeleccionada = catActiva === c
    return (
      <button
        key={c}
        onClick={() => {
          if (!tieneItems) return
          onCat(c as CatFiltro)
          setAbierto(false)
        }}
        disabled={!tieneItems}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-colors ${
          esSeleccionada
            ? "bg-slate-800 text-white font-semibold"
            : tieneItems
            ? "text-slate-700 hover:bg-slate-100"
            : "text-slate-300 cursor-not-allowed"
        }`}
      >
        <span className="truncate">{cfg.label}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-2 ${
          esSeleccionada ? "bg-white/20 text-white" : tieneItems ? "bg-slate-100 text-slate-500" : "bg-slate-50 text-slate-300"
        }`}>
          {cantidad}
        </span>
      </button>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-20 shrink-0">Tipo</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["TODOS", "PROCESAL", "INTERNA"] as TipoFiltro[]).map(t => (
            <button key={t} onClick={() => onTipo(t)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              tipoActivo === t
                ? t === "PROCESAL" ? "bg-red-600 text-white border-red-600"
                : t === "INTERNA" ? "bg-blue-600 text-white border-blue-600"
                : "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}>
              {t === "TODOS" ? "Todos" : t === "PROCESAL" ? "Procesal" : "Interna"}
            </button>
          ))}
          <span className="text-xs text-slate-400 ml-1">{tareas.length} tarea{tareas.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-20 shrink-0">Categoría</span>
        <div ref={refDropdown} className="relative flex-1 min-w-[240px] max-w-md">
          <button
            onClick={() => setAbierto(!abierto)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
              hayFiltroCat
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{triggerLabel}</span>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {hayFiltroCat && (
                <span
                  onClick={(e) => { e.stopPropagation(); onCat("TODOS") }}
                  className="p-0.5 rounded hover:bg-white/20 cursor-pointer"
                  role="button"
                  aria-label="Limpiar filtro"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${abierto ? "rotate-90" : ""}`} />
            </div>
          </button>

          {abierto && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden max-h-[380px] overflow-y-auto">
              <button
                onClick={() => { onCat("TODOS"); setAbierto(false) }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-colors ${
                  catActiva === "TODOS"
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>Todas las categorías</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-2 ${
                  catActiva === "TODOS" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {tareas.length}
                </span>
              </button>

              {tipoActivo === "TODOS" ? (
                <>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1 border-t border-slate-100 mt-1">
                    <Scale className="w-3 h-3" /> Procesales
                  </div>
                  <div className="px-1 pb-1">
                    {procesales.map(renderOpcion)}
                  </div>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 border-t border-slate-100 mt-1">
                    <Briefcase className="w-3 h-3" /> Internas
                  </div>
                  <div className="px-1 pb-1">
                    {internas.map(renderOpcion)}
                  </div>
                </>
              ) : tipoActivo === "PROCESAL" ? (
                <div className="px-1 py-1 border-t border-slate-100">
                  {procesales.map(renderOpcion)}
                </div>
              ) : (
                <div className="px-1 py-1 border-t border-slate-100">
                  {internas.map(renderOpcion)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ordenarTareasPorUrgencia(tareas: TareaConRelaciones[]): TareaConRelaciones[] {
  return [...tareas].sort((a, b) => {
    const ua = URGENCIA_ORDEN[getUrgencia(a)]
    const ub = URGENCIA_ORDEN[getUrgencia(b)]
    if (ua !== ub) return ua - ub
    if (a.fechaVencimiento && b.fechaVencimiento) return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
    if (a.fechaVencimiento) return -1
    if (b.fechaVencimiento) return 1
    return 0
  })
}

function GrupoTareas({ titulo, icono: Icono, colorTitulo, tareas, onChange, onEdit, onDelete, onOpenDrawer, onCerrarVencida, soloLectura, currentUserId, ultimoAcceso, tareasLeidasLocalmente }: {
  titulo: string
  icono: any
  colorTitulo: string
  tareas: TareaConRelaciones[]
  onChange: (id: string, estado: EstadoTarea, motivo?: string) => void
  onEdit: (tarea: TareaConRelaciones) => void
  onDelete: (id: string) => void
  onOpenDrawer: (tarea: TareaConRelaciones) => void
  onCerrarVencida: (id: string) => void
  soloLectura?: boolean
  currentUserId: string
  ultimoAcceso: string | null
  tareasLeidasLocalmente?: Set<string>
}) {
  if (tareas.length === 0) return null
  const ordenadas = ordenarTareasPorUrgencia(tareas)
  return (
    <div className="mb-4">
      <div className={`flex items-center gap-1.5 mb-2 ${colorTitulo}`}>
        <Icono className="w-3 h-3" />
        <h3 className="text-[11px] font-bold uppercase tracking-wider">{titulo}</h3>
        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">{tareas.length}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {ordenadas.map(t => (
          <TareaCard
            key={t.id} tarea={t} onChange={onChange} onEdit={onEdit} onDelete={onDelete}
            onOpenDrawer={onOpenDrawer} onCerrarVencida={onCerrarVencida}
            soloLectura={soloLectura} currentUserId={currentUserId}
            tipoNovedad={getTipoNovedad(t, ultimoAcceso, currentUserId, tareasLeidasLocalmente)}
          />
        ))}
      </div>
    </div>
  )
}

function SeccionTareas({ titulo, tareas, colorTitulo, onChange, onEdit, onDelete, onOpenDrawer, onCerrarVencida, soloLectura, currentUserId, ultimoAcceso, tareasLeidasLocalmente, agruparPorDisponibilidad = false }: {
  titulo: string
  tareas: TareaConRelaciones[]
  colorTitulo: string
  onChange: (id: string, estado: EstadoTarea, motivo?: string) => void
  onEdit: (tarea: TareaConRelaciones) => void
  onDelete: (id: string) => void
  onOpenDrawer: (tarea: TareaConRelaciones) => void
  onCerrarVencida: (id: string) => void
  soloLectura?: boolean
  currentUserId: string
  ultimoAcceso: string | null
  tareasLeidasLocalmente?: Set<string>
  agruparPorDisponibilidad?: boolean
}) {
  const [colapsada, setColapsada] = useState(false)
  if (tareas.length === 0) return null
 
  // Baldes en vista "Mis Tareas":
  // - Requieren atención: VENCIDA abierta Y dentro del rango de 30 días
  // - Activas: PENDIENTE + EN_PROCESO
  // - A la espera: BLOQUEADA
  const activas = agruparPorDisponibilidad
    ? tareas.filter(t => t.estado === "PENDIENTE" || t.estado === "EN_PROCESO")
    : tareas
  const requierenAtencion = agruparPorDisponibilidad
    ? tareas.filter(t => esVencidaActiva(t))
    : []
  const aLaEspera = agruparPorDisponibilidad
    ? tareas.filter(t => t.estado === "BLOQUEADA")
    : []
 
  return (
    <div className="mb-6">
      <button onClick={() => setColapsada(!colapsada)} className="w-full flex items-center justify-between mb-3 group">
        <div className="flex items-center gap-2">
          <h2 className={`text-base font-bold ${colorTitulo}`}>{titulo}</h2>
          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">{tareas.length}</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${colapsada ? "" : "rotate-90"}`} />
      </button>
      {!colapsada && (
        agruparPorDisponibilidad ? (
          <>
            <GrupoTareas
              titulo="Requieren atención" icono={AlertTriangle} colorTitulo="text-red-600"
              tareas={requierenAtencion} onChange={onChange} onEdit={onEdit} onDelete={onDelete}
              onOpenDrawer={onOpenDrawer} onCerrarVencida={onCerrarVencida}
              soloLectura={soloLectura} currentUserId={currentUserId} ultimoAcceso={ultimoAcceso}
              tareasLeidasLocalmente={tareasLeidasLocalmente}
            />
            <GrupoTareas
              titulo="Activas" icono={Clock} colorTitulo="text-slate-500"
              tareas={activas} onChange={onChange} onEdit={onEdit} onDelete={onDelete}
              onOpenDrawer={onOpenDrawer} onCerrarVencida={onCerrarVencida}
              soloLectura={soloLectura} currentUserId={currentUserId} ultimoAcceso={ultimoAcceso}
              tareasLeidasLocalmente={tareasLeidasLocalmente}
            />
            <GrupoTareas
              titulo="A la espera" icono={Lock} colorTitulo="text-slate-500"
              tareas={aLaEspera} onChange={onChange} onEdit={onEdit} onDelete={onDelete}
              onOpenDrawer={onOpenDrawer} onCerrarVencida={onCerrarVencida}
              soloLectura={soloLectura} currentUserId={currentUserId} ultimoAcceso={ultimoAcceso}
              tareasLeidasLocalmente={tareasLeidasLocalmente}
            />
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {ordenarTareasPorUrgencia(tareas).map(t => (
              <TareaCard
                key={t.id} tarea={t} onChange={onChange} onEdit={onEdit} onDelete={onDelete}
                onOpenDrawer={onOpenDrawer} onCerrarVencida={onCerrarVencida}
                soloLectura={soloLectura} currentUserId={currentUserId}
                tipoNovedad={getTipoNovedad(t, ultimoAcceso, currentUserId, tareasLeidasLocalmente)}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function TareasBoard({ tareas: tareasIniciales, currentUserId, ultimoAccesoTareas, usuarios }: {
  tareas: TareaConRelaciones[]; currentUserId: string; ultimoAccesoTareas: string | null
  usuarios?: { id: string; nombre: string | null; apellido: string | null; rol: string }[]
}) {

  const [tareas, setTareas] = useState(tareasIniciales)

  useEffect(() => { setTareas(tareasIniciales) }, [tareasIniciales])

const [tareasLeidasLocalmente, setTareasLeidasLocalmente] = useState<Set<string>>(new Set())
 


  const [filtroKpi, setFiltroKpi] = useState<string | null>(null)
  const [vistaActiva, setVistaActiva] = useState<"mias" | "supervisadas" | "historial" | "nuevas">("mias")
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("TODOS")
  const [catFiltro, setCatFiltro] = useState<CatFiltro>("TODOS")
  const [busqueda, setBusqueda] = useState("")

  const [filtroHistorial, setFiltroHistorial] = useState<"todas" | "completadas" | "vencidas">("todas")

  const [ultimoAcceso, setUltimoAcceso] = useState(ultimoAccesoTareas)
  const [isPending, startTransition] = useTransition()
  const [modalBloqueo, setModalBloqueo] = useState<string | null>(null)
  const [modalDesbloqueo, setModalDesbloqueo] = useState<string | null>(null)
  const [modalEliminar, setModalEliminar] = useState<{ id: string; titulo: string } | null>(null)
  const [modalEditar, setModalEditar] = useState<TareaConRelaciones | null>(null)
  const [modalCerrarVencida, setModalCerrarVencida] = useState<string | null>(null)
  const [drawerTarea, setDrawerTarea] = useState<TareaConRelaciones | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const handleCambioVista = (nuevaVista: "mias" | "supervisadas" | "historial" | "nuevas") => {
    setVistaActiva(nuevaVista)
    setFiltroKpi(null)
    setFiltroHistorial("todas")
  }

const lastOpenedRef = useRef<string | null>(null)
 
  // ═══ Mantener una referencia siempre actualizada de `tareas` ═══
  // Sin esto, abrirDrawerConTarea se recrearía cada vez que cambia tareas,
  // disparando re-ejecuciones del useEffect que rompían el flujo.
  const tareasRef = useRef(tareas)
  useEffect(() => { tareasRef.current = tareas }, [tareas])
 
  // ═══ Helper centralizado para abrir el drawer ═══
  // Llamado desde 2 lugares: useEffect de URL (cuando venís de otra página)
  // y listener de evento custom (cuando ya estabas en /gestion-tareas).
  const abrirDrawerConTarea = useCallback(async (tareaId: string) => {
    if (lastOpenedRef.current === tareaId) return
    lastOpenedRef.current = tareaId
    sessionStorage.removeItem("tareaCerrada")
 
    const enMemoria = tareasRef.current.find(t => t.id === tareaId)
    if (enMemoria) {
      setDrawerTarea(enMemoria)
    } else {
      const t = await getTareaDetalle(tareaId)
      if (t) {
        setDrawerTarea(t)
      } else {
        lastOpenedRef.current = null
        console.warn("getTareaDetalle no devolvió tarea para:", tareaId)
        return
      }
    }
 
    // ═══ Descuento local instantáneo del toggle "Novedades" ═══
    setTareasLeidasLocalmente(prev => {
      if (prev.has(tareaId)) return prev
      const next = new Set(prev)
      next.add(tareaId)
      return next
    })
 
    // Persistir en server (descuenta también el contador de la campanita)
    marcarTareaComoLeidaAction(tareaId).then((res) => {
      if (res.success) dispatchNotificationsRefresh()
    })
  }, [])
 
  // ═══ Camino 1: vengo de otra página con ?tareaAbierta=X en la URL ═══
  useEffect(() => {
    const tareaAbierta = searchParams.get("tareaAbierta")
    if (!tareaAbierta) return
 
    const tareaCerrada = sessionStorage.getItem("tareaCerrada")
    if (tareaCerrada === tareaAbierta) return
 
    abrirDrawerConTarea(tareaAbierta)
 
    // Limpiar query param con history API (router.replace falla en misma ruta)
    const params = new URLSearchParams(window.location.search)
    params.delete("tareaAbierta")
    const newQs = params.toString()
    const newUrl = newQs ? `${pathname}?${newQs}` : pathname
    window.history.replaceState(null, "", newUrl)
  }, [searchParams.toString(), abrirDrawerConTarea])
 
  // ═══ Camino 2: ya estoy en la página, click en campanita dispara evento ═══
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ tareaId: string }>
      const tareaId = ce.detail?.tareaId
      if (tareaId) abrirDrawerConTarea(tareaId)
    }
    window.addEventListener(ABRIR_TAREA_DRAWER_EVENT, handler)
    return () => window.removeEventListener(ABRIR_TAREA_DRAWER_EVENT, handler)
  }, [abrirDrawerConTarea])

  // ═══ TIME-BOXING APLICADO ═══
  // Una tarea se considera "terminal para Mis Tareas / Supervisadas" si:
  // - Es COMPLETADA (siempre)
  // - Es VENCIDA cerrada manualmente
  // - Es VENCIDA abandonada (>30 días sin cerrar) → va al histórico como "vencida sin resolver"
  const esTerminalParaBoard = (t: TareaConRelaciones) =>
    t.estado === "COMPLETADA" ||
    (t.estado === "VENCIDA" && !!t.vencidaCerradaEn) ||
    esVencidaHistorica(t)

  const tareasConNovedad = useMemo(() =>
    tareas.filter(t =>
      !esTerminalParaBoard(t) &&
      getTipoNovedad(t, ultimoAcceso, currentUserId, tareasLeidasLocalmente) !== null &&
      (t.responsableId === currentUserId || t.supervisorId === currentUserId)
    ),
  [tareas, currentUserId, ultimoAcceso, tareasLeidasLocalmente])

  const tareasMias = useMemo(() =>
    tareas.filter(t => !esTerminalParaBoard(t) && t.responsableId === currentUserId),
  [tareas, currentUserId])

  const tareasSupervisadas = useMemo(() =>
    tareas.filter(t => !esTerminalParaBoard(t) && t.supervisorId === currentUserId),
  [tareas, currentUserId])

  // Finalizadas ahora incluye:
  // - COMPLETADAS (en plazo o con demora)
  // - VENCIDAS cerradas manualmente
  // - VENCIDAS abandonadas (>30d sin acción) — también van al histórico automáticamente
  const tareasFinalizadasTodas = useMemo(() =>
    tareas.filter(t => esTerminalParaBoard(t) && (t.responsableId === currentUserId || t.supervisorId === currentUserId)),
  [tareas, currentUserId])

  const historialCompletadasCount = useMemo(() => tareasFinalizadasTodas.filter(t => t.estado === "COMPLETADA").length, [tareasFinalizadasTodas])
  const historialVencidasCount = useMemo(() => tareasFinalizadasTodas.filter(t => t.estado === "VENCIDA").length, [tareasFinalizadasTodas])

  const baseViewTasks = useMemo(() => {
    if (vistaActiva === "nuevas") return tareasConNovedad;
    if (vistaActiva === "mias") return tareasMias;
    if (vistaActiva === "supervisadas") return tareasSupervisadas;

    if (filtroHistorial === "completadas") return tareasFinalizadasTodas.filter(t => t.estado === "COMPLETADA")
    if (filtroHistorial === "vencidas") return tareasFinalizadasTodas.filter(t => t.estado === "VENCIDA")
    return tareasFinalizadasTodas;
  }, [vistaActiva, filtroHistorial, tareasConNovedad, tareasMias, tareasSupervisadas, tareasFinalizadasTodas]);

  const pendientesCount = baseViewTasks.filter(t => t.estado === "PENDIENTE").length
  const enProcesoCount  = baseViewTasks.filter(t => t.estado === "EN_PROCESO").length
  const fatalesCount    = baseViewTasks.filter(t =>
    t.prioridad === "FATAL" &&
    t.estado !== "COMPLETADA" &&
    !(t.estado === "VENCIDA" && !!t.vencidaCerradaEn)
  ).length
  // Vencidas "activas" = solo las que están dentro del rango de 30 días (siguen siendo accionables)
  const vencidasAbiertasCount = baseViewTasks.filter(t => esVencidaActiva(t)).length
  // ═══ NUEVO: bloqueadas (esperando algo externo) ═══
  const bloqueadasCount = baseViewTasks.filter(t => t.estado === "BLOQUEADA").length
 
  const tareasConKpi = useMemo(() => {
    if (!filtroKpi) return baseViewTasks;
    if (filtroKpi === 'pendientes') return baseViewTasks.filter(t => t.estado === 'PENDIENTE');
    if (filtroKpi === 'en_proceso') return baseViewTasks.filter(t => t.estado === 'EN_PROCESO');
    if (filtroKpi === 'fatales') return baseViewTasks.filter(t =>
      t.prioridad === 'FATAL' &&
      t.estado !== 'COMPLETADA' &&
      !(t.estado === "VENCIDA" && !!t.vencidaCerradaEn)
    );
    if (filtroKpi === 'vencidas') return baseViewTasks.filter(t => esVencidaActiva(t));
    if (filtroKpi === 'bloqueadas') return baseViewTasks.filter(t => t.estado === 'BLOQUEADA');  // ═══ NUEVO
    return baseViewTasks;
  }, [baseViewTasks, filtroKpi]);

  const tareasFiltradas = useMemo(() => tareasConKpi.filter(t => {
    if (tipoFiltro !== "TODOS" && t.tipo !== tipoFiltro) return false;
    if (catFiltro !== "TODOS" && t.categoria !== catFiltro) return false;
    if (busqueda.trim() && !t.titulo.toLowerCase().includes(busqueda.trim().toLowerCase())) return false;
    return true
  }), [tareasConKpi, tipoFiltro, catFiltro, busqueda])

  const procesales = tareasFiltradas.filter(t => t.tipo === "PROCESAL")
  const internas = tareasFiltradas.filter(t => t.tipo === "INTERNA")

const handleMarcarVistas = () => {
  startTransition(async () => {
    const result = await marcarTareasComoVistasAction()
    if (result.success) {
      setUltimoAcceso(new Date().toISOString())
      setTareasLeidasLocalmente(new Set())  // ═══ NUEVO: reset (ya no es necesario)
      if (vistaActiva === "nuevas") setVistaActiva("mias")
    }
  })
}
  const handleCambioEstado = (tareaId: string, nuevoEstado: EstadoTarea, motivo?: string) => {
    if (nuevoEstado === "BLOQUEADA" && !motivo) { setModalBloqueo(tareaId); return }
    if (nuevoEstado === "PENDIENTE" && !motivo) { const tarea = tareas.find(t => t.id === tareaId); if (tarea?.estado === "BLOQUEADA") { setModalDesbloqueo(tareaId); return } }
    startTransition(async () => {
      const result = await cambiarEstadoTareaAction(tareaId, nuevoEstado, motivo);
      if (result.success) {
        setTareas(prev => prev.map(t => t.id === tareaId ? {
          ...t,
          estado: nuevoEstado,
          motivoBloqueo: nuevoEstado === "BLOQUEADA" ? (motivo ?? null) : t.motivoBloqueo,
          motivoDesbloqueo: (nuevoEstado === "PENDIENTE" && t.estado === "BLOQUEADA") ? (motivo ?? null) : t.motivoDesbloqueo,
          fechaCompletada: nuevoEstado === "COMPLETADA" ? new Date().toISOString() : t.fechaCompletada
        } : t))
        setDrawerTarea(prev => prev?.id === tareaId ? {
          ...prev,
          estado: nuevoEstado,
          motivoBloqueo: nuevoEstado === "BLOQUEADA" ? (motivo ?? null) : prev.motivoBloqueo,
          motivoDesbloqueo: (nuevoEstado === "PENDIENTE" && prev.estado === "BLOQUEADA") ? (motivo ?? null) : prev.motivoDesbloqueo,
          fechaCompletada: nuevoEstado === "COMPLETADA" ? new Date().toISOString() : prev.fechaCompletada
        } : prev)
      }
    })
    setModalBloqueo(null); setModalDesbloqueo(null)
  }

  const handleCerrarVencida = (tareaId: string) => {
    setModalCerrarVencida(tareaId)
  }

  const confirmarCerrarVencida = (motivo: string) => {
    if (!modalCerrarVencida) return
    const tareaId = modalCerrarVencida
    setModalCerrarVencida(null)
    startTransition(async () => {
      const result = await cerrarVencidaAction(tareaId, motivo)
      if (result.success) {
        const ahora = new Date().toISOString()
        setTareas(prev => prev.map(t => t.id === tareaId ? {
          ...t,
          vencidaCerradaEn: ahora,
          vencidaCerradaPorId: currentUserId,
          motivoCierreVencida: motivo,
        } : t))
        setDrawerTarea(prev => prev?.id === tareaId ? {
          ...prev,
          vencidaCerradaEn: ahora,
          vencidaCerradaPorId: currentUserId,
          motivoCierreVencida: motivo,
        } : prev)
      }
    })
  }

  const handleDelete = (tareaId: string) => { const tarea = tareas.find(t => t.id === tareaId); if (tarea) setModalEliminar({ id: tareaId, titulo: tarea.titulo }) }
  const confirmarEliminar = () => { if (!modalEliminar) return; const { id } = modalEliminar; setModalEliminar(null); startTransition(async () => { const result = await eliminarTareaAction(id); if (result.success) setTareas(prev => prev.filter(t => t.id !== id)) }) }
  const handleEdit = (tarea: TareaConRelaciones) => { setModalEditar(tarea) }
  const handleSaved = (tareaActualizada: TareaConRelaciones) => { setTareas(prev => prev.map(t => t.id === tareaActualizada.id ? tareaActualizada : t)); setModalEditar(null) }
const handleOpenDrawer = (tarea: TareaConRelaciones) => {
  setDrawerTarea(tarea)
  lastOpenedRef.current = tarea.id
 
  // ═══ NUEVO: descuento local instantáneo ═══
  setTareasLeidasLocalmente(prev => {
    if (prev.has(tarea.id)) return prev
    const next = new Set(prev)
    next.add(tarea.id)
    return next
  })
 
  marcarTareaComoLeidaAction(tarea.id).then((res) => {
    if (res.success) dispatchNotificationsRefresh()
  })
}
 
const handleCloseDrawer = () => {
  if (drawerTarea?.id) {
    sessionStorage.setItem("tareaCerrada", drawerTarea.id)
  }
  lastOpenedRef.current = null
  setDrawerTarea(null)
 
  // Igual que arriba: usar history API en lugar de router.replace
  // para garantizar que la URL se limpie siempre.
  const params = new URLSearchParams(window.location.search)
  params.delete("tareaAbierta")
  const newQs = params.toString()
  const newUrl = newQs ? `${pathname}?${newQs}` : pathname
  window.history.replaceState(null, "", newUrl)
}
  const kpisVisibles = 2
    + (vencidasAbiertasCount > 0 ? 1 : 0)
    + (fatalesCount > 0 ? 1 : 0)
    + (bloqueadasCount > 0 ? 1 : 0)
 
  const gridClase =
    kpisVisibles === 5 ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-5" :
    kpisVisibles === 4 ? "grid-cols-2 md:grid-cols-4" :
    kpisVisibles === 3 ? "grid-cols-2 md:grid-cols-3" :
    "grid-cols-2 md:grid-cols-2"

  return (
    <>
      {modalBloqueo && <ModalBloqueo onClose={() => setModalBloqueo(null)} onConfirm={m => handleCambioEstado(modalBloqueo, "BLOQUEADA", m)} />}
      {modalDesbloqueo && <ModalDesbloqueo onClose={() => setModalDesbloqueo(null)} onConfirm={m => handleCambioEstado(modalDesbloqueo, "PENDIENTE", m)} />}
      {modalEliminar && <ModalEliminar titulo={modalEliminar.titulo} onClose={() => setModalEliminar(null)} onConfirm={confirmarEliminar} />}
      {modalEditar && <ModalEditar tarea={modalEditar} onClose={() => setModalEditar(null)} onSaved={handleSaved} currentUserId={currentUserId} usuarios={usuarios} />}
      {modalCerrarVencida && <ModalCerrarVencida onClose={() => setModalCerrarVencida(null)} onConfirm={confirmarCerrarVencida} />}

      <TareaDetalleDrawer
        tarea={drawerTarea}
        open={!!drawerTarea}
        onClose={handleCloseDrawer}
        onChangeEstado={handleCambioEstado}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentUserId={currentUserId}
      />

{vistaActiva !== "historial" && (
        <>
          {/* Header con (i) — VA AFUERA del grid, justo arriba */}
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs text-slate-500 font-medium">Resumen rápido</p>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                  aria-label="Información sobre los KPIs"
                >
                  <Info className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-xs" side="right" align="start">
                <p className="font-semibold text-slate-700 mb-1">¿Cómo usar las tarjetas?</p>
                <p className="text-slate-600 leading-relaxed">
                  Estas tarjetas son filtros rápidos: hacé click en cualquiera para mostrar solo los eventos en ese estado. Click otra vez para sacar el filtro.
                </p>
              </PopoverContent>
            </Popover>
          </div>

          {/* Grid de KPIs — solo contiene los 4 botones, nada más */}
<div className={`grid ${gridClase} gap-4 mb-6`}>
 
            {/* 1. VENCIDAS — daño consumado, requiere acción inmediata */}
            {vencidasAbiertasCount > 0 && (
              <button
                onClick={() => setFiltroKpi(f => f === 'vencidas' ? null : 'vencidas')}
                className={`bg-red-50 border rounded-xl p-4 text-left transition-all hover:shadow-md cursor-pointer ${
                  filtroKpi === 'vencidas' ? 'ring-2 ring-red-600 border-red-600' : 'border-red-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <p className="text-xs text-red-600 font-medium">Vencidas</p>
                </div>
                <p className="text-3xl font-bold text-red-700">{vencidasAbiertasCount}</p>
              </button>
            )}
 
            {/* 2. FATAL — máxima prioridad, todavía a tiempo */}
                        {fatalesCount > 0 && (
              <button
                onClick={() => setFiltroKpi(f => f === 'fatales' ? null : 'fatales')}
                className={`bg-orange-50 border rounded-xl p-4 text-left transition-all hover:shadow-md cursor-pointer ${
                  filtroKpi === 'fatales' ? 'ring-2 ring-orange-500 border-orange-500' : 'border-orange-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-4 h-4 text-orange-600" />
                  <p className="text-xs text-orange-700 font-medium">Prioridad Fatal</p>
                </div>
                <p className="text-3xl font-bold text-orange-700">{fatalesCount}</p>
              </button>
            )}
            {/* 3. BLOQUEADAS — pausa, esperando algo externo */}
            {bloqueadasCount > 0 && (
              <button
                onClick={() => setFiltroKpi(f => f === 'bloqueadas' ? null : 'bloqueadas')}
                className={`bg-amber-50 border rounded-xl p-4 text-left transition-all hover:shadow-md cursor-pointer ${
                  filtroKpi === 'bloqueadas' ? 'ring-2 ring-amber-500 border-amber-500' : 'border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-amber-700 font-medium">Bloqueadas</p>
                </div>
                <p className="text-3xl font-bold text-amber-700">{bloqueadasCount}</p>
              </button>
            )}
 
            {/* 4. PENDIENTES — esperando empezar */}
            <button
              onClick={() => setFiltroKpi(f => f === 'pendientes' ? null : 'pendientes')}
              className={`bg-white border rounded-xl p-4 text-left transition-all hover:shadow-md cursor-pointer ${
                filtroKpi === 'pendientes' ? 'ring-2 ring-slate-400 border-slate-400' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className={`w-4 h-4 ${filtroKpi === 'pendientes' ? 'text-slate-700' : 'text-slate-400'}`} />
                <p className="text-xs text-slate-500 font-medium">Pendientes</p>
              </div>
              <p className="text-3xl font-bold text-slate-800">{pendientesCount}</p>
            </button>
 
            {/* 5. EN PROCESO — en marcha */}
            <button
              onClick={() => setFiltroKpi(f => f === 'en_proceso' ? null : 'en_proceso')}
              className={`bg-white border rounded-xl p-4 text-left transition-all hover:shadow-md cursor-pointer ${
                filtroKpi === 'en_proceso' ? 'ring-2 ring-blue-500 border-blue-500' : 'border-blue-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className={`w-4 h-4 ${filtroKpi === 'en_proceso' ? 'text-blue-600' : 'text-blue-400'}`} />
                <p className={`text-xs font-medium ${filtroKpi === 'en_proceso' ? 'text-blue-700' : 'text-blue-600'}`}>En Proceso</p>
              </div>
              <p className={`text-3xl font-bold ${filtroKpi === 'en_proceso' ? 'text-blue-800' : 'text-blue-700'}`}>{enProcesoCount}</p>
            </button>
 
          </div>
        </>
      )}

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 overflow-x-auto">
          {tareasConNovedad.length > 0 && <button onClick={() => handleCambioVista("nuevas")} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${vistaActiva === "nuevas" ? "bg-blue-600 text-white shadow-sm" : "text-blue-600 hover:text-blue-700"}`}><Sparkles className="w-4 h-4" />Novedades<span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${vistaActiva === "nuevas" ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-700"}`}>{tareasConNovedad.length}</span></button>}
          <button onClick={() => handleCambioVista("mias")} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${vistaActiva === "mias" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><User className="w-4 h-4" />Mis Tareas<span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${vistaActiva === "mias" ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"}`}>{tareasMias.length}</span></button>
          <button onClick={() => handleCambioVista("supervisadas")} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${vistaActiva === "supervisadas" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Eye className="w-4 h-4" />Supervisadas<span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${vistaActiva === "supervisadas" ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"}`}>{tareasSupervisadas.length}</span></button>
          <button onClick={() => handleCambioVista("historial")} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${vistaActiva === "historial" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><History className="w-4 h-4" />Finalizadas<span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${vistaActiva === "historial" ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"}`}>{tareasFinalizadasTodas.length}</span></button>
        </div>
        {tareasConNovedad.length > 0 && <button onClick={handleMarcarVistas} disabled={isPending} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"><CheckCheck className="w-3.5 h-3.5" />Marcar todo como visto</button>}
      </div>

      {vistaActiva === "historial" && tareasFinalizadasTodas.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4">
          <button
            onClick={() => setFiltroHistorial("todas")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              filtroHistorial === "todas"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            Todas
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              filtroHistorial === "todas" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            }`}>{tareasFinalizadasTodas.length}</span>
          </button>
          <button
            onClick={() => setFiltroHistorial("completadas")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              filtroHistorial === "completadas"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-green-700 border-green-200 hover:border-green-300"
            }`}
          >
            <CheckCheck className="w-3 h-3" />
            Completadas
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              filtroHistorial === "completadas" ? "bg-white/20 text-white" : "bg-green-100 text-green-700"
            }`}>{historialCompletadasCount}</span>
          </button>
          <button
            onClick={() => setFiltroHistorial("vencidas")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              filtroHistorial === "vencidas"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-red-700 border-red-200 hover:border-red-300"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Vencidas
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              filtroHistorial === "vencidas" ? "bg-white/20 text-white" : "bg-red-100 text-red-700"
            }`}>{historialVencidasCount}</span>
          </button>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar tarea por título..."
          className="w-full h-10 pl-10 pr-4 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-slate-400"
        />
        {busqueda && (
          <button onClick={() => setBusqueda("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <TabsFiltro tareas={tareasConKpi as any} tipoActivo={tipoFiltro} catActiva={catFiltro} onTipo={t => { setTipoFiltro(t); setCatFiltro("TODOS") }} onCat={setCatFiltro} />

      {tareasFiltradas.length === 0 && (() => {
        const hayBusqueda = busqueda.trim().length > 0
        const hayFiltros = tipoFiltro !== "TODOS" || catFiltro !== "TODOS" || filtroKpi !== null
        const baseVacia = baseViewTasks.length === 0

        if (hayBusqueda) {
          return (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-600">Sin resultados para "{busqueda}"</p>
              <p className="text-sm text-slate-400 mt-1">Probá con otro término o revisá los filtros activos</p>
              <button onClick={() => setBusqueda("")} className="mt-3 text-sm text-blue-600 hover:underline">
                Limpiar búsqueda
              </button>
            </div>
          )
        }

        if (hayFiltros && !baseVacia) {
          return (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Filter className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-600">No hay tareas que coincidan con los filtros</p>
              <p className="text-sm text-slate-400 mt-1">Probá desactivando los filtros de arriba</p>
              <button
                onClick={() => { setTipoFiltro("TODOS"); setCatFiltro("TODOS"); setFiltroKpi(null) }}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )
        }

        if (vistaActiva === "nuevas") {
          return (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <CheckCheck className="w-10 h-10 mx-auto mb-3 text-green-300" />
              <p className="font-medium text-slate-600">Estás al día</p>
              <p className="text-sm text-slate-400 mt-1">No hay novedades desde tu última visita</p>
            </div>
          )
        }

        if (vistaActiva === "historial") {
          if (filtroHistorial === "completadas" && tareasFinalizadasTodas.length > 0) {
            return (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <CheckCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="font-medium text-slate-600">Ninguna tarea completada todavía</p>
                <p className="text-sm text-slate-400 mt-1">Las tareas que termines aparecerán acá</p>
              </div>
            )
          }
          if (filtroHistorial === "vencidas" && tareasFinalizadasTodas.length > 0) {
            return (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <CheckCheck className="w-10 h-10 mx-auto mb-3 text-green-300" />
                <p className="font-medium text-slate-600">Ninguna tarea vencida</p>
                <p className="text-sm text-slate-400 mt-1">Buen control de plazos</p>
              </div>
            )
          }
          return (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <History className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-600">Aún no hay tareas finalizadas</p>
              <p className="text-sm text-slate-400 mt-1">Cuando completes o cierres tareas, van a aparecer acá</p>
            </div>
          )
        }

        if (vistaActiva === "supervisadas") {
          return (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Eye className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-600">No supervisás ninguna tarea</p>
              <p className="text-sm text-slate-400 mt-1">Cuando asignes tareas a otro miembro del equipo, aparecerán acá</p>
            </div>
          )
        }

        return (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <User className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">No tenés tareas asignadas</p>
            <p className="text-sm text-slate-400 mt-1">Creá una nueva tarea o esperá que te asignen una</p>
          </div>
        )
      })()}

      {(tipoFiltro === "TODOS" || tipoFiltro === "PROCESAL") && <SeccionTareas titulo="Procesales" tareas={tipoFiltro === "PROCESAL" ? tareasFiltradas : procesales} colorTitulo="text-indigo-700" onChange={handleCambioEstado} onEdit={handleEdit} onDelete={handleDelete} onOpenDrawer={handleOpenDrawer} onCerrarVencida={handleCerrarVencida} soloLectura={vistaActiva === "supervisadas"} currentUserId={currentUserId} ultimoAcceso={ultimoAcceso} tareasLeidasLocalmente={tareasLeidasLocalmente} agruparPorDisponibilidad={vistaActiva === "mias"} />}
      {(tipoFiltro === "TODOS" || tipoFiltro === "INTERNA") && <SeccionTareas titulo="Internas" tareas={tipoFiltro === "INTERNA" ? tareasFiltradas : internas} colorTitulo="text-slate-700" onChange={handleCambioEstado} onEdit={handleEdit} onDelete={handleDelete} onOpenDrawer={handleOpenDrawer} onCerrarVencida={handleCerrarVencida} soloLectura={vistaActiva === "supervisadas"} currentUserId={currentUserId} ultimoAcceso={ultimoAcceso} tareasLeidasLocalmente={tareasLeidasLocalmente} agruparPorDisponibilidad={vistaActiva === "mias"} />}

      {/* ═══ FOOTER INFORMATIVO ═══
          Aclaración en el tab Finalizadas sobre el alcance del historial.
          Reemplaza Gemini's "mostrando 30 días" con info honesta: todas las finalizadas + vencidas abandonadas. */}
      {vistaActiva === "historial" && tareasFinalizadasTodas.length > 0 && (
        <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <p className="text-xs text-slate-500 leading-relaxed">
            Este historial incluye tareas completadas y vencidas resueltas (cerradas manualmente o sin acción por más de {DIAS_VENCIDA_ACTIVA} días).
            Para ver el historial completo de un expediente específico, revisá su bitácora.
          </p>
        </div>
      )}
    </>
  )
}