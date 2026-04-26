// app/reportes/matriz-carga/page.tsx

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { ArrowLeft, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { redirect, notFound } from "next/navigation"

import { KPICardsCarga } from "./components/KPICardsCarga"
import { TablaPanoramaAbogado } from "./components/TablaPanoramaAbogado"
import { DetalleCargaPersonal } from "./components/DetalleCargaPersonal"
import { PanelProximasVencer } from "./components/PanelProximasVencer"
import { TablaBloqueadasActivas } from "./components/TablaBloqueadasActivas"
import { PanelInsightsCarga } from "./components/PanelInsightsCarga"
import { ToggleVistaCarga } from "./components/ToggleVistaCarga"

// ============================================================================
// TIPOS
// ============================================================================

export type AbogadoPanorama = {
  id: string
  nombre: string
  rol: string
  casosActivos: number
  tareasActivas: number
  tareasPendientes: number
  tareasEnProceso: number
  tareasBloqueadas: number
  tareasVencidas: number
  tareasProximas: number
  capitalEnLitigio: number
  tareasFatal: number
  tareasAlta: number
  tareasMedia: number
  tareasBaja: number
}

export type TareaProximaVencer = {
  id: string
  titulo: string
  tipo: string
  responsable: string
  categoria: string
  prioridad: string
  caso: string | null
  casoId: string | null
  fechaVencimiento: string
  diasRestantes: number
}

export type CasoActivoDetalle = {
  id: string
  numero: string
  titulo: string
  tipo: string
  capitalEnLitigio: number
}

export type TareaActivaDetalle = {
  id: string
  titulo: string
  tipo: string
  categoria: string
  prioridad: string
  estado: string
  caso: string | null
  casoId: string | null
  fechaVencimiento: string | null
}

export type TareaBloqueadaDetalle = {
  id: string
  titulo: string
  tipo: string
  categoria: string
  prioridad: string
  motivoBloqueo: string | null
  caso: string | null
  casoId: string | null
  fechaVencimiento: string | null
  diasBloqueada: number            // días reales desde que pasó a BLOQUEADA (vía bitácora)
  fechaBloqueoISO: string | null   // timestamp del cambio a BLOQUEADA, null si no se encuentra en bitácora
  responsable: string
}

// ============================================================================
// CONSTANTES
// ============================================================================

const TIPO_CASO_LABELS: Record<string, string> = {
  LABORAL: "Laboral", CIVIL_COMERCIAL: "Civil y Comercial", FAMILIA: "Familia",
  PENAL: "Penal", SUCESIONES: "Sucesiones", CONTENCIOSO_ADMINISTRATIVO: "Contencioso Adm.", OTRO: "Otro",
}

// ============================================================================
// HELPER: días desde bloqueo real (vía bitácora)
//
// Busca la última entrada TAREA_ESTADO_CHANGE con estadoNuevo=BLOQUEADA para
// cada tarea, y calcula cuántos días pasaron desde ese momento. Si no existe
// registro en bitácora (p.ej. tareas pre-sistema de auditoría), cae a null.
// ============================================================================
async function obtenerFechaBloqueoMap(tareaIds: string[]): Promise<Map<string, Date>> {
  if (tareaIds.length === 0) return new Map()

  // Traer todas las entradas de bitácora relevantes: cambios de estado a BLOQUEADA
  const entradas = await prisma.bitacora.findMany({
    where: {
      tareaId: { in: tareaIds },
      accion: "TAREA_ESTADO_CHANGE",
      estadoNuevo: "BLOQUEADA",
    },
    select: { tareaId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  // Por cada tarea, nos quedamos con la entrada más reciente (ya ordenado desc)
  const mapa = new Map<string, Date>()
  for (const e of entradas) {
    if (!e.tareaId) continue
    if (!mapa.has(e.tareaId)) mapa.set(e.tareaId, e.createdAt)
  }
  return mapa
}

// ============================================================================
// QUERY PRINCIPAL
// ============================================================================

async function getMatrizCarga(abogadoId?: string) {
  // 1. Expedientes activos con monto
  const whereCasos: any = { estaCerrado: false }
  if (abogadoId) whereCasos.abogadoId = abogadoId

  const casosActivos = await prisma.caso.findMany({
    where: whereCasos,
    select: {
      id: true, numero: true, titulo: true, tipo: true,
      montoDisputa: true, updatedAt: true,
      abogado: { select: { id: true, nombre: true, apellido: true, rol: true } },
    },
  })

  // 2. Eventos activos (no terminales)
  const whereTareas: any = { estado: { notIn: ["COMPLETADA", "VENCIDA"] } }
  if (abogadoId) whereTareas.responsableId = abogadoId

  const tareasActivasRaw = await prisma.tarea.findMany({
    where: whereTareas,
    select: {
      id: true, titulo: true, tipo: true, categoria: true, prioridad: true, estado: true,
      fechaVencimiento: true,
      responsable: { select: { id: true, nombre: true, apellido: true, rol: true } },
      caso: { select: { id: true, numero: true } },
    },
    orderBy: { fechaVencimiento: "asc" },
  })

  // 3. Eventos vencidos
  const whereTareasVencidas: any = { estado: "VENCIDA" }
  if (abogadoId) whereTareasVencidas.responsableId = abogadoId

  const tareasVencidas = await prisma.tarea.findMany({
    where: whereTareasVencidas,
    select: {
      id: true, prioridad: true,
      responsable: { select: { id: true, nombre: true, apellido: true } },
    },
  })

  // 4. Eventos próximos a vencer (7 días)
  const ahora = new Date()
  const en7dias = new Date()
  en7dias.setDate(ahora.getDate() + 7)

  const whereTareasProximas: any = {
    estado: { notIn: ["COMPLETADA", "VENCIDA"] },
    fechaVencimiento: { gte: ahora, lte: en7dias },
  }
  if (abogadoId) whereTareasProximas.responsableId = abogadoId

  const tareasProximasRaw = await prisma.tarea.findMany({
    where: whereTareasProximas,
    select: {
      id: true, titulo: true, tipo: true, categoria: true, prioridad: true,
      fechaVencimiento: true,
      responsable: { select: { id: true, nombre: true, apellido: true } },
      caso: { select: { id: true, numero: true } },
    },
    orderBy: { fechaVencimiento: "asc" },
  })

  // 5. Eventos bloqueados activos
  const whereTareasBloqueadas: any = { estado: "BLOQUEADA" }
  if (abogadoId) whereTareasBloqueadas.responsableId = abogadoId

  const tareasBloqueadasRaw = await prisma.tarea.findMany({
    where: whereTareasBloqueadas,
    select: {
      id: true, titulo: true, tipo: true, categoria: true, prioridad: true,
      motivoBloqueo: true, fechaVencimiento: true, updatedAt: true,
      responsable: { select: { id: true, nombre: true, apellido: true } },
      caso: { select: { id: true, numero: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  // 6. Buscar en bitácora la fecha real de bloqueo de cada tarea bloqueada
  const fechaBloqueoMap = await obtenerFechaBloqueoMap(tareasBloqueadasRaw.map(t => t.id))

  // ========== PANORAMA POR ABOGADO (vista general) ==========

  const abogadosMap = new Map<string, AbogadoPanorama>()

  for (const caso of casosActivos) {
    const abId = caso.abogado.id
    if (!abogadosMap.has(abId)) {
      const nombre = caso.abogado.nombre && caso.abogado.apellido
        ? `${caso.abogado.nombre} ${caso.abogado.apellido}` : "Sin nombre"
      abogadosMap.set(abId, {
        id: abId, nombre, rol: caso.abogado.rol, casosActivos: 0,
        tareasActivas: 0, tareasPendientes: 0, tareasEnProceso: 0, tareasBloqueadas: 0, tareasVencidas: 0, tareasProximas: 0,
        capitalEnLitigio: 0, tareasFatal: 0, tareasAlta: 0, tareasMedia: 0, tareasBaja: 0,
      })
    }
    const ab = abogadosMap.get(abId)!
    ab.casosActivos++
    ab.capitalEnLitigio += caso.montoDisputa ? Number(caso.montoDisputa) : 0
  }

  for (const tarea of tareasActivasRaw) {
    const abId = tarea.responsable.id
    if (!abogadosMap.has(abId)) {
      const nombre = tarea.responsable.nombre && tarea.responsable.apellido
        ? `${tarea.responsable.nombre} ${tarea.responsable.apellido}` : "Sin nombre"
      abogadosMap.set(abId, {
        id: abId, nombre, rol: tarea.responsable.rol, casosActivos: 0,
        tareasActivas: 0, tareasPendientes: 0, tareasEnProceso: 0, tareasBloqueadas: 0, tareasVencidas: 0, tareasProximas: 0,
        capitalEnLitigio: 0, tareasFatal: 0, tareasAlta: 0, tareasMedia: 0, tareasBaja: 0,
      })
    }
    const ab = abogadosMap.get(abId)!
    ab.tareasActivas++
    if (tarea.estado === "PENDIENTE") ab.tareasPendientes++
    if (tarea.estado === "EN_PROCESO") ab.tareasEnProceso++
    if (tarea.estado === "BLOQUEADA") ab.tareasBloqueadas++
    if (tarea.prioridad === "FATAL") ab.tareasFatal++
    if (tarea.prioridad === "ALTA") ab.tareasAlta++
    if (tarea.prioridad === "MEDIA") ab.tareasMedia++
    if (tarea.prioridad === "BAJA") ab.tareasBaja++
  }

  for (const tarea of tareasVencidas) {
    const abId = tarea.responsable.id
    if (abogadosMap.has(abId)) abogadosMap.get(abId)!.tareasVencidas++
  }

  for (const tarea of tareasProximasRaw) {
    const abId = tarea.responsable.id
    if (abogadosMap.has(abId)) abogadosMap.get(abId)!.tareasProximas++
  }

  const panoramaAbogados = Array.from(abogadosMap.values())
    .sort((a, b) => (b.casosActivos + b.tareasActivas) - (a.casosActivos + a.tareasActivas))

  // ========== DETALLE PARA VISTA PERSONAL ==========

  const casosActivosDetalle: CasoActivoDetalle[] = casosActivos.map(c => ({
    id: c.id,
    numero: c.numero,
    titulo: c.titulo,
    tipo: TIPO_CASO_LABELS[c.tipo] ?? c.tipo,
    capitalEnLitigio: c.montoDisputa ? Number(c.montoDisputa) : 0,
  }))

  const tareasActivasDetalle: TareaActivaDetalle[] = tareasActivasRaw.map(t => ({
    id: t.id,
    titulo: t.titulo,
    tipo: t.tipo,
    categoria: t.categoria,
    prioridad: t.prioridad,
    estado: t.estado,
    caso: t.caso?.numero ?? null,
    casoId: t.caso?.id ?? null,
    fechaVencimiento: t.fechaVencimiento ? t.fechaVencimiento.toISOString() : null,
  }))

  // ========== EVENTOS PRÓXIMOS A VENCER ==========

  const tareasProximas: TareaProximaVencer[] = tareasProximasRaw.map(t => ({
    id: t.id, titulo: t.titulo, tipo: t.tipo,
    responsable: t.responsable.nombre && t.responsable.apellido
      ? `${t.responsable.nombre} ${t.responsable.apellido}` : "Sin asignar",
    categoria: t.categoria, prioridad: t.prioridad,
    caso: t.caso?.numero ?? null, casoId: t.caso?.id ?? null,
    fechaVencimiento: t.fechaVencimiento!.toISOString(),
    diasRestantes: Math.max(0, Math.ceil((t.fechaVencimiento!.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))),
  }))

  // ========== EVENTOS BLOQUEADOS ACTIVOS — con fecha real de bloqueo ==========

  const tareasBloqueadasDetalle: TareaBloqueadaDetalle[] = tareasBloqueadasRaw.map(t => {
    const fechaBloqueoReal = fechaBloqueoMap.get(t.id) ?? null
    // Si tenemos bitácora, usamos esa fecha. Fallback a updatedAt para tareas pre-auditoría.
    const fechaReferencia = fechaBloqueoReal ?? t.updatedAt
    const diasBloqueada = Math.max(0, Math.floor((ahora.getTime() - fechaReferencia.getTime()) / (1000 * 60 * 60 * 24)))
    return {
      id: t.id,
      titulo: t.titulo,
      tipo: t.tipo,
      categoria: t.categoria,
      prioridad: t.prioridad,
      motivoBloqueo: t.motivoBloqueo,
      caso: t.caso?.numero ?? null,
      casoId: t.caso?.id ?? null,
      fechaVencimiento: t.fechaVencimiento ? t.fechaVencimiento.toISOString() : null,
      diasBloqueada,
      fechaBloqueoISO: fechaBloqueoReal ? fechaBloqueoReal.toISOString() : null,
      responsable: t.responsable.nombre && t.responsable.apellido
        ? `${t.responsable.nombre} ${t.responsable.apellido}` : "Sin asignar",
    }
  })

  // ========== KPIs ==========

  const totalCasosActivos = casosActivos.length
  const totalTareasActivas = tareasActivasRaw.length
  const totalCapital = casosActivos.reduce((s, c) => s + (c.montoDisputa ? Number(c.montoDisputa) : 0), 0)
  const totalVencidas = tareasVencidas.length

  // ========== INSIGHTS ==========

  const abConMasCarga = panoramaAbogados.length > 0 ? panoramaAbogados[0] : null
  const abConMasCapital = panoramaAbogados.length > 0
    ? [...panoramaAbogados].sort((a, b) => b.capitalEnLitigio - a.capitalEnLitigio)[0] : null
  const porcentajeCapitalConcentrado = abConMasCapital && totalCapital > 0
    ? Math.round((abConMasCapital.capitalEnLitigio / totalCapital) * 100) : 0

  // Umbral dinámico para "concentración anómala":
  // si hay N personas con capital, el promedio natural es 100/N%.
  // Solo es interesante si alguien tiene MUCHO más (al menos el doble del promedio o >= 50%).
  const personasConCapital = panoramaAbogados.filter(p => p.capitalEnLitigio > 0).length
  const umbralConcentracion = personasConCapital > 0
    ? Math.max(50, Math.round((100 / personasConCapital) * 2))
    : 50

  return {
    kpis: { totalCasosActivos, totalTareasActivas, totalCapital },
    panoramaAbogados, casosActivosDetalle, tareasActivasDetalle, tareasProximas, tareasBloqueadasDetalle,
    insights: {
      abConMasCarga: abConMasCarga ? { nombre: abConMasCarga.nombre, casos: abConMasCarga.casosActivos, tareas: abConMasCarga.tareasActivas } : null,
      abConMasCapital: abConMasCapital && porcentajeCapitalConcentrado >= umbralConcentracion
        ? { nombre: abConMasCapital.nombre, porcentaje: porcentajeCapitalConcentrado }
        : null,
      tareasProximasCount: tareasProximas.length,
      totalVencidas,
    },
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type PageProps = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }

export default async function MatrizCargaPage({ searchParams }: PageProps) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")
  const userRol = user.rol?.toUpperCase()
  if (userRol === 'CLIENTE' || userRol === 'ADMIN') notFound()

  const params = await searchParams
  const vistaParam = typeof params.vista === "string" ? params.vista : undefined
  const vistaGeneral = vistaParam === "general"
  const abogadoId = vistaGeneral ? undefined : user.id
  const datos = await getMatrizCarga(abogadoId)

  const tieneProximas = !vistaGeneral && datos.tareasProximas.length > 0

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className={`flex ${tieneProximas ? "xl:flex-row" : ""} flex-col`}>

            {/* Panel "Próximas a vencer" — fijo a la izquierda en xl */}
            {tieneProximas && (
              <div className="hidden xl:block w-72 shrink-0 border-r border-slate-200 sticky top-0 self-start max-h-[calc(100vh-64px)] overflow-y-auto p-4">
                <PanelProximasVencer data={datos.tareasProximas} />
              </div>
            )}

            {/* Contenido principal */}
            <div className="flex-1 p-6 min-w-0">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <Link href="/reportes"><Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 gap-2"><ArrowLeft className="w-4 h-4" /> Volver</Button></Link>
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-indigo-600" /> Carga de trabajo
                      </h1>
                      <p className="text-sm text-slate-500">
                        {vistaGeneral ? "Panorama actual de carga y distribución del equipo" : "Tu carga de trabajo actual: expedientes, eventos y capital"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6"><ToggleVistaCarga vistaActual={vistaGeneral ? "general" : "personal"} /></div>

                <KPICardsCarga data={datos.kpis} />

                {/* Panel próximas — inline en pantallas chicas */}
                {tieneProximas && (
                  <div className="xl:hidden mb-6">
                    <PanelProximasVencer data={datos.tareasProximas} />
                  </div>
                )}

                {/* Vista general: tabla panorama con expand */}
                {vistaGeneral && datos.panoramaAbogados.length > 0 && (
                  <TablaPanoramaAbogado data={datos.panoramaAbogados} vistaGeneral={true} />
                )}

                {/* Vista personal: desplegables a ancho completo */}
                {!vistaGeneral && (
                  <DetalleCargaPersonal
                    casos={datos.casosActivosDetalle}
                    tareas={datos.tareasActivasDetalle}
                  />
                )}

                {/* Tabla eventos bloqueados activos — solo vista personal */}
                {!vistaGeneral && datos.tareasBloqueadasDetalle.length > 0 && (
                  <TablaBloqueadasActivas data={datos.tareasBloqueadasDetalle} />
                )}

                {/* Insights — solo vista general */}
                {vistaGeneral && <PanelInsightsCarga data={datos.insights} />}

                <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Metodología del Reporte</p>
                  <p className="text-xs text-slate-500">
                    <strong>Foto actual:</strong> Este reporte muestra el estado presente, no un rango temporal.{" "}
                    <strong>Expedientes activos:</strong> Expedientes no cerrados asignados al abogado.{" "}
                    <strong>Eventos activos:</strong> En estado Pendiente, En proceso o Bloqueado.{" "}
                    <strong>Bloqueados:</strong> Eventos activos que no pueden avanzar hasta destrabarse.{" "}
                    <strong>Por vencer:</strong> Eventos activos cuyo plazo vence en los próximos 7 días.{" "}
                    <strong>Capital en litigio:</strong> Suma del monto en disputa de los expedientes activos.{" "}
                    <strong>Días bloqueado:</strong> Tiempo transcurrido desde el último cambio a estado Bloqueado según la bitácora de auditoría.{" "}
                    Los datos se calculan en tiempo real sobre la actividad registrada en el sistema.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}