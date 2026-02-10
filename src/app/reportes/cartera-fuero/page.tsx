// app/reportes/cartera-fuero/page.tsx
// REPORTE EST-14: Composición de Cartera por Fuero (Strategic Portfolio Analysis)
// Qué responde: ¿Somos un estudio de volumen o de valor? ¿Dónde está el dinero?

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { differenceInDays, subDays } from "date-fns"
import { ArrowLeft, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"

// Componentes Client
import { KPICards } from "./components/KPICards"
import { MatrizFuero } from "./components/MatrizFuero"
import { PanelLitigiosidad } from "./components/Panellitigiosidad"

// ============================================================================
// MAPEO DE TIPOS DE CASO A LABELS LEGIBLES
// ============================================================================

const TIPO_CASO_LABELS: Record<string, string> = {
  LABORAL: "Laboral",
  CIVIL_COMERCIAL: "Civil y Comercial",
  FAMILIA: "Familia",
  PENAL: "Penal",
  SUCESIONES: "Sucesiones",
  CONTENCIOSO_ADMINISTRATIVO: "Contencioso Administrativo",
  OTRO: "Otro",
}

// Clasificación de etapas procesales
const ETAPAS_TEMPRANAS = ["Inicio / Demanda", "Mediación / Previo"]
const ETAPAS_MEDIAS = ["Prueba (Oficios/Pericias)", "Alegatos / Conclusiones"]
const ETAPAS_TARDIAS = ["Sentencia de 1ra Instancia", "Apelación / 2da Instancia", "Ejecución de Sentencia"]

// ============================================================================
// FUNCIONES DE DATOS (Server-side, consulta directa a Prisma)
// ============================================================================

async function getCarteraPorFuero(userId: string, esAdmin: boolean) {
  const whereClause = esAdmin ? {} : { abogadoId: userId }
  const hoy = new Date()
  const hace30Dias = subDays(hoy, 30)

  // 1. Obtener todos los casos activos con datos necesarios
  const casosActivos = await prisma.caso.findMany({
    where: {
      ...whereClause,
      estaCerrado: false,
      estado: { notIn: ["Cerrado", "Archivado", "CERRADO", "ARCHIVADO"] },
    },
    select: {
      id: true,
      tipo: true,
      estado: true,
      montoDisputa: true,
      updatedAt: true,
    },
  })

  // 2. Obtener casos cerrados para calcular promedio de días de cierre por fuero
  const casosCerrados = await prisma.caso.findMany({
    where: {
      ...whereClause,
      estaCerrado: true,
      fechaCierre: { not: null },
    },
    select: {
      tipo: true,
      fechaInicio: true,
      fechaCierre: true,
    },
  })

  // 3. Agrupar por tipo de caso
  const totalActivos = casosActivos.length

  const agrupado: Record<string, typeof casosActivos> = {}
  for (const caso of casosActivos) {
    const tipo = caso.tipo
    if (!agrupado[tipo]) agrupado[tipo] = []
    agrupado[tipo].push(caso)
  }

  const cerradosPorTipo: Record<string, number[]> = {}
  for (const caso of casosCerrados) {
    const tipo = caso.tipo
    if (!cerradosPorTipo[tipo]) cerradosPorTipo[tipo] = []
    if (caso.fechaCierre) {
      const dias = differenceInDays(caso.fechaCierre, caso.fechaInicio)
      if (dias > 0) cerradosPorTipo[tipo].push(dias)
    }
  }

  // 4. Construir filas de la matriz
  const filas = Object.entries(agrupado)
    .map(([tipo, casos]) => {
      const cantidad = casos.length
      const pesoVolumen = totalActivos > 0 ? Math.round((cantidad / totalActivos) * 100) : 0

      const capitalEnLitigio = casos.reduce((sum, c) => {
        const monto = c.montoDisputa ? Number(c.montoDisputa) : 0
        return sum + monto
      }, 0)

      const ticketPromedio = cantidad > 0 ? Math.round(capitalEnLitigio / cantidad) : 0

      const casosConActividad = casos.filter((c) => c.updatedAt >= hace30Dias).length
      const tasaActividad = cantidad > 0 ? Math.round((casosConActividad / cantidad) * 100) : 0

      const diasCierreArr = cerradosPorTipo[tipo] || []
      const promedioDiasCierre =
        diasCierreArr.length > 0
          ? Math.round(diasCierreArr.reduce((a, b) => a + b, 0) / diasCierreArr.length)
          : null

      const conteoEtapas: Record<string, number> = {}
      for (const c of casos) {
        conteoEtapas[c.estado] = (conteoEtapas[c.estado] || 0) + 1
      }
      const distribucionEtapas = Object.entries(conteoEtapas)
        .map(([etapa, cant]) => ({
          etapa,
          cantidad: cant,
          porcentaje: Math.round((cant / cantidad) * 100),
        }))
        .sort((a, b) => b.cantidad - a.cantidad)

      return {
        tipo,
        tipoLabel: TIPO_CASO_LABELS[tipo] || tipo,
        cantidad,
        pesoVolumen,
        capitalEnLitigio,
        ticketPromedio,
        tasaActividad,
        promedioDiasCierre,
        distribucionEtapas,
      }
    })
    .sort((a, b) => b.capitalEnLitigio - a.capitalEnLitigio)

  // 5. KPIs globales
  const capitalTotal = filas.reduce((s, r) => s + r.capitalEnLitigio, 0)
  const ticketGlobal = totalActivos > 0 ? Math.round(capitalTotal / totalActivos) : 0
  const fueroMasVolumen = filas.length > 0 ? [...filas].sort((a, b) => b.cantidad - a.cantidad)[0].tipoLabel : "—"
  const fueroMasValor = filas.length > 0 ? filas[0].tipoLabel : "—"

  // 6. Datos de litigiosidad (pipeline)
  let etapaTemprana = 0
  let etapaMedia = 0
  let etapaTardia = 0

  for (const caso of casosActivos) {
    if (ETAPAS_TEMPRANAS.includes(caso.estado)) etapaTemprana++
    else if (ETAPAS_MEDIAS.includes(caso.estado)) etapaMedia++
    else if (ETAPAS_TARDIAS.includes(caso.estado)) etapaTardia++
    else etapaTemprana++
  }

  return {
    kpis: {
      totalCasosActivos: totalActivos,
      capitalTotalEnLitigio: capitalTotal,
      ticketPromedioGlobal: ticketGlobal,
      fueroConMasVolumen: fueroMasVolumen,
      fueroConMasValor: fueroMasValor,
    },
    filas,
    litigiosidad: {
      etapaTemprana,
      etapaMedia,
      etapaTardia,
      totalActivos,
    },
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL (Server Component)
// ============================================================================

export default async function CarteraFueroPage() {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const esAdmin = user.rol?.toUpperCase() === "ADMIN"

  const { kpis, filas, litigiosidad } = await getCarteraPorFuero(user.id, esAdmin)

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
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
                    <Scale className="h-6 w-6 text-indigo-600" />
                    Composición de Cartera por Fuero
                  </h1>
                  <p className="text-sm text-slate-500">
                    Análisis estratégico: volumen de trabajo vs. valor económico por materia
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                  esAdmin
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {esAdmin ? "Vista Gerencial" : "Vista Personal"}
              </span>
            </div>

            {/* SECCIÓN 1: KPIs */}
            <KPICards data={kpis} />

            {/* SECCIÓN 2: Matriz Principal */}
            {filas.length > 0 ? (
              <MatrizFuero data={filas} />
            ) : (
              <div className="p-8 bg-white border border-slate-200 rounded-lg text-center">
                <p className="text-slate-500">No hay casos activos para analizar.</p>
              </div>
            )}

            {/* SECCIÓN 3: Pipeline / Litigiosidad */}
            {litigiosidad.totalActivos > 0 && <PanelLitigiosidad data={litigiosidad} />}

            {/* Nota informativa */}
            <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-600">
                <strong>Criterios del reporte:</strong> Solo incluye casos activos (no cerrados ni archivados) |
                Capital en litigio = suma de montoDisputa | Tasa de actividad = casos con movimiento en últimos 30 días |
                Promedio de cierre = calculado sobre casos históricos cerrados del mismo fuero |
                {!esAdmin && " Los datos reflejan únicamente tus casos asignados."}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}