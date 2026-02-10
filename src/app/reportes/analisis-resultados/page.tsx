// app/reportes/analisis-resultados/page.tsx
// REPORTE REP-EST-02 / TAC-09: Análisis de Resultados (Tasa de Éxito)
// Qué responde: ¿Cómo terminan nuestros juicios? ¿Cuánto recuperamos? ¿Qué tan efectivos somos?

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { differenceInDays } from "date-fns"
import { ArrowLeft, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

// Componentes Client
import { KPICards } from "./components/KPICards"
import { TablaMotivos } from "./components/TablaMotivos"
import { TablaFueroResultados } from "./components/TablaFueroResultados"
import { PanelInsights } from "./components/PanelInsights"

// ============================================================================
// MAPEO DE TIPOS DE CASO A LABELS LEGIBLES
// ============================================================================

const TIPO_CASO_LABELS: Record<string, string> = {
  LABORAL: "Laboral",
  CIVIL_COMERCIAL: "Civil y Comercial",
  FAMILIA: "Familia",
  PENAL: "Penal",
  SUCESIONES: "Sucesiones",
  CONTENCIOSO_ADMINISTRATIVO: "Contencioso Adm.",
  OTRO: "Otro",
}

// Motivos que cuentan como "éxito"
const MOTIVOS_EXITOSOS = ["Sentencia favorable", "Acuerdo/Conciliación"]

// ============================================================================
// FUNCIONES DE DATOS
// ============================================================================

async function getAnalisisResultados(userId: string, esAdmin: boolean) {
  const whereClause = esAdmin ? {} : { abogadoId: userId }

  // Obtener todos los casos cerrados con datos completos
  const casosCerrados = await prisma.caso.findMany({
    where: {
      ...whereClause,
      estaCerrado: true,
    },
    select: {
      id: true,
      numero: true,
      titulo: true,
      tipo: true,
      motivoCierre: true,
      montoDisputa: true,
      montoFinal: true,
      fechaInicio: true,
      fechaCierre: true,
      abogado: {
        select: { nombre: true, apellido: true }
      }
    },
    orderBy: { fechaCierre: "desc" },
  })

  const totalCerrados = casosCerrados.length

  if (totalCerrados === 0) {
    return {
      kpis: { totalCerrados: 0, tasaExito: 0, tasaRecupero: 0, promedioDiasCierre: 0 },
      motivoRows: [],
      fueroRows: [],
      insights: {
        motivoMasRapido: null, motivoMasLento: null, motivoMejorRecupero: null,
        fueroPredominante: null, acuerdosVsSentencias: { acuerdosDias: 0, sentenciasDias: 0, acuerdosRecupero: 0, sentenciasRecupero: 0, hayDatos: false },
      },
    }
  }

  // ========== KPIs GLOBALES ==========
  const casosExitosos = casosCerrados.filter((c) => c.motivoCierre && MOTIVOS_EXITOSOS.includes(c.motivoCierre)).length
  const tasaExito = Math.round((casosExitosos / totalCerrados) * 100)

  const montoReclamadoTotal = casosCerrados.reduce((s, c) => s + (c.montoDisputa ? Number(c.montoDisputa) : 0), 0)
  const montoObtenidoTotal = casosCerrados.reduce((s, c) => s + (c.montoFinal ? Number(c.montoFinal) : 0), 0)
  const tasaRecupero = montoReclamadoTotal > 0 ? Math.round((montoObtenidoTotal / montoReclamadoTotal) * 100) : 0

  const diasCierreArr = casosCerrados
    .filter((c) => c.fechaCierre)
    .map((c) => differenceInDays(c.fechaCierre!, c.fechaInicio))
    .filter((d) => d > 0)
  const promedioDiasCierre = diasCierreArr.length > 0 ? Math.round(diasCierreArr.reduce((a, b) => a + b, 0) / diasCierreArr.length) : 0

  // ========== AGRUPACIÓN POR MOTIVO DE CIERRE ==========
  const porMotivo: Record<string, typeof casosCerrados> = {}
  for (const caso of casosCerrados) {
    const motivo = caso.motivoCierre || "Sin especificar"
    if (!porMotivo[motivo]) porMotivo[motivo] = []
    porMotivo[motivo].push(caso)
  }

  const motivoRows = Object.entries(porMotivo)
    .map(([motivo, casos]) => {
      const cantidad = casos.length
      const porcentaje = Math.round((cantidad / totalCerrados) * 100)
      const reclamado = casos.reduce((s, c) => s + (c.montoDisputa ? Number(c.montoDisputa) : 0), 0)
      const obtenido = casos.reduce((s, c) => s + (c.montoFinal ? Number(c.montoFinal) : 0), 0)
      const recupero = reclamado > 0 ? Math.round((obtenido / reclamado) * 100) : 0
      const dias = casos.filter((c) => c.fechaCierre).map((c) => differenceInDays(c.fechaCierre!, c.fechaInicio)).filter((d) => d > 0)
      const promDias = dias.length > 0 ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : 0

      return {
        motivo,
        cantidad,
        porcentaje,
        montoReclamadoTotal: reclamado,
        montoObtenidoTotal: obtenido,
        tasaRecupero: recupero,
        promedioDias: promDias,
        casos: casos.map((c) => {
          const diasDuracion = c.fechaCierre ? differenceInDays(c.fechaCierre, c.fechaInicio) : 0
          const abogadoNombre = c.abogado.nombre && c.abogado.apellido
            ? `${c.abogado.nombre} ${c.abogado.apellido}`
            : c.abogado.nombre || "Sin asignar"
          return {
            id: c.id,
            numero: c.numero,
            titulo: c.titulo,
            tipo: c.tipo,
            tipoLabel: TIPO_CASO_LABELS[c.tipo] || c.tipo,
            montoDisputa: c.montoDisputa ? Number(c.montoDisputa) : 0,
            montoFinal: c.montoFinal ? Number(c.montoFinal) : 0,
            diasDuracion,
            fechaCierre: c.fechaCierre ? c.fechaCierre.toLocaleDateString("es-AR") : "—",
            abogadoNombre,
          }
        }),
      }
    })
    .sort((a, b) => b.cantidad - a.cantidad)

  // ========== AGRUPACIÓN POR FUERO ==========
  const porFuero: Record<string, typeof casosCerrados> = {}
  for (const caso of casosCerrados) {
    const tipo = caso.tipo
    if (!porFuero[tipo]) porFuero[tipo] = []
    porFuero[tipo].push(caso)
  }

  const fueroRows = Object.entries(porFuero)
    .map(([tipo, casos]) => {
      const totalF = casos.length
      const favorables = casos.filter((c) => c.motivoCierre === "Sentencia favorable").length
      const acuerdos = casos.filter((c) => c.motivoCierre === "Acuerdo/Conciliación").length
      const desfavorables = casos.filter((c) => c.motivoCierre === "Sentencia desfavorable").length
      const otros = totalF - favorables - acuerdos - desfavorables
      const tasaExitoFuero = totalF > 0 ? Math.round(((favorables + acuerdos) / totalF) * 100) : 0
      const dias = casos.filter((c) => c.fechaCierre).map((c) => differenceInDays(c.fechaCierre!, c.fechaInicio)).filter((d) => d > 0)
      const promDias = dias.length > 0 ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : 0

      return {
        tipoLabel: TIPO_CASO_LABELS[tipo] || tipo,
        totalCerrados: totalF,
        favorables,
        acuerdos,
        desfavorables,
        otros,
        tasaExito: tasaExitoFuero,
        promedioDias: promDias,
      }
    })
    .sort((a, b) => b.totalCerrados - a.totalCerrados)

  // ========== INSIGHTS ==========
  const motivosConDias = motivoRows.filter((m) => m.promedioDias > 0)
  const motivoMasRapido = motivosConDias.length > 0
    ? { motivo: motivosConDias.sort((a, b) => a.promedioDias - b.promedioDias)[0].motivo, dias: motivosConDias.sort((a, b) => a.promedioDias - b.promedioDias)[0].promedioDias }
    : null
  const motivoMasLento = motivosConDias.length > 0
    ? { motivo: motivosConDias.sort((a, b) => b.promedioDias - a.promedioDias)[0].motivo, dias: motivosConDias.sort((a, b) => b.promedioDias - a.promedioDias)[0].promedioDias }
    : null

  const motivosConRecupero = motivoRows.filter((m) => m.tasaRecupero > 0)
  const motivoMejorRecupero = motivosConRecupero.length > 0
    ? { motivo: motivosConRecupero.sort((a, b) => b.tasaRecupero - a.tasaRecupero)[0].motivo, tasa: motivosConRecupero.sort((a, b) => b.tasaRecupero - a.tasaRecupero)[0].tasaRecupero }
    : null

  const fueroPredominante = fueroRows.length > 0
    ? { tipo: fueroRows[0].tipoLabel, cantidad: fueroRows[0].totalCerrados }
    : null

  // Comparativa Acuerdos vs Sentencias
  const acuerdosData = motivoRows.find((m) => m.motivo === "Acuerdo/Conciliación")
  const sentenciasData = motivoRows.find((m) => m.motivo === "Sentencia favorable")
  const acuerdosVsSentencias = {
    acuerdosDias: acuerdosData?.promedioDias || 0,
    sentenciasDias: sentenciasData?.promedioDias || 0,
    acuerdosRecupero: acuerdosData?.tasaRecupero || 0,
    sentenciasRecupero: sentenciasData?.tasaRecupero || 0,
    hayDatos: !!(acuerdosData && sentenciasData),
  }

  return {
    kpis: { totalCerrados, tasaExito, tasaRecupero, promedioDiasCierre },
    motivoRows,
    fueroRows,
    insights: { motivoMasRapido, motivoMasLento, motivoMejorRecupero, fueroPredominante, acuerdosVsSentencias },
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default async function AnalisisResultadosPage() {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const esAdmin = user.rol?.toUpperCase() === "ADMIN"

  const { kpis, motivoRows, fueroRows, insights } = await getAnalisisResultados(user.id, esAdmin)

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
                    <Trophy className="h-6 w-6 text-amber-500" />
                    Análisis de Resultados
                  </h1>
                  <p className="text-sm text-slate-500">
                    Tasa de éxito, recupero económico y duración de los casos cerrados
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
                {esAdmin ? "Vista General" : "Mis Resultados"}
              </span>
            </div>

            {/* SECCIÓN 1: KPIs */}
            <KPICards data={kpis} />

            {/* SECCIÓN 2: Tabla por motivo de cierre */}
            {motivoRows.length > 0 ? (
              <TablaMotivos data={motivoRows} />
            ) : (
              <div className="p-8 bg-white border border-slate-200 rounded-lg text-center mb-6">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No hay casos cerrados para analizar</p>
                <p className="text-sm text-slate-400 mt-1">
                  Los resultados aparecerán cuando se cierren expedientes con el sistema de cierre formal.
                </p>
              </div>
            )}

            {/* SECCIÓN 3: Resultados por fuero */}
            {fueroRows.length > 0 && <TablaFueroResultados data={fueroRows} />}

            {/* SECCIÓN 4: Insights automáticos */}
            {motivoRows.length > 0 && <PanelInsights data={insights} />}

            {/* Nota informativa */}
            <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-600">
                <strong>Criterios del reporte:</strong> Tasa de éxito = (Sentencias favorables + Acuerdos) / Total cerrados |
                Tasa de recupero = Monto obtenido / Monto reclamado original |
                Solo incluye casos con cierre formal registrado |
                {!esAdmin && " Los datos reflejan únicamente tus casos."}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}