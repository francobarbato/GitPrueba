'use client'

// app/reportes/auditoria/components/FiltrosAuditoria.tsx

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useState, useRef, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Filter, X, ChevronLeft, ChevronRight, CalendarIcon, Search } from "lucide-react"
import { format, addDays, subDays, isToday, isYesterday } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

const ACCIONES = [
  { value: "todos", label: "Todos los tipos" },
  { value: "criticos", label: "⚠ Solo críticos" },
  { value: "ESTADO_CHANGE", label: "Cambios de etapa" },
  { value: "MONTO_CHANGE", label: "Modificaciones de monto" },
  { value: "JUZGADO_CHANGE", label: "Modificaciones de juzgado" },
  { value: "UBICACION_CHANGE", label: "Modificaciones de ubicación" },
  { value: "CIERRE", label: "Cierres de caso" },
  { value: "REAPERTURA", label: "Reaperturas" },
  { value: "PRIORIDAD_CHANGE", label: "Cambios de prioridad" },
  { value: "CREATE", label: "Creaciones" },
  { value: "UPDATE", label: "Ediciones generales" },
]

type Caso = { id: string; numero: string; titulo: string }

type Props = {
  casos: Caso[]
  fechasActivas: string[]
  modoBusqueda: "fecha" | "caso"
}

// ============================================================================
// BUSCADOR DE CASOS
// ============================================================================

