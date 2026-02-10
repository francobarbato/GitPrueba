// src/app/casos/[id]/page.tsx

import { notFound } from "next/navigation"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CalendarClock, FileText, Scale, History, DollarSign, Briefcase } from 'lucide-react';
import prisma from "src/lib/db/prisma"
import { TaskManager } from "./components/TaskManager"
import { TimelineAuditoria } from "./components/TimelineAuditoria"
import { PagosManager } from "./components/PagosManager"
import { CasoHeader } from "./components/caso-header"
import { 
  MapPin, Archive, Calendar, 
  Clock, User, Building2, Mail, Phone, Eye, AlertTriangle,
  TrendingUp, ShieldAlert
} from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Helper para verificar roles
const isAdmin = (rol: string) => rol?.toUpperCase() === 'ADMIN'
const isAbogado = (rol: string) => rol?.toUpperCase() === 'ABOGADO'
const isAsistente = (rol: string) => rol?.toUpperCase() === 'ASISTENTE'

export default async function CasoDetailPage({ params }: { params: { id: string } }) {
  const user = await getUserSessionServer()
  
  if (!user) {
    notFound()
  }

  const userRol = user.rol?.toUpperCase() || ''
  
  const caso = await prisma.caso.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      abogado: true,
      requirements: {
        orderBy: { dueDate: "asc" },
      },
      pagos: {  
        orderBy: { createdAt: "desc" }
      }
    },
  })

  if (!caso) notFound()

  // Obtener bitácora de auditoría (solo automáticas)
  const bitacoras = await prisma.bitacora.findMany({
    where: { 
      casoId: params.id, 
      tipo: "auto" 
    },
    include: {
      usuario: {
        select: { nombre: true, apellido: true }
      }
    },
    orderBy: { createdAt: "asc" }
  })

  const getPriorityColor = (priority: string) => {
    if (priority === "HIGH") return "bg-red-100 text-red-700"
    if (priority === "NORMAL") return "bg-yellow-100 text-yellow-700"
    return "bg-green-100 text-green-700"
  }

  const getStateColor = (estado: string) => {
    if (estado === "Cerrado") return "bg-slate-100 text-slate-700"
    if (estado === "Abierto" || estado === "Inicio / Demanda") return "bg-blue-100 text-blue-700"
    return "bg-purple-100 text-purple-700"
  }

  // ===== PERMISOS POR ROL =====
  const puedeEditar = (isAdmin(userRol) || isAbogado(userRol)) && !caso.estaCerrado // No editar si está cerrado
  const puedeVerPagos = isAdmin(userRol) || isAbogado(userRol)
  const puedeVerAuditoria = isAdmin(userRol)
  const puedeVerMontoDisputa = isAdmin(userRol) || isAbogado(userRol)

  // Verificar si el caso está cerrado
  const casoCerrado = caso.estaCerrado === true

  // Calcular cantidad de pestañas visibles para el grid
  const cantidadPestanas = 3 + (puedeVerPagos ? 1 : 0) + (puedeVerAuditoria ? 1 : 0)

  return (
    <div className="container mx-auto py-8 px-4">
      
      {/* ===== NUEVO: Header con botones de Cierre/Reapertura ===== */}
      <CasoHeader 
        caso={{
          id: caso.id,
          numero: caso.numero,
          titulo: caso.titulo,
          estado: caso.estado,
          priority: caso.priority,
          isFavorite: caso.isFavorite,
          montoDisputa: caso.montoDisputa ? Number(caso.montoDisputa) : null,
          estaCerrado: caso.estaCerrado,
          motivoCierre: caso.motivoCierre,
          fechaCierre: caso.fechaCierre?.toISOString() || null,
          observacionCierre: caso.observacionCierre,
          estadoAntesCierre: caso.estadoAntesCierre
        }}
        userRol={userRol}
        puedeEditar={isAdmin(userRol) || isAbogado(userRol)}
      />

      {/* Indicador de modo Asistente */}
      {isAsistente(userRol) && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-2">
          <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Modo Asistente:</strong> Puedes ver la información del caso y gestionar tareas. 
            La edición del caso y la información financiera están restringidas.
          </div>
        </div>
      )}

      <Tabs defaultValue="resumen" className="w-full space-y-6">
        
        <TabsList className={`grid w-full h-auto p-1 gap-1 grid-cols-2 md:grid-cols-${Math.min(cantidadPestanas, 5)}`}>
          <TabsTrigger value="resumen" className="h-9">
            <FileText className="w-4 h-4 mr-2 shrink-0" />
            Resumen
          </TabsTrigger>
          
          <TabsTrigger value="agenda" className="h-9">
            <CalendarClock className="w-4 h-4 mr-2 shrink-0" />
            Agenda
          </TabsTrigger>
          
          <TabsTrigger value="expediente" className="h-9">
            <Briefcase className="w-4 h-4 mr-2 shrink-0" />
            Expediente
          </TabsTrigger>

          {/* Pestaña Pagos - Solo Admin y Abogado */}
          {puedeVerPagos && (
            <TabsTrigger value="pagos" className="h-9">
              <DollarSign className="w-4 h-4 mr-2 shrink-0" />
              Pagos
            </TabsTrigger>
          )}
          
          {/* Pestaña Auditoría - Solo Admin */}
          {puedeVerAuditoria && (
            <TabsTrigger value="auditoria" className="h-9">
              <History className="w-4 h-4 mr-2 shrink-0" />
              Auditoría
            </TabsTrigger>
          )}
        </TabsList>

        {/* TAB 1: RESUMEN COMPLETO DEL CASO */}
        <TabsContent value="resumen" className="animate-in fade-in-50">
          <div className="space-y-6">

            {/* Descripción y Estrategia */}
            <Card>
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Descripción y Estrategia del Caso
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {caso.descripcion || "No hay descripción disponible"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Información Judicial */}
            <Card>
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-purple-600" />
                  Información Judicial y Radicación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Carátula / Expediente
                      </label>
                      <p className="mt-1 text-slate-900 font-medium">
                        {caso.numero || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600">Tipo de Caso</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-sm">
                          {caso.tipo === 'LABORAL' ? 'Laboral' :
                           caso.tipo === 'CIVIL_COMERCIAL' ? 'Civil Y Comercial' :
                           caso.tipo === 'FAMILIA' ? 'Familia' :
                           caso.tipo === 'PENAL' ? 'Penal' :
                           caso.tipo === 'SUCESIONES' ? 'Sucesiones' :
                           caso.tipo || 'No categorizado'}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600">Fuero</label>
                      <p className="mt-1 text-slate-900">
                        {caso.fuero || <span className="text-slate-400">No especificado</span>}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Juzgado / Tribunal</label>
                      <p className="mt-1 text-slate-900">
                        {caso.juzgado || <span className="text-slate-400">No especificado</span>}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600">Estado / Etapa Procesal</label>
                      <div className="mt-1">
                        <Badge className={getStateColor(caso.estado)}>
                          {caso.estado}
                        </Badge>
                        {casoCerrado && (
                          <Badge variant="secondary" className="ml-2 bg-slate-200">
                            Caso Cerrado
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Progreso del Caso
                      </label>
                      <div className="mt-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${casoCerrado ? 'bg-slate-500' : 'bg-blue-600'}`}
                              style={{ width: casoCerrado ? '100%' : `${caso.porcentajeAvance || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-slate-900 w-12 text-right">
                            {casoCerrado ? '100%' : `${caso.porcentajeAvance || 0}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contraparte (si existe) */}
                {(caso.contraparteNombre || caso.contraparteDni) && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Información de la Contraparte
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {caso.contraparteNombre && (
                        <div>
                          <label className="text-sm text-slate-600">Nombre/Razón Social</label>
                          <p className="mt-1 text-slate-900 font-medium">{caso.contraparteNombre}</p>
                        </div>
                      )}
                      {caso.contraparteDni && (
                        <div>
                          <label className="text-sm text-slate-600">DNI/CUIT</label>
                          <p className="mt-1 text-slate-900 font-mono">{caso.contraparteDni}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información Financiera - Solo Admin y Abogado */}
            {puedeVerMontoDisputa && (caso.montoDisputa || caso.montoFinal) && (
              <Card>
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Información Financiera
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {caso.montoDisputa && (
                      <div>
                        <label className="text-sm font-semibold text-slate-600">Monto en Disputa</label>
                        <p className="mt-1 text-2xl font-bold text-slate-700">
                          ${Number(caso.montoDisputa).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    
                    {/* Monto Final (si el caso está cerrado) */}
                    {casoCerrado && caso.montoFinal && (
                      <div>
                        <label className="text-sm font-semibold text-slate-600">Monto Final (Cierre)</label>
                        <p className="mt-1 text-2xl font-bold text-green-600">
                          ${Number(caso.montoFinal).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {caso.montoDisputa && (
                          <p className="text-sm text-slate-500 mt-1">
                            {Number(caso.montoFinal) >= Number(caso.montoDisputa) 
                              ? `✅ ${((Number(caso.montoFinal) / Number(caso.montoDisputa)) * 100).toFixed(1)}% del monto en disputa`
                              : `📉 ${((Number(caso.montoFinal) / Number(caso.montoDisputa)) * 100).toFixed(1)}% del monto en disputa`
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ubicación Física del Expediente */}
            {caso.ubicacionFisica && (
              <Card>
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-600" />
                    Ubicación Física del Expediente
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <Archive className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600 mb-1">El expediente físico se encuentra en:</p>
                      <p className="text-slate-900 font-semibold">{caso.ubicacionFisica}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fechas Importantes */}
            <Card>
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Fechas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Fecha de Inicio
                    </label>
                    <p className="mt-1 text-slate-900">
                      {new Date(caso.fechaInicio).toLocaleDateString('es-AR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>

                  {caso.fechaCierre && (
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Fecha de Cierre</label>
                      <p className="mt-1 text-slate-900">
                        {new Date(caso.fechaCierre).toLocaleDateString('es-AR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-slate-600">Duración</label>
                    <p className="mt-1 text-slate-900">
                      {caso.fechaCierre 
                        ? `${Math.floor((new Date(caso.fechaCierre).getTime() - new Date(caso.fechaInicio).getTime()) / (1000 * 60 * 60 * 24))} días (finalizado)`
                        : `${Math.floor((new Date().getTime() - new Date(caso.fechaInicio).getTime()) / (1000 * 60 * 60 * 24))} días (en curso)`
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datos del Cliente */}
            <Card>
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {caso.cliente ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-600">Nombre Completo</label>
                        <p className="mt-1 text-slate-900 font-medium">
                          {caso.cliente.nombre} {caso.cliente.apellido}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-600">Documento</label>
                        <p className="mt-1 text-slate-900 font-mono">
                          {caso.cliente.tipoDocumento}: {caso.cliente.numeroDocumento || "No registrado"}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-600">Tipo de Persona</label>
                        <p className="mt-1 flex items-center gap-2">
                          {caso.cliente.tipoPersona === 'FISICA' ? (
                            <>
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="text-slate-900">Persona Física</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="h-4 w-4 text-purple-600" />
                              <span className="text-slate-900">Persona Jurídica</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          Email
                        </label>
                        <p className="mt-1 text-slate-900">
                          {caso.cliente.email ? (
                            <a href={`mailto:${caso.cliente.email}`} className="hover:text-blue-600 hover:underline">
                              {caso.cliente.email}
                            </a>
                          ) : (
                            <span className="text-slate-400">No registrado</span>
                          )}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          Teléfono
                        </label>
                        <p className="mt-1 text-slate-900">
                          {caso.cliente.telefono ? (
                            <a href={`tel:${caso.cliente.telefono}`} className="hover:text-blue-600 hover:underline">
                              {caso.cliente.telefono}
                            </a>
                          ) : (
                            <span className="text-slate-400">No registrado</span>
                          )}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Dirección
                        </label>
                        <p className="mt-1 text-slate-900">
                          {caso.cliente.direccion || <span className="text-slate-400">No registrada</span>}
                        </p>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Link href={`/clientes/${caso.cliente.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Ver Perfil Completo del Cliente
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">Sin cliente asignado</p>
                )}
              </CardContent>
            </Card>

            {/* Abogado Responsable */}
            <Card>
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-slate-600" />
                  Abogado Responsable
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {caso.abogado ? (
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {caso.abogado.nombre} {caso.abogado.apellido}
                      </p>
                      <p className="text-sm text-slate-600">{caso.abogado.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500">Sin abogado asignado</p>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* TAB 2: AGENDA Y TAREAS - Disponible para todos */}
        <TabsContent value="agenda" className="animate-in fade-in-50">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
              <div>
                <CardTitle>Bitácora de Tareas</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Gestión de vencimientos, audiencias y escritos.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <TaskManager casoId={caso.id} requirements={caso.requirements} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: EXPEDIENTE DIGITAL - Disponible para todos */}
        <TabsContent value="expediente" className="animate-in fade-in-50">
          <Card>
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle>Documentos y Actuaciones</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">Sección en desarrollo</p>
                <p className="text-sm">Aquí se mostrarán los documentos adjuntos</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: PAGOS - Solo Admin y Abogado */}
        {puedeVerPagos && (
          <TabsContent value="pagos" className="animate-in fade-in-50">
            <Card>
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle>Gestión de Pagos y Gastos</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Honorarios, tasas, sellados y gastos del caso
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <PagosManager casoId={caso.id} pagos={caso.pagos as any} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* TAB 5: AUDITORÍA - Solo Admin */}
        {puedeVerAuditoria && (
          <TabsContent value="auditoria" className="animate-in fade-in-50">
            <Card>
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle>Timeline de Auditoría</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Historial automático de cambios y movimientos del caso
                </p>
              </CardHeader>
              <CardContent className="p-6">
                {bitacoras.length > 0 ? (
                  <TimelineAuditoria bitacoras={bitacoras.filter(b => b.accion !== null) as any} />
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">Sin movimientos registrados</p>
                    <p className="text-sm">La auditoría automática comenzará a registrar cambios</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}