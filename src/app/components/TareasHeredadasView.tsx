// src/app/configuracion/tareas-heredadas/components/TareasHeredadasView.tsx

'use client'

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useConfirmacion } from "@/components/confirmacion/ConfirmacionProvider"
import {
  Inbox, AlertCircle, CheckCircle2, Loader2, X,
  Calendar, Briefcase, User, AlertTriangle, ShieldAlert,
  Send, XCircle, Clock
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  delegarTareaHeredadaAction,
  cerrarTareaHeredadaAction,
} from "src/lib/actions/tareas-heredadas-actions"

type Tarea = {
  id: string
  titulo: string
  descripcion: string | null
  tipo: string
  categoria: string
  prioridad: string
  estado: string
  fechaVencimiento: Date | null
  lugarFisico: string | null
  responsableId: string
  supervisorId: string | null
  createdAt: Date
  caso: { id: string; numero: string; titulo: string } | null
  cliente: { id: string; nombre: string; apellido: string | null } | null
  creador: { id: string; nombre: string | null; apellido: string | null }
}

type Usuario = {
  id: string
  nombre: string | null
  apellido: string | null
  rol: string
}

interface Props {
  tareas: Tarea[]
  usuarios: Usuario[]
  errorCarga: string | null
}

const PRIORIDAD_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  FATAL:  { label: "Fatal",  bg: "bg-orange-100", text: "text-orange-800" },
  ALTA:   { label: "Alta",   bg: "bg-yellow-100", text: "text-yellow-800" },
  MEDIA:  { label: "Media",  bg: "bg-slate-100",  text: "text-slate-700" },
  BAJA:   { label: "Baja",   bg: "bg-slate-50",   text: "text-slate-600" },
}

const ESTADO_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDIENTE:  { label: "Pendiente",  bg: "bg-slate-100", text: "text-slate-700" },
  EN_PROCESO: { label: "En proceso", bg: "bg-blue-100",  text: "text-blue-700" },
  BLOQUEADA:  { label: "Bloqueada",  bg: "bg-amber-100", text: "text-amber-700" },
  VENCIDA:    { label: "Vencida",    bg: "bg-red-100",   text: "text-red-700" },
}

