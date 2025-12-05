'use client'

import { actualizarClienteAction } from "src/lib/actions/clientes-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useFormState, useFormStatus } from "react-dom"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
      <Save className="w-4 h-4" />
      {pending ? "Guardando..." : "Guardar Cambios"}
    </Button>
  )
}

// Recibimos el objeto 'cliente' con sus datos actuales
export function EditarClienteForm({ cliente }: { cliente: any }) {
  const initialState = { message: null, error: null }
  const [state, dispatch] = useFormState(actualizarClienteAction, initialState)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header interno */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/clientes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Editar Cliente</h1>
          <p className="text-gray-500">{cliente.nombre} {cliente.apellido}</p>
        </div>
      </div>

      <Card className="shadow-md border-slate-200">
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>Actualiza los datos del cliente</CardDescription>
        </CardHeader>
        <CardContent>
          
          {state?.error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <p className="font-bold">Error</p>
              <p>{state.error}</p>
            </div>
          )}

          <form action={dispatch} className="space-y-6">
            {/* ID Oculto para saber a quién editar */}
            <input type="hidden" name="id" value={cliente.id} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" defaultValue={cliente.nombre} required />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" name="apellido" defaultValue={cliente.apellido} required />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={cliente.email} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                <Select name="tipoDocumento" defaultValue={cliente.tipoDocumento || "DNI"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="CUIT">CUIT</SelectItem>
                    <SelectItem value="CUIL">CUIL</SelectItem>
                    <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="numeroDocumento">Número</Label>
                <Input id="numeroDocumento" name="numeroDocumento" defaultValue={cliente.numeroDocumento} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" name="telefono" defaultValue={cliente.telefono} />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select name="estado" defaultValue={cliente.estado || "Activo"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" name="direccion" defaultValue={cliente.direccion} />
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t">
              <Link href="/clientes">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <SubmitButton />
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}