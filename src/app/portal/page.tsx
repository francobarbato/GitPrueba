// src/app/portal/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import prisma from "src/lib/db/prisma"
import { 
  Briefcase, 
  Clock, 
  AlertCircle, 
  FileText, 
  ArrowRight,
  CheckCircle2,
  Calendar,
  Bell,
  Upload,
  MessageSquare,
  Inbox
} from 'lucide-react'

export default async function PortalDashboard() {
  const user = await getUserSessionServer()

  if (!user || user.rol?.toUpperCase() !== 'CLIENTE') {
    redirect("/auth/signin")
  }

  // Obtener el cliente vinculado al usuario
  const cliente = await prisma.cliente.findFirst({
    where: { usuarioPortalId: user.id },
    include: {
      casos: {
        where: { estaCerrado: false },
        orderBy: { updatedAt: 'desc' },
        include: {
          tareas: {
            where: { completada: false },
            orderBy: { fecha: 'asc' },
            take: 5
          }
        }
      }
    }
  })

  if (!cliente) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Error de vinculación
          </h2>
          <p className="text-slate-600">
            No se encontró información de cliente asociada a su cuenta. 
            Por favor, contacte al estudio jurídico.
          </p>
        </div>
      </div>
    )
  }

  // Calcular estadísticas
  const casosActivos = cliente.casos.length
  const casosCerrados = await prisma.caso.count({
    where: { clienteId: cliente.id, estaCerrado: true }
  })

  // Obtener todas las tareas pendientes de los casos del cliente
  const tareasPendientes = cliente.casos.flatMap(caso => 
    caso.tareas.map(tarea => ({
      ...tarea,
      casoNumero: caso.numero,
      casoTitulo: caso.titulo
    }))
  ).slice(0, 5)

  // Formatear fecha
  const formatearFecha = (fecha: string | Date | null) => {
    if (!fecha) return 'Sin fecha'
    const date = new Date(fecha)
    const hoy = new Date()
    const diferencia = Math.ceil((date.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diferencia < 0) return 'Vencida'
    if (diferencia === 0) return 'Hoy'
    if (diferencia === 1) return 'Mañana'
    if (diferencia <= 7) return `En ${diferencia} días`
    
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="space-y-8">
      
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Bienvenido, {cliente.nombre}
        </h1>
        <p className="text-slate-600 mt-1">
          Aquí puede consultar el estado de sus casos y documentación
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Casos Activos */}
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Casos Activos</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{casosActivos}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            {casosActivos > 0 && (
              <Link href="/portal/casos">
                <Button variant="link" className="px-0 mt-2 text-blue-600">
                  Ver detalle
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Casos Finalizados */}
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Casos Finalizados</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{casosCerrados}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tareas Pendientes */}
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Tareas Pendientes</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{tareasPendientes.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            {tareasPendientes.length > 0 && (
              <p className="text-sm text-amber-600 mt-2">
                Requieren su atención
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna izquierda - Casos y Tareas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Mis Casos Activos */}
          <Card className="border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-slate-600" />
                    Mis Casos Activos
                  </CardTitle>
                  <CardDescription>Estado actual de sus expedientes</CardDescription>
                </div>
                {casosActivos > 0 && (
                  <Link href="/portal/casos">
                    <Button variant="outline" size="sm">
                      Ver todos
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {casosActivos === 0 ? (
                <div className="py-12 text-center">
                  <Inbox className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No tiene casos activos</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Cuando tenga casos en curso, aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cliente.casos.slice(0, 3).map((caso) => (
                    <Link key={caso.id} href={`/portal/casos/${caso.id}`}>
                      <div className="p-4 hover:bg-slate-50 transition cursor-pointer">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-slate-500">
                                {caso.numero}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {caso.tipo}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-slate-900 truncate">
                              {caso.titulo}
                            </h4>
                            <p className="text-sm text-slate-600 mt-1">
                              Etapa: {caso.estado}
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tareas y Vencimientos */}
          <Card className="border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-slate-600" />
                Próximos Vencimientos
              </CardTitle>
              <CardDescription>Tareas que requieren su atención</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {tareasPendientes.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Sin tareas pendientes</p>
                  <p className="text-sm text-slate-400 mt-1">
                    No hay vencimientos próximos
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {tareasPendientes.map((tarea) => (
                    <div key={tarea.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                          tarea.prioridad === 'Alta' ? 'bg-red-500' :
                          tarea.prioridad === 'Media' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">{tarea.titulo}</p>
                          <p className="text-sm text-slate-500 mt-0.5">
                            Caso: {tarea.casoNumero}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`flex-shrink-0 ${
                            tarea.fecha && new Date(tarea.fecha) < new Date() 
                              ? 'border-red-200 text-red-700 bg-red-50' 
                              : 'text-slate-600'
                          }`}
                        >
                          {formatearFecha(tarea.fecha)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Acciones rápidas */}
        <div className="space-y-6">
          
          {/* Acciones Rápidas */}
          <Card className="border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Link href="/portal/documentos" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Upload className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Subir Documento</p>
                    <p className="text-xs text-slate-500">Adjuntar archivos a sus casos</p>
                  </div>
                </Button>
              </Link>
              
              <Link href="/portal/mensajes" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                  <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Enviar Mensaje</p>
                    <p className="text-xs text-slate-500">Contactar a su abogado</p>
                  </div>
                </Button>
              </Link>
              
              <Link href="/portal/casos" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Ver Mis Casos</p>
                    <p className="text-xs text-slate-500">Historial completo</p>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Notificaciones / Alertas */}
          <Card className="border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="py-8 text-center">
                <Bell className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-medium">Sin notificaciones</p>
                <p className="text-xs text-slate-400 mt-1">
                  Le avisaremos cuando haya novedades
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información de contacto */}
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-700 mb-2">
                ¿Necesita ayuda?
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Comuníquese con el estudio para cualquier consulta sobre sus casos.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Contactar al Estudio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
