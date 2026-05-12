import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { ClienteService } from "@/lib/aplication/services/cliente.service"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, User, Building2, Eye, ChevronRight, LayoutDashboard } from "lucide-react"
import { Buscador } from "../components/buscador"
import { redirect, notFound } from "next/navigation"

const clienteService = new ClienteService()

// Helper para verificar roles
const isAdmin = (rol: string) => rol?.toUpperCase() === 'ADMIN'
const isAbogado = (rol: string) => rol?.toUpperCase() === 'ABOGADO'
const isAsistente = (rol: string) => rol?.toUpperCase() === 'ASISTENTE'

export default async function ClientesPage({
  searchParams,
}: {
  searchParams?: { buscar?: string; estado?: string }
}) {
  const user = await getUserSessionServer()
  if (!user) redirect("/auth/signin")

  const userRol = user.rol?.toUpperCase() || ''
  // Defensa en profundidad — bloquear roles no operativos
  if (userRol === 'CLIENTE' || userRol === 'ADMIN') notFound()
  
  if (userRol === 'ADMIN') redirect('/')

  // Obtener clientes según rol
  let clientes = []
  if (isAdmin(userRol) || isAsistente(userRol)) {
    // Admin y Asistente ven todos los clientes
    clientes = await clienteService.getAllClientes()
  } else {
    // Abogado ve solo sus clientes
    clientes = await clienteService.getClientesByAbogado(user.id)
  }

  // 1. Filtrado por Estado (Lógica de Borrado Lógico / Archivo)
  const filtroEstado = searchParams?.estado || "habilitados" // Por defecto muestra solo los que sirven
  
  if (filtroEstado === "habilitados") {
    clientes = clientes.filter(c => c.activo === true)
  } else if (filtroEstado === "archivados") {
    clientes = clientes.filter(c => c.activo === false)
  }
  // Si es "todos", no filtramos por activo/inactivo

  // 2. Filtrado por Búsqueda (Texto)
  const terminoBusqueda = searchParams?.buscar?.toLowerCase() || ""
  if (terminoBusqueda) {
    clientes = clientes.filter(c => 
      c.nombre?.toLowerCase().includes(terminoBusqueda) || 
      c.apellido?.toLowerCase().includes(terminoBusqueda) ||
      c.email?.toLowerCase().includes(terminoBusqueda) ||
      c.numeroDocumento?.includes(terminoBusqueda) ||
      // @ts-ignore - Preparado para cuando agreguemos estos campos
      c.cuit?.includes(terminoBusqueda) || 
      // @ts-ignore - Preparado para cuando agreguemos estos campos
      c.razonSocial?.toLowerCase().includes(terminoBusqueda)
    )
  }

  // Textos según rol
  const getTitulo = () => {
    if (isAdmin(userRol)) return 'Gestión de Clientes'
    if (isAsistente(userRol)) return 'Clientes del Estudio'
    return 'Mis Clientes'
  }

  const getSubtitulo = () => {
    if (isAdmin(userRol)) return 'Administra todos los clientes del estudio'
    if (isAsistente(userRol)) return 'Visualización y registro de clientes'
    return 'Registra y administra los clientes de tus casos'
  }

  // Helper para armar las URLs de las pestañas de filtro manteniendo la búsqueda actual
  const buildFilterUrl = (estado: string) => {
    const params = new URLSearchParams()
    if (terminoBusqueda) params.set("buscar", terminoBusqueda)
    params.set("estado", estado)
    return `?${params.toString()}`
  }

  return (
    <div className="flex h-screen bg-slate-50"> {/* Cambiado gray-50 a slate-50 para consistencia */}
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          {/* ELIMINADO max-w-6xl para que use todo el ancho visual */}
          <div className="w-full">
            
            {/* BREADCRUMB AGREGADO */}
            <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-400">
              <Link href="/" className="hover:text-slate-700 transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-3.5 h-3.5" />
                Inicio
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-600 font-medium">Clientes</span>
            </nav>

            {/* HEADER UNIFICADO (Estilo Agenda/Expedientes) */}
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{getTitulo()}</h1>
                <p className="text-sm text-slate-500 mt-1">{getSubtitulo()}</p>
              </div>
              
              <Link href="/clientes/nuevo">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm font-medium">
                  <Plus className="w-4 h-4" />
                  Nuevo Cliente
                </Button>
              </Link>
            </div>

            {/* Indicador de rol para Asistente */}
            {isAsistente(userRol) && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm shadow-sm">
                <strong>Modo Asistente:</strong> Puedes ver y registrar clientes. 
                Los clientes creados quedarán disponibles para ser asignados a casos por los abogados.
              </div>
            )}

            {/* Filtros */}
            <Card className="mb-6 shadow-sm border-slate-200">
              <CardHeader className="pb-3 px-4">
                <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Buscador placeholder="Buscar por nombre, apellido, DNI, empresa..." />
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                    <Link 
                      href={buildFilterUrl('habilitados')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filtroEstado === 'habilitados' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Habilitados
                    </Link>
                    <Link 
                      href={buildFilterUrl('archivados')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filtroEstado === 'archivados' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Archivados
                    </Link>
                    <Link 
                      href={buildFilterUrl('todos')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filtroEstado === 'todos' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Todos
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla */}
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="bg-white border-b border-slate-100 px-4">
                <CardTitle className="text-lg">Lista de Clientes ({clientes.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0"> {/* Eliminado el padding para que la tabla toque los bordes del Card */}
                {clientes.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium text-slate-600">No se encontraron clientes</p>
                    {terminoBusqueda === "" && filtroEstado === "habilitados" && (
                      <Link href="/clientes/nuevo" className="text-blue-600 hover:underline text-sm mt-2 block">
                        Crear el primero
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="w-[80px] font-semibold text-slate-600 text-center">Tipo</TableHead>
                          <TableHead className="font-semibold text-slate-600">Cliente</TableHead>
                          <TableHead className="font-semibold text-slate-600">Documento</TableHead>
                          <TableHead className="font-semibold text-slate-600">Email</TableHead>
                          <TableHead className="font-semibold text-slate-600">Teléfono</TableHead>
                          <TableHead className="font-semibold text-slate-600">Estado</TableHead>
                          <TableHead className="font-semibold text-slate-600 text-right pr-6">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientes.map((cliente) => (
                          <TableRow key={cliente.id} className="hover:bg-slate-50/80 transition-colors group">
                            <TableCell className="text-center">
                              <div className="flex justify-center" title={cliente.tipoPersona === 'FISICA' ? "Persona Física" : "Persona Jurídica"}>
                                {cliente.tipoPersona === 'FISICA' ? (
                                  <User className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Building2 className="h-4 w-4 text-purple-500" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-slate-900 py-4">
                              {cliente.nombre} {cliente.apellido || ''}
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">
                              {cliente.numeroDocumento ? (
                                <span>
                                  <span className="font-medium text-slate-400 text-[10px] uppercase mr-1">{cliente.tipoDocumento || 'DNI'}</span> 
                                  {cliente.numeroDocumento}
                                </span>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm font-light">{cliente.email || "-"}</TableCell>
                            <TableCell className="text-slate-500 text-sm">{cliente.telefono || "-"}</TableCell>
                            <TableCell>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border 
                                ${cliente.activo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                {cliente.activo ? 'Habilitado' : 'Archivado'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-1">
                                <Link href={`/clientes/${cliente.id}`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 group/eye">
                                    <Eye className="w-4 h-4 text-slate-400 group-hover/eye:text-blue-600 transition-colors" />
                                  </Button>
                                </Link>
                                <Link href={`/clientes/${cliente.id}/editar`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 group/edit">
                                    <Edit className="w-4 h-4 text-slate-400 group-hover/edit:text-slate-900 transition-colors" />
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
