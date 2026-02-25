// app/reportes/cartera-clientes/page.tsx
// REPORTE ES-12: Análisis de Cartera de Clientes
// Qué responde: ¿Quiénes son nuestros clientes? ¿Cuánto capital mueven? ¿Quiénes están inactivos?
// Visibilidad: Admin + Abogado (completo con montos) | Asistente (operativo, sin montos)

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { differenceInDays } from "date-fns"
import { ArrowLeft, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

// Componentes
import { KPIsClientes } from "./components/KPIsClientes"
import { FiltrosClientes } from "./components/FiltrosClientes"
import { TablaClientes } from "./components/TablaClientes"

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
  capitalEnLitigio: number      // suma montoDisputa de activos
  capitalRecuperado: number     // suma montoFinal de cerrados
  capitalHistorico: number      // suma montoDisputa de cerrados
  ultimoMovimiento: string | null
  ultimoMovimientoLabel: string
  tiempoInactivoLabel: string   // solo para inactivos
  ultimoCierreLabel: string     // solo para inactivos
  abogadoResponsable: string    // abogado del caso más reciente
  estaActivo: boolean           // tiene al menos 1 caso no cerrado
  categoriaCantidad: string     // 'unico' | 'recurrente' | 'frecuente'
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
// MAPEOS
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
// FUNCIÓN DE DATOS
// ============================================================================

async function getCarteraClientes() {
  const hoy = new Date()

  // Traer todos los clientes con sus casos y abogado del caso más reciente
  const clientes = await prisma.cliente.findMany({
    include: {
      casos: {
        select: {
          id: true,
          estado: true,
          estaCerrado: true,
          montoDisputa: true,
          montoFinal: true,
          fechaCierre: true,
          updatedAt: true,
          abogado: {
            select: { nombre: true, apellido: true }
          }
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  })

  // Procesar cada cliente
  const clientesProcessed: ClienteReporte[] = clientes.map((cliente) => {
    const casosTotal = cliente.casos.length
    const casosActivos = cliente.casos.filter((c) => !c.estaCerrado).length
    const casosCerrados = casosTotal - casosActivos
    const estaActivo = casosActivos > 0

    // Antigüedad desde creación del cliente
    const antiguedadDias = differenceInDays(hoy, cliente.createdAt)

    // Capital en litigio (activos)
    const capitalEnLitigio = cliente.casos
      .filter((c) => !c.estaCerrado && c.montoDisputa)
      .reduce((sum, c) => sum + Number(c.montoDisputa), 0)

    // Capital recuperado (cerrados con montoFinal)
    const capitalRecuperado = cliente.casos
      .filter((c) => c.estaCerrado && c.montoFinal)
      .reduce((sum, c) => sum + Number(c.montoFinal), 0)

    // Capital histórico (montoDisputa de cerrados)
    const capitalHistorico = cliente.casos
      .filter((c) => c.estaCerrado && c.montoDisputa)
      .reduce((sum, c) => sum + Number(c.montoDisputa), 0)

    // Último movimiento (updatedAt del caso más reciente)
    const ultimoMovimientoDate = cliente.casos.length > 0 ? cliente.casos[0].updatedAt : null
    const diasDesdeUltimoMov = ultimoMovimientoDate ? differenceInDays(hoy, ultimoMovimientoDate) : 0
    const ultimoMovimientoLabel = ultimoMovimientoDate
      ? diasDesdeUltimoMov === 0
        ? "Hoy"
        : diasDesdeUltimoMov === 1
        ? "Ayer"
        : `Hace ${formatTiempoInactivo(diasDesdeUltimoMov)}`
      : "Sin movimientos"
    const ultimoMovimiento = ultimoMovimientoDate?.toISOString() ?? null

    // Para inactivos: último cierre y tiempo inactivo
    const ultimoCierre = cliente.casos
      .filter((c) => c.estaCerrado && c.fechaCierre)
      .sort((a, b) => (b.fechaCierre!.getTime() - a.fechaCierre!.getTime()))[0]
    const ultimoCierreLabel = ultimoCierre?.fechaCierre
      ? ultimoCierre.fechaCierre.toLocaleDateString("es-AR", { month: "short", year: "numeric" })
      : "—"
    const diasInactivo = ultimoCierre?.fechaCierre
      ? differenceInDays(hoy, ultimoCierre.fechaCierre)
      : 0
    const tiempoInactivoLabel = !estaActivo && diasInactivo > 0
      ? formatTiempoInactivo(diasInactivo)
      : "—"

    // Abogado responsable (del caso más reciente)
    const casoReciente = cliente.casos[0]
    const abogadoResponsable = casoReciente?.abogado
      ? `${casoReciente.abogado.nombre || ""} ${casoReciente.abogado.apellido || ""}`.trim()
      : "Sin asignar"

    // Nombre completo
    const nombre = cliente.tipoPersona === "JURIDICA"
      ? cliente.nombre
      : `${cliente.nombre}${cliente.apellido ? ` ${cliente.apellido}` : ""}`

    // Categoría por cantidad de casos
    let categoriaCantidad: string
    if (casosTotal >= 5) categoriaCantidad = "frecuente"
    else if (casosTotal >= 2) categoriaCantidad = "recurrente"
    else categoriaCantidad = "unico"

    return {
      id: cliente.id,
      nombre,
      tipoPersona: cliente.tipoPersona,
      tipoPersonaLabel: TIPO_PERSONA_LABELS[cliente.tipoPersona] || cliente.tipoPersona,
      antiguedadDias,
      antiguedadLabel: formatAntiguedad(antiguedadDias),
      casosTotal,
      casosActivos,
      casosCerrados,
      capitalEnLitigio,
      capitalRecuperado,
      capitalHistorico,
      ultimoMovimiento,
      ultimoMovimientoLabel,
      tiempoInactivoLabel,
      ultimoCierreLabel,
      abogadoResponsable,
      estaActivo,
      categoriaCantidad,
    }
  })

  // ========== KPIs ==========
  const totalClientes = clientesProcessed.length
  const personas = clientesProcessed.filter((c) => c.tipoPersona === "FISICA").length
  const empresas = totalClientes - personas
  const porcentajePersonas = totalClientes > 0 ? Math.round((personas / totalClientes) * 100) : 0
  const porcentajeEmpresas = totalClientes > 0 ? Math.round((empresas / totalClientes) * 100) : 0

  const clientesRecurrentes = clientesProcessed.filter((c) => c.casosTotal >= 2).length
  const tasaRecurrencia = totalClientes > 0 ? Math.round((clientesRecurrentes / totalClientes) * 100) : 0

  const capitalEnCartera = clientesProcessed.reduce((sum, c) => sum + c.capitalEnLitigio, 0)
  const clientesInactivos = clientesProcessed.filter((c) => !c.estaActivo && c.casosTotal > 0).length

  const kpis: KPIsCarteraClientes = {
    totalClientes,
    porcentajePersonas,
    porcentajeEmpresas,
    tasaRecurrencia,
    capitalEnCartera,
    clientesInactivos,
  }

  return { kpis, clientes: clientesProcessed }
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

  const userRol = user.rol as string
  const esGerencial = userRol === "ADMIN" || userRol === "ABOGADO"

  const params = await searchParams
  const filtroTipo = typeof params.tipo === "string" ? params.tipo : "todos"
  const filtroEstado = typeof params.estado === "string" ? params.estado : "todos"
  const filtroBusqueda = typeof params.q === "string" ? params.q : ""

  const { kpis, clientes } = await getCarteraClientes()

  // Convertir Date a string para compatibilidad con TablaClientes
  const clientesConStringDates = clientes.map((c) => ({
    ...c,
    ultimoMovimiento: c.ultimoMovimiento ?? null,
  }))

  // Aplicar filtros server-side
  let clientesFiltrados = clientesConStringDates

  if (filtroTipo !== "todos") {
    clientesFiltrados = clientesFiltrados.filter((c) => c.tipoPersona === filtroTipo)
  }
  if (filtroEstado === "activos") {
    clientesFiltrados = clientesFiltrados.filter((c) => c.estaActivo)
  } else if (filtroEstado === "inactivos") {
    clientesFiltrados = clientesFiltrados.filter((c) => !c.estaActivo && c.casosTotal > 0)
  }
  if (filtroBusqueda) {
    const q = filtroBusqueda.toLowerCase()
    clientesFiltrados = clientesFiltrados.filter((c) => c.nombre.toLowerCase().includes(q))
  }

  // Separar para tabs
  const clientesRecurrentes = clientesFiltrados
    .filter((c) => c.casosTotal >= 2)
    .sort((a, b) => b.capitalEnLitigio - a.capitalEnLitigio || b.casosTotal - a.casosTotal)

  const clientesInactivos = clientesFiltrados
    .filter((c) => !c.estaActivo && c.casosTotal > 0)
    .sort((a, b) => {
      // Ordenar por tiempo inactivo descendente
      const diasA = a.ultimoMovimiento ? differenceInDays(new Date(), new Date(a.ultimoMovimiento)) : 9999
      const diasB = b.ultimoMovimiento ? differenceInDays(new Date(), new Date(b.ultimoMovimiento)) : 9999
      return diasB - diasA
    })

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
                    Perfil de la base de clientes del estudio: recurrencia, capital y actividad
                  </p>
                </div>
              </div>

              <span className="text-xs font-medium px-3 py-1.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                Vista General
              </span>
            </div>

            {/* Filtros */}
            <div className="mb-6">
              <FiltrosClientes />
            </div>

            {/* KPIs — solo gerencial */}
            {esGerencial && <KPIsClientes data={kpis} esGerencial={esGerencial} />}

            {/* Tabs con tablas */}
            <TablaClientes
              clientesRecurrentes={clientesRecurrentes}
              clientesInactivos={clientesInactivos}
              esGerencial={esGerencial}
            />

            {/* Nota metodológica */}
            <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 mb-1">Metodología del Reporte</p>
              <p className="text-xs text-slate-500">
                <strong>Cliente activo:</strong> tiene al menos 1 caso no cerrado.
                <strong> Cliente inactivo:</strong> todos sus casos están cerrados o archivados.
                <strong> Recurrencia:</strong> Único (1 caso), Recurrente (2-4 casos), Frecuente (5+ casos).
                <strong> Capital en litigio:</strong> suma de montos en disputa de los casos activos del cliente.
                <strong> Antigüedad:</strong> desde la fecha de alta del cliente en el sistema.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}