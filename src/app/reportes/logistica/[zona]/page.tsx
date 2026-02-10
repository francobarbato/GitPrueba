

import React from "react"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect, notFound } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { 
  ArrowLeft, 
  MapPin,
  FileText,
  Calendar,
  AlertTriangle,
  User,
  Scale,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function DetalleZonaPage({
  params
}: {
  params: { zona: string }
}) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const zonaDecoded = decodeURIComponent(params.zona)

  // Obtener casos de esta zona
  const casos = await prisma.caso.findMany({
    where: user.rol === 'admin' ? {
      fuero: zonaDecoded === 'Sin Especificar' ? null : zonaDecoded,
      estado: { not: 'CERRADO' }
    } : {
      abogadoId: user.id,
      fuero: zonaDecoded === 'Sin Especificar' ? null : zonaDecoded,
      estado: { not: 'CERRADO' }
    },
    include: {
      cliente: true,
      abogado: true,
      tareas: {
        where: {
          completada: false
        },
        orderBy: {
          fecha: 'asc'
        }
      }
    },
    orderBy: {
      fechaInicio: 'desc'
    }
  })

  if (casos.length === 0) {
    notFound()
  }

  // Clasificar casos por urgencia
  const hoy = new Date()
  const en7Dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)

  const casosUrgentes = casos.filter(caso =>
    caso.tareas.some(t => {
      if (!t.fecha) return false
      const fechaTarea = new Date(t.fecha)
      return fechaTarea >= hoy && fechaTarea <= en7Dias
    })
  )

  const casosNormales = casos.filter(caso => !casosUrgentes.includes(caso))

  const formatearFecha = (fecha: Date | string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDiasDesdeInicio = (fechaInicio: Date) => {
    const dias = Math.floor((Date.now() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24))
    return dias
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/reportes/logistica" className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="text-orange-500" /> {zonaDecoded}
                </h1>
                <p className="text-sm text-slate-500">
                  {casos.length} caso{casos.length !== 1 ? 's' : ''} activo{casos.length !== 1 ? 's' : ''} en esta zona
                </p>
              </div>
            </div>

            {/* Resumen rápido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-blue-600">
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Total Casos</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{casos.length}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-600">
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Urgentes (7 días)</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{casosUrgentes.length}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-600">
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Regulares</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{casosNormales.length}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Lista de casos urgentes */}
          {casosUrgentes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={20} />
                Casos Urgentes ({casosUrgentes.length})
              </h2>
              <div className="space-y-4">
                {casosUrgentes.map((caso) => {
                  const proximaTarea = caso.tareas[0]
                  const diasDesdeInicio = getDiasDesdeInicio(caso.fechaInicio)

                  return (
                    <Link key={caso.id} href={`/casos/${caso.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-red-100 text-red-700">Urgente</Badge>
                                <Badge variant="outline" className="text-xs">
                                  {caso.tipo}
                                </Badge>
                                <span className="text-xs text-slate-500 font-mono">#{caso.numero}</span>
                              </div>

                              <h3 className="text-lg font-bold text-slate-900 mb-2">{caso.titulo}</h3>
                              
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <User size={14} />
                                  <span>{caso.cliente.nombre} {caso.cliente.apellido}</span>
                                </div>

                                {caso.juzgado && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Scale size={14} />
                                    <span className="truncate">{caso.juzgado}</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <Clock size={14} />
                                  <span>{diasDesdeInicio} días desde inicio</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <FileText size={14} />
                                  <span>{caso.estado}</span>
                                </div>
                              </div>

                              {proximaTarea && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle size={16} className="text-red-600 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-red-900">
                                        Próximo vencimiento: {proximaTarea.fecha ? formatearFecha(proximaTarea.fecha) : 'Sin fecha'}
                                      </p>
                                      <p className="text-xs text-red-700 mt-1">{proximaTarea.titulo}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="text-right">
                              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-red-600">
                                    {caso.porcentajeAvance}
                                  </p>
                                  <p className="text-[10px] text-red-600 font-semibold">%</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Lista de casos regulares */}
          {casosNormales.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="text-slate-600" size={20} />
                Casos Regulares ({casosNormales.length})
              </h2>
              <div className="space-y-4">
                {casosNormales.map((caso) => {
                  const diasDesdeInicio = getDiasDesdeInicio(caso.fechaInicio)

                  return (
                    <Link key={caso.id} href={`/casos/${caso.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {caso.tipo}
                                </Badge>
                                <span className="text-xs text-slate-500 font-mono">#{caso.numero}</span>
                              </div>

                              <h3 className="text-lg font-semibold text-slate-900 mb-2">{caso.titulo}</h3>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <User size={14} />
                                  <span>{caso.cliente.nombre} {caso.cliente.apellido}</span>
                                </div>

                                {caso.juzgado && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Scale size={14} />
                                    <span className="truncate">{caso.juzgado}</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <Clock size={14} />
                                  <span>{diasDesdeInicio} días</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <FileText size={14} />
                                  <span>{caso.estado}</span>
                                </div>
                              </div>

                              {caso.tareas.length > 0 && (
                                <div className="mt-3 text-xs text-slate-500">
                                  {caso.tareas.length} tarea{caso.tareas.length !== 1 ? 's' : ''} pendiente{caso.tareas.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>

                            <div className="text-right">
                              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-slate-600">
                                    {caso.porcentajeAvance}
                                  </p>
                                  <p className="text-[10px] text-slate-600 font-semibold">%</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}