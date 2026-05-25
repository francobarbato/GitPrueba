// REPORTE: Auditoría Personal del Abogado
// ACCESO: Solo ABOGADO — ve únicamente sus propios casos

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { TimelineAuditoriaReporte } from "./components/TimelineAuditoriaReporte"
import { FiltrosAuditoria } from "./components/FiltrosAuditoria"

// ============================================================================
// TIPOS Y CONSTANTES
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
  usuario: {
    nombre: string
    apellido: string
    rol: string
  }
  caso: {
    id: string
    numero: string
    titulo: string
  } | null
}

const ACCIONES_RELEVANTES = [
  "CREATE", "ESTADO_CHANGE", "PRIORIDAD_CHANGE",
  "JUZGADO_CHANGE", "UBICACION_CHANGE", "MONTO_CHANGE",
  "CIERRE", "REAPERTURA", "UPDATE",
]

// ============================================================================
// FUNCIONES DE DATOS
// ============================================================================

async function getEventosAuditoria(
  userId: string,
  filtroAccion: string,
  filtroCasoId: string,
  fechaDesde: string,
  fechaHasta: string,
  filtroRol: string | null,
  page: number
): Promise<{ eventos: EventoAuditoria[], totalCount: number, casosAfectadosTotal: number }> {

  const casosDelAbogado = await prisma.caso.findMany({
    where: { abogadoId: userId },
    select: { id: true }
  })
  const casoIds = casosDelAbogado.map(c => c.id)
  if (casoIds.length === 0) return { eventos: [], totalCount: 0, casosAfectadosTotal: 0 }

  const desde = new Date(fechaDesde + "T00:00:00")
  const hasta = new Date(fechaHasta + "T23:59:59")

  const ACCIONES_CRITICAS = ["MONTO_CHANGE", "JUZGADO_CHANGE", "UBICACION_CHANGE", "CIERRE", "REAPERTURA"]

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

  // Traer paginado + total + todos los casoIds del período (para KPI real)
  const [totalCount, eventosDb, todosLosEventosDelPeriodo] = await prisma.$transaction([
    prisma.bitacora.count({ where }),
    prisma.bitacora.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
      include: {
        usuario: { select: { nombre: true, apellido: true, rol: true } },
        caso: { select: { id: true, numero: true, titulo: true } }
      }
    }),
    // Solo los casoId para calcular casos únicos afectados en todo el período
    prisma.bitacora.findMany({
      where,
      select: { casoId: true }
    })
  ])

  const casosAfectadosTotal = new Set(
    todosLosEventosDelPeriodo.map(e => e.casoId).filter(Boolean)
  ).size

  const mapeados: EventoAuditoria[] = eventosDb.map(e => ({
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
    caso: e.caso ? {
      id: e.caso.id,
      numero: e.caso.numero,
      titulo: e.caso.titulo,
    } : null
  }))

  return { eventos: mapeados, totalCount, casosAfectadosTotal }
}

async function getFechasConActividad(
  userId: string,
  filtroAccion: string,
  filtroCasoId: string,
  filtroRol: string | null
): Promise<string[]> {
  const casosDelAbogado = await prisma.caso.findMany({
    where: { abogadoId: userId },
    select: { id: true }
  })
  const casoIds = casosDelAbogado.map(c => c.id)
  if (casoIds.length === 0) return []

  const ACCIONES_CRITICAS = ["MONTO_CHANGE", "JUZGADO_CHANGE", "UBICACION_CHANGE", "CIERRE", "REAPERTURA"]

  const accionWhere =
    filtroAccion === "criticos" ? { in: ACCIONES_CRITICAS } :
    filtroAccion !== "todos"    ? filtroAccion :
                                  { in: ACCIONES_RELEVANTES }

  const where: any = {
    casoId: filtroCasoId && filtroCasoId !== "todos" ? filtroCasoId : { in: casoIds },
    accion: accionWhere,
  }
  if (filtroRol) where.usuario = { rol: filtroRol }

  const bitacoras = await prisma.bitacora.findMany({
    where,
    select: { createdAt: true },
  })

  const fechasUnicas = new Set(
    bitacoras.map(b => format(new Date(b.createdAt), "yyyy-MM-dd"))
  )
  return Array.from(fechasUnicas)
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

  const casosDelAbogado = await prisma.caso.findMany({
    where: { abogadoId: user.id },
    select: { id: true, numero: true, titulo: true },
    orderBy: { updatedAt: "desc" }
  })

  const { eventos, totalCount, casosAfectadosTotal } = await getEventosAuditoria(
    user.id, filtroAccion, filtroCasoId, fechaDesde, fechaHasta, filtroRol, currentPage
  )

  const fechasActivas = await getFechasConActividad(
    user.id, filtroAccion, filtroCasoId, filtroRol
  )

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Link href="/reportes">
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-slate-700" />
                    Auditoría Personal
                  </h1>
                  <p className="text-sm text-slate-500">
                    Registro de actividad en tus expedientes — solo visible para vos
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium px-3 py-1.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200">
                Acceso Privado
              </span>
            </div>

            {/* KPIs — ambos sobre el período completo */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs text-slate-500 font-medium">Eventos en el período</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{totalCount}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs text-slate-500 font-medium">Expedientes afectados</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{casosAfectadosTotal}</p>
              </div>
            </div>

            {/* Filtros */}
            <FiltrosAuditoria casos={casosDelAbogado} fechasActivas={fechasActivas} />

            {/* Timeline */}
            <div className="mt-6">
              <TimelineAuditoriaReporte
                eventos={eventos}
                currentPage={currentPage}
                totalPages={totalPages}
              />
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}