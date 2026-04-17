'use client'

import { useState, useTransition, useMemo, useRef, useEffect } from "react"
import {
  ShieldAlert, Lock, Unlock, User, Briefcase,
  Clock, AlertTriangle, ChevronRight, Scale,
  MapPin, Filter, MoreVertical, Pencil, Trash2,
  History, X, Eye, Sparkles, CheckCheck, Lock as LockIcon, Search
} from "lucide-react"
import { cambiarEstadoTareaAction, eliminarTareaAction, editarTareaAction, marcarTareasComoVistasAction } from "src/lib/actions/tarea-actions"
import type { TareaConRelaciones } from "src/lib/actions/tarea-actions"
import type { EstadoTarea, PrioridadTarea, CategoriaTarea } from "@prisma/client"
import { format, isToday, isTomorrow, isBefore, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"

// ============================================================================
// HELPERS
// ============================================================================

type Urgencia = "vencida" | "hoy" | "manana" | "tres_dias" | "semana" | "quince" | "normal"

function getUrgencia(t: TareaConRelaciones): Urgencia {
  if (t.estado === "COMPLETADA" || t.estado === "VENCIDA") return "normal"
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
  if (!t.fechaVencimiento) return { color: "text-slate-400", bg: "bg-transparent" }
  const partes = t.fechaVencimiento.split("T")[0].split("-")
  const f = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
  const ahora = new Date()
  const dias = differenceInDays(f, ahora)
  if (isBefore(f, ahora)) return { color: "text-red-600", bg: "bg-red-50" }
  if (isToday(f)) return { color: "text-red-600", bg: "bg-red-50" }
  if (isTomorrow(f)) return { color: "text-orange-600", bg: "bg-orange-50" }
  if (dias <= 3) return { color: "text-orange-500", bg: "bg-orange-50" }
  if (dias <= 7) return { color: "text-amber-600", bg: "bg-amber-50" }
  if (dias <= 15) return { color: "text-blue-600", bg: "bg-blue-50" }
  return { color: "text-slate-500", bg: "bg-slate-50" }
}

function getEtiquetaFecha(t: TareaConRelaciones): { linea1: string; linea2: string | null } | null {
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
  BLOQUEADA: { label: "Bloqueada", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-100" },
  COMPLETADA: { label: "Completada", dot: "bg-green-500", text: "text-green-700", bg: "bg-green-100" },
  VENCIDA: { label: "Vencida", dot: "bg-red-600", text: "text-red-700", bg: "bg-red-100" },
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

// Determina si una tarea es "nueva", "editada" o sin novedad
function getTipoNovedad(t: TareaConRelaciones, ultimoAcceso: string | null, currentUserId: string): "nueva" | "editada" | null {
  if (!ultimoAcceso) return "nueva"
  if (new Date(t.updatedAt) <= new Date(ultimoAcceso)) return null
  // No marcar si yo la creé y nadie la modificó después
  if (t.creadorId === currentUserId) {
    const diffMs = Math.abs(new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime())
    if (diffMs < 5000) return null
  }
  // Si createdAt es posterior al último acceso → es nueva
  if (new Date(t.createdAt) > new Date(ultimoAcceso)) return "nueva"
  // Si createdAt es anterior pero updatedAt posterior → fue editada
  return "editada"
}

// ============================================================================
// MODALES
// ============================================================================

function ModalEliminar({ titulo, onClose, onConfirm }: { titulo: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-start gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0"><Unlock className="w-5 h-5 text-green-600" /></div><div><h3 className="text-base font-bold text-slate-800">Desbloquear tarea</h3><p className="text-sm text-slate-500 mt-1">¿Qué cambió para que pueda retomarse?</p></div></div>
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: El cliente envió la documentación, El juzgado retomó actividad..." className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-green-300" />
        <div className="flex justify-end gap-2 mt-4"><button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button><button disabled={!motivo.trim()} onClick={() => onConfirm(motivo)} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">Confirmar desbloqueo</button></div>
      </div>
    </div>
  )
}

// ============================================================================
// MODAL EDITAR — campos según rol del usuario
// ============================================================================

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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Editar Tarea</h2>
            <p className="text-xs text-slate-400 mt-0.5">{esCreadorOSupervisor ? "Vista de creador — podés editar todo" : "Vista de responsable — campos operativos"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
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
          <div><label className="text-xs font-semibold text-slate-600 block mb-1">Vencimiento / Plazo</label><input type="date" value={fechaVencimiento} onChange={e => setFecha(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" /></div>
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
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-white text-slate-600">Cancelar</button>
          <button onClick={handleSave} disabled={isPending} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">{isPending ? "Guardando..." : "Guardar cambios"}</button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// DROPDOWN
// ============================================================================

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
          {puedeEditar && <button onClick={() => { onEdit(); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"><Pencil className="w-3.5 h-3.5 text-slate-400" /> Editar tarea</button>}
          {puedeEliminar && <button onClick={() => { onDelete(); setOpen(false) }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors ${puedeEditar ? "border-t border-slate-100" : ""}`}><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// CARD DE TAREA
// ============================================================================

function TareaCard({ tarea, onChange, onEdit, onDelete, soloLectura = false, currentUserId, tipoNovedad = null }: {
  tarea: TareaConRelaciones; onChange: (id: string, estado: EstadoTarea, motivo?: string) => void; onEdit: (tarea: TareaConRelaciones) => void; onDelete: (id: string) => void; soloLectura?: boolean; currentUserId: string; tipoNovedad?: "nueva" | "editada" | null
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
  const esTerminal = tarea.estado === "COMPLETADA" || tarea.estado === "VENCIDA"

  const bordeIzq =
    urgencia === "vencida" || urgencia === "hoy" ? "border-l-4 border-l-red-500" :
    urgencia === "manana" || urgencia === "tres_dias" ? "border-l-4 border-l-orange-400" :
    esProcesal || tarea.prioridad === "FATAL" ? "border-l-4 border-l-red-400" :
    tarea.estado === "BLOQUEADA" ? "border-l-4 border-l-red-400" : ""

  const bordeNovedad = tipoNovedad === "nueva" ? "border-blue-300 ring-1 ring-blue-200"
    : tipoNovedad === "editada" ? "border-amber-300 ring-1 ring-amber-200"
    : "border-slate-200"

  return (
    <div className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-all ${bordeIzq} ${bordeNovedad}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {tipoNovedad === "nueva" && <span className="text-[10px] px-2 py-0.5 bg-blue-500 text-white rounded-full font-bold flex items-center gap-1 shrink-0 animate-pulse"><Sparkles className="w-3 h-3" /> NUEVA</span>}
            {tipoNovedad === "editada" && <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold flex items-center gap-1 shrink-0 border border-amber-200"><Pencil className="w-3 h-3" /> EDITADA</span>}
            {esProcesal && <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold border border-red-200 flex items-center gap-1 shrink-0"><Scale className="w-3 h-3" /> PROCESAL</span>}
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200 shrink-0">{categoriaCfg.label}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0 ${estadoCfg.bg} ${estadoCfg.text}`}><span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dot}`} />{estadoCfg.label}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {etiquetaF && <div className={`text-right px-2 py-1 rounded-lg ${etiquetaT.bg}`}><p className={`text-[11px] font-bold leading-tight ${etiquetaT.color}`}>{etiquetaF.linea1}</p>{etiquetaF.linea2 && <p className={`text-[10px] leading-tight ${etiquetaT.color} opacity-75`}>{etiquetaF.linea2}</p>}</div>}
            {!esTerminal && <DropdownMenu onEdit={() => onEdit(tarea)} onDelete={() => onDelete(tarea.id)} puedeEditar={puedeEditar} puedeEliminar={puedeEliminar} />}
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-800 mb-1.5 leading-snug">{tarea.titulo}</p>
        {lugarLimpio && lugarLimpio !== "Estudio Jurídico" && <div className="flex items-center gap-1 mb-1.5"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-xs text-slate-600 font-medium truncate">{lugarLimpio}</span></div>}
        {tarea.caso && <div className="flex items-center gap-1 mb-1.5"><Briefcase className="w-3 h-3 text-slate-400 shrink-0" /><span className="font-mono text-xs font-bold text-blue-600">{tarea.caso.numero}</span><span className="text-slate-300">—</span><span className="text-xs text-slate-500 truncate">{tarea.caso.titulo.slice(0, 35)}</span></div>}
        {tarea.descripcion && <p className="text-xs text-slate-500 mb-2 leading-relaxed line-clamp-3">{tarea.descripcion.slice(0, 200)}{tarea.descripcion.length > 200 ? "..." : ""}</p>}
        <div className="flex flex-col gap-0.5 mb-2">
          {!esMia && <p className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3 text-slate-400 shrink-0" />Solicitado por: <span className="font-medium text-slate-700">{tarea.creador.nombre} {tarea.creador.apellido}</span></p>}
          {tarea.supervisor && <p className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3 text-slate-400 shrink-0" />Supervisor: <span className="font-medium text-slate-700">{tarea.supervisor.nombre} {tarea.supervisor.apellido}</span></p>}
          {tarea.cliente && <p className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3 text-slate-400 shrink-0" /><span className="truncate">{tarea.cliente.nombre} {tarea.cliente.apellido}</span></p>}
        </div>
        {tarea.estado === "BLOQUEADA" && tarea.motivoBloqueo && <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-1.5"><Lock className="w-3 h-3 text-red-500 mt-0.5 shrink-0" /><p className="text-xs text-red-700">{tarea.motivoBloqueo.slice(0, 150)}{tarea.motivoBloqueo.length > 150 ? "..." : ""}</p></div>}
        {tarea.motivoDesbloqueo && tarea.estado !== "BLOQUEADA" && <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-start gap-1.5"><Unlock className="w-3 h-3 text-green-500 mt-0.5 shrink-0" /><div className="text-xs"><span className="text-green-700 font-medium">Desbloqueada: </span><span className="text-green-600">{tarea.motivoDesbloqueo.slice(0, 150)}{tarea.motivoDesbloqueo.length > 150 ? "..." : ""}</span></div></div>}
        {!soloLectura && !esTerminal && (
          <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
            {tarea.estado === "PENDIENTE" && (
              <>
                {CATEGORIAS_FLUJO_COMPLETO.has(tarea.categoria) ? (
                  <button onClick={() => onChange(tarea.id, "EN_PROCESO")} className="text-[10px] px-2 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 border border-blue-200 transition-colors">En proceso</button>
                ) : (
                  <button onClick={() => onChange(tarea.id, "COMPLETADA")} className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 border border-green-200 transition-colors font-semibold">Completar</button>
                )}
                <button onClick={() => onChange(tarea.id, "BLOQUEADA")} className="text-[10px] px-2 py-1 bg-red-50 text-red-700 rounded-md hover:bg-red-100 border border-red-200 transition-colors">Bloquear</button>
              </>
            )}
            {tarea.estado === "EN_PROCESO" && (<><button onClick={() => onChange(tarea.id, "COMPLETADA")} className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 border border-green-200 transition-colors font-semibold">Completar</button><button onClick={() => onChange(tarea.id, "BLOQUEADA")} className="text-[10px] px-2 py-1 bg-red-50 text-red-700 rounded-md hover:bg-red-100 border border-red-200 transition-colors">Bloquear</button></>)}
            {tarea.estado === "BLOQUEADA" && <button onClick={() => onChange(tarea.id, "PENDIENTE")} className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 border border-green-200 transition-colors flex items-center gap-1 font-medium"><Unlock className="w-3 h-3" /> Desbloquear</button>}
          </div>
        )}
        {esTerminal && <div className="pt-2 border-t border-slate-100"><p className="text-[10px] text-slate-400 italic">{tarea.estado === "COMPLETADA" ? "Tarea finalizada" : "Tarea vencida — plazo expirado"}{tarea.fechaCompletada && tarea.estado === "COMPLETADA" && <span> el {format(new Date(tarea.fechaCompletada), "d MMM yyyy", { locale: es })}</span>}</p></div>}
      </div>
    </div>
  )
}

// ============================================================================
// FILTROS
// ============================================================================

type TipoFiltro = "TODOS" | "PROCESAL" | "INTERNA"
type CatFiltro = "TODOS" | keyof typeof CATEGORIA_CONFIG

function TabsFiltro({ tareas, tipoActivo, catActiva, onTipo, onCat }: { tareas: TareaConRelaciones[]; tipoActivo: TipoFiltro; catActiva: CatFiltro; onTipo: (t: TipoFiltro) => void; onCat: (c: CatFiltro) => void }) {
  const todasLasCategorias = Object.keys(CATEGORIA_CONFIG) as (keyof typeof CATEGORIA_CONFIG)[]
  const categoriasMostradas = tipoActivo === "TODOS" ? todasLasCategorias : todasLasCategorias.filter(c => CATEGORIA_CONFIG[c].tipo === tipoActivo)
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 space-y-3">
      <div className="flex items-center gap-3 flex-wrap"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-20 shrink-0">Tipo</span><div className="flex items-center gap-1.5 flex-wrap">{(["TODOS", "PROCESAL", "INTERNA"] as TipoFiltro[]).map(t => (<button key={t} onClick={() => onTipo(t)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${tipoActivo === t ? t === "PROCESAL" ? "bg-red-600 text-white border-red-600" : t === "INTERNA" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>{t === "TODOS" ? "Todos" : t === "PROCESAL" ? "Procesal" : "Interna"}</button>))}<span className="text-xs text-slate-400 ml-1">{tareas.length} tarea{tareas.length !== 1 ? "s" : ""}</span></div></div>
      <div className="border-t border-slate-100" />
      <div className="flex items-center gap-3 flex-wrap"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-20 shrink-0">Categoría</span><div className="flex items-center gap-1.5 flex-wrap"><button onClick={() => onCat("TODOS")} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${catActiva === "TODOS" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>Todas</button>{categoriasMostradas.map(c => { const cfg = CATEGORIA_CONFIG[c]; const tieneItems = tareas.some(t => t.categoria === c); return (<button key={c} onClick={() => onCat(c as CatFiltro)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${catActiva === c ? "bg-slate-800 text-white border-slate-800" : tieneItems ? "bg-white text-slate-600 border-slate-200 hover:border-slate-300" : "bg-slate-50 text-slate-300 border-slate-100 cursor-default"}`} disabled={!tieneItems} title={!tieneItems ? "Sin tareas en esta categoría" : undefined}>{cfg.label}</button>) })}</div></div>
    </div>
  )
}

// ============================================================================
// SECCIÓN DE TAREAS
// ============================================================================

function SeccionTareas({ titulo, tareas, colorTitulo, onChange, onEdit, onDelete, soloLectura, currentUserId, ultimoAcceso }: {
  titulo: string; tareas: TareaConRelaciones[]; colorTitulo: string; onChange: (id: string, estado: EstadoTarea, motivo?: string) => void; onEdit: (tarea: TareaConRelaciones) => void; onDelete: (id: string) => void; soloLectura?: boolean; currentUserId: string; ultimoAcceso: string | null
}) {
  const [colapsada, setColapsada] = useState(false)
  if (tareas.length === 0) return null
  const ordenadas = [...tareas].sort((a, b) => { const ua = URGENCIA_ORDEN[getUrgencia(a)]; const ub = URGENCIA_ORDEN[getUrgencia(b)]; if (ua !== ub) return ua - ub; if (a.fechaVencimiento && b.fechaVencimiento) return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime(); if (a.fechaVencimiento) return -1; if (b.fechaVencimiento) return 1; return 0 })
  return (
    <div className="mb-6">
      <button onClick={() => setColapsada(!colapsada)} className="w-full flex items-center justify-between mb-3 group"><div className="flex items-center gap-2"><h2 className={`text-base font-bold ${colorTitulo}`}>{titulo}</h2><span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">{tareas.length}</span></div><ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${colapsada ? "" : "rotate-90"}`} /></button>
      {!colapsada && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{ordenadas.map(t => <TareaCard key={t.id} tarea={t} onChange={onChange} onEdit={onEdit} onDelete={onDelete} soloLectura={soloLectura} currentUserId={currentUserId} tipoNovedad={getTipoNovedad(t, ultimoAcceso, currentUserId)} />)}</div>}
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function TareasBoard({ tareas: tareasIniciales, currentUserId, ultimoAccesoTareas, usuarios, onEdit }: {
  tareas: TareaConRelaciones[]; currentUserId: string; ultimoAccesoTareas: string | null
  usuarios?: { id: string; nombre: string | null; apellido: string | null; rol: string }[]
  onEdit?: (tarea: TareaConRelaciones) => void
}) {
  const [tareas, setTareas] = useState(tareasIniciales)
  useEffect(() => { setTareas(tareasIniciales) }, [tareasIniciales])
  const [ultimoAcceso, setUltimoAcceso] = useState(ultimoAccesoTareas)
  const [vistaActiva, setVistaActiva] = useState<"mias" | "supervisadas" | "historial" | "nuevas">("mias")
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("TODOS")
  const [catFiltro, setCatFiltro] = useState<CatFiltro>("TODOS")
  const [busqueda, setBusqueda] = useState("")
  const [isPending, startTransition] = useTransition()
  const [modalBloqueo, setModalBloqueo] = useState<string | null>(null)
  const [modalDesbloqueo, setModalDesbloqueo] = useState<string | null>(null)
  const [modalEliminar, setModalEliminar] = useState<{ id: string; titulo: string } | null>(null)
  const [modalEditar, setModalEditar] = useState<TareaConRelaciones | null>(null)

  const esTerminal = (estado: EstadoTarea) => estado === "COMPLETADA" || estado === "VENCIDA"

  // Tareas con novedad (nueva o editada) — para el toggle "Nuevas"
  const tareasConNovedad = useMemo(() =>
    tareas.filter(t => !esTerminal(t.estado) && getTipoNovedad(t, ultimoAcceso, currentUserId) !== null && (t.responsableId === currentUserId || t.supervisorId === currentUserId)),
  [tareas, currentUserId, ultimoAcceso])

  const tareasMias = useMemo(() => tareas.filter(t => !esTerminal(t.estado) && t.responsableId === currentUserId), [tareas, currentUserId])
  const tareasSupervisadas = useMemo(() => tareas.filter(t => !esTerminal(t.estado) && t.supervisorId === currentUserId), [tareas, currentUserId])
  const tareasHistorial = useMemo(() => tareas.filter(t => esTerminal(t.estado) && (t.responsableId === currentUserId || t.supervisorId === currentUserId)), [tareas, currentUserId])

  const base = vistaActiva === "nuevas" ? tareasConNovedad : vistaActiva === "mias" ? tareasMias : vistaActiva === "supervisadas" ? tareasSupervisadas : tareasHistorial
  const tareasFiltradas = useMemo(() => base.filter(t => { if (tipoFiltro !== "TODOS" && t.tipo !== tipoFiltro) return false; if (catFiltro !== "TODOS" && t.categoria !== catFiltro) return false; if (busqueda.trim() && !t.titulo.toLowerCase().includes(busqueda.trim().toLowerCase())) return false; return true }), [base, tipoFiltro, catFiltro, busqueda])
  const procesales = tareasFiltradas.filter(t => t.tipo === "PROCESAL")
  const internas = tareasFiltradas.filter(t => t.tipo === "INTERNA")
  const vencidas = tareasMias.filter(t => getUrgencia(t) === "vencida").length
  const hoy = tareasMias.filter(t => getUrgencia(t) === "hoy").length
  const fatales = tareasMias.filter(t => t.prioridad === "FATAL").length

  const handleMarcarVistas = () => { startTransition(async () => { const result = await marcarTareasComoVistasAction(); if (result.success) { setUltimoAcceso(new Date().toISOString()); if (vistaActiva === "nuevas") setVistaActiva("mias") } }) }
  const handleCambioEstado = (tareaId: string, nuevoEstado: EstadoTarea, motivo?: string) => {
    if (nuevoEstado === "BLOQUEADA" && !motivo) { setModalBloqueo(tareaId); return }
    if (nuevoEstado === "PENDIENTE" && !motivo) { const tarea = tareas.find(t => t.id === tareaId); if (tarea?.estado === "BLOQUEADA") { setModalDesbloqueo(tareaId); return } }
    startTransition(async () => { const result = await cambiarEstadoTareaAction(tareaId, nuevoEstado, motivo); if (result.success) { setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: nuevoEstado, motivoBloqueo: nuevoEstado === "BLOQUEADA" ? (motivo ?? null) : t.motivoBloqueo, motivoDesbloqueo: (nuevoEstado === "PENDIENTE" && t.estado === "BLOQUEADA") ? (motivo ?? null) : t.motivoDesbloqueo, fechaCompletada: nuevoEstado === "COMPLETADA" ? new Date().toISOString() : null } : t)) } })
    setModalBloqueo(null); setModalDesbloqueo(null)
  }
  const handleDelete = (tareaId: string) => { const tarea = tareas.find(t => t.id === tareaId); if (tarea) setModalEliminar({ id: tareaId, titulo: tarea.titulo }) }
  const confirmarEliminar = () => { if (!modalEliminar) return; const { id } = modalEliminar; setModalEliminar(null); startTransition(async () => { const result = await eliminarTareaAction(id); if (result.success) setTareas(prev => prev.filter(t => t.id !== id)) }) }
  const handleEdit = (tarea: TareaConRelaciones) => { setModalEditar(tarea) }
  const handleSaved = (tareaActualizada: TareaConRelaciones) => { setTareas(prev => prev.map(t => t.id === tareaActualizada.id ? tareaActualizada : t)); setModalEditar(null) }

  return (
    <>
      {modalBloqueo && <ModalBloqueo onClose={() => setModalBloqueo(null)} onConfirm={m => handleCambioEstado(modalBloqueo, "BLOQUEADA", m)} />}
      {modalDesbloqueo && <ModalDesbloqueo onClose={() => setModalDesbloqueo(null)} onConfirm={m => handleCambioEstado(modalDesbloqueo, "PENDIENTE", m)} />}
      {modalEliminar && <ModalEliminar titulo={modalEliminar.titulo} onClose={() => setModalEliminar(null)} onConfirm={confirmarEliminar} />}
      {modalEditar && <ModalEditar tarea={modalEditar} onClose={() => setModalEditar(null)} onSaved={handleSaved} currentUserId={currentUserId} usuarios={usuarios} />}

      {vistaActiva === "mias" && (vencidas > 0 || hoy > 0 || fatales > 0) && (
        <div className="flex gap-3 mb-5 flex-wrap">
          {vencidas > 0 && <div className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl shadow-sm"><AlertTriangle className="w-4 h-4" /><span className="text-sm font-bold">{vencidas} vencida{vencidas !== 1 ? "s" : ""}</span></div>}
          {hoy > 0 && <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl shadow-sm"><Clock className="w-4 h-4" /><span className="text-sm font-bold">{hoy} vence{hoy !== 1 ? "n" : ""} hoy</span></div>}
          {fatales > 0 && <div className="flex items-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl border border-red-200"><ShieldAlert className="w-4 h-4" /><span className="text-sm font-bold">{fatales} prioridad Fatal</span></div>}
        </div>
      )}

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 overflow-x-auto">
          {tareasConNovedad.length > 0 && <button onClick={() => setVistaActiva("nuevas")} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${vistaActiva === "nuevas" ? "bg-blue-600 text-white shadow-sm" : "text-blue-600 hover:text-blue-700"}`}><Sparkles className="w-4 h-4" />Novedades<span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${vistaActiva === "nuevas" ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-700"}`}>{tareasConNovedad.length}</span></button>}
          <button onClick={() => setVistaActiva("mias")} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${vistaActiva === "mias" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><User className="w-4 h-4" />Mis Tareas<span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${vistaActiva === "mias" ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"}`}>{tareasMias.length}</span></button>
          <button onClick={() => setVistaActiva("supervisadas")} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${vistaActiva === "supervisadas" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Eye className="w-4 h-4" />Supervisadas<span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${vistaActiva === "supervisadas" ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"}`}>{tareasSupervisadas.length}</span></button>
          <button onClick={() => setVistaActiva("historial")} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${vistaActiva === "historial" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><History className="w-4 h-4" />Historial<span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${vistaActiva === "historial" ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"}`}>{tareasHistorial.length}</span></button>
        </div>
        {tareasConNovedad.length > 0 && <button onClick={handleMarcarVistas} disabled={isPending} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"><CheckCheck className="w-3.5 h-3.5" />Marcar todo como visto</button>}
      </div>

      {/* Buscador por título */}
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

      <TabsFiltro tareas={base as any} tipoActivo={tipoFiltro} catActiva={catFiltro} onTipo={t => { setTipoFiltro(t); setCatFiltro("TODOS") }} onCat={setCatFiltro} />

      {tareasFiltradas.length === 0 && <div className="bg-white border border-slate-200 rounded-xl p-12 text-center"><Filter className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="font-medium text-slate-600">{vistaActiva === "historial" ? "Sin tareas en el historial" : vistaActiva === "nuevas" ? "No hay novedades" : "No hay tareas para esta vista"}</p>{tipoFiltro !== "TODOS" || catFiltro !== "TODOS" || busqueda.trim() ? <button onClick={() => { setTipoFiltro("TODOS"); setCatFiltro("TODOS"); setBusqueda("") }} className="mt-2 text-sm text-blue-600 hover:underline">Limpiar filtros</button> : null}</div>}

      {(tipoFiltro === "TODOS" || tipoFiltro === "PROCESAL") && <SeccionTareas titulo="Procesales" tareas={tipoFiltro === "PROCESAL" ? tareasFiltradas : procesales} colorTitulo="text-red-700" onChange={handleCambioEstado} onEdit={handleEdit} onDelete={handleDelete} soloLectura={vistaActiva === "supervisadas"} currentUserId={currentUserId} ultimoAcceso={ultimoAcceso} />}
      {(tipoFiltro === "TODOS" || tipoFiltro === "INTERNA") && <SeccionTareas titulo="Internas" tareas={tipoFiltro === "INTERNA" ? tareasFiltradas : internas} colorTitulo="text-blue-700" onChange={handleCambioEstado} onEdit={handleEdit} onDelete={handleDelete} soloLectura={vistaActiva === "supervisadas"} currentUserId={currentUserId} ultimoAcceso={ultimoAcceso} />}
    </>
  )
}