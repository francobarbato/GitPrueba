'use client'

import { useState, useEffect, useTransition, useRef } from "react"
import { MessageCircle, Send, CornerUpLeft, X, User as UserIcon } from "lucide-react"
import { format, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import {
  getComentariosTarea,
  crearComentarioAction,
} from "src/lib/actions/comentario-actions"
import type { ComentarioConAutor } from "src/lib/actions/comentario-actions"

// ============================================================================
// HELPERS
// ============================================================================

function tiempoRelativo(fechaISO: string): string {
  const fecha = new Date(fechaISO)
  const ahora = new Date()
  const mins = differenceInMinutes(ahora, fecha)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins}m`
  const horas = differenceInHours(ahora, fecha)
  if (horas < 24) return `hace ${horas}h`
  const dias = differenceInDays(ahora, fecha)
  if (dias < 7) return `hace ${dias}d`
  return format(fecha, "d MMM", { locale: es })
}

function getNombreCompleto(autor: { nombre: string | null; apellido: string | null }): string {
  const n = autor.nombre ?? ""
  const a = autor.apellido ?? ""
  const completo = `${n} ${a}`.trim()
  return completo || "Usuario"
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type Props = {
  tareaId: string
  currentUserId: string
  // Se dispara cuando se crea un comentario (para refrescar la UI externa si corresponde)
  onComentarioCreado?: () => void
}

export function ComentariosSection({ tareaId, currentUserId, onComentarioCreado }: Props) {
  const [comentarios, setComentarios] = useState<ComentarioConAutor[]>([])
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState("")
  const [citando, setCitando] = useState<ComentarioConAutor | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  // Cargar comentarios al montar y cuando cambia la tarea
  useEffect(() => {
    let cancelado = false
    setLoading(true)
    getComentariosTarea(tareaId).then(data => {
      if (!cancelado) {
        setComentarios(data)
        setLoading(false)
      }
    })
    return () => {
      cancelado = true
    }
  }, [tareaId])

  // Auto-scroll al final cuando se agregan comentarios
  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight
    }
  }, [comentarios.length])

  // Focus al input cuando se inicia una cita
  useEffect(() => {
    if (citando && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [citando])

  const handleEnviar = () => {
    if (!texto.trim() || isPending) return
    setError(null)
    const citaId = citando?.id
    startTransition(async () => {
      const result = await crearComentarioAction({
        tareaId,
        texto: texto.trim(),
        citaComentarioId: citaId,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.comentario) {
        setComentarios(prev => [...prev, result.comentario!])
        setTexto("")
        setCitando(null)
        onComentarioCreado?.()
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter envía, Shift+Enter hace nueva línea
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
    // Escape cancela la cita
    if (e.key === "Escape" && citando) {
      setCitando(null)
    }
  }

  return (
    <section>
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
        <MessageCircle className="w-3.5 h-3.5" />
        Comentarios
        {comentarios.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium ml-1">
            {comentarios.length}
          </span>
        )}
      </h3>

      {/* Lista de comentarios */}
      <div
        ref={listaRef}
        className="space-y-3 mb-4 max-h-[360px] overflow-y-auto pr-1"
      >
        {loading ? (
          <div className="text-center py-6 text-sm text-slate-400">Cargando comentarios...</div>
        ) : comentarios.length === 0 ? (
          <div className="text-center py-6">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-200" />
            <p className="text-sm text-slate-500">Sin comentarios aún</p>
            <p className="text-xs text-slate-400 mt-0.5">Dejá una nota para el equipo</p>
          </div>
        ) : (
          comentarios.map(c => {
            const esMio = c.autorId === currentUserId
            return (
              <div key={c.id} className="group">
                {/* Cita a comentario anterior (estilo WhatsApp: barra vertical + texto tenue) */}
                {c.citaComentario && (
                  <div className="border-l-2 border-slate-300 pl-2 mb-1.5 ml-0.5">
                    <p className="text-[11px] font-medium text-slate-500">
                      {getNombreCompleto(c.citaComentario.autor)}
                    </p>
                    <p className="text-xs text-slate-400 italic line-clamp-2">
                      {c.citaComentario.texto}
                    </p>
                  </div>
                )}

                {/* Header: nombre + fecha + botón responder */}
                <div className="flex items-center gap-2 mb-1">
                  <UserIcon className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className={`text-sm font-semibold ${esMio ? "text-blue-700" : "text-slate-700"}`}>
                    {getNombreCompleto(c.autor)}
                    {esMio && <span className="text-xs font-normal text-slate-400 ml-1">(Yo)</span>}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{tiempoRelativo(c.createdAt)}</span>

                  <button
                    onClick={() => setCitando(c)}
                    className="ml-auto text-[10px] text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                    title="Responder citando"
                  >
                    <CornerUpLeft className="w-3 h-3" />
                    Responder
                  </button>
                </div>

                {/* Texto del comentario */}
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words ml-5">
                  {c.texto}
                </p>
              </div>
            )
          })
        )}
      </div>

      {/* Preview de cita activa */}
      {citando && (
        <div className="mb-2 flex items-start gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <CornerUpLeft className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-slate-600">
              Respondiendo a {getNombreCompleto(citando.autor)}
            </p>
            <p className="text-xs text-slate-500 italic line-clamp-1">{citando.texto}</p>
          </div>
          <button
            onClick={() => setCitando(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded shrink-0"
            aria-label="Cancelar cita"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input de nuevo comentario */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={texto}
          onChange={e => {
            if (e.target.value.length <= 2000) {
              setTexto(e.target.value)
              setError(null)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Escribí un comentario..."
          rows={2}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-slate-400 min-h-[40px]"
          maxLength={2000}
        />
        <button
          onClick={handleEnviar}
          disabled={!texto.trim() || isPending}
          className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-sm font-medium shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          {isPending ? "..." : "Enviar"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-1.5">{error}</p>
      )}

      <p className="text-[10px] text-slate-400 mt-1.5">
        Enter para enviar · Shift+Enter para nueva línea
      </p>
    </section>
  )
}