export function TareasHeredadasView({ tareas, usuarios, errorCarga }: Props) {
  const router = useRouter()
  const { confirm: confirmar } = useConfirmacion()

  // Estado por tarea: a quién querés delegarla
  const [seleccion, setSeleccion] = useState<Record<string, string>>({})
  // Estado por tarea: si está procesando ("delegando" o "cerrando")
  const [procesando, setProcesando] = useState<Record<string, 'delegando' | 'cerrando' | null>>({})

  const [error, setError] = useState<string | null>(errorCarga)
  const [success, setSuccess] = useState<string | null>(null)

  const tieneUsuariosParaDelegar = usuarios.length > 0

  const handleDelegar = async (tarea: Tarea) => {
    const destinoId = seleccion[tarea.id]
    if (!destinoId) {
      setError("Elegí primero un destinatario en el select")
      return
    }
    const destino = usuarios.find(u => u.id === destinoId)
    if (!destino) {
      setError("El destinatario seleccionado no es válido")
      return
    }

    const nombreDestino = `${destino.nombre ?? ''} ${destino.apellido ?? ''}`.trim() || destino.rol

    const confirmado = await confirmar({
      titulo: "Delegar tarea",
      descripcion: `"${tarea.titulo}" se asignará a ${nombreDestino}. Va a recibir una notificación de nuevo evento.`,
      variante: "info",
      textoConfirmar: "Sí, delegar",
      textoCancelar: "Cancelar",
    })
    if (!confirmado) return

    setError(null)
    setProcesando(p => ({ ...p, [tarea.id]: 'delegando' }))

    try {
      const result = await delegarTareaHeredadaAction(tarea.id, destinoId)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`"${tarea.titulo}" delegada a ${nombreDestino}.`)
        setSeleccion(s => {
          const next = { ...s }
          delete next[tarea.id]
          return next
        })
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "Error al delegar")
    } finally {
      setProcesando(p => ({ ...p, [tarea.id]: null }))
    }
  }

  const handleCerrar = async (tarea: Tarea) => {
    const confirmado = await confirmar({
      titulo: "Cerrar tarea heredada",
      descripcion: `La tarea "${tarea.titulo}" va a quedar archivada como cerrada por el administrador. Esta acción no se puede deshacer.`,
      variante: "danger",
      textoConfirmar: "Sí, cerrar tarea",
      textoCancelar: "Cancelar",
    })
    if (!confirmado) return

    setError(null)
    setProcesando(p => ({ ...p, [tarea.id]: 'cerrando' }))

    try {
      const result = await cerrarTareaHeredadaAction(tarea.id)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`"${tarea.titulo}" cerrada.`)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "Error al cerrar")
    } finally {
      setProcesando(p => ({ ...p, [tarea.id]: null }))
    }
  }

  const formatearFecha = (fecha: Date | string | null) => {
    if (!fecha) return null
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const labelRol = (rol: string) => {
    if (rol === 'ABOGADO') return 'Abogado'
    if (rol === 'ASISTENTE') return 'Asistente'
    return rol
  }

  return (
    <div className="space-y-6">

      {/* Mensajes */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Listo</p>
            <p className="text-sm">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Aviso si no hay usuarios para delegar */}
      {tareas.length > 0 && !tieneUsuariosParaDelegar && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-2">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">No hay usuarios activos para delegar</p>
            <p className="text-xs mt-1">
              No hay abogados ni asistentes activos en el sistema. Solo podés cerrar las eventos hasta que actives un usuario.
            </p>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {tareas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">No tenés eventos heredados</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Cuando un usuario sea desactivado y sus eventos no puedan reasignarse automáticamente, van a aparecer acá para que los gestiones.
            </p>
          </CardContent>
        </Card>
      ) : (
        // Lista de tareas
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-slate-600" />
              <h2 className="text-base font-semibold text-slate-800">
                {tareas.length} evento{tareas.length !== 1 ? 's' : ''} pendiente{tareas.length !== 1 ? 's' : ''} de gestionar
              </h2>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {tareas.map(tarea => {
              const prioCfg = PRIORIDAD_CONFIG[tarea.prioridad] ?? PRIORIDAD_CONFIG.MEDIA
              const estadoCfg = ESTADO_CONFIG[tarea.estado] ?? ESTADO_CONFIG.PENDIENTE
              const estaProcesando = procesando[tarea.id] != null
              const estado = procesando[tarea.id]
              const fechaVenc = formatearFecha(tarea.fechaVencimiento)
              const valorSeleccionado = seleccion[tarea.id] ?? ""

              return (
                <div key={tarea.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">

                    {/* Info de la tarea */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap mb-2">
                        <Badge className={`${prioCfg.bg} ${prioCfg.text} border-0 text-[10px] font-bold uppercase`}>
                          {prioCfg.label}
                        </Badge>
                        <Badge className={`${estadoCfg.bg} ${estadoCfg.text} border-0 text-[10px] font-bold uppercase`}>
                          {estadoCfg.label}
                        </Badge>
                        {tarea.tipo === "PROCESAL" && (
                          <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[10px] font-bold uppercase">
                            Procesal
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-slate-900 leading-snug">
                        {tarea.titulo}
                      </h3>

                      {tarea.descripcion && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {tarea.descripcion}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 flex-wrap mt-3 text-xs text-slate-500">
                        {tarea.caso && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            <span className="font-mono text-blue-600">{tarea.caso.numero}</span>
                            <span className="truncate max-w-[200px]">— {tarea.caso.titulo}</span>
                          </span>
                        )}
                        {!tarea.caso && (
                          <span className="flex items-center gap-1 text-amber-600 italic">
                            <AlertTriangle className="w-3 h-3" />
                            Sin caso asociado (recordatorio personal)
                          </span>
                        )}
                        {tarea.creador && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Creada por {tarea.creador.nombre} {tarea.creador.apellido}
                          </span>
                        )}
                        {fechaVenc && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Vence: {fechaVenc}
                          </span>
                        )}
                        {!fechaVenc && (
                          <span className="flex items-center gap-1 text-slate-400 italic">
                            <Clock className="w-3 h-3" />
                            Sin fecha de vencimiento
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col sm:flex-row gap-2 lg:items-center shrink-0">

                      <Select
                        value={valorSeleccionado}
                        onValueChange={(v) => setSeleccion(s => ({ ...s, [tarea.id]: v }))}
                        disabled={estaProcesando || !tieneUsuariosParaDelegar}
                      >
                        <SelectTrigger className="w-full sm:w-[200px] h-9 text-xs">
                          <SelectValue placeholder="Delegar a..." />
                        </SelectTrigger>
                        <SelectContent>
                          {usuarios.length === 0 && (
                            <div className="px-2 py-1.5 text-xs text-slate-400 italic">
                              Sin usuarios disponibles
                            </div>
                          )}
                          {usuarios.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              <span className="flex items-center gap-2">
                                <span className="text-[10px] px-1.5 py-0 rounded bg-slate-100 text-slate-600">
                                  {labelRol(u.rol)}
                                </span>
                                {u.nombre} {u.apellido}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        disabled={estaProcesando || !valorSeleccionado}
                        onClick={() => handleDelegar(tarea)}
                        className="bg-blue-600 hover:bg-blue-700 h-9"
                      >
                        {estado === 'delegando' ? (
                          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Delegando...</>
                        ) : (
                          <><Send className="w-3.5 h-3.5 mr-1.5" /> Delegar</>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={estaProcesando}
                        onClick={() => handleCerrar(tarea)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-9"
                      >
                        {estado === 'cerrando' ? (
                          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Cerrando...</>
                        ) : (
                          <><XCircle className="w-3.5 h-3.5 mr-1.5" /> Cerrar</>
                        )}
                      </Button>

                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer informativo */}
      {tareas.length > 0 && (
        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
          <strong className="text-slate-700">Política:</strong> al delegar, la tarea pasa al responsable seleccionado y se registra en bitácora.
          Al cerrar, queda archivada como vencida con motivo administrativo — no aparece en análisis de cumplimiento como si fuera una tarea perdida del estudio.
        </div>
      )}
    </div>
  )
}