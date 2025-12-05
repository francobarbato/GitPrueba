'use client'

import { crearCasoAction } from "../actions" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Plus, Trash2, Star, Flame, Activity } from 'lucide-react' 
import Link from "next/link"
import { useFormState, useFormStatus } from "react-dom"
import { useState } from "react" 
// import { Switch } from "@/components/ui/switch" // Si ya lo instalaste, descoméntalo y úsalo

const TIPOS_CASO = ["Laboral", "Civil", "Comercial", "Familia", "Penal"]
const PRIORIDADES = ["HIGH", "NORMAL", "LOW"]

// AQUI AGREGAMOS TUS ESTADOS PERSONALIZADOS
const ESTADOS_CASO = ["Abierto", "En proceso", "Completado", "Cerrado", "Archivado"]

type ClienteSimple = {
    id: string;
    nombre: string;
    apellido: string;
}

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

  // Estado local para el checklist
  const [requisitos, setRequisitos] = useState<{ description: string; dueDate: string }[]>([])

  const agregarRequisito = () => {
    setRequisitos([...requisitos, { description: "", dueDate: "" }])
  }

  const eliminarRequisito = (index: number) => {
    const nuevos = [...requisitos]
    nuevos.splice(index, 1)
    setRequisitos(nuevos)
  }

  const actualizarRequisito = (index: number, campo: 'description' | 'dueDate', valor: string) => {
    const nuevos = [...requisitos]
    nuevos[index] = { ...nuevos[index], [campo]: valor }
    setRequisitos(nuevos)
  }

  return (
    <Card className="max-w-4xl shadow-md border-slate-200">
        <CardHeader>
          <CardTitle>Información del Caso</CardTitle>
          <CardDescription>Complete los datos para registrar un nuevo expediente.</CardDescription>
        </CardHeader>
        <CardContent>
          
          {state?.error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <p className="font-bold">Error</p>
                <p>{state.error}</p>
            </div>
          )}

          <form action={dispatch} className="space-y-6">
            
            {/* --- SECCIÓN 1: DATOS CLAVE, ESTADO Y PRIORIDAD --- */}
            {/* Cambiamos a 3 columnas para que entre el Estado prolijamente */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 1. Número */}
              <div className="space-y-2">
                <Label htmlFor="numero">Número de Caso *</Label>
                <Input id="numero" name="numero" placeholder="Ej: EXP-2024-001" required />
              </div>

              {/* 2. Estado (NUEVO) */}
              <div className="space-y-2">
                <Label htmlFor="estado" className="flex items-center gap-2">
                   <Activity className="h-4 w-4 text-blue-500" /> Estado Inicial
                </Label>
                <Select name="estado" defaultValue="Abierto">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CASO.map((estado) => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Prioridad */}
              <div className="space-y-2">
                <Label htmlFor="priority" className="flex items-center gap-2">
                   Prioridad
                </Label>
                <Select name="priority" defaultValue="NORMAL">
                  <SelectTrigger>
                    <SelectValue placeholder="Nivel de prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">Alta (Urgente)</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="LOW">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* --- SECCIÓN 2: DESCRIPCIÓN --- */}
            <div className="space-y-2">
              <Label htmlFor="titulo">Título del Caso *</Label>
              <Input id="titulo" name="titulo" placeholder="Carátula o Título descriptivo" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea 
                id="descripcion" 
                name="descripcion" 
                placeholder="Detalles del proceso, situación actual, observaciones..." 
                rows={3}
                required 
              />
            </div>

            {/* --- SECCIÓN 3: CLASIFICACIÓN Y CLIENTE --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Caso *</Label>
                <Select name="tipo" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar fuero/tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CASO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
              </div>
            </div>

             {/* Switch de Favorito */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border border-slate-100">
                <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-100" />
                    <Label htmlFor="isFavorite" className="cursor-pointer">¿Marcar como caso Favorito/Destacado?</Label>
                </div>
                <input type="checkbox" name="isFavorite" id="isFavorite" className="ml-auto w-5 h-5 accent-blue-600 cursor-pointer" />
            </div>

            {/* Input oculto para fecha (default hoy) */}
            <div className="hidden">
                 <Input name="fechaInicio" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>

            <hr className="border-slate-200" />

            {/* --- SECCIÓN 4: CHECKLIST INICIAL --- */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-base font-semibold">Checklist de Requisitos Iniciales</Label>
                        <p className="text-sm text-muted-foreground">Documentos o tareas faltantes (generan alertas de vencimiento).</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={agregarRequisito}>
                        <Plus className="h-4 w-4 mr-2" /> Agregar Item
                    </Button>
                </div>

                <div className="space-y-3">
                    {requisitos.map((req, index) => (
                        <div key={index} className="flex gap-3 items-start">
                            <div className="flex-1">
                                <Input 
                                    placeholder="Ej: Traer DNI, Pagar anticipo..." 
                                    value={req.description}
                                    onChange={(e) => actualizarRequisito(index, 'description', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="w-40">
                                <Input 
                                    type="date" 
                                    value={req.dueDate}
                                    onChange={(e) => actualizarRequisito(index, 'dueDate', e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => eliminarRequisito(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {requisitos.length === 0 && (
                        <p className="text-sm text-slate-400 italic text-center py-4 border border-dashed rounded-md bg-slate-50">
                            No hay requisitos iniciales cargados.
                        </p>
                    )}
                </div>

                {/* Input oculto que envía el array JSON al server action */}
                <input type="hidden" name="requirements" value={JSON.stringify(requisitos)} />
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