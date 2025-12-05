'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Save, X } from "lucide-react"
import { crearTareaAction } from "src/lib/actions/tarea-actions" // Asegúrate de usar @
import { useState } from "react"

// Recibimos los casos para poder seleccionarlos en el combo
export function NuevaTareaDialog({ casos }: { casos: any[] }) {
  const [open, setOpen] = useState(false)

  // Función wrapper para cerrar el modal al guardar
  async function handleSubmit(formData: FormData) {
    await crearTareaAction(formData)
    setOpen(false) // Cierra el modal manualmente
  }

  return (
    <>
      {/* BOTÓN ACTIVADOR */}
      <Button 
        onClick={() => setOpen(true)} 
        className="gap-2 bg-slate-900 text-white hover:bg-slate-800 shadow-md"
      >
        <Plus className="w-4 h-4" />
        Nueva Tarea Rápida
      </Button>

      {/* MODAL MANUAL (Sin shadcn Dialog) */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-[425px] rounded-lg bg-white p-6 shadow-lg animate-in zoom-in-95 duration-200">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold leading-none tracking-tight">Crear Nueva Tarea</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Formulario */}
            <form action={handleSubmit} className="grid gap-4">
              
              <div className="grid gap-2">
                <Label htmlFor="titulo">Título de la tarea</Label>
                <Input id="titulo" name="titulo" placeholder="Ej: Llamar al cliente..." required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select name="prioridad" defaultValue="Media">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Checkbox Nativo */}
                <div className="flex items-end pb-2">
                   <div className="flex items-center space-x-2">
                    <input 
                        type="checkbox" 
                        id="fatal" 
                        name="fatal" 
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                    />
                    <Label htmlFor="fatal" className="text-sm font-medium leading-none cursor-pointer">
                      ¿Es Plazo Fatal? 🔥
                    </Label>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="casoId">Vincular a Caso (Opcional)</Label>
                <Select name="casoId" defaultValue="none">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar caso..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Sin vincular --</SelectItem>
                    {casos.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                            {c.titulo}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Footer del Modal */}
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" /> Guardar Tarea
                </Button>
              </div>
            </form>
            
          </div>
        </div>
      )}
    </>
  )
}