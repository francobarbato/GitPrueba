'use client'

import { useState, useTransition, useRef, useEffect, useCallback, useMemo  } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, MapPin, Calendar, Briefcase, User, Link as LinkIcon, Search, ChevronDown, AlertTriangle, Eye, Info } from "lucide-react"
import { crearTareaAction } from "src/lib/actions/tarea-actions"
import { getCargaResponsableAction } from "src/lib/actions/getCargaResponsable"
import type { TipoTarea, CategoriaTarea, AmbitoTarea, PrioridadTarea } from "@prisma/client"
import { useRouter } from "next/navigation"
import { CalendarioCarga } from "./CalendarioCarga"
import { useFeriados } from "../../hooks/useFeriados"

// ============================================================================
// MATRIZ DE CATEGORÍAS POR TIPO
// ============================================================================

const CATEGORIAS_PROCESAL: { value: CategoriaTarea; label: string; desc: string }[] = [
  { value: "PRESENTACION_ESCRITO",  label: "Presentación / Escrito",    desc: "Demandar, contestar traslados, presentar prueba" },
  { value: "AUDIENCIA",             label: "Audiencia",                  desc: "Concurrencia física o virtual ante el juez" },
  { value: "NOTIFICACION_CEDULA",   label: "Notificación / Cédula",      desc: "Telegramas, oficios, diligencias" },
  { value: "CONTROL_EXPEDIENTE",    label: "Control de Expediente",      desc: "Verificar movimientos en el poder judicial" },
  { value: "APELACION_RECURSO",     label: "Apelación / Recurso",        desc: "Impugnar resoluciones judiciales" },
  { value: "PERICIA_PRUEBA",        label: "Pericia / Prueba",            desc: "Seguimiento de pericias, ofrecimiento y producción de prueba" },
]

const CATEGORIAS_INTERNA: { value: CategoriaTarea; label: string; desc: string }[] = [
  { value: "REUNION_CLIENTE",          label: "Reunión con Cliente",        desc: "Asesoramiento, firmas, consultas" },
  { value: "REDACCION_DOCUMENTACION",  label: "Redacción / Documentación",  desc: "Contratos, poderes, escritos previos" },
  { value: "TRAMITE_ADMINISTRATIVO",   label: "Trámite Administrativo",     desc: "AFIP, Registro, Municipalidad, Colegio" },
  { value: "REQUERIMIENTO_CLIENTE",    label: "Requerimiento al Cliente",   desc: "Solicitar documentación o información" },
  { value: "GESTION_FINANCIERA",       label: "Gestión Financiera",         desc: "Honorarios, tasas, facturación" },
  { value: "REUNION_EQUIPO",           label: "Reunión de Equipo",          desc: "Discutir estrategia con socios o asistentes" },
  { value: "VENCIMIENTO_PLAZO",        label: "Vencimiento / Plazo",        desc: "Recordatorio de plazo legal o administrativo" },
]

const TIPOS: { value: TipoTarea; label: string; desc: string }[] = [
  { value: "PROCESAL", label: "Procesal", desc: "Plazos legales, audiencias, escritos" },
  { value: "INTERNA",  label: "Interna",  desc: "Gestión del estudio, reuniones, trámites" },
]

const PRIORIDADES: { value: PrioridadTarea; label: string; color: string }[] = [
  { value: "BAJA",  label: "Baja",                        color: "text-slate-600" },
  { value: "MEDIA", label: "Media",                       color: "text-slate-700" },
  { value: "ALTA",  label: "Alta",                        color: "text-orange-700 font-semibold" },
  { value: "FATAL", label: "Fatal — Plazo improrrogable", color: "text-red-700 font-bold" },
]

const MODALIDADES_LUGAR = [
  { value: "ESTUDIO",   label: "En el Estudio" },
  { value: "TRIBUNAL",  label: "Juzgado / Tribunal" },
  { value: "VIRTUAL",   label: "Virtual (Zoom/Meet)" },
  { value: "EXTERNO",   label: "Otro lugar físico" },
]

