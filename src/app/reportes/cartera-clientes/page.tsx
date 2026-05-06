// app/reportes/cartera-clientes/page.tsx
// REPORTE ES-12: Análisis de Cartera de Clientes
// Vista personal: mis clientes + paneles de valiosos y en riesgo
// Vista gerencial: top estudio, antigüedad, distribución por abogado

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { differenceInDays } from "date-fns"
import { ArrowLeft, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

import { KPIsClientes } from "./components/KPIsClientes"
import { FiltrosClientes } from "./components/FiltrosClientes"
import { TablaClientes } from "./components/TablaClientes"
import { ToggleVistaClientes } from "./components/ToggleVistaClientes"
import { PanelClientesValiosos } from "./components/PanelClientesValiosos"
import { PanelClientesEnRiesgo } from "./components/PanelClientesEnRiesgo"
import { VistaGerencialClientes, type ClienteGerencial, type DistribucionAbogado } from "./components/VistaGerencialClientes"
import { redirect, notFound } from "next/navigation"
// ============================================================================
// TIPOS
// ============================================================================

export type ClienteReporte = {
  id: string
  nombre: string
  tipoPersona: string
  tipoPersonaLabel: string
  antiguedadDias: number
  antiguedadLabel: string
  casosTotal: number
  casosActivos: number
  casosCerrados: number
  capitalEnLitigio: number
  capitalRecuperado: number
  capitalHistorico: number
  ultimoMovimiento: string | null
  ultimoMovimientoLabel: string
  tiempoInactivoLabel: string
  ultimoCierreLabel: string
  abogadoResponsable: string
  abogadoResponsableId: string
  estaActivo: boolean
  categoriaCantidad: string
}

export type KPIsCarteraClientes = {
  totalClientes: number
  porcentajePersonas: number
  porcentajeEmpresas: number
  tasaRecurrencia: number
  capitalEnCartera: number
  clientesInactivos: number
}

// ============================================================================
// HELPERS
// ============================================================================

const TIPO_PERSONA_LABELS: Record<string, string> = {
  FISICA: "Persona Física",
  JURIDICA: "Persona Jurídica",
}

function formatAntiguedad(dias: number): string {
  if (dias < 30) return `${dias} días`
  if (dias < 365) return `${Math.round(dias / 30)} meses`
  const anios = Math.floor(dias / 365)
  const mesesRestantes = Math.round((dias % 365) / 30)
  if (mesesRestantes === 0) return `${anios} ${anios === 1 ? "año" : "años"}`
  return `${anios} ${anios === 1 ? "año" : "años"}, ${mesesRestantes}m`
}

function formatTiempoInactivo(dias: number): string {
  if (dias < 30) return `${dias} días`
  if (dias < 365) return `${Math.round(dias / 30)} meses`
  return `${Math.round(dias / 365)} ${Math.round(dias / 365) === 1 ? "año" : "años"}`
}

// ============================================================================
// QUERY — VISTA PERSONAL (sin cambios)
// ============================================================================

async function getCarteraClientes(abogadoId?: string) {
  const hoy = new Date()

  const whereCliente: any = {}
  if (abogadoId) whereCliente.abogadoId = abogadoId

  const clientes = await prisma.cliente.findMany({
    where: whereCliente,
    include: {
      casos: {
        select: {
          id: true, estado: true, estaCerrado: true,
          montoDisputa: true, montoFinal: true,
          fechaCierre: true, updatedAt: true,
          abogado: { select: { id: true, nombre: true, apellido: true } }
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  })

  const clientesProcessed: ClienteReporte[] = clientes.map((cliente) => {
    const casosTotal = cliente.casos.length
    const casosActivos = cliente.casos.filter(c => !c.estaCerrado).length
    const casosCerrados = casosTotal - casosActivos
    const estaActivo = casosActivos > 0
    const antiguedadDias = differenceInDays(hoy, cliente.createdAt)

    const capitalEnLitigio = cliente.casos
      .filter(c => !c.estaCerrado && c.montoDisputa)
      .reduce((sum, c) => sum + Number(c.montoDisputa), 0)
    const capitalRecuperado = cliente.casos
      .filter(c => c.estaCerrado && c.montoFinal)
      .reduce((sum, c) => sum + Number(c.montoFinal), 0)
    const capitalHistorico = cliente.casos
      .filter(c => c.estaCerrado && c.montoDisputa)
      .reduce((sum, c) => sum + Number(c.montoDisputa), 0)

    const ultimoMovimientoDate = cliente.casos.length > 0 ? cliente.casos[0].updatedAt : null
    const diasDesdeUltimoMov = ultimoMovimientoDate ? differenceInDays(hoy, ultimoMovimientoDate) : 0
    const ultimoMovimientoLabel = ultimoMovimientoDate
      ? diasDesdeUltimoMov === 0 ? "Hoy"
        : diasDesdeUltimoMov === 1 ? "Ayer"
        : `Hace ${formatTiempoInactivo(diasDesdeUltimoMov)}`
      : "Sin movimientos"

    const ultimoCierre = cliente.casos
      .filter(c => c.estaCerrado && c.fechaCierre)
      .sort((a, b) => b.fechaCierre!.getTime() - a.fechaCierre!.getTime())[0]
    const ultimoCierreLabel = ultimoCierre?.fechaCierre
      ? ultimoCierre.fechaCierre.toLocaleDateString("es-AR", { month: "short", year: "numeric" })
      : "—"
    const diasInactivo = ultimoCierre?.fechaCierre
      ? differenceInDays(hoy, ultimoCierre.fechaCierre) : 0
    const tiempoInactivoLabel = !estaActivo && diasInactivo > 0
      ? formatTiempoInactivo(diasInactivo) : "—"

    const casoReciente = cliente.casos[0]
    const abogadoResponsable = casoReciente?.abogado
      ? `${casoReciente.abogado.nombre || ""} ${casoReciente.abogado.apellido || ""}`.trim()
      : "Sin asignar"
    const abogadoResponsableId = casoReciente?.abogado?.id || ""

    const nombre = cliente.tipoPersona === "JURIDICA"
      ? cliente.nombre
      : `${cliente.nombre}${cliente.apellido ? ` ${cliente.apellido}` : ""}`

    let categoriaCantidad: string
    if (casosTotal >= 5) categoriaCantidad = "frecuente"
    else if (casosTotal >= 2) categoriaCantidad = "recurrente"
    else categoriaCantidad = "unico"

    return {
      id: cliente.id, nombre,
      tipoPersona: cliente.tipoPersona,
      tipoPersonaLabel: TIPO_PERSONA_LABELS[cliente.tipoPersona] || cliente.tipoPersona,
      antiguedadDias, antiguedadLabel: formatAntiguedad(antiguedadDias),
      casosTotal, casosActivos, casosCerrados,
      capitalEnLitigio, capitalRecuperado, capitalHistorico,
      ultimoMovimiento: ultimoMovimientoDate?.toISOString() ?? null,
      ultimoMovimientoLabel, tiempoInactivoLabel, ultimoCierreLabel,
      abogadoResponsable, abogadoResponsableId,
      estaActivo, categoriaCantidad,
    }
  })

  const clientesConCasos = clientesProcessed.filter(c => c.casosTotal > 0)
  const totalClientes = clientesConCasos.length
  const personas = clientesConCasos.filter(c => c.tipoPersona === "FISICA").length
  const empresas = totalClientes - personas

  const kpis: KPIsCarteraClientes = {
    totalClientes,
    porcentajePersonas: totalClientes > 0 ? Math.round((personas / totalClientes) * 100) : 0,
    porcentajeEmpresas: totalClientes > 0 ? Math.round((empresas / totalClientes) * 100) : 0,
    tasaRecurrencia: totalClientes > 0
      ? Math.round(clientesProcessed.filter(c => c.casosTotal >= 2).length / totalClientes * 100) : 0,
    capitalEnCartera: clientesProcessed.reduce((sum, c) => sum + c.capitalEnLitigio, 0),
    clientesInactivos: clientesProcessed.filter(c => !c.estaActivo && c.casosTotal > 0).length,
  }

  return {
    kpis,
    clientes: clientesProcessed,
    clientesSinCasos: clientesProcessed.filter(c => c.casosTotal === 0),
  }
}

// ============================================================================
// QUERY — VISTA GERENCIAL
// Todos los clientes del estudio sin filtro de abogado
// ============================================================================

async function getCarteraGerencial(): Promise<{
  kpis: KPIsCarteraClientes
  clientes: ClienteGerencial[]
  distribucion: DistribucionAbogado[]
}> {
  const hoy = new Date()

  const clientes = await prisma.cliente.findMany({
    include: {
      casos: {
        select: {
          id: true, estado: true, estaCerrado: true,
          montoDisputa: true, montoFinal: true,
          fechaCierre: true, updatedAt: true,
          abogado: { select: { id: true, nombre: true, apellido: true } }
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  })

  const clientesProcessed: ClienteGerencial[] = clientes
    .filter(c => c.casos.length > 0)
    .map(cliente => {
      const casosTotal = cliente.casos.length
      const casosActivos = cliente.casos.filter(c => !c.estaCerrado).length
      const estaActivo = casosActivos > 0
      const antiguedadDias = differenceInDays(hoy, cliente.createdAt)

      const capitalEnLitigio = cliente.casos
        .filter(c => !c.estaCerrado && c.montoDisputa)
        .reduce((sum, c) => sum + Number(c.montoDisputa), 0)
      const capitalRecuperado = cliente.casos
        .filter(c => c.estaCerrado && c.montoFinal)
        .reduce((sum, c) => sum + Number(c.montoFinal), 0)
      const capitalHistorico = cliente.casos
        .filter(c => c.estaCerrado && c.montoDisputa)
        .reduce((sum, c) => sum + Number(c.montoDisputa), 0)

      const casoReciente = cliente.casos[0]
      const abogadoResponsable = casoReciente?.abogado
        ? `${casoReciente.abogado.nombre || ""} ${casoReciente.abogado.apellido || ""}`.trim()
        : "Sin asignar"
      const abogadoResponsableId = casoReciente?.abogado?.id || ""

      const nombre = cliente.tipoPersona === "JURIDICA"
        ? cliente.nombre
        : `${cliente.nombre}${cliente.apellido ? ` ${cliente.apellido}` : ""}`

      let categoriaCantidad: string
      if (casosTotal >= 5) categoriaCantidad = "frecuente"
      else if (casosTotal >= 2) categoriaCantidad = "recurrente"
      else categoriaCantidad = "unico"

      return {
        id: cliente.id, nombre,
        tipoPersona: cliente.tipoPersona,
        antiguedadDias, antiguedadLabel: formatAntiguedad(antiguedadDias),
        casosTotal, casosActivos,
        capitalEnLitigio, capitalRecuperado, capitalHistorico,
        estaActivo, abogadoResponsable, abogadoResponsableId,
        categoriaCantidad,
      }
    })

  // Distribución por abogado
  const abogadoMap = new Map<string, DistribucionAbogado>()
  clientesProcessed.forEach(c => {
    if (!c.abogadoResponsableId) return
    if (!abogadoMap.has(c.abogadoResponsableId)) {
      abogadoMap.set(c.abogadoResponsableId, {
        id: c.abogadoResponsableId,
        nombre: c.abogadoResponsable,
        clientesActivos: 0,
        capitalEnLitigio: 0,
        totalClientes: 0,
      })
    }
    const d = abogadoMap.get(c.abogadoResponsableId)!
    d.totalClientes++
    if (c.estaActivo) d.clientesActivos++
    d.capitalEnLitigio += c.capitalEnLitigio
  })

  const totalClientes = clientesProcessed.length
  const personas = clientesProcessed.filter(c => c.tipoPersona === "FISICA").length

  const kpis: KPIsCarteraClientes = {
    totalClientes,
    porcentajePersonas: totalClientes > 0 ? Math.round((personas / totalClientes) * 100) : 0,
    porcentajeEmpresas: totalClientes > 0 ? Math.round(((totalClientes - personas) / totalClientes) * 100) : 0,
    tasaRecurrencia: totalClientes > 0
      ? Math.round(clientesProcessed.filter(c => c.casosTotal >= 2).length / totalClientes * 100) : 0,
    capitalEnCartera: clientesProcessed.reduce((sum, c) => sum + c.capitalEnLitigio, 0),
    clientesInactivos: clientesProcessed.filter(c => !c.estaActivo).length,
  }

  return {
    kpis,
    clientes: clientesProcessed,
    distribucion: Array.from(abogadoMap.values()),
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CarteraClientesPage({ searchParams }: PageProps) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const userRol = user.rol?.toUpperCase()
  // Defensa en profundidad — bloquear roles no operativos
  if (userRol === 'CLIENTE' || userRol === 'ADMIN') notFound()
  if (userRol === 'ASISTENTE') redirect("/reportes")

  const params = await searchParams

  const vistaParam = typeof params.vista === "string" ? params.vista : undefined
  const vistaGerencial = vistaParam === "gerencial"

  const filtroTipo = typeof params.tipo === "string" ? params.tipo : "todos"
  const filtroEstado = typeof params.estado === "string" ? params.estado : "todos"
  const filtroBusqueda = typeof params.q === "string" ? params.q : ""
  const filtroAbogado = typeof params.abogado === "string" ? params.abogado : "todos"

  // Lista abogados para filtros (solo Admin)
  let listaAbogados: { id: string; nombre: string }[] = []
  if (userRol === 'ADMIN') {
    const abogadosDb = await prisma.user.findMany({
      where: { rol: 'ABOGADO', isActive: true },
      select: { id: true, nombre: true, apellido: true },
      orderBy: { nombre: 'asc' }
    })
    listaAbogados = abogadosDb.map(a => ({
      id: a.id,
      nombre: `${a.nombre || ''} ${a.apellido || ''}`.trim()
    }))
  }

  // Abogado id para filtro personal
  const abogadoIdFiltro = userRol === 'ABOGADO'
    ? user.id
    : (filtroAbogado !== "todos" && listaAbogados.some(a => a.id === filtroAbogado))
      ? filtroAbogado
      : undefined

  // Ejecutar solo la query que corresponde
  const [datosPersonal, datosGerencial] = await Promise.all([
    !vistaGerencial
      ? getCarteraClientes(abogadoIdFiltro)
      : Promise.resolve(null),
    vistaGerencial
      ? getCarteraGerencial()
      : Promise.resolve(null),
  ])

  // Filtros aplicados en memoria (solo vista personal)
  let clientesFiltrados = datosPersonal?.clientes ?? []
  if (filtroTipo !== "todos") clientesFiltrados = clientesFiltrados.filter(c => c.tipoPersona === filtroTipo)
  if (filtroEstado === "activos") clientesFiltrados = clientesFiltrados.filter(c => c.estaActivo)
  else if (filtroEstado === "inactivos") clientesFiltrados = clientesFiltrados.filter(c => !c.estaActivo && c.casosTotal > 0)
  if (filtroBusqueda) {
    const q = filtroBusqueda.toLowerCase()
    clientesFiltrados = clientesFiltrados.filter(c => c.nombre.toLowerCase().includes(q))
  }

  const clientesActivos = clientesFiltrados
    .filter(c => c.estaActivo)
    .sort((a, b) => b.capitalEnLitigio - a.capitalEnLitigio || b.casosTotal - a.casosTotal)

  const clientesInactivos = clientesFiltrados
    .filter(c => !c.estaActivo && c.casosTotal > 0)
    .sort((a, b) => {
      const diasA = a.ultimoMovimiento ? differenceInDays(new Date(), new Date(a.ultimoMovimiento)) : 9999
      const diasB = b.ultimoMovimiento ? differenceInDays(new Date(), new Date(b.ultimoMovimiento)) : 9999
      return diasB - diasA
    })

  const todosLosClientes = [...clientesFiltrados, ...(datosPersonal?.clientesSinCasos ?? [])]
  const kpisAjustados = datosPersonal ? {
    ...datosPersonal.kpis,
    totalClientes: todosLosClientes.length,
    porcentajePersonas: todosLosClientes.length > 0
      ? Math.round(todosLosClientes.filter(c => c.tipoPersona === 'FISICA').length / todosLosClientes.length * 100) : 0,
    porcentajeEmpresas: todosLosClientes.length > 0
      ? Math.round(todosLosClientes.filter(c => c.tipoPersona === 'JURIDICA').length / todosLosClientes.length * 100) : 0,
    tasaRecurrencia: todosLosClientes.length > 0
      ? Math.round(todosLosClientes.filter(c => c.casosTotal >= 2).length / todosLosClientes.length * 100) : 0,
    capitalEnCartera: todosLosClientes.reduce((sum, c) => sum + c.capitalEnLitigio, 0),
    clientesInactivos: todosLosClientes.filter(c => !c.estaActivo && c.casosTotal > 0).length,
  } : datosGerencial!.kpis

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
                    <Users className="h-6 w-6 text-indigo-600" />
                    Análisis de cartera de clientes
                  </h1>
                  <p className="text-sm text-slate-500">
                    {vistaGerencial
                      ? "Clientes del estudio: fidelización, valor y distribución por abogado"
                      : userRol === 'ABOGADO'
                        ? "Perfil de tu cartera de clientes: recurrencia, capital y actividad"
                        : "Perfil de la base de clientes del estudio: recurrencia, capital y actividad"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Toggle */}
            <div className="mb-6">
              <ToggleVistaClientes vistaActual={vistaGerencial ? 'gerencial' : 'personal'} />
            </div>

            {/* ── VISTA PERSONAL ── */}
            {!vistaGerencial && datosPersonal && (
              <>
                <div className="mb-6">
                  <FiltrosClientes
                    abogados={listaAbogados}
                    mostrarFiltroAbogado={userRol === 'ADMIN'}
                  />
                </div>

                <KPIsClientes data={kpisAjustados} esGerencial={true} />

                <TablaClientes
                  clientesRecurrentes={clientesActivos}
                  clientesInactivos={clientesInactivos}
                  clientesSinCasos={datosPersonal.clientesSinCasos}
                  esGerencial={true}
                />

                {/* Paneles complementarios */}
                <PanelClientesValiosos clientes={clientesActivos} />
                <PanelClientesEnRiesgo clientes={clientesInactivos} />
              </>
            )}

            {/* ── VISTA GERENCIAL ── */}
            {vistaGerencial && datosGerencial && (
              <>
                <KPIsClientes data={datosGerencial.kpis} esGerencial={true} />
                <VistaGerencialClientes
                  clientes={datosGerencial.clientes}
                  distribucion={datosGerencial.distribucion}
                />
              </>
            )}

            {/* Nota metodológica */}
            <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 mb-1">Metodología del Reporte</p>
              <p className="text-xs text-slate-500">
                <strong>Cliente activo:</strong> tiene al menos 1 caso no cerrado.{" "}
                <strong>Cliente inactivo:</strong> todos sus casos están cerrados o archivados.{" "}
                <strong>Recurrencia:</strong> Único (1 caso), Recurrente (2-4 casos), Frecuente (5+ casos).{" "}
                <strong>Capital en litigio:</strong> suma de montos en disputa de los expedientes activos del cliente.{" "}
                <strong>Antigüedad:</strong> desde la fecha de alta del cliente en el sistema.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}