function BuscadorExpedientes({
  casos, casoActual, onSelect,
}: {
  casos: Caso[]
  casoActual: string
  onSelect: (id: string | null) => void
}) {
  const [query, setQuery] = useState("")
  const [abierto, setAbierto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const casoSeleccionado = casos.find(c => c.id === casoActual)

  const filtrados = query.trim().length > 0
    ? casos.filter(c =>
        c.numero.toLowerCase().includes(query.toLowerCase()) ||
        c.titulo.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const seleccionar = (caso: Caso) => {
    onSelect(caso.id)
    setQuery("")
    setAbierto(false)
  }

  const limpiar = () => {
    onSelect(null)
    setQuery("")
    setAbierto(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {casoSeleccionado ? (
        <div className="flex items-center gap-2 h-8 px-3 border border-blue-300 rounded-md bg-blue-50 text-sm">
          <span className="font-mono text-xs text-blue-700 font-medium">#{casoSeleccionado.numero}</span>
          <span className="text-slate-500 truncate max-w-[160px]">
            {casoSeleccionado.titulo.length > 25 ? casoSeleccionado.titulo.slice(0, 25) + "..." : casoSeleccionado.titulo}
          </span>
          <button onClick={limpiar} className="ml-auto text-slate-400 hover:text-slate-600 shrink-0">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setAbierto(true) }}
            onFocus={() => setAbierto(true)}
            placeholder="Buscar caso..."
            className="pl-8 h-8 text-sm w-[220px]"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setAbierto(false) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {abierto && filtrados.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-[320px] bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {filtrados.map(caso => (
            <button
              key={caso.id}
              onClick={() => seleccionar(caso)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
            >
              <span className="font-mono text-xs font-bold text-slate-700">#{caso.numero}</span>
              <span className="text-xs text-slate-500 ml-2 block truncate">{caso.titulo}</span>
            </button>
          ))}
        </div>
      )}

      {abierto && query.trim().length > 0 && filtrados.length === 0 && (
        <div className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-slate-200 rounded-lg shadow-lg z-50 px-3 py-2">
          <p className="text-xs text-slate-400">Sin resultados para "{query}"</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function FiltrosAuditoria({ casos, fechasActivas, modoBusqueda }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const accionActual = searchParams.get("accion") || "todos"
  const casoActual = searchParams.get("caso") || "todos"
  const hoyStr = format(new Date(), "yyyy-MM-dd")
  const modoActual = searchParams.get("modo") || "single"
  const fechaActual = searchParams.get("fecha") || hoyStr
  const desdeActual = searchParams.get("desde") || null
  const hastaActual = searchParams.get("hasta") || null

  const esRango = modoActual === "range"
  const esHoy = !esRango && fechaActual === hoyStr
  const hayFiltrosExtra = accionActual !== "todos"

  const fechaSeleccionada = esRango ? undefined : new Date(fechaActual + "T12:00:00")
  const rangoSeleccionado: DateRange | undefined = esRango && desdeActual ? {
    from: new Date(desdeActual + "T12:00:00"),
    to: hastaActual ? new Date(hastaActual + "T12:00:00") : undefined,
  } : undefined

  const datesConActividad = fechasActivas.map(d => new Date(d + "T12:00:00"))

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key)
      else params.set(key, value)
    })
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  const irADia = (fecha: Date) => updateParams({ fecha: format(fecha, "yyyy-MM-dd"), modo: null, desde: null, hasta: null })
  const diaAnterior = () => irADia(subDays(new Date(fechaActual + "T12:00:00"), 1))
  const diaSiguiente = () => irADia(addDays(new Date(fechaActual + "T12:00:00"), 1))

  const getLabelFecha = () => {
    if (esRango) {
      if (!desdeActual) return "Seleccionar rango"
      const desde = new Date(desdeActual + "T12:00:00")
      const hasta = hastaActual ? new Date(hastaActual + "T12:00:00") : null
      if (!hasta) return `Desde ${format(desde, "d MMM", { locale: es })}`
      return `${format(desde, "d MMM", { locale: es })} — ${format(hasta, "d MMM yyyy", { locale: es })}`
    }
    const fecha = new Date(fechaActual + "T12:00:00")
    if (isToday(fecha)) return "Hoy"
    if (isYesterday(fecha)) return "Ayer"
    return format(fecha, "d 'de' MMMM yyyy", { locale: es })
  }

  const handleSelectSingle = (date: Date | undefined) => {
    if (!date) return
    updateParams({ fecha: format(date, "yyyy-MM-dd"), modo: null, desde: null, hasta: null })
    setCalendarOpen(false)
  }

  const handleSelectRange = (range: DateRange | undefined) => {
    if (!range) return
    updateParams({
      modo: "range", fecha: null,
      desde: range.from ? format(range.from, "yyyy-MM-dd") : null,
      hasta: range.to ? format(range.to, "yyyy-MM-dd") : null,
    })
    if (range.from && range.to) setCalendarOpen(false)
  }

  // Modo caso: el calendario es un filtro opcional de rango
  const esModoFecha = modoBusqueda === "fecha"
  const tieneFiltroDeFechaEnModoCaso = modoBusqueda === "caso" && esRango && desdeActual

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">

      {/* Fila 1: Calendario — obligatorio en modo fecha, opcional en modo caso */}
      {esModoFecha ? (
        /* MODO FECHA: navegación completa con flechas */
        <div className="flex items-center gap-2">
          {!esRango && (
            <Button variant="outline" size="sm" onClick={diaAnterior} className="h-9 w-9 p-0 shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-start gap-2 text-sm font-medium text-slate-700 h-9">
                <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="capitalize">{getLabelFecha()}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b border-slate-100 flex gap-2">
                <Button size="sm" variant={!esRango ? "default" : "outline"} className="text-xs h-7"
                  onClick={() => updateParams({ modo: null, desde: null, hasta: null, fecha: hoyStr })}>
                  Día exacto
                </Button>
                <Button size="sm" variant={esRango ? "default" : "outline"} className="text-xs h-7"
                  onClick={() => updateParams({ modo: "range", fecha: null })}>
                  Rango de fechas
                </Button>
              </div>
              <div className="px-4 pt-3 pb-1 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50/50">
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span>Los días resaltados indican actividad registrada.</span>
              </div>
              {!esRango ? (
                <Calendar mode="single" selected={fechaSeleccionada} onSelect={handleSelectSingle}
                  disabled={{ after: new Date() }} initialFocus
                  modifiers={{ activa: datesConActividad }}
                  modifiersClassNames={{ activa: "font-bold text-blue-600 bg-blue-50/50 underline decoration-blue-400 decoration-2 underline-offset-4" }}
                />
              ) : (
                <Calendar mode="range" selected={rangoSeleccionado} onSelect={handleSelectRange}
                  disabled={{ after: new Date() }} numberOfMonths={2} initialFocus
                  modifiers={{ activa: datesConActividad }}
                  modifiersClassNames={{ activa: "font-bold text-blue-600 bg-blue-50/50 underline decoration-blue-400 decoration-2 underline-offset-4" }}
                />
              )}
              <div className="p-3 border-t border-slate-100 flex gap-2 flex-wrap">
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { irADia(new Date()); setCalendarOpen(false) }}>Hoy</Button>
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { irADia(subDays(new Date(), 1)); setCalendarOpen(false) }}>Ayer</Button>
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => {
                  const hoy = new Date()
                  updateParams({ modo: "range", fecha: null, desde: format(subDays(hoy, 6), "yyyy-MM-dd"), hasta: format(hoy, "yyyy-MM-dd") })
                  setCalendarOpen(false)
                }}>Últimos 7 días</Button>
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => {
                  const hoy = new Date()
                  updateParams({ modo: "range", fecha: null, desde: format(subDays(hoy, 29), "yyyy-MM-dd"), hasta: format(hoy, "yyyy-MM-dd") })
                  setCalendarOpen(false)
                }}>Últimos 30 días</Button>
              </div>
            </PopoverContent>
          </Popover>

          {!esRango && (
            <Button variant="outline" size="sm" onClick={diaSiguiente} disabled={esHoy} className="h-9 w-9 p-0 shrink-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
          {!esHoy && !esRango && (
            <Button variant="ghost" size="sm" onClick={() => irADia(new Date())} className="text-xs text-blue-600 hover:text-blue-700 h-9 shrink-0">
              Ir a hoy
            </Button>
          )}
        </div>
      ) : (
        /* MODO CASO: rango opcional para acotar */
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Acotar por fechas (opcional):</span>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={tieneFiltroDeFechaEnModoCaso ? "default" : "outline"}
                size="sm"
                className={`gap-2 text-sm h-8 ${tieneFiltroDeFechaEnModoCaso ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
              >
                <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="capitalize">
                  {tieneFiltroDeFechaEnModoCaso ? getLabelFecha() : "Seleccionar rango"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="px-4 pt-3 pb-1 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50/50">
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span>Seleccioná un rango para filtrar la actividad del caso.</span>
              </div>
              <Calendar mode="range" selected={rangoSeleccionado} onSelect={handleSelectRange}
                disabled={{ after: new Date() }} numberOfMonths={2} initialFocus
                modifiers={{ activa: datesConActividad }}
                modifiersClassNames={{ activa: "font-bold text-blue-600 bg-blue-50/50 underline decoration-blue-400 decoration-2 underline-offset-4" }}
              />
              <div className="p-3 border-t border-slate-100 flex gap-2 flex-wrap">
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => {
                  const hoy = new Date()
                  updateParams({ modo: "range", fecha: null, desde: format(subDays(hoy, 6), "yyyy-MM-dd"), hasta: format(hoy, "yyyy-MM-dd") })
                  setCalendarOpen(false)
                }}>Últimos 7 días</Button>
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => {
                  const hoy = new Date()
                  updateParams({ modo: "range", fecha: null, desde: format(subDays(hoy, 29), "yyyy-MM-dd"), hasta: format(hoy, "yyyy-MM-dd") })
                  setCalendarOpen(false)
                }}>Últimos 30 días</Button>
                {tieneFiltroDeFechaEnModoCaso && (
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-red-500 hover:text-red-600" onClick={() => {
                    updateParams({ modo: null, desde: null, hasta: null, fecha: null })
                    setCalendarOpen(false)
                  }}>Quitar filtro</Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Fila 2: Buscador de casos + filtro de acción */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />

        <BuscadorExpedientes
          casos={casos}
          casoActual={casoActual}
          onSelect={(id) => updateParams({ caso: id, vista: null, casoId: null, accionDetalle: null })}
        />

        {esModoFecha && (
          <Select value={accionActual} onValueChange={(v) => updateParams({ accion: v === "todos" ? null : v })}>
            <SelectTrigger className="text-sm h-8 min-w-[180px] w-auto">
              <SelectValue placeholder="Tipo de acción" />
            </SelectTrigger>
            <SelectContent>
              {ACCIONES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {(hayFiltrosExtra || casoActual !== "todos") && (
          <Button variant="ghost" size="sm"
            onClick={() => updateParams({ accion: null, caso: null, vista: null, casoId: null, modo: null, desde: null, hasta: null })}
            className="text-xs text-slate-500 gap-1 h-8">
            <X className="w-3 h-3" /> Limpiar todo
          </Button>
        )}
      </div>
    </div>
  )
}