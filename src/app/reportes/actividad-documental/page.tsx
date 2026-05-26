// app/reportes/actividad-documental/page.tsx
// REPORTE EQ-06: Actividad Documental
// Reporte gerencial informativo: actividad documental del estudio por abogado.
// Mide volumen real (documentos, MB, tipo de archivo) — descriptivo, sin acciones.

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { subMonths, subYears, startOfMonth } from "date-fns"
import { ArrowLeft, FolderArchive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { redirect, notFound } from "next/navigation"

import { KPIsDocumental } from "./components/KPIsDocumental"
import { FiltrosDocumental } from "./components/FiltrosDocumental"
import { TablaActividadAbogado, type ActividadAbogado } from "./components/TablaActividadAbogado"
import { RankingExpedientes, type ExpedienteActividad } from "./components/RankingExpedientes"
import { ActividadTemporal, type PuntoTemporal } from "./components/ActividadTemporal"

// ============================================================================
// HELPERS
// ============================================================================

function familiaArchivo(extension: string): 'pdf' | 'word' | 'excel' | 'imagen' | 'otros' {
  const ext = extension.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx', 'txt'].includes(ext)) return 'word'
  if (['xls', 'xlsx'].includes(ext)) return 'excel'
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'imagen'
  return 'otros'
}

function fechaDesde(periodo: string): Date | null {
  const hoy = new Date()
  switch (periodo) {
    case 'mes': return startOfMonth(hoy)
    case 'trimestre': return subMonths(hoy, 3)
    case 'semestre': return subMonths(hoy, 6)
    case 'anio': return subYears(hoy, 1)
    case 'todo': return null
    default: return startOfMonth(hoy)
  }
}

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// ============================================================================
// QUERY — Actividad documental del estudio
// ============================================================================

async function getActividadDocumental(
  desde: Date | null,
  granularidad: 'dia' | 'mes',
  abogadoId?: string
) {
  const where: any = {}
  if (desde) where.createdAt = { gte: desde }
  if (abogadoId) where.subidoPorId = abogadoId

  const documentos = await prisma.documento.findMany({
    where,
    select: {
      extension: true,
      tamanio: true,
      casoId: true,
      createdAt: true,
      caso: { select: { id: true, numero: true, titulo: true } },
      subidoPor: { select: { id: true, nombre: true, apellido: true, email: true } }
    }
  })

  const mapaAbogado = new Map<string, ActividadAbogado & { _expedientes: Set<string> }>()
  const mapaExpediente = new Map<string, ExpedienteActividad>()
  const mapaTemporal = new Map<string, PuntoTemporal>()

  for (const doc of documentos) {
    const mb = doc.tamanio / (1024 * 1024)

    // Por abogado
    const aid = doc.subidoPor.id
    if (!mapaAbogado.has(aid)) {
      const nombre = doc.subidoPor.nombre && doc.subidoPor.apellido
        ? `${doc.subidoPor.nombre} ${doc.subidoPor.apellido}`
        : (doc.subidoPor.email?.split('@')[0] || 'Usuario')
      mapaAbogado.set(aid, {
        id: aid, nombre,
        totalDocumentos: 0, totalMB: 0,
        pdf: 0, word: 0, excel: 0, imagen: 0, otros: 0,
        expedientesDistintos: 0, _expedientes: new Set<string>()
      })
    }
    const a = mapaAbogado.get(aid)!
    a.totalDocumentos++
    a.totalMB += mb
    a[familiaArchivo(doc.extension)]++
    a._expedientes.add(doc.casoId)

    // Por expediente
    if (!mapaExpediente.has(doc.casoId)) {
      mapaExpediente.set(doc.casoId, {
        id: doc.caso.id, numero: doc.caso.numero, titulo: doc.caso.titulo,
        cantidadDocumentos: 0, totalMB: 0
      })
    }
    const e = mapaExpediente.get(doc.casoId)!
    e.cantidadDocumentos++
    e.totalMB += mb

    // Temporal (día o mes según granularidad)
    const d = doc.createdAt
    let clave: string, label: string, tooltipLabel: string
    if (granularidad === 'dia') {
      clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      label = String(d.getDate())
      tooltipLabel = `${DIAS_CORTO[d.getDay()]} ${d.getDate()} ${MESES_CORTO[d.getMonth()]}`
    } else {
      clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      label = `${MESES_CORTO[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
      tooltipLabel = `${MESES_ES[d.getMonth()]} ${d.getFullYear()}`
    }
    if (!mapaTemporal.has(clave)) {
      mapaTemporal.set(clave, { clave, label, tooltipLabel, cantidad: 0, totalMB: 0 })
    }
    const t = mapaTemporal.get(clave)!
    t.cantidad++
    t.totalMB += mb
  }

  const abogados: ActividadAbogado[] = Array.from(mapaAbogado.values()).map(a => ({
    id: a.id, nombre: a.nombre,
    totalDocumentos: a.totalDocumentos, totalMB: a.totalMB,
    pdf: a.pdf, word: a.word, excel: a.excel, imagen: a.imagen, otros: a.otros,
    expedientesDistintos: a._expedientes.size
  }))

  const expedientes = Array.from(mapaExpediente.values())
  const puntosTemporales = Array.from(mapaTemporal.values()).sort((x, y) => x.clave.localeCompare(y.clave))

  const totalDocumentos = documentos.length
  const totalMB = documentos.reduce((s, d) => s + d.tamanio / (1024 * 1024), 0)
  const expedientesConDocs = mapaExpediente.size
  const abogadosActivos = abogados.length
  const promedioPorExpediente = expedientesConDocs > 0 ? totalDocumentos / expedientesConDocs : 0

  return {
    kpis: { totalDocumentos, totalMB, abogadosActivos, promedioPorExpediente, expedientesConDocs },
    abogados, expedientes, puntosTemporales
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ActividadDocumentalPage({ searchParams }: PageProps) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const userRol = user.rol?.toUpperCase()
  // ADMIN es rol técnico/de sistemas: sin acceso a datos legales.
  // CLIENTE: bloqueado. ABOGADO y ASISTENTE: ven el reporte completo.
  if (userRol === 'CLIENTE' || userRol === 'ADMIN') notFound()

  const params = await searchParams
  const periodo = typeof params.periodo === "string" ? params.periodo : "mes"
  const desde = fechaDesde(periodo)

  // Granularidad del gráfico: por día si es el mes actual, por mes si el período es largo.
  const granularidad: 'dia' | 'mes' = periodo === 'mes' ? 'dia' : 'mes'

  // Lista de abogados para el filtro.
  const abogadosDb = await prisma.user.findMany({
    where: { rol: 'ABOGADO', isActive: true },
    select: { id: true, nombre: true, apellido: true },
    orderBy: { nombre: 'asc' }
  })
  const listaAbogados = abogadosDb.map(a => ({
    id: a.id,
    nombre: `${a.nombre || ''} ${a.apellido || ''}`.trim() || 'Sin nombre'
  }))

  const filtroAbogado = typeof params.abogado === "string" ? params.abogado : "todos"
  const abogadoIdFiltro = (filtroAbogado !== "todos" && listaAbogados.some(a => a.id === filtroAbogado))
    ? filtroAbogado
    : undefined

  const { kpis, abogados, expedientes, puntosTemporales } =
    await getActividadDocumental(desde, granularidad, abogadoIdFiltro)

  const periodoLabel: Record<string, string> = {
    mes: "este mes", trimestre: "los últimos 3 meses", semestre: "los últimos 6 meses",
    anio: "el último año", todo: "todo el histórico"
  }

  // El gráfico se muestra si hay al menos 2 puntos (un solo día/mes no dibuja tendencia).
  const mostrarTemporal = puntosTemporales.length > 1

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Link href="/reportes">
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FolderArchive className="h-6 w-6 text-indigo-600" />
                    Actividad documental
                  </h1>
                  <p className="text-sm text-slate-500">
                    Volumen de documentación generada por el estudio durante {periodoLabel[periodo] || "el período"}
                  </p>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="mb-6">
              <FiltrosDocumental abogados={listaAbogados} />
            </div>

            {/* KPIs globales */}
            <KPIsDocumental data={kpis} />

            {/* Ranking de expedientes con más movimiento */}
            <RankingExpedientes expedientes={expedientes} />

            {/* Gráfico temporal (por día si es el mes, por mes si es período largo) */}
            {mostrarTemporal && (
              <ActividadTemporal puntos={puntosTemporales} granularidad={granularidad} />
            )}

            {/* Tabla por abogado */}
            <TablaActividadAbogado abogados={abogados} />

            {/* Nota metodológica */}
            <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 mb-1">Metodología del Reporte</p>
              <p className="text-xs text-slate-500">
                <strong>Actividad documental:</strong> mide la cantidad de documentos subidos al sistema, no su contenido jurídico.{" "}
                <strong>Período:</strong> se cuentan los documentos según su fecha de subida.{" "}
                <strong>Ritmo de actividad:</strong> el gráfico muestra los documentos por día cuando se consulta el mes actual, y por mes en períodos más largos.{" "}
                <strong>Expedientes con más movimiento:</strong> los que más documentos recibieron en el período.{" "}
                <strong>Tipo de archivo:</strong> PDF, Word (doc, docx, txt), Excel (xls, xlsx), Imagen (jpg, png, webp) y Otros.{" "}
                Este reporte es informativo y descriptivo: refleja actividad de carga, no una evaluación de desempeño.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}