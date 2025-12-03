'use client'

import { crearCasoAction } from "../actions" // Asegúrate de tener este action
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from 'lucide-react'
import Link from "next/link"
import { useFormState, useFormStatus } from "react-dom"

const TIPOS_CASO = ["Laboral", "Civil", "Comercial", "Familia", "Penal"]
const ESTADOS_CASO = ["Abierto", "En proceso", "Cerrado", "Archivado"]

// Definición simple de Cliente para las props
type ClienteSimple = {
    id: string; // Ojo: string porque son UUIDs
    nombre: string;
    apellido: string;
}

// Botón de Submit inteligente
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
      <Save className="h-4 w-4 mr-2" />
      {pending ? "Guardando..." : "Crear Caso"}
    </Button>
  )
}

export function NuevoCasoForm({ clientes }: { clientes: ClienteSimple[] }) {
  const initialState = { message: null, error: null }
  const [state, dispatch] = useFormState(crearCasoAction, initialState)

  return (
    <Card className="max-w-2xl shadow-md border-slate-200">
        <CardHeader>
          <CardTitle>Información del Caso</CardTitle>
          <CardDescription>Complete los datos para crear un nuevo caso vinculado a su cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          
          {/* Mensaje de Error */}
          {state?.error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <p className="font-bold">Error</p>
                <p>{state.error}</p>
            </div>
          )}

          <form action={dispatch} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Número de Expediente */}
              <div className="space-y-2">
                <Label htmlFor="numero">Número de Caso *</Label>
                <Input id="numero" name="numero" placeholder="Ej: CASO-2024-001" required />
              </div>

              {/* Fecha Inicio (Opcional, si no se envía el server pone la actual) */}
              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                <Input 
                    id="fechaInicio" 
                    name="fechaInicio" 
                    type="date" 
                    defaultValue={new Date().toISOString().split("T")[0]} 
                />
              </div>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo">Título del Caso *</Label>
              <Input id="titulo" name="titulo" placeholder="Título descriptivo del caso" required />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea 
                id="descripcion" 
                name="descripcion" 
                placeholder="Descripción detallada del caso..." 
                rows={4}
                required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de Caso */}
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Caso *</Label>
                <Select name="tipo" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CASO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="clienteId">Cliente *</Label>
                <Select name="clienteId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.length > 0 ? (
                        clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                                {cliente.nombre} {cliente.apellido}
                            </SelectItem>
                        ))
                    ) : (
                        <SelectItem value="none" disabled>No tienes clientes registrados</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {clientes.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                        * Primero debes crear un cliente en la sección Clientes.
                    </p>
                )}
              </div>
            </div>

            {/* Botones */}
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