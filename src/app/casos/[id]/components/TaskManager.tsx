"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CalendarIcon, Plus, Trash2, Edit2, CalendarClock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "src/lib/utils"
import { useToast } from "../../../hooks/use-toast"

interface Requirement {
  id: string
  description: string
  dueDate: Date | null
  isCompleted: boolean
}

interface TaskManagerProps {
  casoId: string
  requirements: any[]
}

export function TaskManager({ casoId, requirements: initialRequirements }: TaskManagerProps) {
  const [tareas, setTareas] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTarea, setEditingTarea] = useState<Requirement | null>(null)

  // Form state
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    const formattedReqs = initialRequirements.map((r) => ({
      ...r,
      dueDate: r.dueDate ? new Date(r.dueDate) : null,
    }))
    setTareas(formattedReqs)
  }, [initialRequirements])

  // Cargar tareas
  const cargarTareas = async () => {
    try {
      console.log("[v0] Fetching tasks for case:", casoId)
      setLoading(true)
      const res = await fetch(`/api/tareas?casoId=${casoId}`)
      if (!res.ok) throw new Error("Error al cargar tareas")
      const data = await res.json()
      console.log("[v0] Tasks loaded:", data)

      // Convertir fechas de string a Date
      const tareasFormateadas = data.map((t: any) => ({
        ...t,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
      }))

      setTareas(tareasFormateadas)
    } catch (error) {
      console.error("[v0] Error cargando tareas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Crear o editar tarea
  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({
        title: "Error",
        description: "La descripción es requerida",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] Submitting task:", { description, dueDate, editingTarea })
    setSubmitting(true)
    try {
      if (editingTarea) {
        // Editar tarea existente
        const res = await fetch(`/api/tareas/${editingTarea.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "editar",
            description,
            dueDate: dueDate?.toISOString(),
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          console.error("[v0] Error response:", error)
          throw new Error(error.error || "Error al editar tarea")
        }

        toast({
          title: "Tarea actualizada",
          description: "La tarea se actualizó correctamente",
        })
      } else {
        // Crear nueva tarea
        console.log("[v0] Creating new task for case:", casoId)
        const res = await fetch("/api/tareas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            casoId,
            description,
            dueDate: dueDate?.toISOString(),
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          console.error("[v0] Error response:", error)
          throw new Error(error.error || "Error al crear tarea")
        }

        const newTask = await res.json()
        console.log("[v0] Task created successfully:", newTask)

        toast({
          title: "Tarea creada",
          description: "La tarea se creó correctamente y aparecerá en los reportes",
        })
      }

      // Resetear form y recargar
      setDescription("")
      setDueDate(undefined)
      setDialogOpen(false)
      setEditingTarea(null)
      await cargarTareas()
    } catch (error: any) {
      console.error("[v0] Error al guardar tarea:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la tarea",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Completar/reactivar tarea
  const toggleComplete = async (tarea: Requirement) => {
    try {
      console.log("[v0] Toggling task completion:", tarea.id, !tarea.isCompleted)
      const action = tarea.isCompleted ? "reactivar" : "completar"
      const res = await fetch(`/api/tareas/${tarea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) throw new Error("Error al actualizar tarea")

      await cargarTareas()

      toast({
        title: tarea.isCompleted ? "Tarea reactivada" : "Tarea completada",
        description: tarea.isCompleted ? "La tarea se reactivó correctamente" : "La tarea se marcó como completada",
      })
    } catch (error) {
      console.error("[v0] Error al cambiar estado:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive",
      })
    }
  }

  // Eliminar tarea
  const handleDelete = async (tareaId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta tarea?")) return

    try {
      console.log("[v0] Deleting task:", tareaId)
      const res = await fetch(`/api/tareas/${tareaId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Error al eliminar tarea")

      await cargarTareas()

      toast({
        title: "Tarea eliminada",
        description: "La tarea se eliminó correctamente",
      })
    } catch (error) {
      console.error("[v0] Error al eliminar:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      })
    }
  }

  // Abrir diálogo para editar
  const openEditDialog = (tarea: Requirement) => {
    setEditingTarea(tarea)
    setDescription(tarea.description)
    setDueDate(tarea.dueDate || undefined)
    setDialogOpen(true)
  }

  // Cerrar diálogo y resetear
  const closeDialog = () => {
    setDialogOpen(false)
    setEditingTarea(null)
    setDescription("")
    setDueDate(undefined)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={() => setEditingTarea(null)}>
              <Plus className="h-4 w-4" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTarea ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
              <DialogDescription>
                {editingTarea
                  ? "Modifica los detalles de la tarea"
                  : "Agrega una nueva tarea con fecha de vencimiento para generar alertas automáticas en los reportes"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Input
                  id="description"
                  placeholder="Ej: Presentar documentación en juzgado"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dueDate} onSelect={(date) => setDueDate(date ?? undefined)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Guardando..." : editingTarea ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tareas.length === 0 ? (
        <div className="text-center py-16">
          <CalendarClock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">La agenda está vacía</p>
          <p className="text-sm text-slate-400">Agrega una tarea para activar las alertas automáticas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tareas.map((tarea) => (
            <div
              key={tarea.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border hover:bg-slate-50 transition",
                tarea.isCompleted && "bg-muted/50",
              )}
            >
              <Checkbox checked={tarea.isCompleted} onCheckedChange={() => toggleComplete(tarea)} className="mt-1" />

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium text-slate-700",
                    tarea.isCompleted && "line-through text-muted-foreground",
                  )}
                >
                  {tarea.description}
                </p>

                {tarea.dueDate && (
                  <span
                    className={cn(
                      "inline-block px-2 py-1 rounded text-xs font-medium mt-1",
                      tarea.isCompleted ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-700",
                    )}
                  >
                    Vence: {format(tarea.dueDate, "PPP", { locale: es })}
                  </span>
                )}
              </div>

              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(tarea)} disabled={tarea.isCompleted}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(tarea.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
