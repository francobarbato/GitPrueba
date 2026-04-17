// REPORTE: Auditoría Personal del Abogado
// ACCESO: Solo ABOGADO — ve únicamente sus propios casos

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { ShieldCheck, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { isToday, isYesterday } from "date-fns"
import { TimelineAuditoriaReporte } from "./components/TimelineAuditoriaReporte"
import { FiltrosAuditoria } from "./components/FiltrosAuditoria"
import { DetalleCasoAuditoria } from "./components/DetalleCasoAuditoria"
import { redirect, notFound } from "next/navigation"

// ============================================================================
// TIPOS
// ============================================================================
const ITEMS_PER_PAGE = 10

export type EventoAuditoria = {
  id: string
  accion: string
  texto: string
  detalle: string | null
  estadoAnterior: string | null
  estadoNuevo: string | null
  createdAt: string
  usuario: { nombre: string; apellido: string; rol: string }
  caso: { id: string; numero: string; titulo: string } | null
}

export type EventosPorDia = {
  fecha: string
  fechaLabel: string
  eventos: EventoAuditoria[]
}

const ACCIONES_RELEVANTES = [
  "CREATE", "ESTADO_CHANGE", "PRIORIDAD_CHANGE",
  "JUZGADO_CHANGE", "UBICACION_CHANGE", "MONTO_CHANGE",
  "CIERRE", "REAPERTURA", "UPDATE",
]
const ACCIONES_CRITICAS = ["MONTO_CHANGE", "JUZGADO_CHANGE", "UBICACION_CHANGE", "CIERRE", "REAPERTURA"]

// ============================================================================
// FUNCIONES DE DATOS
// ============================================================================

function mapearEvento(e: any): EventoAuditoria {
  return {
    id: e.id,
    accion: e.accion || "UPDATE",
    texto: e.texto,
    detalle: e.detalle,
    estadoAnterior: e.estadoAnterior,
    estadoNuevo: e.estadoNuevo,
    createdAt: e.createdAt.toISOString(),
    usuario: {
      nombre: e.usuario.nombre || "",
      apellido: e.usuario.apellido || "",
      rol: e.usuario.rol || "",
    },
    caso: e.caso ? { id: e.caso.id, numero: e.caso.numero, titulo: e.caso.titulo } : null
  }
}

async function getEventosAuditoria(
  userId: string, filtroAccion: string, filtroCasoId: string,
  fechaDesde: string, fechaHasta: string, filtroRol: string | null, page: number
): Promise<{ eventos: EventoAuditoria[], totalCount: number, casosAfectadosTotal: number }> {

  const casosDelAbogado = await prisma.caso.findMany({ where: { abogadoId: userId }, select: { id: true } })
  const casoIds = casosDelAbogado.map((c: any) => c.id)
  if (casoIds.length === 0) return { eventos: [], totalCount: 0, casosAfectadosTotal: 0 }

  const desde = new Date(fechaDesde + "T00:00:00")
  const hasta = new Date(fechaHasta + "T23:59:59")

  const accionWhere =
    filtroAccion === "criticos" ? { in: ACCIONES_CRITICAS } :
    filtroAccion !== "todos"    ? filtroAccion :
                                  { in: ACCIONES_RELEVANTES }

  const where: any = {
    casoId: filtroCasoId && filtroCasoId !== "todos" ? filtroCasoId : { in: casoIds },
    accion: accionWhere,
    createdAt: { gte: desde, lte: hasta }
  }
  if (filtroRol) where.usuario = { rol: filtroRol }

  const skip = (page - 1) * ITEMS_PER_PAGE
  const include = { usuario: { select: { nombre: true, apellido: true, rol: true } }, caso: { select: { id: true, numero: true, titulo: true } } }

  const [totalCount, eventosDb, todosLosEventos] = await prisma.$transaction([
    prisma.bitacora.count({ where }),
    prisma.bitacora.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: ITEMS_PER_PAGE, include }),
    prisma.bitacora.findMany({ where, select: { casoId: true } })
  ])

  const casosAfectadosTotal = new Set(todosLosEventos.map((e: any) => e.casoId).filter(Boolean)).size
  return { eventos: eventosDb.map(mapearEvento), totalCount, casosAfectadosTotal }
}

