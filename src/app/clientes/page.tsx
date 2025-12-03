import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { ClienteService } from "@/lib/aplication/services/cliente.service"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react"

// Instancia del servicio
const clienteService = new ClienteService()

export default async function ClientesPage({
  searchParams,
}: {
  searchParams?: { buscar?: string; estado?: string }
}) {
  // 1. Sesión
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  // 2. Obtener datos (Lógica de Roles)
  let clientes = []
  if (user.rol === 'admin') {
    clientes = await clienteService.getAllClientes()
  } else {
    clientes = await clienteService.getClientesByAbogado(user.id)
  }

  // 3. Filtrado simple en memoria (o podrías pasarlo al repo)
  const terminoBusqueda = searchParams?.buscar?.toLowerCase() || ""
  if (terminoBusqueda) {
    clientes = clientes.filter(c => 
      c.nombre.toLowerCase().includes(terminoBusqueda) || 
      c.apellido.toLowerCase().includes(terminoBusqueda) ||
      c.email?.toLowerCase().includes(terminoBusqueda)
    )
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
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">Gestión de Clientes</h1>
                  <p className="text-gray-600">Registra y administra los clientes del estudio</p>
                </div>
              </div>
              <Link href="/clientes/nuevo">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Nuevo Cliente
                </Button>
              </Link>
            </div>

            {/* Filtros (Visual por ahora, funcionará con URL parameters luego) */}
            <Card className="mb-6 shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <div className="flex-1">
                  {/* Este input necesitaría ser un Client Component para actualizar la URL */}
                  <form action="">
                    <Input
                        name="buscar"
                        placeholder="Buscar por nombre, email... (Presiona Enter)"
                        defaultValue={searchParams?.buscar}
                    />
                  </form>
                </div>
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
                          <TableHead className="font-semibold text-slate-600">Nombre</TableHead>
                          <TableHead className="font-semibold text-slate-600">Email</TableHead>
                          <TableHead className="font-semibold text-slate-600">Documento</TableHead>
                          <TableHead className="font-semibold text-slate-600">Teléfono</TableHead>
                          <TableHead className="font-semibold text-slate-600">Estado</TableHead>
                          <TableHead className="font-semibold text-slate-600">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientes.map((cliente) => (
                          <TableRow key={cliente.id} className="hover:bg-slate-50 transition">
                            <TableCell className="font-medium text-slate-900">
                              {cliente.nombre} {cliente.apellido}
                            </TableCell>
                            <TableCell className="text-slate-600">{cliente.email || "-"}</TableCell>
                            <TableCell className="text-slate-600">
                              {cliente.numeroDocumento ? `${cliente.tipoDocumento || 'DNI'}: ${cliente.numeroDocumento}` : "-"}
                            </TableCell>
                            <TableCell className="text-slate-600">{cliente.telefono || "-"}</TableCell>
                            <TableCell>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                                ${cliente.estado === "Activo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                {cliente.estado || 'Activo'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Link href={`/clientes/${cliente.id}/editar`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Edit className="w-4 h-4 text-slate-500 hover:text-blue-600" />
                                  </Button>
                                </Link>
                                {/* El botón de eliminar requerirá un Server Action o Componente Cliente */}
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600" />
                                </Button>
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