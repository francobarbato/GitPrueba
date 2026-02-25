// app/reportes/rendimiento/page.tsx
// Actividad y Resultados por Abogado
//
// Visibilidad por rol:
//   - Admin: KPIs globales + tabla todos los abogados + expandible completo (sin lista de casos)
//   - Abogado: Toggle Vista Personal / Vista General
//     - Personal: sus KPIs + carga + cierres con lista de casos | filtro Desde/Hasta
//     - General: KPIs globales + tabla resumen (solo expande su fila) | filtro por período
//   - Asistente: No accede

import React from "react"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { ArrowLeft, BarChart3, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import prisma from "src/lib/db/prisma"

import { ReportesService } from "@/lib/aplication/services/reportes.service"

import { KPIsRendimiento } from "./components/KPIsRendimiento"
import { TablaActividad } from "./components/TablaActividad"
import { VistaPersonal } from "./components/VistaPersonal"
import { FiltrosGeneral } from "./components/FiltroGeneral"
import { FiltrosPersonal } from "./components/FiltrosPersonal"
import { ToggleVista } from "./components/ToggleVista"

const reportesService = new ReportesService()

const isAdmin = (rol: string) => rol?.toUpperCase() === 'ADMIN'
const isAbogado = (rol: string) => rol?.toUpperCase() === 'ABOGADO'

async function obtenerTiposCaso(): Promise<string[]> {
  const casos = await prisma.caso.findMany({
    where: { estaCerrado: true },
    select: { tipo: true },
    distinct: ['tipo']
  })
  return casos.map(c => c.tipo).filter(Boolean) as string[]
}

export default async function RendimientoPage({
  searchParams
}: {
  searchParams: {
    periodo?: string
    tipo?: string
    vista?: string
    desde?: string
    hasta?: string
  }
}) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const userRol = user.rol?.toUpperCase() || ''
  if (userRol === 'ASISTENTE') redirect("/reportes")

  const vistaActual = searchParams.vista || (isAbogado(userRol) ? 'personal' : 'general')
  const filtroTipo = searchParams.tipo
  const tiposDisponibles = await obtenerTiposCaso()

  const esVistaPersonal = isAbogado(userRol) && vistaActual === 'personal'

  // ===== Obtener datos según vista =====

  // Vista general: siempre con período predefinido
  const periodo = searchParams.periodo || '90'
  const datosGlobales = await reportesService.getActividadResultados({
    periodo,
    filtroTipo
  })

  // Vista personal: con rango de fechas o período por defecto
  let datosPersonales = null
  if (esVistaPersonal) {
    const personal = await reportesService.getActividadResultados({
      desde: searchParams.desde,
      hasta: searchParams.hasta,
      periodo: (!searchParams.desde && !searchParams.hasta) ? '90' : undefined,
      filtroTipo,
      abogadoId: user.id
    })
    datosPersonales = personal.abogados.length > 0 ? personal.abogados[0] : null
  }

  // Texto descriptivo
  const periodoTexto = {
    '90': 'últimos 90 días',
    '180': 'últimos 6 meses',
    '365': 'último año'
  }[periodo] || 'últimos 90 días'

  const rangoTexto = searchParams.desde && searchParams.hasta
    ? `${searchParams.desde} al ${searchParams.hasta}`
    : periodoTexto

  const sinDatos = esVistaPersonal
    ? !datosPersonales || (datosPersonales.casosCerrados === 0 && datosPersonales.casosActivos === 0)
    : datosGlobales.kpis.casosCerrados === 0 && datosGlobales.abogados.every(a => a.casosActivos === 0)

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
                    <BarChart3 className="h-6 w-6 text-emerald-600" />
                    Actividad y resultados por abogado
                  </h1>
                  <p className="text-sm text-slate-500">
                    {esVistaPersonal
                      ? `Tu actividad y resultados — ${rangoTexto}`
                      : `Cierres, resultados y carga del equipo — ${periodoTexto}`
                    }
                  </p>
                </div>
              </div>

              {isAbogado(userRol) ? (
                <ToggleVista vistaActual={vistaActual} />
              ) : (
                <span className="text-xs font-medium px-3 py-1.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                  Vista General
                </span>
              )}
            </div>

            {/* Filtros según vista */}
            {esVistaPersonal ? (
              <FiltrosPersonal
                desdeActual={searchParams.desde}
                hastaActual={searchParams.hasta}
                tiposDisponibles={tiposDisponibles}
                tipoActual={filtroTipo}
              />
            ) : (
              <FiltrosGeneral
                periodoActual={periodo}
                tiposDisponibles={tiposDisponibles}
                tipoActual={filtroTipo}
              />
            )}

            {sinDatos ? (
              <Card className="p-12 text-center border-slate-200">
                <AlertTriangle className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">
                  No hay datos para mostrar
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  Probá seleccionando un período más amplio o quitando los filtros.
                </p>
              </Card>
            ) : (
              <>
                {/* VISTA PERSONAL */}
                {esVistaPersonal && datosPersonales && (
                  <VistaPersonal datos={datosPersonales} />
                )}

                {/* VISTA GENERAL */}
                {vistaActual === 'general' && (
                  <>
                    <KPIsRendimiento data={datosGlobales.kpis} />
                    <TablaActividad
                      data={datosGlobales.abogados}
                      userId={isAbogado(userRol) ? user.id : undefined}
                    />
                  </>
                )}
              </>
            )}

            {/* Nota metodológica */}
            <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                📖 Metodología del Reporte
              </p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li><strong>Tasa de éxito:</strong> Porcentaje de casos con resultado favorable (sentencias favorables + acuerdos/conciliaciones) sobre el total de cerrados en el período.</li>
                <li><strong>Valor recuperado:</strong> Suma de montos finales obtenidos. El porcentaje de recuperación compara contra los montos en disputa originales.</li>
                <li><strong>Carga actual:</strong> Cantidad de casos activos al día de hoy, independiente del período seleccionado.</li>
                <li><strong>Sobre los resultados:</strong> La tasa de éxito refleja los cierres registrados y no contempla factores como complejidad del caso, jurisdicción, instancia o contexto procesal que pueden incidir en el resultado.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}