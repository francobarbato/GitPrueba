'use client'

import { actualizarCasoAction } from "../../actions" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Save, Star, Flame, Plus, Trash2 } from 'lucide-react' 
import Link from "next/link"
import { useFormState, useFormStatus } from "react-dom"
import { useState } from "react"

const TIPOS_CASO = ["Laboral", "Civil", "Comercial", "Familia", "Penal"]
const ESTADOS_CASO = ["Abierto", "En proceso", "Cerrado", "Archivado"]
const PRIORIDADES = ["HIGH", "NORMAL", "LOW"]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700 text-white">
      <Save className="h-4 w-4 mr-2" />
      {pending ? "Guardando..." : "Guardar Cambios"}
    </Button>
  )
}

export function EditarCasoForm({ caso, clientes }: { caso: any, clientes: any[] }) {
  const initialState = { message: null, error: null }
  const [state, dispatch] = useFormState(actualizarCasoAction, initialState)

  // --- LÓGICA DE CHECKLIST (Igual al Create, pero con datos iniciales) ---
  
  // Función auxiliar para formatear fecha que viene de DB (ISO) a Input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ""
    return new Date(dateString).toISOString().split('T')[0]
  }

  // Inicializamos el estado con los requisitos existentes del caso
  const [requisitos, setRequisitos] = useState<{ description: string; dueDate: string; isCompleted?: boolean }[]>(
    caso.requirements ? caso.requirements.map((r: any) => ({
        description: r.description,
        dueDate: formatDateForInput(r.dueDate),
        isCompleted: r.isCompleted
    })) : []
  )

  const agregarRequisito = () => {
    setRequisitos([...requisitos, { description: "", dueDate: "" }])
  }

  const eliminarRequisito = (index: number) => {
    const nuevos = [...requisitos]
    nuevos.splice(index, 1)
    setRequisitos(nuevos)
  }

  const actualizarRequisito = (index: number, campo: 'description' | 'dueDate' | 'isCompleted', valor: any) => {
    const nuevos = [...requisitos]
    // @ts-ignore
    nuevos[index] = { ...nuevos[index], [campo]: valor }
    setRequisitos(nuevos)
  }

  return (
    <Card className="shadow-md border-slate-200 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Editar Caso: {caso.numero}
            {caso.isFavorite && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
          </CardTitle>
          <CardDescription>Modifique los datos, prioridades o requisitos del expediente.</CardDescription>
        </CardHeader>
        <CardContent>
          
          {state?.error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <p className="font-bold">Error</p>
                <p>{state.error}</p>
            </div>
          )}

          <form action={dispatch} className="space-y-6">
            
            {/* ID DEL CASO (NECESARIO) */}
            <input type="hidden" name="id" value={caso.id} />

            {/* --- FILA 1: ESTADO Y PRIORIDAD --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="space-y-2">
                <Label htmlFor="estado">Estado Actual</Label>
                <Select name="estado" defaultValue={caso.estado}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Estado actual" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CASO.map((estado) => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PRIORIDAD */}
              <div className="space-y-2">
                <Label htmlFor="priority" className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" /> Prioridad
                </Label>
                <Select name="priority" defaultValue={caso.priority || "NORMAL"}>
                  <SelectTrigger className="bg-white">
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

            {/* --- FILA 2: NÚMERO Y TÍTULO --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="numero">Número de Caso</Label>
                <Input id="numero" name="numero" defaultValue={caso.numero} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título del Caso</Label>
                <Input id="titulo" name="titulo" defaultValue={caso.titulo} required />
              </div>
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

            {/* --- FILA 3: TIPO Y CLIENTE --- */}
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

            {/* SWITCH FAVORITO */}
            <div className="flex items-center gap-2 p-3 rounded-md border border-slate-200 mt-2">
                <div className="flex items-center gap-2">
                    <Star className={`h-5 w-5 ${caso.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
                    <Label htmlFor="isFavorite" className="cursor-pointer font-medium">Marcar como Favorito</Label>
                </div>
                <input 
                    type="checkbox" 
                    name="isFavorite" 
                    id="isFavorite" 
                    defaultChecked={caso.isFavorite}
                    className="ml-auto w-5 h-5 accent-blue-600 cursor-pointer" 
                />
            </div>

             <hr className="border-slate-200" />

            {/* --- SECCIÓN CHECKLIST (IGUAL QUE EN CREAR) --- */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-base font-semibold">Checklist de Requisitos / Plazos</Label>
                        <p className="text-sm text-muted-foreground">Gestione vencimientos y tareas pendientes.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={agregarRequisito}>
                        <Plus className="h-4 w-4 mr-2" /> Agregar Item
                    </Button>
                </div>

                <div className="space-y-3">
                    {requisitos.map((req, index) => (
                        <div key={index} className="flex gap-3 items-center">
                            {/* Checkbox de completado (Extra para el edit) */}
                            <input 
                                type="checkbox"
                                checked={req.isCompleted}
                                onChange={(e) => actualizarRequisito(index, 'isCompleted', e.target.checked)}
                                className="w-5 h-5 accent-green-600 cursor-pointer"
                                title="Marcar como completado"
                            />
                            
                            <div className="flex-1">
                                <Input 
                                    placeholder="Descripción de la tarea o documento" 
                                    value={req.description}
                                    onChange={(e) => actualizarRequisito(index, 'description', e.target.value)}
                                    required
                                    className={req.isCompleted ? "line-through text-slate-400 bg-slate-50" : ""}
                                />
                            </div>
                            <div className="w-40">
                                <Input 
                                    type="date" 
                                    value={req.dueDate}
                                    onChange={(e) => actualizarRequisito(index, 'dueDate', e.target.value)}
                                />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => eliminarRequisito(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {requisitos.length === 0 && (
                        <p className="text-sm text-slate-400 italic text-center py-4 border border-dashed rounded-md bg-slate-50">
                            No hay requisitos cargados.
                        </p>
                    )}
                </div>

                {/* INPUT OCULTO CLAVE PARA ENVIAR AL SERVER */}
                <input type="hidden" name="requirements" value={JSON.stringify(requisitos)} />
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