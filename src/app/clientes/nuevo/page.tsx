'use client'

// CORRECCIÓN AQUÍ: Usamos la ruta absoluta con @
import { crearClienteAction } from "../../../lib/actions/clientes-actions" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
// Importamos useFormState y useFormStatus correctamente
import { useFormState, useFormStatus } from "react-dom" 

// Botón inteligente
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
      {pending ? "Guardando..." : "Guardar Cliente"}
    </Button>
  )
}

export default function NuevoClientePage() {
  // Configuración del hook para manejar errores
  const initialState = { message: null, error: null }
  const [state, dispatch] = useFormState(crearClienteAction, initialState)

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center items-start">
      <Card className="w-full max-w-2xl shadow-md">
        <CardHeader className="border-b bg-white rounded-t-xl">
          <CardTitle className="text-xl font-bold text-slate-800">Registrar Nuevo Cliente</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white rounded-b-xl">
          
          {/* Mostramos mensaje de error si existe */}
          {state?.error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold">Error:</p>
              <p>{state.error}</p>
            </div>
          )}

          {/* Usamos 'dispatch' en el action */}
          <form action={dispatch} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" placeholder="Ej: Juan" required />
              </div>

              {/* Apellido */}
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" name="apellido" placeholder="Ej: Pérez" required />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="cliente@email.com" required />
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" name="telefono" placeholder="+54 9 351..." />
              </div>

              {/* Tipo Documento */}
              <div className="space-y-2">
                <Label htmlFor="tipoDocumento">Tipo Documento</Label>
                <select 
                    name="tipoDocumento" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <option value="DNI">DNI</option>
                    <option value="CUIL">CUIL</option>
                    <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>

              {/* Número Documento */}
              <div className="space-y-2">
                <Label htmlFor="numeroDocumento">Número</Label>
                <Input id="numeroDocumento" name="numeroDocumento" placeholder="12345678" />
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="direccion">Domicilio</Label>
              <Input id="direccion" name="direccion" placeholder="Calle Falsa 123, Córdoba" />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
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