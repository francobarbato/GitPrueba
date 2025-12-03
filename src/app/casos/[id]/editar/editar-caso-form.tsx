'use client'

import { actualizarCasoAction } from "../../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from 'lucide-react'
import Link from "next/link"
import { useFormState, useFormStatus } from "react-dom"

const TIPOS_CASO = ["Laboral", "Civil", "Comercial", "Familia", "Penal"]
const ESTADOS_CASO = ["Abierto", "En proceso", "Cerrado", "Archivado"]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700 text-white">
      <Save className="h-4 w-4 mr-2" />
      {pending ? "Guardando..." : "Guardar Cambios"}
    </Button>
  )
}

// Recibimos el 'caso' actual y la lista de 'clientes'
export function EditarCasoForm({ caso, clientes }: { caso: any, clientes: any[] }) {
  const initialState = { message: null, error: null }
  const [state, dispatch] = useFormState(actualizarCasoAction, initialState)

  return (
    <Card className="shadow-md border-slate-200">
        <CardHeader>
          <CardTitle>Editar Caso: {caso.numero}</CardTitle>
        </CardHeader>
        <CardContent>
          
          {state?.error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <p className="font-bold">Error</p>
                <p>{state.error}</p>
            </div>
          )}

          <form action={dispatch} className="space-y-6">
            
            {/* INPUT HIDDEN PARA EL ID DEL CASO */}
            <input type="hidden" name="id" value={caso.id} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="numero">Número de Caso</Label>
                <Input id="numero" name="numero" defaultValue={caso.numero} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select name="estado" defaultValue={caso.estado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado actual" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CASO.map((estado) => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">Título del Caso</Label>
              <Input id="titulo" name="titulo" defaultValue={caso.titulo} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea 
                id="descripcion" 
                name="descripcion" 
                defaultValue={caso.descripcion} 
                rows={4} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Caso</Label>
                <Select name="tipo" defaultValue={caso.tipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CASO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clienteId">Cliente</Label>
                <Select name="clienteId" defaultValue={caso.clienteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nombre} {cliente.apellido}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href="/casos">
                <Button variant="outline" type="button">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancelar
                </Button>
              </Link>
              <SubmitButton />
            </div>

          </form>
        </CardContent>
      </Card>
  )
}