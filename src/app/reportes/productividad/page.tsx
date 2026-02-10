import React from "react"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { ArrowLeft, Users, TrendingUp, Filter, AlertCircle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProductividadAbogado {
  abogado: string
  abogadoId: string
  email: string
  fueros: string[]
  casosActivos: number
  casosCerrados: number
  tasaCierre: number
  promedioDias: number
  motivosRetraso: string[]
  etapaMasComun: string
  casosUrgentes: number
}

async function calcularProductividad() {
  // Obtener todos los abogados con sus casos
  const abogados = await prisma.user.findMany({
    where: {
      isActive: true
    },
    include: {
      casos: {
        include: {
          tareas: {
            where: {
              completada: false
            }
          },
          bitacoras: {
            where: {
              tipo: 'auto',
              accion: { not: null }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      }
    }
  })

  const productividad: ProductividadAbogado[] = []

  for (const abogado of abogados) {
    const casosActivos = abogado.casos.filter(c => c.estado !== 'CERRADO')
    const casosCerrados = abogado.casos.filter(c => c.estado === 'CERRADO')

    const totalCasos = abogado.casos.length
    const tasaCierre = totalCasos > 0 
      ? Math.round((casosCerrados.length / totalCasos) * 100) 
      : 0

    // Calcular promedio de días
    let totalDias = 0
    let casosConDuracion = 0

    abogado.casos.forEach(caso => {
      const inicio = new Date(caso.fechaInicio)
      const fin = caso.fechaFin ? new Date(caso.fechaFin) : new Date()
      const dias = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
      
      if (dias >= 0) {
        totalDias += dias
        casosConDuracion++
      }
    })

    const promedioDias = casosConDuracion > 0 
      ? Math.round(totalDias / casosConDuracion) 
      : 0

    // Identificar fueros más comunes
    const fuerosMap = new Map<string, number>()
    abogado.casos.forEach(caso => {
      if (caso.fuero) {
        fuerosMap.set(caso.fuero, (fuerosMap.get(caso.fuero) || 0) + 1)
      }
    })
    const fuerosTop = Array.from(fuerosMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([fuero]) => fuero)

    // Identificar etapa más común
    const estadosMap = new Map<string, number>()
    casosActivos.forEach(caso => {
      estadosMap.set(caso.estado, (estadosMap.get(caso.estado) || 0) + 1)
    })
    const etapaMasComun = Array.from(estadosMap.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    // Identificar motivos de retraso
    const motivosRetraso: string[] = []
    
    // 1. Casos con tareas vencidas
    const casosConTareasVencidas = casosActivos.filter(caso => 
      caso.tareas.some(t => {
        if (!t.fecha) return false
        return new Date(t.fecha) < new Date()
      })
    ).length

    if (casosConTareasVencidas > 0) {
      motivosRetraso.push(`${casosConTareasVencidas} con tareas vencidas`)
    }

    // 2. Casos sin movimiento reciente (>30 días sin bitácora)
    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const casosSinMovimiento = casosActivos.filter(caso => {
      const ultimaBitacora = caso.bitacoras[0]
      if (!ultimaBitacora) return true
      return new Date(ultimaBitacora.createdAt) < hace30Dias
    }).length

    if (casosSinMovimiento > 0) {
      motivosRetraso.push(`${casosSinMovimiento} sin movimiento >30d`)
    }

    // 3. Casos en etapa de prueba por mucho tiempo
    const casosEnPruebaMucho = casosActivos.filter(caso => {
      if (!caso.estado.toLowerCase().includes('prueba')) return false
      const inicio = new Date(caso.fechaInicio)
      const diasEnPrueba = Math.floor((Date.now() - inicio.getTime()) / (1000 * 60 * 60 * 24))
      return diasEnPrueba > 120
    }).length

    if (casosEnPruebaMucho > 0) {
      motivosRetraso.push(`${casosEnPruebaMucho} en Prueba >120d`)
    }

    // Si no hay motivos, todo está al día
    if (motivosRetraso.length === 0) {
      motivosRetraso.push('Al día')
    }

    // Casos urgentes (próximos 7 días)
    const en7Dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const casosUrgentes = casosActivos.filter(caso =>
      caso.tareas.some(t => {
        if (!t.fecha) return false
        const fechaTarea = new Date(t.fecha)
        return fechaTarea >= new Date() && fechaTarea <= en7Dias
      })
    ).length

    productividad.push({
      abogado: `${abogado.nombre || ''} ${abogado.apellido || ''}`.trim() || abogado.email || 'Sin nombre',
      abogadoId: abogado.id,
      email: abogado.email || '',
      fueros: fuerosTop.length > 0 ? fuerosTop : ['General'],
      casosActivos: casosActivos.length,
      casosCerrados: casosCerrados.length,
      tasaCierre,
      promedioDias,
      motivosRetraso,
      etapaMasComun,
      casosUrgentes
    })
  }

  // Ordenar por casos activos (más ocupados primero)
  return productividad.sort((a, b) => b.casosActivos - a.casosActivos)
}

function getDaysStatus(dias: number): string {
  if (dias > 150) return 'bg-red-100 text-red-700 border-red-200'
  if (dias > 100) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

export default async function ProductividadPage() {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  // Solo admin puede ver este reporte completo
  // if (user.rol !== 'admin') {
  //   redirect("/reportes")
  // }

  const productividad = await calcularProductividad()

  // Calcular KPIs generales
  const tasaCierrePromedio = productividad.length > 0
    ? Math.round(productividad.reduce((sum, p) => sum + p.tasaCierre, 0) / productividad.length)
    : 0

  const casosConRetrasoTotal = productividad.reduce((sum, p) => {
    const tieneretraso = p.motivosRetraso.some(m => m !== 'Al día')
    return sum + (tieneretraso ? p.casosActivos : 0)
  }, 0)

  const promedioCierreDias = productividad.length > 0
    ? Math.round(productividad.reduce((sum, p) => sum + p.promedioDias, 0) / productividad.length)
    : 0

  const totalCasosActivos = productividad.reduce((sum, p) => sum + p.casosActivos, 0)
  const totalCasosUrgentes = productividad.reduce((sum, p) => sum + p.casosUrgentes, 0)

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          {/* Header de Página */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/reportes" className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={24} className="text-blue-600" /> Desempeño y Productividad
                </h1>
                <p className="text-sm text-slate-500">Análisis de eficiencia, volumen de casos y puntos de retraso por abogado.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                <span className="text-slate-500">Total activos: </span>
                <span className="font-bold text-slate-900">{totalCasosActivos}</span>
              </div>
              {totalCasosUrgentes > 0 && (
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm">
                  <span className="text-red-600 font-bold">{totalCasosUrgentes} urgentes</span>
                </div>
              )}
            </div>
          </div>

          {/* KPI CARDS RESUMEN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-600 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-bold text-slate-400 uppercase">Tasa de Cierre Promedio</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{tasaCierrePromedio}%</p>
                <p className="text-xs text-slate-500 mt-1">
                  {productividad.reduce((s, p) => s + p.casosCerrados, 0)} casos cerrados
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-600 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-bold text-slate-400 uppercase">Casos con Retraso Activo</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{casosConRetrasoTotal}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Requieren atención inmediata
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-emerald-600 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-bold text-slate-400 uppercase">Promedio de Duración (Días)</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{promedioCierreDias}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Desde inicio hasta cierre/actual
                </p>
              </CardContent>
            </Card>
          </div>

          {/* TABLA PRINCIPAL DE PRODUCTIVIDAD */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-white border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users size={20} className="text-slate-600" /> Rendimiento Detallado por Abogado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {productividad.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium">No hay datos de productividad</p>
                  <p className="text-sm text-slate-400 mt-2">Los abogados con casos comenzarán a aparecer aquí</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Abogado</th>
                        <th className="px-6 py-3">Volumen Activo</th>
                        <th className="px-6 py-3">Tasa de Cierre</th>
                        <th className="px-6 py-3">Tiempo Promedio</th>
                        <th className="px-6 py-3">Etapa Mayoría</th>
                        <th className="px-6 py-3">Motivos de Retraso</th>
                        <th className="px-6 py-3">Urgentes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productividad.map((data, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-slate-800">{data.abogado}</p>
                              <p className="text-xs text-slate-500">{data.email}</p>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 text-center">
                            <div>
                              <p className="font-bold text-slate-900">{data.casosActivos}</p>
                              <p className="text-xs text-slate-500">
                                {data.fueros.join(', ')}
                              </p>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <Badge 
                              className={data.tasaCierre > 50 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : data.tasaCierre > 30
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                              }
                            >
                              {data.tasaCierre}%
                            </Badge>
                            <p className="text-xs text-slate-500 mt-1">
                              {data.casosCerrados} cerrados
                            </p>
                          </td>
                          
                          <td className="px-6 py-4">
                            <Badge className={getDaysStatus(data.promedioDias)}>
                              {data.promedioDias} días
                            </Badge>
                          </td>
                          
                          <td className="px-6 py-4">
                            <span className="text-slate-700 font-medium">{data.etapaMasComun}</span>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {data.motivosRetraso.map((motivo, j) => (
                                <Badge 
                                  key={j} 
                                  className={
                                    motivo === 'Al día' 
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : motivo.includes('vencidas')
                                      ? 'bg-red-50 text-red-600 border-red-200'
                                      : 'bg-amber-50 text-amber-600 border-amber-200'
                                  }
                                >
                                  {motivo === 'Al día' ? (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle size={12} />
                                      {motivo}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <AlertCircle size={12} />
                                      {motivo}
                                    </span>
                                  )}
                                </Badge>
                              ))}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-center">
                            {data.casosUrgentes > 0 ? (
                              <Badge className="bg-red-100 text-red-700">
                                {data.casosUrgentes}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* NOTA OPERATIVA */}
          <div className="mt-8 p-4 bg-slate-100 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 mb-2">
              <strong>Notas Operativas:</strong>
            </p>
            <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc">
              {/* <li>El <strong>"Tiempo Promedio"</strong> se calcula desde la fecha de inicio hasta el cierre (o fecha actual para casos activos).</li>
              <li>Los <strong>"Motivos de Retraso"</strong> se detectan automáticamente: tareas vencidas, casos sin movimiento >30 días, casos en Prueba >120 días.</li>
              <li>Los <strong>"Casos Urgentes"</strong> son aquellos con tareas/audiencias en los próximos 7 días.</li>
              <li>La <strong>"Tasa de Cierre"</strong> es el porcentaje de casos cerrados sobre el total histórico del abogado.</li> */}
            </ul>
          </div>
        </main>
      </div>
    </div>
  )
}