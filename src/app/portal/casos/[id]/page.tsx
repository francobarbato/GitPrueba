// src/app/portal/casos/[id]/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import prisma from "src/lib/db/prisma"
import Link from "next/link"
import {
  Scale, MapPin, Calendar, Clock,
  ArrowLeft, CheckCircle2, AlertCircle, Lock, User
} from 'lucide-react'
import { format } from "date-fns"
import { es } from "date-fns/locale"

const TIPO_LABELS: Record<string, string> = {
  LABORAL: 'Laboral', CIVIL_COMERCIAL: 'Civil y Comercial',
  FAMILIA: 'Familia', PENAL: 'Penal', SUCESIONES: 'Sucesiones',
  CONTENCIOSO_ADMINISTRATIVO: 'Contencioso Admin.', OTRO: 'Otro',
}

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  BLOQUEADA: "En espera",
  VENCIDA: "Vencida",
}

export default async function PortalCasoDetallePage({ params }: { params: { id: string } }) {
  const user = await getUserSessionServer()
  if (!user || user.rol?.toUpperCase() !== 'CLIENTE') redirect("/auth/signin")

  const cliente = await prisma.cliente.findFirst({
    where: { usuarioPortalId: user.id },
  })
  if (!cliente) redirect("/portal")

  const caso = await prisma.caso.findUnique({
    where: { id: params.id },
    select: {
      id: true, numero: true, titulo: true, tipo: true,
      estado: true, estaCerrado: true, motivoCierre: true,
      fechaInicio: true, fechaCierre: true,
      juzgado: true, fuero: true, ciudad: true, provincia: true,
      clienteId: true,
      tareas: {
        where: { visibleCliente: true, estado: { notIn: ["COMPLETADA", "VENCIDA"] } },
        orderBy: { fechaVencimiento: 'asc' },
        select: {
          id: true, titulo: true, descripcion: true,
          estado: true, fechaVencimiento: true, lugarFisico: true,
        }
      }
    }
  })

  if (!caso || caso.clienteId !== cliente.id) notFound()

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
    <div className="space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/portal/casos" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Mis Expedientes
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">{caso.numero}</span>
      </div>

      {/* Header del caso */}
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-mono text-slate-500">{caso.numero}</span>
          <Badge variant="outline">{TIPO_LABELS[caso.tipo] ?? caso.tipo}</Badge>
          {caso.estaCerrado && (
            <Badge className="bg-slate-100 text-slate-600 border border-slate-200">Finalizado</Badge>
          )}
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">{caso.titulo}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Estado del expediente */}
        <Card className="border-slate-200">
          <CardHeader className="border-b bg-slate-50/50 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-600" />
              Estado del Expediente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Etapa procesal</p>
              <p className="text-base font-semibold text-slate-800">{caso.estado}</p>
            </div>
            {caso.juzgado && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Juzgado / Tribunal</p>
                <p className="text-sm text-slate-700 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-slate-400" />{caso.juzgado}
                </p>
              </div>
            )}
            {(caso.ciudad || caso.provincia || caso.fuero) && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Jurisdicción</p>
                <p className="text-sm text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {[caso.ciudad, caso.provincia].filter(Boolean).join(', ') || caso.fuero}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fechas */}
        <Card className="border-slate-200">
          <CardHeader className="border-b bg-slate-50/50 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-600" />
              Fechas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Inicio del caso</p>
              <p className="text-sm text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {format(new Date(caso.fechaInicio), "d 'de' MMMM yyyy", { locale: es })}
              </p>
            </div>
            {caso.fechaCierre && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Fecha de cierre</p>
                <p className="text-sm text-slate-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  {format(new Date(caso.fechaCierre), "d 'de' MMMM yyyy", { locale: es })}
                </p>
              </div>
            )}
            {!caso.estaCerrado && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Duración</p>
                <p className="text-sm text-slate-700">
                  {Math.floor((new Date().getTime() - new Date(caso.fechaInicio).getTime()) / (1000 * 60 * 60 * 24))} días en curso
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tareas asignadas */}
        <Card className="border-slate-200 md:col-span-2">
          <CardHeader className="border-b bg-slate-50/50 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-600" />
              Eventos Asignados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {caso.tareas.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Sin eventos pendientes para este expediente</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {caso.tareas.map(tarea => {
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
                            {lugarLimpio && lugarLimpio !== "Estudio Jurídico" && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />{lugarLimpio}
                              </span>
                            )}
                          </div>
                        </div>
                        {tarea.fechaVencimiento && (
                          <Badge variant="outline"
                            className={`shrink-0 text-xs ${
                              new Date(tarea.fechaVencimiento) < new Date()
                                ? 'border-red-200 text-red-700 bg-red-50'
                                : 'text-slate-600'
                            }`}>
                            {formatearFecha(tarea.fechaVencimiento)}
                          </Badge>
                        )}
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