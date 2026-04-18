'use client'

import { useEffect, useState } from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  X, Briefcase, User, MapPin, Calendar, Lock, Unlock,
  Scale, ShieldAlert, Pencil, Trash2, Eye, AlertTriangle,
  CheckCircle2, ExternalLink, FileText,
} from "lucide-react"
import Link from "next/link"
import { format, isToday, isTomorrow, isBefore, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import type { TareaConRelaciones } from "src/lib/actions/tarea-actions"
import type { EstadoTarea } from "@prisma/client"
import { marcarTareaLeidaAction } from "src/lib/actions/comentario-actions"
import { ComentariosSection } from "./ComentariosSection"

// ============================================================================
// CONFIG
// ============================================================================

const ESTADO_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  PENDIENTE:  { label: "Pendiente",  dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
  EN_PROCESO: { label: "En proceso", dot: "bg-blue-500",  text: "text-blue-700",  bg: "bg-blue-100",  border: "border-blue-200" },
  BLOQUEADA:  { label: "Bloqueada",  dot: "bg-red-500",   text: "text-red-700",   bg: "bg-red-100",   border: "border-red-200" },
  COMPLETADA: { label: "Completada", dot: "bg-green-500", text: "text-green-700", bg: "bg-green-100", border: "border-green-200" },
  VENCIDA:    { label: "Vencida",    dot: "bg-red-600",   text: "text-red-700",   bg: "bg-red-100",   border: "border-red-300" },
}

const CATEGORIA_LABEL: Record<string, string> = {
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

const PRIORIDAD_CONFIG: Record<string, { label: string; text: string; bg: string; border: string }> = {
  BAJA:  { label: "Baja",  text: "text-slate-600",  bg: "bg-slate-50",   border: "border-slate-200" },
  MEDIA: { label: "Media", text: "text-slate-700",  bg: "bg-slate-100",  border: "border-slate-300" },
  ALTA:  { label: "Alta",  text: "text-orange-700", bg: "bg-orange-100", border: "border-orange-300" },
  FATAL: { label: "Fatal", text: "text-white",      bg: "bg-red-600",    border: "border-red-600" },
}

const CATEGORIAS_FLUJO_COMPLETO: Set<string> = new Set([
  "PRESENTACION_ESCRITO",
  "APELACION_RECURSO",
  "PERICIA_PRUEBA",
  "REDACCION_DOCUMENTACION",
  "REQUERIMIENTO_CLIENTE",
])

// ============================================================================
// HELPERS
// ============================================================================

function getVencimientoInfo(t: TareaConRelaciones): { texto: string; sub: string | null; color: string; bg: string } | null {
  if (!t.fechaVencimiento) return null
  const partes = t.fechaVencimiento.split("T")[0].split("-")
  const f = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
  const ahora = new Date()
  const dias = differenceInDays(f, ahora)
  const fecha = format(f, "d 'de' MMMM", { locale: es })
  const hora = format(f, "HH:mm")

  if (t.estado === "COMPLETADA" || t.estado === "VENCIDA") {
    return { texto: fecha, sub: hora, color: "text-slate-500", bg: "bg-slate-50" }
  }
  if (isBefore(f, ahora)) return { texto: `Venció el ${fecha}`,  sub: null,              color: "text-red-700",    bg: "bg-red-100" }
  if (isToday(f))         return { texto: `Vence hoy`,           sub: hora,              color: "text-red-700",    bg: "bg-red-100" }
  if (isTomorrow(f))      return { texto: `Vence mañana`,        sub: hora,              color: "text-orange-700", bg: "bg-orange-100" }
  if (dias <= 3)          return { texto: `Vence el ${fecha}`,   sub: `en ${dias} días`, color: "text-orange-600", bg: "bg-orange-50" }
  if (dias <= 7)          return { texto: `Vence el ${fecha}`,   sub: `en ${dias} días`, color: "text-amber-700",  bg: "bg-amber-50" }
  if (dias <= 15)         return { texto: `Vence el ${fecha}`,   sub: `en ${dias} días`, color: "text-slate-700",  bg: "bg-slate-100" }
  return                         { texto: `Vence el ${fecha}`,   sub: `en ${dias} días`, color: "text-slate-600",  bg: "bg-slate-50" }
}

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

function SeccionTitulo({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
      <Icon className="w-3.5 h-3.5" /> {children}
    </h3>
  )
}

function FilaInfo({ icon: Icon, label, valor, href }: { icon: any; label: string; valor: React.ReactNode; href?: string }) {
  const contenido = (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400 font-medium">{label}</p>
        <div className="text-sm text-slate-700 font-medium flex items-center gap-1.5">
          {valor}
          {href && <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />}
        </div>
      </div>
    </div>
  )
  if (href) {
    return (
      <Link href={href} className="block hover:bg-slate-50 rounded-md -mx-2 px-2 transition-colors">
        {contenido}
      </Link>
    )
  }
  return contenido
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type Props = {
  tarea: TareaConRelaciones | null
  open: boolean
  onClose: () => void
  onChangeEstado: (id: string, estado: EstadoTarea, motivo?: string) => void
  onEdit: (tarea: TareaConRelaciones) => void
  onDelete: (id: string) => void
  currentUserId: string
}

export function TareaDetalleDrawer({ tarea, open, onClose, onChangeEstado, onEdit, onDelete, currentUserId }: Props) {
  // Marcar tarea como "vista" apenas se abre el drawer (si corresponde a responsable/supervisor)
  useEffect(() => {
    if (!open || !tarea) return
    const esResponsableOSupervisor =
      tarea.responsableId === currentUserId || tarea.supervisorId === currentUserId
    if (!esResponsableOSupervisor) return
    marcarTareaLeidaAction(tarea.id).catch(err => console.error("Error marcando tarea como leída:", err))
  }, [open, tarea?.id, currentUserId])

  if (!tarea) return null

  const estadoCfg = ESTADO_CONFIG[tarea.estado] ?? ESTADO_CONFIG.PENDIENTE
  const prioridadCfg = PRIORIDAD_CONFIG[tarea.prioridad] ?? PRIORIDAD_CONFIG.MEDIA
  const categoriaLabel = CATEGORIA_LABEL[tarea.categoria] ?? tarea.categoria
  const esProcesal = tarea.tipo === "PROCESAL"
  const vencimientoInfo = getVencimientoInfo(tarea)
  const lugarLimpio = tarea.lugarFisico?.replace(/^\[.*?\]\s?/, "") ?? null
  const tieneLugar = lugarLimpio && lugarLimpio !== "Estudio Jurídico" && lugarLimpio.trim() !== ""

  const esCreador = tarea.creadorId === currentUserId
  const esSupervisor = tarea.supervisorId === currentUserId
  const esResponsable = tarea.responsableId === currentUserId
  const puedeEditar = esCreador || esSupervisor || esResponsable
  const puedeEliminar = esCreador
  const puedeComentar = esResponsable || esSupervisor // solo responsable y supervisor
  const esTerminal = tarea.estado === "COMPLETADA" || tarea.estado === "VENCIDA"

  const handleEdit = () => { onEdit(tarea); onClose() }
  const handleDelete = () => { onDelete(tarea.id); onClose() }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] p-0 overflow-y-auto [&>button]:hidden"
      >
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              {esProcesal && (
                <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold border border-red-200 flex items-center gap-1">
                  <Scale className="w-3 h-3" /> PROCESAL
                </span>
              )}
              {!esProcesal && (
                <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold border border-blue-200 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> INTERNA
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                {categoriaLabel}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${estadoCfg.bg} ${estadoCfg.text} border ${estadoCfg.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dot}`} />
                {estadoCfg.label}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <SheetHeader className="space-y-2 text-left">
            <SheetTitle className="text-lg font-bold text-slate-800 leading-snug">
              {tarea.titulo}
            </SheetTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${prioridadCfg.bg} ${prioridadCfg.text} ${prioridadCfg.border} flex items-center gap-1`}>
                {tarea.prioridad === "FATAL" && <ShieldAlert className="w-3 h-3" />}
                Prioridad {prioridadCfg.label}
              </span>
              {vencimientoInfo && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${vencimientoInfo.bg} ${vencimientoInfo.color} border border-transparent flex items-center gap-1`}>
                  <Calendar className="w-3 h-3" />
                  {vencimientoInfo.texto}
                  {vencimientoInfo.sub && <span className="opacity-70">· {vencimientoInfo.sub}</span>}
                </span>
              )}
            </div>
          </SheetHeader>
        </div>

        <div className="px-6 py-5 space-y-6">

          {tarea.descripcion && (
            <section>
              <SeccionTitulo icon={FileText}>Descripción</SeccionTitulo>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {tarea.descripcion}
              </p>
            </section>
          )}

          {tieneLugar && (
            <section>
              <SeccionTitulo icon={MapPin}>Ubicación</SeccionTitulo>
              <p className="text-sm text-slate-700 font-medium">{lugarLimpio}</p>
            </section>
          )}

          <section>
            <SeccionTitulo icon={Briefcase}>Vinculaciones</SeccionTitulo>
            <div className="space-y-0.5">
              {tarea.caso && (
                <FilaInfo
                  icon={Briefcase}
                  label="Expediente"
                  valor={
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-blue-600 font-bold">{tarea.caso.numero}</span>
                      <span className="text-slate-400">—</span>
                      <span className="truncate">{tarea.caso.titulo}</span>
                    </span>
                  }
                  href={`/casos/${tarea.caso.id}`}
                />
              )}
              {tarea.cliente && (
                <FilaInfo
                  icon={User}
                  label="Cliente"
                  valor={<span className="truncate">{tarea.cliente.nombre} {tarea.cliente.apellido ?? ""}</span>}
                />
              )}
              <FilaInfo
                icon={User}
                label="Solicitado por"
                valor={<span>{tarea.creador.nombre} {tarea.creador.apellido}</span>}
              />
              <FilaInfo
                icon={User}
                label="Responsable"
                valor={
                  <span>
                    {tarea.responsable.nombre} {tarea.responsable.apellido}
                    {esResponsable && <span className="ml-1.5 text-[10px] text-slate-400">(Yo)</span>}
                  </span>
                }
              />
              {tarea.supervisor && (
                <FilaInfo
                  icon={Eye}
                  label="Supervisor"
                  valor={<span>{tarea.supervisor.nombre} {tarea.supervisor.apellido}</span>}
                />
              )}
            </div>
          </section>

          {tarea.estado === "BLOQUEADA" && tarea.motivoBloqueo && (
            <section>
              <SeccionTitulo icon={Lock}>Bloqueo actual</SeccionTitulo>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 leading-relaxed">{tarea.motivoBloqueo}</p>
              </div>
            </section>
          )}

          {tarea.motivoDesbloqueo && tarea.estado !== "BLOQUEADA" && (
            <section>
              <SeccionTitulo icon={Unlock}>Último desbloqueo</SeccionTitulo>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 leading-relaxed">{tarea.motivoDesbloqueo}</p>
              </div>
            </section>
          )}

          {esTerminal && (
            <section>
              <div className={`p-3 rounded-lg border ${tarea.estado === "COMPLETADA" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-start gap-2">
                  {tarea.estado === "COMPLETADA" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  )}
                  <div className="text-sm">
                    <p className={`font-semibold ${tarea.estado === "COMPLETADA" ? "text-green-800" : "text-red-800"}`}>
                      {tarea.estado === "COMPLETADA" ? "Tarea finalizada" : "Tarea vencida"}
                    </p>
                    {tarea.fechaCompletada && tarea.estado === "COMPLETADA" && (
                      <p className="text-xs text-green-700 mt-0.5">
                        Completada el {format(new Date(tarea.fechaCompletada), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                      </p>
                    )}
                    {tarea.estado === "VENCIDA" && (
                      <p className="text-xs text-red-700 mt-0.5">
                        El plazo expiró sin completarse
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECCIÓN DE COMENTARIOS — solo para responsable y supervisor */}
          {puedeComentar && (
            <ComentariosSection
              tareaId={tarea.id}
              currentUserId={currentUserId}
            />
          )}
        </div>

        {!esTerminal && (
          <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex flex-wrap items-center gap-2">
            {tarea.estado === "PENDIENTE" && (
              <>
                {CATEGORIAS_FLUJO_COMPLETO.has(tarea.categoria) ? (
                  <button
                    onClick={() => onChangeEstado(tarea.id, "EN_PROCESO")}
                    className="text-xs px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 font-medium transition-colors"
                  >
                    Poner en proceso
                  </button>
                ) : (
                  <button
                    onClick={() => onChangeEstado(tarea.id, "COMPLETADA")}
                    className="text-xs px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 font-semibold transition-colors"
                  >
                    Completar
                  </button>
                )}
                <button
                  onClick={() => onChangeEstado(tarea.id, "BLOQUEADA")}
                  className="text-xs px-3 py-2 bg-white text-slate-600 rounded-lg hover:bg-slate-50 border border-slate-200 font-medium transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3 h-3" /> Bloquear
                </button>
              </>
            )}
            {tarea.estado === "EN_PROCESO" && (
              <>
                <button
                  onClick={() => onChangeEstado(tarea.id, "COMPLETADA")}
                  className="text-xs px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 font-semibold transition-colors"
                >
                  Completar
                </button>
                <button
                  onClick={() => onChangeEstado(tarea.id, "BLOQUEADA")}
                  className="text-xs px-3 py-2 bg-white text-slate-600 rounded-lg hover:bg-slate-50 border border-slate-200 font-medium transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3 h-3" /> Bloquear
                </button>
              </>
            )}
            {tarea.estado === "BLOQUEADA" && (
              <button
                onClick={() => onChangeEstado(tarea.id, "PENDIENTE")}
                className="text-xs px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 font-medium transition-colors flex items-center gap-1.5"
              >
                <Unlock className="w-3 h-3" /> Desbloquear
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              {puedeEditar && (
                <button
                  onClick={handleEdit}
                  className="text-xs px-3 py-2 bg-white text-slate-600 rounded-lg hover:bg-slate-50 border border-slate-200 font-medium transition-colors flex items-center gap-1.5"
                >
                  <Pencil className="w-3 h-3" /> Editar
                </button>
              )}
              {puedeEliminar && (
                <button
                  onClick={handleDelete}
                  className="text-xs px-3 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 border border-red-200 font-medium transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" /> Eliminar
                </button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}