async function getEventosCasoAgrupados(
  userId: string, casoId: string,
  fechaDesde: string | null, fechaHasta: string | null
): Promise<EventosPorDia[]> {
  const casosDelAbogado = await prisma.caso.findMany({ where: { abogadoId: userId }, select: { id: true } })
  const casoIds = casosDelAbogado.map((c: any) => c.id)
  if (!casoIds.includes(casoId)) return []

  const where: any = { casoId, accion: { in: ACCIONES_RELEVANTES } }
  if (fechaDesde && fechaHasta) {
    where.createdAt = { gte: new Date(fechaDesde + "T00:00:00"), lte: new Date(fechaHasta + "T23:59:59") }
  }

  const eventosDb = await prisma.bitacora.findMany({
    where, orderBy: { createdAt: "desc" },
    include: { usuario: { select: { nombre: true, apellido: true, rol: true } }, caso: { select: { id: true, numero: true, titulo: true } } }
  })

  const mapeados = eventosDb.map(mapearEvento)
  const mapaFechas = new Map<string, EventoAuditoria[]>()
  mapeados.forEach(e => {
    const key = format(new Date(e.createdAt), "yyyy-MM-dd")
    if (!mapaFechas.has(key)) mapaFechas.set(key, [])
    mapaFechas.get(key)!.push(e)
  })

  return Array.from(mapaFechas.entries()).map(([fecha, eventos]) => {
    const fechaObj = new Date(fecha + "T12:00:00")
    let fechaLabel: string
    if (isToday(fechaObj)) fechaLabel = "Hoy"
    else if (isYesterday(fechaObj)) fechaLabel = "Ayer"
    else fechaLabel = format(fechaObj, "EEEE d 'de' MMMM yyyy", { locale: es })
    return { fecha, fechaLabel, eventos }
  })
}

async function getEventosPorCaso(
  userId: string, casoId: string, fechaDesde: string, fechaHasta: string
): Promise<EventoAuditoria[]> {
  const casosDelAbogado = await prisma.caso.findMany({ where: { abogadoId: userId }, select: { id: true } })
  const casoIds = casosDelAbogado.map((c: any) => c.id)
  if (!casoIds.includes(casoId)) return []

  const eventosDb = await prisma.bitacora.findMany({
    where: {
      casoId, accion: { in: ACCIONES_RELEVANTES },
      createdAt: { gte: new Date(fechaDesde + "T00:00:00"), lte: new Date(fechaHasta + "T23:59:59") }
    },
    orderBy: { createdAt: "desc" },
    include: { usuario: { select: { nombre: true, apellido: true, rol: true } }, caso: { select: { id: true, numero: true, titulo: true } } }
  })
  return eventosDb.map(mapearEvento)
}

async function getFechasConActividad(
  userId: string, filtroAccion: string, filtroCasoId: string, filtroRol: string | null
): Promise<string[]> {
  const casosDelAbogado = await prisma.caso.findMany({ where: { abogadoId: userId }, select: { id: true } })
  const casoIds = casosDelAbogado.map((c: any) => c.id)
  if (casoIds.length === 0) return []

  const accionWhere =
    filtroAccion === "criticos" ? { in: ACCIONES_CRITICAS } :
    filtroAccion !== "todos"    ? filtroAccion :
                                  { in: ACCIONES_RELEVANTES }

  const where: any = {
    casoId: filtroCasoId && filtroCasoId !== "todos" ? filtroCasoId : { in: casoIds },
    accion: accionWhere,
  }
  if (filtroRol) where.usuario = { rol: filtroRol }

  const bitacoras = await prisma.bitacora.findMany({ where, select: { createdAt: true } })
  const fechasUnicas = new Set(bitacoras.map((b: any) => format(new Date(b.createdAt), "yyyy-MM-dd")))
  return Array.from(fechasUnicas)
}

