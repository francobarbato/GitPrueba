// app/clientes/[id]/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect, notFound } from "next/navigation"
import { ClienteService } from "@/lib/aplication/services/cliente.service"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PortalAccesoSection } from "./components/PortalAccesoSection"
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Building2, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase,
  Hash,
  Receipt,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react"
import prisma from "../../../lib/db/prisma"

const clienteService = new ClienteService()

export default async function ClienteDetallePage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const userRol = user.rol?.toUpperCase() || ''
  // Defensa en profundidad — bloquear roles no operativos
  if (userRol === 'CLIENTE' || userRol === 'ADMIN') notFound()
  if (userRol === 'ADMIN') redirect('/')

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      casos: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      abogado: {
        select: {
          name: true,
          email: true
        }
      },
      // ===== NUEVO: Incluir usuario del portal =====
      usuarioPortal: {
        select: {
          id: true,
          email: true,
          isActive: true,
          createdAt: true,
          ultimoAcceso: true
        }
      }
      // =============================================
    }
  })

  if (!cliente) {
    notFound()
  }

  const isAdmin = userRol === 'ADMIN'
  const isAsistente = userRol === 'ASISTENTE'
  
  if (!isAdmin && !isAsistente && cliente.abogadoId !== user.id) {
    redirect("/clientes")
  }

  const casosActivos = cliente.casos.filter(c => !c.estaCerrado).length
  const casosCerrados = cliente.casos.filter(c => c.estaCerrado).length
  const totalCasos = cliente.casos.length

  const formatearFecha = (fecha: Date | string | null) => {
    if (!fecha) return "No disponible"
    const date = new Date(fecha)
    return date.toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatearFechaCorta = (fecha: Date | string | null) => {
    if (!fecha) return "-"
    const date = new Date(fecha)
    return date.toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit'
    })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">

            {/* Breadcrumb */}
            <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
              <Link href="/clientes" className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Gestión de Clientes
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">
                {cliente.nombre} {cliente.apellido}
              </span>
            </nav>
            
            <div className="mb-6 flex items-center justify-between">
                <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                      {cliente.tipoPersona === 'FISICA' ? (
                        <User className="h-8 w-8 text-blue-600" />
                      ) : (
                        <Building2 className="h-8 w-8 text-purple-600" />
                      )}
                      {cliente.nombre} {cliente.apellido}
                    </h1>
                  <p className="text-slate-600 mt-1 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      cliente.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {cliente.activo ? '● Activo' : '○ Inactivo'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-sm">
                      {cliente.tipoPersona === 'FISICA' ? 'Persona Física' : 'Persona Jurídica'}
                    </span>
                    {/* Badge de acceso al portal */}
                    {cliente.usuarioPortalId && (
                      <>
                        <span className="text-slate-400">•</span>
                        <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                          🌐 Portal Habilitado
                        </Badge>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <Link href={`/clientes/${cliente.id}/editar`}>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Edit className="w-4 h-4" />
                  Editar Cliente
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* COLUMNA IZQUIERDA */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Datos Personales / Razón Social */}
                <Card className="shadow-sm border-slate-200">
                  <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      {cliente.tipoPersona === 'FISICA' ? (
                        <><User className="h-5 w-5 text-blue-600" /> Datos Personales</>
                      ) : (
                        <><Building2 className="h-5 w-5 text-purple-600" /> Datos de la Empresa</>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div>
                        <label className="text-sm font-medium text-slate-600">
                          {cliente.tipoPersona === 'FISICA' ? 'Nombre Completo' : 'Razón Social'}
                        </label>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {cliente.nombre} {cliente.apellido}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-600">Tipo de Persona</label>
                        <p className="mt-1 flex items-center gap-2">
                          {cliente.tipoPersona === 'FISICA' ? (
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

                      {/* NUEVO: Tipo de Sociedad (solo JURIDICA) */}
                      {cliente.tipoPersona === 'JURIDICA' && cliente.tipoSociedad && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Tipo de Sociedad</label>
                          <p className="mt-1 text-slate-900 font-medium">
                            {cliente.tipoSociedad === 'SA' ? 'Sociedad Anónima (S.A.)' :
                             cliente.tipoSociedad === 'SRL' ? 'Sociedad de Resp. Limitada (S.R.L.)' :
                             cliente.tipoSociedad === 'SAS' ? 'Sociedad por Acciones Simplificada (S.A.S.)' :
                             cliente.tipoSociedad === 'COOPERATIVA' ? 'Cooperativa' :
                             cliente.tipoSociedad === 'ASOCIACION_CIVIL' ? 'Asociación Civil' :
                             cliente.tipoSociedad}
                          </p>
                        </div>
                      )}

                      {/* NUEVO: Representante Legal (solo JURIDICA) */}
                      {cliente.tipoPersona === 'JURIDICA' && cliente.representanteNombre && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Representante Legal</label>
                          <p className="mt-1 text-slate-900 font-medium">
                            {cliente.representanteNombre}
                            {cliente.representanteDni && (
                              <span className="text-slate-500 font-mono text-sm ml-2">
                                — DNI {cliente.representanteDni}
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      {/* NUEVO: Bienes Embargables (solo FISICA, solo si tiene valor y no es NO_CORRESPONDE) */}
                      {cliente.tipoPersona === 'FISICA' && cliente.bienesEmbargables && cliente.bienesEmbargables !== 'NO_CORRESPONDE' && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Bienes Embargables</label>
                          <div className="mt-1">
                            <Badge variant="outline" className={`text-xs ${
                              cliente.bienesEmbargables === 'SI'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {cliente.bienesEmbargables === 'SI' ? '✓ Tiene bienes registrables' : '✗ Sin bienes conocidos'}
                            </Badge>
                          </div>
                        </div>
                      )}

                    </div>
                  </CardContent>
                </Card>

                {/* Documentación Fiscal */}
                <Card className="shadow-sm border-slate-200">
                  <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      Documentación Fiscal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      <div>
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Tipo de Documento
                        </label>
                        <p className="mt-1 text-slate-900 font-medium">
                          {cliente.tipoDocumento || 'No especificado'}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-600">Número de Documento</label>
                        <p className="mt-1 text-slate-900 font-mono font-semibold">
                          {cliente.numeroDocumento || '-'}
                        </p>
                      </div>

                        <div>
                          <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                            <Receipt className="h-3 w-3" />
                            Condición IVA
                          </label>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              {cliente.condicionIva === 'RESPONSABLE_INSCRIPTO' ? 'Responsable Inscripto' :
                               cliente.condicionIva === 'MONOTRIBUTISTA' ? 'Monotributista' :
                               cliente.condicionIva === 'CONSUMIDOR_FINAL' ? 'Consumidor Final' :
                               cliente.condicionIva === 'EXENTO' ? 'Exento' :
                               cliente.condicionIva || 'No categorizado'}
                            </Badge>
                          </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Documento único en sistema - Validado
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Datos de Contacto */}
                <Card className="shadow-sm border-slate-200">
                  <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-orange-600" />
                      Datos de Contacto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Mail className="h-5 w-5 text-slate-600 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-sm font-medium text-slate-600">Email</label>
                          <p className="mt-0.5 text-slate-900">
                            {cliente.email ? (
                              <a href={`mailto:${cliente.email}`} className="hover:text-blue-600 hover:underline">
                                {cliente.email}
                              </a>
                            ) : (
                              <span className="text-slate-400">No registrado</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Phone className="h-5 w-5 text-slate-600 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-sm font-medium text-slate-600">Teléfono</label>
                          <p className="mt-0.5 text-slate-900">
                            {cliente.telefono ? (
                              <a href={`tel:${cliente.telefono}`} className="hover:text-blue-600 hover:underline">
                                {cliente.telefono}
                              </a>
                            ) : (
                              <span className="text-slate-400">No registrado</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-slate-600 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-sm font-medium text-slate-600">
                            {cliente.tipoPersona === 'FISICA' ? 'Dirección' : 'Domicilio / Sede Social'}
                          </label>
                          <p className="mt-0.5 text-slate-900">
                            {cliente.direccion || (
                              <span className="text-slate-400">No registrada</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notas Internas */}
                {cliente.notasInternas && (
                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50 border-b">
                      <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-teal-600" />
                        Notas Internas
                      </CardTitle>
                      <CardDescription>Información adicional de uso interno</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-slate-700 whitespace-pre-wrap">{cliente.notasInternas}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Casos del Cliente */}
                <Card className="shadow-sm border-slate-200">
                  <CardHeader className="bg-slate-50 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-indigo-600" />
                        Casos Asociados ({totalCasos})
                      </CardTitle>
                      {totalCasos > 0 && (
                        <Link href={`/casos?cliente=${cliente.id}`}>
                          <Button variant="outline" size="sm">
                            Ver todos los casos
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {cliente.casos.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Briefcase className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-sm">No hay casos asociados a este cliente</p>
                        <Link href={`/casos/nuevo?clienteId=${cliente.id}`}>
                          <Button className="mt-4" size="sm">
                            Crear Primer Caso
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cliente.casos.slice(0, 5).map((caso) => (
                          <Link key={caso.id} href={`/casos/${caso.id}`}>
                            <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-xs text-slate-500">
                                      #{caso.numero}
                                    </span>
                                    <Badge variant={caso.estaCerrado ? 'secondary' : 'default'} className="text-xs">
                                      {caso.estaCerrado ? 'Cerrado' : caso.estado}
                                    </Badge>
                                  </div>
                                  <h4 className="font-semibold text-slate-900">{caso.titulo}</h4>
                                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                    {caso.descripcion}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatearFechaCorta(caso.fechaInicio)}
                                    </span>
                                    {caso.tipo && (
                                      <span className="px-2 py-0.5 bg-slate-100 rounded">
                                        {caso.tipo}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                        
                        {cliente.casos.length > 5 && (
                          <div className="text-center pt-2">
                            <Link href={`/casos?cliente=${cliente.id}`}>
                              <Button variant="outline" size="sm">
                                Ver {cliente.casos.length - 5} casos más
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* COLUMNA DERECHA */}
              <div className="space-y-6">
                
                {/* ===== NUEVO: Sección de Acceso al Portal ===== */}
                <PortalAccesoSection 
                  cliente={{
                    id: cliente.id,
                    nombre: cliente.nombre,
                    apellido: cliente.apellido,
                    email: cliente.email,
                    usuarioPortalId: cliente.usuarioPortalId,
                    usuarioPortal: cliente.usuarioPortal
                  }}
                  userRol={userRol}
                />
                {/* ============================================== */}

                {/* Estadísticas de Casos */}
                <Card className="shadow-sm border-slate-200">
                  <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="text-lg">Resumen de Casos</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-slate-700">Total de casos</span>
                        </div>
                        <span className="text-xl font-bold text-blue-600">{totalCasos}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-slate-700">Expedientes activos</span>
                        </div>
                        <span className="text-xl font-bold text-green-600">{casosActivos}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-700">Casos cerrados</span>
                        </div>
                        <span className="text-xl font-bold text-slate-600">{casosCerrados}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Información del Sistema */}
                <Card className="shadow-sm border-slate-200">
                  <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Información del Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      
                      <div>
                        <label className="text-xs font-medium text-slate-600">Fecha de Registro</label>
                        <p className="mt-1 text-sm text-slate-900 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {formatearFechaCorta(cliente.createdAt)}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600">Última Modificación</label>
                        <p className="mt-1 text-sm text-slate-900 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {formatearFechaCorta(cliente.updatedAt)}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <label className="text-xs font-medium text-slate-600">Abogado Responsable</label>
                        <p className="mt-1 text-sm text-slate-900">
                          {cliente.abogado.name || cliente.abogado.email}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600">ID del Cliente</label>
                        <p className="mt-1 text-xs font-mono text-slate-500 break-all">
                          {cliente.id}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Estado del Cliente */}
                <Card className={`shadow-sm border-2 ${
                  cliente.activo ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      {cliente.activo ? (
                        <>
                          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                          <h3 className="font-semibold text-green-900">Cliente Activo</h3>
                          <p className="text-sm text-green-700 mt-1">
                            Puede tener expedientes activos y recibir notificaciones
                          </p>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                          <h3 className="font-semibold text-gray-900">Cliente Inactivo</h3>
                          <p className="text-sm text-gray-700 mt-1">
                            Mantenido en historial. No aparece en listados principales
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}