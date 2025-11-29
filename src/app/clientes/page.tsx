"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react"

interface Cliente {
  id: number
  nombre: string
  apellido: string
  email: string
  numeroDocumento?: string
  tipoDocumento?: string
  telefono?: string
  estado: string
  createdAt: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState("")
  const [estado, setEstado] = useState("Todos")
  const [error, setError] = useState("")

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (buscar) params.append("buscar", buscar)
      if (estado !== "Todos") params.append("estado", estado)

      const res = await fetch(`/api/clientes?${params}`)
      if (!res.ok) throw new Error("Error al cargar clientes")

      const data = await res.json()
      setClientes(data)
      setError("")
    } catch (err: any) {
      setError(err.message)
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const eliminarCliente = async (id: number) => {
    if (!confirm("¿Estás seguro que deseas eliminar este cliente?")) return

    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")

      setClientes(clientes.filter((c) => c.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
              <p className="text-gray-600">Registra y administra los clientes del estudio</p>
            </div>
          </div>
          <Link href="/clientes/nuevo">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Cliente
            </Button>
          </Link>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, email o documento..."
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
              />
            </div>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={cargarClientes} variant="outline">
              Aplicar Filtros
            </Button>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes ({clientes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded mb-4">{error}</div>}

            {loading ? (
              <div className="text-center py-8">Cargando clientes...</div>
            ) : clientes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay clientes registrados</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">
                          {cliente.nombre} {cliente.apellido}
                        </TableCell>
                        <TableCell>{cliente.email}</TableCell>
                        <TableCell>
                          {cliente.numeroDocumento ? `${cliente.tipoDocumento}: ${cliente.numeroDocumento}` : "-"}
                        </TableCell>
                        <TableCell>{cliente.telefono || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              cliente.estado === "activo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {cliente.estado}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/clientes/${cliente.id}/editar`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={() => eliminarCliente(cliente.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
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
    </div>
  )
}
