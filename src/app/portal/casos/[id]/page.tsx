// src/app/portal/casos/[id]/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import prisma from "src/lib/db/prisma"
import { 
  ArrowLeft,
  Briefcase, 
  Clock,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Scale,
  MapPin,
  Upload,
  MessageSquare,
  Inbox
} from 'lucide-react'

export default async function PortalCasoDetallePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const user = await getUserSessionServer()

  if (!user || user.rol?.toUpperCase() !== 'CLIENTE') {
    redirect("/auth/signin")
  }

  // Obtener el cliente vinculado
  const cliente = await prisma.cliente.findFirst({
    where: { usuarioPortalId: user.id }
  })

  if (!cliente) {
    redirect("/portal")
  }

  // Obtener el caso (verificando que pertenezca al cliente)
  const caso = await prisma.caso.findFirst({
    where: {
      id: params.id,
      clienteId: cliente.id
    },
    include: {
      abogado: {
        select: { nombre: true, apellido: true, email: true }
      },
      tareas: {
        where: { completada: false },
        orderBy: { fecha: 'asc' },
        take: 10
      },
      // Bitácora pública (solo hitos importantes, no notas internas)
      bitacoras: {
        where: {
          tipo: 'auto',
          accion: {
            in: ['CREATE', 'ESTADO_CHANGE', 'CIERRE', 'REAPERTURA']
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          texto: true,
          accion: true,
          createdAt: true,
          estadoAnterior: true,
          estadoNuevo: true
        }
      }
    }
  })

  if (!caso) {
    notFound()
  }

  // Formatear fecha
  const formatearFecha = (fecha: Date | string | null) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatearFechaCorta = (fecha: Date | string | null) => {
    if (!fecha) return 'Sin fecha'
    const date = new Date(fecha)
    const hoy = new Date()
    const diferencia = Math.ceil((date.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diferencia < 0) return 'Vencida'
    if (diferencia === 0) return 'Hoy'
    if (diferencia === 1) return 'Mañana'
    
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  // Mapeo de motivos de cierre
  const motivosCierre: Record<string, string> = {
    'FAVORABLE': 'Sentencia Favorable',
    'DESFAVORABLE': 'Sentencia Desfavorable',
    'ACUERDO': 'Acuerdo Extrajudicial',
    'DESISTIMIENTO': 'Desistimiento',
    'ARCHIVO': 'Archivado'
  }

  return (
    <div className="space-y-6">
<<<<<<< Updated upstream
      
      {/* Header con navegación */}
      <div className="flex items-start gap-4">
        <Link href="/portal/casos">
          <Button variant="ghost" size="icon" className="mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
=======

      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/portal/casos" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Mis Expedientes
>>>>>>> Stashed changes
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {caso.numero}
            </span>
            <Badge variant="outline">{caso.tipo}</Badge>
            {caso.estaCerrado && (
              <Badge variant="secondary" className="bg-slate-200">
                Caso Finalizado
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            {caso.titulo}
          </h1>
        </div>
      </div>

      {/* Banner de caso cerrado */}
      {caso.estaCerrado && (
        <Card className={`border-2 ${
          caso.motivoCierre === 'FAVORABLE' ? 'border-green-200 bg-green-50' :
          caso.motivoCierre === 'DESFAVORABLE' ? 'border-red-200 bg-red-50' :
          'border-slate-200 bg-slate-50'
        }`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`h-6 w-6 ${
                caso.motivoCierre === 'FAVORABLE' ? 'text-green-600' :
                caso.motivoCierre === 'DESFAVORABLE' ? 'text-red-600' :
                'text-slate-600'
              }`} />
              <div>
                <p className="font-medium text-slate-900">
                  Caso Finalizado - {motivosCierre[caso.motivoCierre || ''] || caso.motivoCierre}
                </p>
                <p className="text-sm text-slate-600">
                  Cerrado el {formatearFecha(caso.fechaCierre)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Estado Actual */}
          <Card className="border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="h-5 w-5 text-slate-600" />
                Estado del Caso
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-slate-500">Etapa Procesal Actual</label>
                  <p className="mt-1 font-medium text-slate-900 text-lg">
                    {caso.estado}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm text-slate-500">Fecha de Inicio</label>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatearFecha(caso.fechaInicio)}
                  </p>
                </div>

<<<<<<< Updated upstream
                {caso.juzgado && (
                  <div>
                    <label className="text-sm text-slate-500">Juzgado</label>
                    <p className="mt-1 text-slate-900">{caso.juzgado}</p>
                  </div>
                )}

                {caso.fuero && (
                  <div>
                    <label className="text-sm text-slate-500">Jurisdicción</label>
                    <p className="mt-1 text-slate-900">{caso.fuero}</p>
                  </div>
                )}
=======
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
>>>>>>> Stashed changes
              </div>

              {/* Barra de progreso visual */}
              {!caso.estaCerrado && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Progreso estimado</span>
                    <span className="text-sm font-medium text-slate-700">
                      {caso.porcentajeAvance || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${caso.porcentajeAvance || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial de Movimientos (público) */}
          <Card className="border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-slate-600" />
                Historial de Movimientos
              </CardTitle>
              <CardDescription>Actualizaciones importantes del caso</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {caso.bitacoras.length === 0 ? (
                <div className="py-12 text-center">
                  <Inbox className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Sin movimientos registrados</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {caso.bitacoras.map((entrada, index) => (
                    <div key={entrada.id} className="p-4 flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full ${
                          index === 0 ? 'bg-blue-600' : 'bg-slate-300'
                        }`} />
                        {index < caso.bitacoras.length - 1 && (
                          <div className="w-px h-full bg-slate-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="text-sm text-slate-900">{entrada.texto}</p>
                        {entrada.estadoNuevo && entrada.estadoAnterior && (
                          <p className="text-xs text-slate-500 mt-1">
                            {entrada.estadoAnterior} → {entrada.estadoNuevo}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(entrada.createdAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tareas Pendientes (asignadas al cliente) */}
          <Card className="border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-slate-600" />
                Pendientes
              </CardTitle>
              <CardDescription>Tareas que requieren su atención</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {caso.tareas.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No hay tareas pendientes</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Le notificaremos cuando necesitemos algo de su parte
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {caso.tareas.map((tarea) => (
                    <div key={tarea.id} className="p-4 flex items-start gap-3">
                      <Circle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        tarea.prioridad === 'Alta' ? 'text-red-500' :
                        tarea.prioridad === 'Media' ? 'text-amber-500' : 'text-slate-400'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{tarea.titulo}</p>
                        {tarea.fatal && (
                          <Badge variant="outline" className="mt-1 text-xs border-red-200 text-red-700">
                            Vencimiento crítico
                          </Badge>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`flex-shrink-0 text-xs ${
                          tarea.fecha && new Date(tarea.fecha) < new Date()
                            ? 'border-red-200 text-red-700 bg-red-50'
                            : ''
                        }`}
                      >
                        {formatearFechaCorta(tarea.fecha)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          
          {/* Abogado Responsable */}
          <Card className="border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-base">Abogado Responsable</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {caso.abogado ? (
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {caso.abogado.nombre} {caso.abogado.apellido}
                    </p>
                    <p className="text-sm text-slate-500">{caso.abogado.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No asignado</p>
              )}
            </CardContent>
          </Card>

          {/* Acciones */}
          {!caso.estaCerrado && (
            <Card className="border-slate-200">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-base">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                <Link href={`/portal/documentos?caso=${caso.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Upload className="h-4 w-4" />
                    Subir Documento
                  </Button>
                </Link>
                <Link href={`/portal/mensajes?caso=${caso.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Enviar Mensaje
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Información del caso */}
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="pt-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Expediente</span>
                  <span className="font-mono text-slate-700">{caso.numero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Materia</span>
                  <span className="text-slate-700">{caso.tipo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Inicio</span>
                  <span className="text-slate-700">
                    {new Date(caso.fechaInicio).toLocaleDateString('es-AR')}
                  </span>
                </div>
                {caso.fechaCierre && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cierre</span>
                    <span className="text-slate-700">
                      {new Date(caso.fechaCierre).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
