// app/reportes/composicion-tareas/page.tsx

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { subDays } from "date-fns"
import { ArrowLeft, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { redirect, notFound } from "next/navigation"

import { KPICardsComposicion } from "./components/KPICardsComposicion"
import { DistribucionTipo } from "./components/DistribucionTipo"
import { TopCategorias } from "./components/TopCategorias"
import { DistribucionPersona } from "./components/DistribucionPersona"
import { DistribucionContexto } from "./components/DistribucionContexto"
import { FiltrosComposicion } from "./components/FiltrosComposicion"
import { NotaContextoPeriodo } from "@/app/reportes/components/NotaContextoPeriodo"

// ============================================================================
// TIPOS
// ============================================================================

type TareaRaw = {
  id: string
  tipo: string
  categoria: string
  ambito: string
  lugarFisico: string | null
  responsable: { id: string; nombre: string | null; apellido: string | null; rol: string }
}

export type PersonaComposicion = {
  id: string
  nombre: string
  rol: string
  total: number
  procesales: number
  internas: number
  categoriaDominante: { nombre: string; cantidad: number } | null
}

export type CategoriaCount = {
  categoria: string
  tipo: string
  cantidad: number
  porcentaje: number
}

// Total de categorías posibles en el enum (fuente de verdad en Prisma)
// Usado para mostrar "X de Y categorías con actividad" en los KPIs
const TOTAL_CATEGORIAS_POSIBLES = 13

// ============================================================================
// QUERY PRINCIPAL
// ============================================================================

async function getComposicionTareas(periodoDias?: number, rolFiltro?: string) {
  const whereClause: any = {}
  if (periodoDias) whereClause.createdAt = { gte: subDays(new Date(), periodoDias) }

  const tareas: TareaRaw[] = await prisma.tarea.findMany({
    where: whereClause,
    select: {
      id: true, tipo: true, categoria: true, ambito: true, lugarFisico: true,
      responsable: { select: { id: true, nombre: true, apellido: true, rol: true } },
    },
  })

  // Aplicar filtro de rol client-side (después de la query)
  const tareasFiltradas = rolFiltro && rolFiltro !== "todos"
    ? tareas.filter(t => t.responsable.rol === rolFiltro)
    : tareas

  if (tareasFiltradas.length === 0) {
    return {
      kpis: { total: 0, categoriaTop: null, cantidadCategorias: 0, totalCategoriasPosibles: TOTAL_CATEGORIAS_POSIBLES },
      porTipo: { procesales: 0, internas: 0 },
      topCategorias: [], porPersona: [], porContexto: [],
    }
  }

  const total = tareasFiltradas.length
  const procesales = tareasFiltradas.filter(t => t.tipo === "PROCESAL").length
  const internas = tareasFiltradas.filter(t => t.tipo === "INTERNA").length

  // ========== Top categorías ==========
  const categoriaMap = new Map<string, { categoria: string; tipo: string; cantidad: number }>()
  for (const t of tareasFiltradas) {
    const key = t.categoria
    if (!categoriaMap.has(key)) {
      categoriaMap.set(key, { categoria: t.categoria, tipo: t.tipo, cantidad: 0 })
    }
    categoriaMap.get(key)!.cantidad++
  }

  // Orden: mayor cantidad primero, luego alfabético por nombre de categoría (desempate determinístico)
  const topCategorias: CategoriaCount[] = Array.from(categoriaMap.values())
    .map(c => ({ ...c, porcentaje: Math.round((c.cantidad / total) * 100) }))
    .sort((a, b) => (b.cantidad - a.cantidad) || a.categoria.localeCompare(b.categoria))

  const categoriaTop = topCategorias.length > 0
    ? { nombre: topCategorias[0].categoria, cantidad: topCategorias[0].cantidad, porcentaje: topCategorias[0].porcentaje }
    : null

  // ========== Por persona ==========
  const personaMap = new Map<string, {
    id: string; nombre: string; rol: string
    total: number; procesales: number; internas: number
    categorias: Map<string, number>
  }>()
  for (const t of tareasFiltradas) {
    const id = t.responsable.id
    if (!personaMap.has(id)) {
      const nombre = t.responsable.nombre && t.responsable.apellido
        ? `${t.responsable.nombre} ${t.responsable.apellido}` : "Sin nombre"
      personaMap.set(id, {
        id, nombre, rol: t.responsable.rol,
        total: 0, procesales: 0, internas: 0,
        categorias: new Map(),
      })
    }
    const p = personaMap.get(id)!
    p.total++
    if (t.tipo === "PROCESAL") p.procesales++
    if (t.tipo === "INTERNA") p.internas++
    p.categorias.set(t.categoria, (p.categorias.get(t.categoria) ?? 0) + 1)
  }

  const porPersona: PersonaComposicion[] = Array.from(personaMap.values()).map(p => {
    // Desempate alfabético también en categoría dominante:
    // si dos categorías empatan, elegimos la alfabéticamente primera
    let categoriaDominante: { nombre: string; cantidad: number } | null = null
    let maxCat = 0
    const entries = Array.from(p.categorias.entries()).sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    if (entries.length > 0) {
      const [nombre, cantidad] = entries[0]
      categoriaDominante = { nombre, cantidad }
      maxCat = cantidad
    }
    return {
      id: p.id, nombre: p.nombre, rol: p.rol,
      total: p.total, procesales: p.procesales, internas: p.internas,
      categoriaDominante,
    }
  }).sort((a, b) => (b.total - a.total) || a.nombre.localeCompare(b.nombre))

  // ========== Por contexto físico (ámbito) ==========
  // Nota: Prisma devuelve valores del enum AmbitoTarea (INTERNO/EXTERNO).
  // El componente DistribucionContexto sabe cómo etiquetar cada valor.
  const contextoMap = new Map<string, number>()
  for (const t of tareasFiltradas) {
    const key = t.ambito
    contextoMap.set(key, (contextoMap.get(key) ?? 0) + 1)
  }
  const porContexto = Array.from(contextoMap.entries())
    .map(([ambito, cantidad]) => ({ ambito, cantidad, porcentaje: Math.round((cantidad / total) * 100) }))
    .sort((a, b) => (b.cantidad - a.cantidad) || a.ambito.localeCompare(b.ambito))

  return {
    kpis: {
      total,
      categoriaTop,
      cantidadCategorias: categoriaMap.size,
      totalCategoriasPosibles: TOTAL_CATEGORIAS_POSIBLES,
    },
    porTipo: { procesales, internas },
    topCategorias, porPersona, porContexto,
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type PageProps = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }

export default async function ComposicionTareasPage({ searchParams }: PageProps) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")
  const userRol = user.rol?.toUpperCase()
  if (userRol === 'CLIENTE' || userRol === 'ADMIN') notFound()

  const params = await searchParams
  const periodoParam = typeof params.periodo === "string" ? params.periodo : undefined
  const rolParam = typeof params.rol === "string" ? params.rol : "todos"
  const periodoDias = periodoParam ? parseInt(periodoParam, 10) : undefined
  const periodoValido = periodoDias && !isNaN(periodoDias) && periodoDias > 0 ? periodoDias : undefined

  const datos = await getComposicionTareas(periodoValido, rolParam)

  

  const PERIODO_LABELS: Record<string, string> = { "90": "últimos 90 días", "180": "últimos 180 días", "365": "último año" }
  const subtitulo = periodoParam && PERIODO_LABELS[periodoParam]
    ? `Perfil operativo del estudio — ${PERIODO_LABELS[periodoParam]}`
    : "Qué tipo de trabajo hace el estudio — todo el historial"

  // Rango para la nota contextual: solo si el usuario eligió un período.
// Si filtró "todo el historial", no mostramos la nota.
let desdeISO: string | null = null
let hastaISO: string | null = null
let rangoLabelNota: string | null = null
if (periodoValido) {
  const hoyDate = new Date()
  const desdeDate = subDays(hoyDate, periodoValido)
  desdeISO = desdeDate.toISOString()
  hastaISO = hoyDate.toISOString()
  rangoLabelNota = PERIODO_LABELS[String(periodoValido)] ?? `últimos ${periodoValido} días`
}

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Link href="/reportes"><Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 gap-2"><ArrowLeft className="w-4 h-4" /> Volver</Button></Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                    Composición de la Agenda
                  </h1>
                  <p className="text-sm text-slate-500">{subtitulo}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <FiltrosComposicion />
            </div>

              {desdeISO && hastaISO && rangoLabelNota && (
                <NotaContextoPeriodo
                  desde={desdeISO}
                  hasta={hastaISO}
                  rangoLabel={rangoLabelNota}
                />
              )}

            {datos.kpis.total === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                <p className="text-sm text-slate-500">Sin eventos registrados para los filtros seleccionados.</p>
              </div>
            ) : (
              <>
                <KPICardsComposicion data={datos.kpis} />
                <DistribucionTipo data={datos.porTipo} total={datos.kpis.total} />
                <TopCategorias data={datos.topCategorias} />
                <DistribucionPersona data={datos.porPersona} />
                <DistribucionContexto data={datos.porContexto} total={datos.kpis.total} />
              </>
            )}

            <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 mb-1">Metodología del Reporte</p>
              <p className="text-xs text-slate-500">
                <strong>Enfoque:</strong> Este reporte describe la composición del trabajo del estudio — qué tipo de eventos se realizan, en qué proporción y por quién. No mide rendimiento ni urgencia, solo naturaleza del trabajo.{" "}
                <strong>Procesal vs Interna:</strong> Clasificación según el tipo del evento al crearlo.{" "}
                <strong>Categorías:</strong> Subdivisión por naturaleza específica (Audiencia, Notificación, Reunión con Cliente, etc.).{" "}
                <strong>Contexto físico:</strong> Ámbito donde se desarrolla el evento — interno del estudio o externo.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}