function getLabelFecha(esRango: boolean, fechaActual: string, desdeActual: string | null, hastaActual: string | null): string {
  if (esRango) {
    if (!desdeActual) return "Período seleccionado"
    const desde = new Date(desdeActual + "T12:00:00")
    const hasta = hastaActual ? new Date(hastaActual + "T12:00:00") : null
    if (!hasta) return `Desde ${format(desde, "d 'de' MMMM", { locale: es })}`
    return `${format(desde, "d 'de' MMMM", { locale: es })} — ${format(hasta, "d 'de' MMMM yyyy", { locale: es })}`
  }
  const fecha = new Date(fechaActual + "T12:00:00")
  if (isToday(fecha)) return "Hoy"
  if (isYesterday(fecha)) return "Ayer"
  return format(fecha, "EEEE d 'de' MMMM yyyy", { locale: es })
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AuditoriaPage({ searchParams }: PageProps) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const userRol = user.rol?.toUpperCase()
  // Defensa en profundidad — bloquear roles no operativos
  if (userRol === 'CLIENTE' || userRol === 'ADMIN') notFound()
  if (userRol !== "ABOGADO") redirect("/reportes")

  const params = await searchParams
  const filtroAccion = typeof params.accion === "string" ? params.accion : "todos"
  const filtroCasoId = typeof params.caso === "string" ? params.caso : "todos"
  const filtroRol = typeof params.rol === "string" ? params.rol : null
  const currentPage = typeof params.page === "string" ? parseInt(params.page) : 1
  const hoyStr = format(new Date(), "yyyy-MM-dd")
  const modo = typeof params.modo === "string" ? params.modo : "single"
  const esRango = modo === "range"

  const fechaDesde = esRango
    ? (typeof params.desde === "string" ? params.desde : hoyStr)
    : (typeof params.fecha === "string" ? params.fecha : hoyStr)
  const fechaHasta = esRango
    ? (typeof params.hasta === "string" ? params.hasta : fechaDesde)
    : fechaDesde

  const modoBusqueda: "fecha" | "caso" = filtroCasoId !== "todos" ? "caso" : "fecha"
  const vista = typeof params.vista === "string" ? params.vista : "lista"
  const casoIdDetalle = typeof params.casoId === "string" ? params.casoId : null

  const casosDelAbogado = await prisma.caso.findMany({
    where: { abogadoId: user.id },
    select: { id: true, numero: true, titulo: true },
    orderBy: { updatedAt: "desc" }
  })

  // Modo fecha: query normal con fecha obligatoria
  const { eventos, totalCount, casosAfectadosTotal } = modoBusqueda === "fecha"
    ? await getEventosAuditoria(user.id, filtroAccion, filtroCasoId, fechaDesde, fechaHasta, filtroRol, currentPage)
    : { eventos: [], totalCount: 0, casosAfectadosTotal: 0 }

  // Modo caso: todos los eventos agrupados por día (fecha como filtro opcional)
  const tieneFiltroDeFecha = esRango && typeof params.desde === "string"
  const eventosCasoAgrupados = modoBusqueda === "caso" && vista !== "detalle"
    ? await getEventosCasoAgrupados(
        user.id, filtroCasoId,
        tieneFiltroDeFecha ? fechaDesde : null,
        tieneFiltroDeFecha ? fechaHasta : null
      )
    : []

  const fechasActivas = await getFechasConActividad(user.id, filtroAccion, filtroCasoId, filtroRol)
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const fechaLabel = getLabelFecha(esRango, fechaDesde, esRango ? fechaDesde : null, esRango ? fechaHasta : null)

  // Vista 2
  let eventosDetalle: EventoAuditoria[] = []
  let casoDetalle: { numero: string; titulo: string } | null = null
  if (vista === "detalle" && casoIdDetalle) {
    eventosDetalle = await getEventosPorCaso(user.id, casoIdDetalle, fechaDesde, fechaHasta)
    const found = casosDelAbogado.find((c: any) => c.id === casoIdDetalle)
    if (found) casoDetalle = { numero: found.numero, titulo: found.titulo }
  }

  const casoBuscado = modoBusqueda === "caso"
    ? (casosDelAbogado.find((c: any) => c.id === filtroCasoId) ?? null)
    : null

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="w-full">

            {vista !== "detalle" && (
              <div className="mb-6">
                <nav className="mb-3 flex items-center gap-1.5 text-sm text-slate-400">
                  <Link href="/reportes" className="hover:text-slate-700 transition-colors">Reportes</Link>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-slate-600 font-medium">Auditoría Personal</span>
                </nav>
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-slate-700" />
                    Auditoría Personal
                  </h1>
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200">
                    Acceso Privado
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">Registro de actividad en tus casos — solo visible para vos</p>
              </div>
            )}

            {/* VISTA 1 — MODO FECHA */}
            {vista !== "detalle" && modoBusqueda === "fecha" && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-500 font-medium">Eventos en el período</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{totalCount}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-500 font-medium">Casos afectados</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{casosAfectadosTotal}</p>
                  </div>
                </div>
                <FiltrosAuditoria casos={casosDelAbogado} fechasActivas={fechasActivas} modoBusqueda="fecha" />
                <div className="mt-6">
                  <TimelineAuditoriaReporte
                    eventos={eventos}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    modoBusqueda="fecha"
                    eventosCasoAgrupados={[]}
                    casoBuscado={null}
                  />
                </div>
              </>
            )}

            {/* VISTA 1 — MODO CASO */}
            {vista !== "detalle" && modoBusqueda === "caso" && casoBuscado && (
              <>
                <FiltrosAuditoria casos={casosDelAbogado} fechasActivas={fechasActivas} modoBusqueda="caso" />
                <div className="mt-6">
                  <TimelineAuditoriaReporte
                    eventos={[]}
                    currentPage={1}
                    totalPages={1}
                    modoBusqueda="caso"
                    eventosCasoAgrupados={eventosCasoAgrupados}
                    casoBuscado={casoBuscado}
                  />
                </div>
              </>
            )}

            {/* VISTA 2 */}
            {vista === "detalle" && casoIdDetalle && casoDetalle && (
              <DetalleCasoAuditoria
                eventos={eventosDetalle}
                casoNumero={casoDetalle.numero}
                casoTitulo={casoDetalle.titulo}
                casoId={casoIdDetalle}
                fechaLabel={fechaLabel}
                fechaParam={fechaDesde}
              />
            )}

          </div>
        </main>
      </div>
    </div>
  )
}