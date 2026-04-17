// src/app/portal/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import prisma from "src/lib/db/prisma"
import {
  Briefcase, Clock, AlertCircle, ArrowRight,
  CheckCircle2, Calendar, Inbox, MapPin
} from 'lucide-react'

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  BLOQUEADA: "En espera",
  VENCIDA: "Vencida",
}

export default async function PortalDashboard() {
  const user = await getUserSessionServer()
  if (!user || user.rol?.toUpperCase() !== 'CLIENTE') redirect("/auth/signin")

  const cliente = await prisma.cliente.findFirst({
    where: { usuarioPortalId: user.id },
    include: {
      casos: {
        where: { estaCerrado: false },
        orderBy: { updatedAt: 'desc' },
        take: 3,
      }
    }
  })

  if (!cliente) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Error de vinculación</h2>
        <p className="text-slate-600">No se encontró información de cliente asociada a su cuenta. Contacte al estudio jurídico.</p>
      </div>
    )
  }

  // Tareas visibles para el cliente — excluir completadas Y vencidas
  const tareasCliente = await prisma.tarea.findMany({
    where: {
      clienteId: cliente.id,
      visibleCliente: true,
      estado: { notIn: ["COMPLETADA", "VENCIDA"] }
    },
    orderBy: { fechaVencimiento: 'asc' },
    take: 5,
    include: {
      caso: { select: { numero: true, titulo: true } }
    }
  })

  const formatearFecha = (fecha: Date | null | undefined): string => {
    if (!fecha) return 'Sin fecha'
    const date = new Date(fecha)
    const dias = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (dias < 0)   return 'Vencida'
    if (dias === 0) return 'Hoy'
    if (dias === 1) return 'Mañana'
    if (dias <= 7)  return `En ${dias} días`
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="space-y-8">

      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Bienvenido, {cliente.nombre}</h1>
        <p className="text-slate-600 mt-1">Aquí puede consultar el estado de sus casos y las tareas asignadas por su estudio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Casos Activos */}
        <Card className="border-slate-200">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-slate-600" />
                  Mis Casos
                </CardTitle>
                <CardDescription>Expedientes activos en el estudio</CardDescription>
              </div>
              <Link href="/portal/casos" className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1">
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {cliente.casos.length === 0 ? (
              <div className="py-12 text-center">
                <Inbox className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No tiene casos activos</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cliente.casos.map(caso => (
                  <Link key={caso.id} href={`/portal/casos/${caso.id}`}>
                    <div className="p-4 hover:bg-slate-50 transition cursor-pointer">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-slate-500">{caso.numero}</span>
                            <Badge variant="outline" className="text-xs">{caso.tipo}</Badge>
                          </div>
                          <p className="font-medium text-slate-900 truncate">{caso.titulo}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{caso.estado}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tareas asignadas */}
        <Card className="border-slate-200">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-600" />
              Tareas Asignadas
            </CardTitle>
            <CardDescription>Acciones que su estudio le ha solicitado</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {tareasCliente.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Sin tareas pendientes</p>
                <p className="text-sm text-slate-400 mt-1">No hay acciones requeridas en este momento</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tareasCliente.map(tarea => {
                  const lugarLimpio = tarea.lugarFisico?.replace(/^\[.*?\]\s?/, "") ?? null
                  return (
                    <div key={tarea.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">{tarea.titulo}</p>
                          {tarea.descripcion && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                              {tarea.descripcion.slice(0, 120)}{tarea.descripcion.length > 120 ? "..." : ""}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              tarea.estado === 'BLOQUEADA'  ? 'bg-red-100 text-red-700' :
                              tarea.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {ESTADO_LABELS[tarea.estado] ?? tarea.estado}
                            </span>
                            {tarea.caso && (
                              <span className="text-[10px] font-mono text-slate-500">{tarea.caso.numero}</span>
                            )}
                          </div>
                          {lugarLimpio && lugarLimpio !== "Estudio Jurídico" && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{lugarLimpio}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline"
                          className={`shrink-0 text-xs ${
                            tarea.fechaVencimiento && new Date(tarea.fechaVencimiento) < new Date()
                              ? 'border-red-200 text-red-700 bg-red-50'
                              : 'text-slate-600'
                          }`}>
                          {formatearFecha(tarea.fechaVencimiento)}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}