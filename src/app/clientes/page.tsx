// src/app/clientes/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { ClienteService } from "@/lib/aplication/services/cliente.service"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, User, Building2, Eye } from "lucide-react"

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

  // Obtener clientes según rol
  let clientes = []
  if (isAdmin(userRol) || isAsistente(userRol)) {
    // Admin y Asistente ven todos los clientes
    clientes = await clienteService.getAllClientes()
  } else {
    // Abogado ve solo sus clientes
    clientes = await clienteService.getClientesByAbogado(user.id)
  }

  // Filtrado
  const terminoBusqueda = searchParams?.buscar?.toLowerCase() || ""
  if (terminoBusqueda) {
    clientes = clientes.filter(c => 
      c.nombre.toLowerCase().includes(terminoBusqueda) || 
      c.apellido?.toLowerCase().includes(terminoBusqueda) ||
      c.email?.toLowerCase().includes(terminoBusqueda) ||
      c.numeroDocumento?.includes(terminoBusqueda)
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{getTitulo()}</h1>
                <p className="text-gray-600">{getSubtitulo()}</p>
              </div>
              
              {/* Botón Nuevo Cliente - Todos los roles pueden crear */}
              <Link href="/clientes/nuevo">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Nuevo Cliente
                </Button>
              </Link>
            </div>

            {/* Indicador de rol para Asistente */}
            {isAsistente(userRol) && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                <strong>Modo Asistente:</strong> Puedes ver y registrar clientes. 
                Los clientes creados quedarán disponibles para ser asignados a casos por los abogados.
              </div>
            )}

            {/* Filtros */}
            <Card className="mb-6 shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <form action="" className="flex gap-4">
                  <Input
                    name="buscar"
                    placeholder="Buscar por nombre, DNI, email... (Presiona Enter)"
                    defaultValue={searchParams?.buscar}
                    className="flex-1"
                  />
                </form>
              </CardContent>
            </Card>

            {/* Tabla */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle>Lista de Clientes ({clientes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {clientes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No hay clientes registrados</p>
                    <Link href="/clientes/nuevo" className="text-blue-600 hover:underline text-sm mt-2 block">
                      Crear el primero
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-semibold text-slate-600">Tipo</TableHead>
                          <TableHead className="font-semibold text-slate-600">Cliente</TableHead>
                          <TableHead className="font-semibold text-slate-600">Documento</TableHead>
                          <TableHead className="font-semibold text-slate-600">Email</TableHead>
                          <TableHead className="font-semibold text-slate-600">Teléfono</TableHead>
                          <TableHead className="font-semibold text-slate-600">Estado</TableHead>
                          <TableHead className="font-semibold text-slate-600">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientes.map((cliente) => (
                          <TableRow key={cliente.id} className="hover:bg-slate-50 transition">
                            {/* Indicador de tipo de persona */}
                            <TableCell>
                              <div title={cliente.tipoPersona === 'FISICA' ? "Persona Física" : "Persona Jurídica"}>
                                {cliente.tipoPersona === 'FISICA' ? (
                                  <User className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Building2 className="h-4 w-4 text-purple-600" />
                                )}
                              </div>
                            </TableCell>
                            
                            {/* Nombre */}
                            <TableCell className="font-medium text-slate-900">
                              {cliente.nombre} {cliente.apellido || ''}
                            </TableCell>
                            
                            {/* Documento */}
                            <TableCell className="text-slate-600">
                              {cliente.numeroDocumento ? (
                                <span className="text-xs">
                                  <span className="font-semibold">{cliente.tipoDocumento || 'DNI'}:</span> {cliente.numeroDocumento}
                                </span>
                              ) : "-"}
                            </TableCell>
                            
                            {/* Email */}
                            <TableCell className="text-slate-600 text-sm">{cliente.email || "-"}</TableCell>
                            
                            {/* Teléfono */}
                            <TableCell className="text-slate-600 text-sm">{cliente.telefono || "-"}</TableCell>
                            
                            {/* Estado */}
                            <TableCell>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                                ${cliente.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                {cliente.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </TableCell>
                            
                            {/* Acciones */}
                            <TableCell>
                              <div className="flex gap-2">
                                <Link href={`/clientes/${cliente.id}`}>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 hover:bg-blue-50"
                                    title="Ver detalles">
                                    <Eye className="w-4 h-4 text-blue-600" />
                                  </Button>
                                </Link>
                                <Link href={`/clientes/${cliente.id}/editar`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Edit className="w-4 h-4 text-slate-500 hover:text-blue-600" />
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