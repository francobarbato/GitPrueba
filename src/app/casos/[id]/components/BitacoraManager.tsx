'use client'

import { useState } from "react"
import { crearTareaAction, toggleTareaAction } from "../../actions" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarClock, Plus, X, CheckCircle2, Circle, AlertCircle } from "lucide-react"
import { useFormState, useFormStatus } from "react-dom"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending} className="bg-blue-600 text-white">
      {pending ? "Guardando..." : "Guardar Tarea"}
    </Button>
  )
}

export function TaskManager({ casoId, tareas }: { casoId: string, tareas: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  // @ts-ignore
  const [state, dispatch] = useFormState(crearTareaAction, { message: null, error: null })

  // Cerrar formulario si se creó exitosamente
  if (state?.message === "Tarea creada" && isOpen) {
    setIsOpen(false)
    state.message = null // Reset para que no cierre inmediatamente la próxima vez
  }

  const handleToggle = async (id: string, current: boolean) => {
      await toggleTareaAction(id, !current, casoId)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 p-4 bg-slate-50 border-b">
        <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-blue-600"/> Agenda y Plazos
            </h3>
            <p className="text-sm text-slate-500">Gestión de vencimientos y escritos.</p>
        </div>
        <Button size="sm" onClick={() => setIsOpen(!isOpen)} variant={isOpen ? "secondary" : "default"}>
            {isOpen ? <><X className="w-4 h-4 mr-2"/> Cancelar</> : <><Plus className="w-4 h-4 mr-2"/> Nueva Tarea</>}
        </Button>
      </div>

      {/* FORMULARIO DESPLEGABLE */}
      {isOpen && (
        <div className="p-4 bg-blue-50 border-b border-blue-100 animate-in slide-in-from-top-2">
            <form action={dispatch} className="space-y-4">
                <input type="hidden" name="casoId" value={casoId} />
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-1">
                        <Label htmlFor="titulo" className="text-xs">Descripción de la Tarea</Label>
                        <Input name="titulo" placeholder="Ej: Presentar escrito de prueba..." required autoFocus />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="fecha" className="text-xs">Vencimiento (Opcional)</Label>
                        <Input name="fecha" type="date" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="prioridad" className="text-xs">Prioridad</Label>
                        <Select name="prioridad" defaultValue="Media">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Alta">Alta 🔥</SelectItem>
                                <SelectItem value="Media">Media</SelectItem>
                                <SelectItem value="Baja">Baja</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" name="fatal" id="fatal" className="accent-red-600 w-4 h-4" />
                        <Label htmlFor="fatal" className="text-sm cursor-pointer text-slate-700">Es un plazo fatal (Alerta Crítica)</Label>
                    </div>
                    <SubmitButton />
                </div>
            </form>
        </div>
      )}

      {/* LISTA DE TAREAS */}
      <div className="p-0">
        {tareas.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
                <p>No hay tareas pendientes.</p>
            </div>
        ) : (
            <ul className="divide-y divide-slate-100">
                {tareas.map(t => (
                    <li key={t.id} className={`flex justify-between items-center p-4 hover:bg-slate-50 transition ${t.completada ? 'opacity-60 bg-slate-50' : ''}`}>
                        <div className="flex items-center gap-3">
                            <button onClick={() => handleToggle(t.id, t.completada)} className="text-slate-400 hover:text-green-600 transition">
                                {t.completada ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <Circle className="w-6 h-6" />}
                            </button>
                            <div>
                                <span className={`block font-medium ${t.completada ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                    {t.titulo}
                                </span>
                                {t.prioridad === 'Alta' && !t.completada && (
                                    <span className="text-xs text-red-600 font-bold flex items-center gap-1 mt-0.5">
                                        <AlertCircle className="w-3 h-3" /> Prioridad Alta
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            {t.fecha && (
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${
                                    t.fatal && !t.completada ? "bg-red-100 text-red-700 border-red-200" : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}>
                                    Vence: {new Date(t.fecha).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        )}
      </div>
    </div>
  )
}