const ROL_LABEL: Record<string, string> = {
  ABOGADO: "Abogado",
  ASISTENTE: "Asistente",
  ADMIN: "Admin",
  CLIENTE: "Cliente",
}

const MAX_DESCRIPCION = 300

type Usuario = { id: string; nombre: string | null; apellido: string | null; rol: string }
type Caso = { id: string; numero: string; titulo: string; estaCerrado: boolean; abogadoId: string; clienteId: string }
type Cliente = { id: string; nombre: string; apellido: string | null; tipoPersona: string; tipoSociedad: string | null; usuarioPortalId: string | null; abogadoId: string }

type Props = {
  usuarios: Usuario[]
  casos: Caso[]
  clientes?: Cliente[]
  currentUserId: string
  currentUserRol?: string   // ⬅ NUEVO: si no se pasa, defaultea a ABOGADO
  casoPreseleccionado?: string
  onSuccess?: () => void
}

function dateToISO(d: Date | undefined): string {
  if (!d) return ""
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function isoToDate(s: string): Date | undefined {
  if (!s) return undefined
  const [y, m, d] = s.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

// ============================================================================
// COMBOBOX REUTILIZABLE
// ============================================================================

function Combobox({ label, placeholder, value, onClear, children, open, onOpen, onClose }: {
  label?: string; placeholder: string; value: React.ReactNode | null
  onClear: () => void; children: React.ReactNode
  open: boolean; onOpen: () => void; onClose: () => void
}) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })
  const calcularPosicion = useCallback(() => {
    if (triggerRef.current) { const rect = triggerRef.current.getBoundingClientRect(); setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 300) }) }
  }, [])
  useEffect(() => { if (open) { calcularPosicion(); window.addEventListener("resize", calcularPosicion); return () => window.removeEventListener("resize", calcularPosicion) } }, [open, calcularPosicion])
  return (
    <div>
      {label && <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{label}</Label>}
      <div ref={triggerRef} onClick={onOpen} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 transition">
        {value ?? <span className="text-slate-400 italic">{placeholder}</span>}
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {value && <button onClick={e => { e.stopPropagation(); onClear() }} className="text-slate-400 hover:text-slate-600 p-0.5 rounded"><X className="w-3 h-3" /></button>}
          <ChevronDown className="h-4 w-4 opacity-40" />
        </div>
      </div>
      {open && (<><div className="fixed inset-0 z-[80]" onClick={onClose} /><div className="fixed z-[90] rounded-lg border border-slate-200 bg-white shadow-2xl" style={{ top: pos.top, left: pos.left, width: pos.width }}>{children}</div></>)}
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function NuevaTareaModal({
  usuarios, casos, clientes = [],
  currentUserId, currentUserRol = "ABOGADO",
  casoPreseleccionado, onSuccess,
}: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [tipo, setTipo] = useState<TipoTarea>("INTERNA")
  const [categoria, setCategoria] = useState<CategoriaTarea | "">("")
  const [prioridad, setPrioridad] = useState<PrioridadTarea>("MEDIA")
  const [fechaVencimiento, setFechaVencimiento] = useState("")
  const [modalidadLugar, setModalidadLugar] = useState("ESTUDIO")
  const [detalleLugar, setDetalleLugar] = useState("")
  const [visibleCliente, setVisibleCliente] = useState(false)
  const [casoId, setCasoId] = useState(casoPreseleccionado ?? "")
  const [clienteId, setClienteId] = useState("")
  const [responsableId, setResponsableId] = useState(currentUserId)
  const [openCaso, setOpenCaso] = useState(false)
  const [searchCaso, setSearchCaso] = useState("")
  const [openCliente, setOpenCliente] = useState(false)
  const [searchCliente, setSearchCliente] = useState("")

  const [cargaResponsable, setCargaResponsable] = useState<Record<string, number>>({})
  const [cargaLoading, setCargaLoading] = useState(false)
  const { feriadosSet } = useFeriados([2026, 2027])

  const categoriasDisponibles = tipo === "PROCESAL" ? CATEGORIAS_PROCESAL : CATEGORIAS_INTERNA
  const handleTipoChange = (nuevoTipo: TipoTarea) => { setTipo(nuevoTipo); setCategoria("") }

  const casoObj = casos.find(c => c.id === casoId)
  const responsableObj = usuarios.find(u => u.id === responsableId)
  const creadorEsResponsable = responsableId === currentUserId
  const haySupervisor = !creadorEsResponsable

  // ════ CLIENTE HEREDADO DEL CASO ════
  // Si hay caso activo seleccionado, el clienteId se deriva del caso.
  // El campo de cliente vinculado no es seleccionable, pero el checkbox de
  // "visible en portal" sí debe aparecer (porque el cliente existe).
  const heredarClienteDelCaso = !!casoObj && !casoObj.estaCerrado

  useEffect(() => {
    if (heredarClienteDelCaso && casoObj) {
      if (clienteId !== casoObj.clienteId) {
        setClienteId(casoObj.clienteId)
        setVisibleCliente(false)  // reset por las dudas
      }
    }
  }, [heredarClienteDelCaso, casoObj, clienteId])

  // ════ FILTRO DE CASOS (frontend) ════
  // Si soy ASISTENTE y el responsable elegido es un ABOGADO específico,
  // muestro solo los casos de ese abogado. Si el responsable es ASISTENTE
  // (acceso general) o soy yo mismo, muestro todos los casos del estudio.
  const casosParaDropdown = useMemo(() => {
    if (currentUserRol !== "ASISTENTE") return casos
    const responsable = usuarios.find(u => u.id === responsableId)
    if (!responsable || responsable.rol !== "ABOGADO") return casos
    return casos.filter(c => c.abogadoId === responsable.id)
  }, [casos, responsableId, usuarios, currentUserRol])

  // ════ FILTRO DE CLIENTES (frontend) ════
  // Regla:
  //   - Si soy ABOGADO: el backend ya filtra a mis propios clientes, no toco
  //   - Si soy ASISTENTE: aplico filtro según el responsable elegido
  //     - Si responsable es ABOGADO → solo sus clientes
  //     - Si responsable es ASISTENTE (incluido yo) → todos los del estudio
  const clientesParaDropdown = useMemo(() => {
    if (currentUserRol !== "ASISTENTE") return clientes
    const responsable = usuarios.find(u => u.id === responsableId)
    if (!responsable || responsable.rol !== "ABOGADO") return clientes
    return clientes.filter(c => c.abogadoId === responsable.id)
  }, [clientes, responsableId, usuarios, currentUserRol])

  // ════ FILTROS POR TEXTO DE BÚSQUEDA ════
  // Estos se aplican sobre los dropdowns ya filtrados por rol/responsable
  const casosFiltrados = casosParaDropdown.filter(c => c.numero.toLowerCase().includes(searchCaso.toLowerCase()) || c.titulo.toLowerCase().includes(searchCaso.toLowerCase()))

  const clientesFiltrados = clientesParaDropdown.filter(c => {
    const t = searchCliente.toLowerCase()
    return `${c.nombre} ${c.apellido ?? ""}`.toLowerCase().includes(t) || (c.tipoSociedad ?? "").toLowerCase().includes(t)
  })

  // Si soy asistente y cambio de responsable, si el clienteId actual ya no
  // pasa el filtro, lo limpio. Solo aplica cuando NO hay caso (porque con
  // caso el clienteId viene impuesto).
  useEffect(() => {
    if (currentUserRol !== "ASISTENTE") return
    if (heredarClienteDelCaso) return
    if (!clienteId) return
    const sigueValido = clientesParaDropdown.some(c => c.id === clienteId)
    if (!sigueValido) {
      setClienteId("")
      setVisibleCliente(false)
    }
  }, [clientesParaDropdown, clienteId, currentUserRol, heredarClienteDelCaso])

  // Si soy asistente y cambio de responsable, si el casoId actual ya no
  // pertenece al abogado elegido, lo limpio (junto con el cliente que
  // venía heredado del caso).
  useEffect(() => {
    if (currentUserRol !== "ASISTENTE") return
    if (!casoId) return
    const sigueValido = casosParaDropdown.some(c => c.id === casoId)
    if (!sigueValido) {
      setCasoId("")
      setClienteId("")
      setVisibleCliente(false)
    }
  }, [casosParaDropdown, casoId, currentUserRol])

  // Cliente efectivo (puede venir del caso o del combobox)
  // Usamos la lista completa de clientes (no la filtrada) para encontrarlo,
  // así también lo encontramos cuando viene del caso.
  const clienteObj = clientes.find(c => c.id === clienteId) ?? null
  const clienteTienePortal = !!clienteObj?.usuarioPortalId

  // Usuarios filtrados para responsable según caso (igual que antes)
  const usuariosFiltrados = useMemo(() => {
    if (!casoObj || casoObj.estaCerrado) return usuarios
    return usuarios.filter(u => u.id === casoObj.abogadoId || u.rol === "ASISTENTE")
  }, [casoObj, usuarios])

  const listaRestringidaPorCaso = !!casoObj && !casoObj.estaCerrado && usuariosFiltrados.length < usuarios.length

  useEffect(() => {
    if (casoObj?.estaCerrado) {
      setTipo("INTERNA")
    }
  }, [casoObj])

  useEffect(() => {
    if (!casoObj || casoObj.estaCerrado) return
    const responsableValido = usuariosFiltrados.some(u => u.id === responsableId)
    if (responsableValido) return

    const currentValido = usuariosFiltrados.find(u => u.id === currentUserId)
    if (currentValido) {
      setResponsableId(currentUserId)
    } else {
      setResponsableId(usuariosFiltrados[0]?.id ?? currentUserId)
    }
  }, [casoObj, usuariosFiltrados, responsableId, currentUserId])

  useEffect(() => {
    if (!open) return
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
  }, [responsableId, open])

  function getNombreCliente(c: Cliente) {
    return c.tipoPersona === "JURIDICA" && c.tipoSociedad ? `${c.tipoSociedad} — ${c.nombre}` : `${c.nombre}${c.apellido ? ` ${c.apellido}` : ""}`
  }

  const reset = () => {
    setTitulo(""); setDescripcion(""); setTipo("INTERNA"); setCategoria(""); setPrioridad("MEDIA")
    setFechaVencimiento(""); setModalidadLugar("ESTUDIO"); setDetalleLugar("")
    setVisibleCliente(false); setCasoId(casoPreseleccionado ?? ""); setClienteId(""); setResponsableId(currentUserId)
    setError(null); setSearchCaso(""); setSearchCliente("")
    setCargaResponsable({})
  }

  const handleSubmit = () => {
    if (!titulo.trim()) { setError("El título es obligatorio"); return }
    if (!categoria) { setError("Debe seleccionar una categoría"); return }
    if (!fechaVencimiento) { setError("La fecha de vencimiento es obligatoria"); return }
    if (!responsableId) { setError("Debe asignar un responsable"); return }
    const supervisorId = responsableId !== currentUserId ? currentUserId : undefined
    startTransition(async () => {
      const lugarFinal = modalidadLugar === "ESTUDIO" ? "Estudio Jurídico" : `[${modalidadLugar}] ${detalleLugar}`.trim()
      const result = await crearTareaAction({
        titulo, descripcion: descripcion || undefined, tipo, categoria: categoria as CategoriaTarea,
        ambito: modalidadLugar === "ESTUDIO" ? "INTERNO" : "EXTERNO", prioridad,
        fechaVencimiento: fechaVencimiento || undefined, fechaInicio: new Date().toISOString().split("T")[0],
        lugarFisico: lugarFinal || undefined, visibleCliente, casoId: casoId || undefined,
        clienteId: clienteId || undefined, responsableId, supervisorId,
      })
      if (result?.error) { setError(result.error) } else { setOpen(false); reset(); router.refresh(); onSuccess?.() }
    })
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)} className="gap-2 bg-slate-800 hover:bg-slate-700"><Plus className="w-4 h-4" /> Nuevo Evento</Button>
  }

  const descripcionRestante = MAX_DESCRIPCION - descripcion.length
  const ayudaCategoria = tipo === "PROCESAL"
    ? "Categorías vinculadas al proceso judicial"
    : "Categorías de gestión interna del estudio"

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Nuevo Evento</h2>
          <button onClick={() => { setOpen(false); reset() }} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">

          {/* BLOQUE 1: Detalles */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2"><Briefcase className="w-4 h-4" /> 1. Detalles del evento</h3>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-2 block">Tipo de evento</Label>
              <div className="grid grid-cols-2 gap-3">
                {TIPOS.map(t => (
                  <button key={t.value} onClick={() => handleTipoChange(t.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${tipo === t.value ? t.value === "PROCESAL" ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                    <p className={`text-sm font-bold ${tipo === t.value ? (t.value === "PROCESAL" ? "text-red-700" : "text-blue-700") : "text-slate-700"}`}>{t.value === "PROCESAL" ? "⚖️" : "🏢"} {t.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Título *</Label>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Redactar contestación de demanda" className="text-base font-medium h-12" autoFocus />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Categoría *</Label>
                <Select value={categoria} onValueChange={v => setCategoria(v as CategoriaTarea)}>
                  <SelectTrigger className={!categoria ? "text-slate-400 italic" : ""}><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger>
                  <SelectContent>{categoriasDisponibles.map(c => (<SelectItem key={c.value} value={c.value}><div><p className="font-medium">{c.label}</p><p className="text-xs text-slate-400">{c.desc}</p></div></SelectItem>))}</SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400 mt-1.5">{ayudaCategoria}</p>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nivel de Prioridad</Label>
                <Select value={prioridad} onValueChange={v => setPrioridad(v as PrioridadTarea)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORIDADES.map(p => (<SelectItem key={p.value} value={p.value}><span className={p.color}>{p.label}</span></SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold text-slate-600">Descripción / Instrucciones</Label>
                <span className={`text-[10px] font-medium ${descripcionRestante < 50 ? (descripcionRestante < 0 ? "text-red-600" : "text-amber-600") : "text-slate-400"}`}>{descripcion.length}/{MAX_DESCRIPCION}</span>
              </div>
              <textarea value={descripcion} onChange={e => { if (e.target.value.length <= MAX_DESCRIPCION) setDescripcion(e.target.value) }} maxLength={MAX_DESCRIPCION} placeholder="Detallá acá todo lo que el responsable necesita saber para cumplir el evento..." className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50/50" />
            </div>
          </div>

          {/* BLOQUE 2: Vinculaciones y Asignación */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2"><LinkIcon className="w-4 h-4" /> 2. Vinculaciones y Asignación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!casoPreseleccionado && (
                <Combobox label="Expediente asociado" placeholder="Sin expediente vinculado"
                  value={casoObj ? <span className="truncate"><span className="font-mono text-xs text-blue-600 font-bold mr-2">{casoObj.numero}</span>{casoObj.titulo.slice(0, 30)}{casoObj.titulo.length > 30 ? "..." : ""}</span> : null}
                  onClear={() => { setCasoId(""); setClienteId(""); setVisibleCliente(false) }}
                  open={openCaso} onOpen={() => setOpenCaso(true)} onClose={() => { setOpenCaso(false); setSearchCaso("") }}>
                  <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-lg"><Search className="w-4 h-4 text-slate-400 shrink-0" /><input autoFocus type="text" className="w-full bg-transparent text-sm focus:outline-none" placeholder="Buscar por número o carátula..." value={searchCaso} onChange={e => setSearchCaso(e.target.value)} /></div>
                  <div className="max-h-[280px] overflow-y-auto p-1">
                    <div onClick={() => { setCasoId(""); setClienteId(""); setVisibleCliente(false); setOpenCaso(false); setSearchCaso("") }} className="flex w-full cursor-pointer items-center rounded-md py-2.5 px-3 text-sm hover:bg-slate-100 transition-colors"><span className="text-slate-400 italic">Sin expediente (tarea interna)</span></div>
                    {casosFiltrados.map(c => {
                        const cerrado = c.estaCerrado
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              if (cerrado) return
                              setCasoId(c.id)
                              setOpenCaso(false)
                              setSearchCaso("")
                            }}
                            className={`flex w-full items-center rounded-md py-2.5 px-3 text-sm transition-colors
                              ${cerrado
                                ? "opacity-50 cursor-not-allowed bg-slate-50"
                                : "cursor-pointer hover:bg-slate-100"}
                              ${casoId === c.id ? "bg-blue-50 border border-blue-200" : ""}
                            `}
                          >
                            <span className="font-mono text-xs text-blue-600 font-bold mr-2 shrink-0">
                              {c.numero}
                            </span>
                            <span className="truncate">{c.titulo}</span>
                            {cerrado && (
                              <span className="ml-auto text-[10px] text-red-500 font-semibold">
                                Cerrado
                              </span>
                            )}
                          </div>
                        )
                      })}
                    {casosFiltrados.length === 0 && (
                      <div className="py-6 text-center text-sm text-slate-400">
                        {currentUserRol === "ASISTENTE" && responsableObj?.rol === "ABOGADO"
                          ? `${responsableObj.nombre} ${responsableObj.apellido} no tiene expedientes asignados`
                          : "Sin resultados"}
                      </div>
                    )}
                  </div>
                </Combobox>
              )}
              {casoObj?.estaCerrado && (
                  <div className="p-3 rounded-lg border bg-amber-50 border-amber-200 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Este expediente está cerrado
                      </p>
                      <p className="text-xs text-amber-700">
                        El evento se creará como interna y no se vinculará al expediente.
                      </p>
                    </div>
                  </div>
                )}

              {/* ════ CLIENTE ════
                  Si hay caso activo: cliente automático del caso (no editable)
                  Si no hay caso: combobox normal */}
              {heredarClienteDelCaso ? (
                <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-blue-900">Cliente del expediente</p>
                      <p className="text-sm font-medium text-blue-800 truncate">
                        {clienteObj ? getNombreCliente(clienteObj) : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Combobox label="Cliente vinculado" placeholder="Sin cliente vinculado"
                  value={clienteObj ? <span className="truncate font-medium text-slate-800">{getNombreCliente(clienteObj)}</span> : null}
                  onClear={() => { setClienteId(""); setVisibleCliente(false) }} open={openCliente} onOpen={() => setOpenCliente(true)} onClose={() => { setOpenCliente(false); setSearchCliente("") }}>
                  <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-lg"><Search className="w-4 h-4 text-slate-400 shrink-0" /><input autoFocus type="text" className="w-full bg-transparent text-sm focus:outline-none" placeholder="Buscar por nombre o empresa..." value={searchCliente} onChange={e => setSearchCliente(e.target.value)} /></div>
                  <div className="max-h-[280px] overflow-y-auto p-1">
                    <div onClick={() => { setClienteId(""); setVisibleCliente(false); setOpenCliente(false); setSearchCliente("") }} className="flex w-full cursor-pointer items-center rounded-md py-2.5 px-3 text-sm hover:bg-slate-100 transition-colors"><span className="text-slate-400 italic">Sin cliente vinculado</span></div>
                    {clientesFiltrados.map(c => (<div key={c.id} onClick={() => { setClienteId(c.id); setOpenCliente(false); setSearchCliente("") }} className={`flex w-full cursor-pointer items-center justify-between rounded-md py-2.5 px-3 text-sm hover:bg-slate-100 transition-colors ${clienteId === c.id ? "bg-blue-50 border border-blue-200" : ""}`}><span className="font-medium text-slate-700">{getNombreCliente(c)}</span>{c.usuarioPortalId ? <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200 flex items-center gap-0.5 shrink-0"><Eye className="w-2.5 h-2.5" /> Portal</span> : <span className="text-[10px] text-slate-400 shrink-0">Sin portal</span>}</div>))}
                    {clientesFiltrados.length === 0 && (
                      <div className="py-6 text-center text-sm text-slate-400">
                        {currentUserRol === "ASISTENTE" && responsableObj?.rol === "ABOGADO"
                          ? `Sin clientes del responsable (${responsableObj.nombre} ${responsableObj.apellido})`
                          : "Sin resultados"}
                      </div>
                    )}
                  </div>
                </Combobox>
              )}

              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block flex items-center gap-1"><User className="w-3 h-3" /> Asignar a (Responsable) *</Label>
                <Select value={responsableId} onValueChange={setResponsableId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {usuariosFiltrados.map(u => {
                      const rolLegible = ROL_LABEL[u.rol] ?? u.rol
                      const esYo = u.id === currentUserId
                      return (
                        <SelectItem key={u.id} value={u.id}>
                          <span className="text-slate-700">{u.nombre} {u.apellido}</span>
                          {esYo && <span className="text-xs text-slate-400 ml-1">(Yo)</span>}
                          <span className="text-xs text-slate-400 ml-1">· {rolLegible}</span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {listaRestringidaPorCaso && (
                  <p className="text-xs text-amber-700 mt-1.5 flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>
                      Lista limitada al titular del expediente y asistentes (los demás abogados no tienen acceso a este caso).
                    </span>
                  </p>
                )}
                {haySupervisor && (
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-slate-400" />
                    Vas a supervisar este evento porque se lo estás asignando a{" "}
                    <span className="font-medium text-slate-700">
                      {responsableObj?.nombre} {responsableObj?.apellido}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* ════ VISIBLE EN PORTAL ════
                Se muestra siempre que haya clienteId, sea del caso o seleccionado manualmente.
                Si el cliente tiene portal: checkbox para marcar visible.
                Si no tiene portal: disclaimer indicando que no se podrá enviar al portal. */}
            {clienteId && clienteObj && (
              <div className={`p-3 rounded-lg border mt-2 ${clienteTienePortal ? "bg-blue-50/50 border-blue-100" : "bg-amber-50 border-amber-200"}`}>
                {clienteTienePortal ? (
                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="visibleCliente" checked={visibleCliente} onChange={e => setVisibleCliente(e.target.checked)} className="w-4 h-4 rounded text-blue-600 mt-0.5" />
                    <div>
                      <label htmlFor="visibleCliente" className="text-sm font-bold text-blue-900 cursor-pointer block">
                        Mostrar este evento en el Portal del Cliente
                      </label>
                      <p className="text-xs text-blue-700/70">
                        {getNombreCliente(clienteObj)} podrá ver el evento desde su portal.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        {getNombreCliente(clienteObj)} no tiene acceso al portal
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        El evento se creará igualmente, pero el cliente no podrá verlo. Para habilitarle el portal, hacelo desde el perfil del cliente.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BLOQUE 3: ¿Cuándo y Dónde? */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2"><Calendar className="w-4 h-4" /> 3. ¿Cuándo y Dónde?</h3>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                Vencimiento / Plazo <span className="text-red-500">*</span>
                {responsableObj && (
                  <span className="ml-2 text-[10px] text-slate-400 font-normal italic">
                    Mostrando carga de {responsableObj.nombre} {responsableObj.apellido}
                  </span>
                )}
              </Label>
              <CalendarioCarga
                  selected={isoToDate(fechaVencimiento)}
                  onSelect={(d) => {
                    if (!d) { setFechaVencimiento(""); return }
                    const normalizada = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)
                    setFechaVencimiento(dateToISO(normalizada))
                  }}
                  carga={cargaResponsable}
                  loading={cargaLoading}
                  feriadosSet={feriadosSet}
                />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block flex items-center gap-1"><MapPin className="w-3 h-3" /> Lugar o Modalidad</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={modalidadLugar} onValueChange={setModalidadLugar}>
                  <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{MODALIDADES_LUGAR.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
                {modalidadLugar !== "ESTUDIO" && <Input value={detalleLugar} onChange={e => setDetalleLugar(e.target.value)} placeholder={modalidadLugar === "VIRTUAL" ? "Pegá el link acá..." : "Ej: Juzgado N° 3, Piso 2"} className="flex-1" />}
              </div>
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm font-medium text-red-700">{error}</p></div>}
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50 shrink-0 rounded-b-2xl">
          <Button variant="ghost" onClick={() => { setOpen(false); reset() }} className="text-slate-500">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="gap-2 bg-blue-600 hover:bg-blue-700">{isPending ? "Guardando..." : "Crear Evento"}</Button>
        </div>
      </div>
    </div>
  )
}