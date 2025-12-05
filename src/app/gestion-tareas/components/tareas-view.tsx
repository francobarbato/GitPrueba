'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Calendar, CheckCircle2, Circle, MessageSquare, User, Bot, Send, Flame } from "lucide-react"
import { useState, useEffect } from "react" // Importar useEffect
import { NuevaTareaDialog } from "./nueva-tarea-dialog"
import { toggleTareaAction, crearComentarioAction } from "src/lib/actions/tarea-actions" // Importar la acción nueva

interface TareasViewProps {
  initialTareas: any[]
  casosDisponibles: any[]
  initialFeed: any[] // Nuevo prop
  userNombre: string
}

export function TareasView({ initialTareas, casosDisponibles, initialFeed, userNombre }: TareasViewProps) {
  // Estado local sincronizado con el servidor
  const [tareas, setTareas] = useState(initialTareas)
  const [feed, setFeed] = useState(initialFeed)
  const [nuevoComentario, setNuevoComentario] = useState("")
  const [enviando, setEnviando] = useState(false)

  // CLAVE: Si llegan datos nuevos del servidor (al revalidar), actualizamos la vista
  useEffect(() => {
    setTareas(initialTareas)
  }, [initialTareas])

  useEffect(() => {
    setFeed(initialFeed)
  }, [initialFeed])

  const handleToggle = async (id: string, estadoActual: boolean) => {
    // Optimista: cambiamos ya para que se sienta rápido
    setTareas(prev => prev.map(t => t.id === id ? { ...t, completada: !estadoActual } : t))
    await toggleTareaAction(id, estadoActual)
  }

  const enviarComentario = async () => {
    if (!nuevoComentario.trim()) return
    
    setEnviando(true)
    
    // 1. Llamar al servidor
    await crearComentarioAction(nuevoComentario)
    
    // 2. Limpiar input (La actualización real vendrá por el useEffect cuando el server responda)
    setNuevoComentario("")
    setEnviando(false)
  }

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6">
          
      {/* 1. ENCABEZADO Y ACCIONES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Centro de Comando</h1>
          <p className="text-slate-500">Hola {userNombre}, gestiona tu día a día.</p>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" className="gap-2 bg-white text-slate-700 hover:bg-slate-50">
                <Calendar className="w-4 h-4 text-blue-600" /> Agendar Audiencia
            </Button>
            <NuevaTareaDialog casos={casosDisponibles} />
        </div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LISTA DE TAREAS (Izquierda) */}
        <div className="xl:col-span-7 space-y-6">
            <Card className="h-full shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Mis Tareas y Plazos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="pendientes" className="w-full">
                        <TabsList className="mb-4 grid w-full grid-cols-2 bg-slate-100">
                            <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
                            <TabsTrigger value="completadas">Historial</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="pendientes" className="space-y-2">
                            {tareas.filter(t => !t.completada).map(tarea => (
                                <div key={tarea.id} 
                                     className={`group flex items-start gap-3 p-3 rounded-lg border bg-white border-slate-200 hover:shadow-sm cursor-pointer transition-all
                                     ${tarea.fatal ? 'border-l-4 border-l-rose-500' : ''}`}
                                     onClick={() => handleToggle(tarea.id, tarea.completada)}
                                >
                                    <div className="mt-1 text-slate-400 group-hover:text-blue-600 transition-colors">
                                        <Circle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-800">{tarea.titulo}</span>
                                            {tarea.fatal && (
                                                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                                    Plazo Fatal
                                                </span>
                                            )}
                                        </div>
                                        {tarea.caso && <p className="text-xs text-slate-500 mt-0.5">{tarea.caso.titulo}</p>}
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={tarea.prioridad === 'Alta' ? 'danger' : 'secondary'} className="text-[10px]">
                                            {tarea.prioridad}
                                        </Badge>
                                        <p className="text-xs font-medium text-slate-500 mt-1">{tarea.fecha || "Hoy"}</p>
                                    </div>
                                </div>
                            ))}
                            {tareas.filter(t => !t.completada).length === 0 && (
                                <div className="p-8 text-center text-slate-400 italic">¡Todo al día! No hay pendientes.</div>
                            )}
                        </TabsContent>

                        <TabsContent value="completadas" className="space-y-2 opacity-70">
                             {tareas.filter(t => t.completada).map(tarea => (
                                <div key={tarea.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50" onClick={() => handleToggle(tarea.id, tarea.completada)}>
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span className="font-medium text-slate-500 line-through flex-1">{tarea.titulo}</span>
                                </div>
                             ))}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>

        {/* BITÁCORA (Derecha) */}
        <div className="xl:col-span-5 space-y-6">
            <Card className="h-full shadow-sm border-slate-200 bg-slate-50/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        Bitácora
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm mb-6">
                        <Textarea 
                            placeholder="Escribe una nota..." 
                            className="min-h-[60px] border-0 resize-none text-sm focus-visible:ring-0" 
                            value={nuevoComentario}
                            onChange={(e) => setNuevoComentario(e.target.value)}
                            disabled={enviando}
                        />
                        <div className="flex justify-end mt-2 pt-2 border-t border-slate-100">
                            <Button size="sm" className="h-7 px-3 bg-blue-600" onClick={enviarComentario} disabled={enviando}>
                                {enviando ? '...' : <Send className="w-3 h-3" />}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {feed.map((post) => (
                            <div key={post.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                                    ${post.tipo === 'auto' ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-600'}
                                `}>
                                    {post.tipo === 'auto' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm shadow-sm flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold text-slate-700">{post.autor}</span>
                                        <span className="text-[10px] text-slate-400">{post.tiempo}</span>
                                    </div>
                                    <p className={`text-sm ${post.tipo === 'auto' ? 'text-slate-500 italic' : 'text-slate-700'}`}>
                                        {post.texto}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {feed.length === 0 && <p className="text-center text-slate-400 text-sm">No hay actividad reciente.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  )
}