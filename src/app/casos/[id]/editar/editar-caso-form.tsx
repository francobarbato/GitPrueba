'use client'

import { actualizarCasoAction } from "../../actions" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Save, Star, AlertCircle, Scale, User, Lock, AlertTriangle, MapPin } from 'lucide-react' 
import Link from "next/link"
import { useFormState, useFormStatus } from "react-dom"
import { useState, FormEvent } from "react"

const TIPOS_CASO = ["LABORAL", "CIVIL", "COMERCIAL", "FAMILIA", "PENAL", "SUCESIONES", "OTRO"]

const ESTADOS_CASO = [
  "Inicio / Demanda",
  "Mediación / Previo",
  "Prueba (Oficios/Pericias)",
  "Alegatos / Conclusiones",
  "Sentencia / Resolución",
  "Apelación",
  "Ejecución de Sentencia",
  "Terminado",
  "Archivado"
]

const FUEROS = [
  "Capital Federal",
  "Provincia de Buenos Aires",
  "Córdoba",
  "Santa Fe",
  "Mendoza",
  "Tucumán",
  "Salta",
  "Federal"
]

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
  // @ts-ignore
  const [state, dispatch] = useFormState(actualizarCasoAction, initialState)

  // Control de estado para la etapa procesal
  const [etapaActual, setEtapaActual] = useState(caso.estado)
  const etapaOriginal = caso.estado

  // Función auxiliar para formatear fecha
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ""
    return new Date(dateString).toISOString().split('T')[0]
  }

  // Estado del checklist con datos iniciales
  const [requisitos, setRequisitos] = useState<{ description: string; dueDate: string; isCompleted?: boolean }[]>(
    caso.requirements ? caso.requirements.map((r: any) => ({
        description: r.description,
        dueDate: formatDateForInput(r.dueDate),
        isCompleted: r.isCompleted
    })) : []
  )

  // Interceptor del envío para confirmar cambio de estado
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (etapaActual !== etapaOriginal) {
        const confirmado = window.confirm(
            `⚠️ ATENCIÓN: Estás a punto de cambiar la etapa procesal de:\n\n"${etapaOriginal}"  ➡️  "${etapaActual}"\n\n¿Estás seguro de que el expediente avanzó de fase?`
        )
        if (!confirmado) {
            e.preventDefault() // Cancela el envío si dice que no
        }
    }
  }

  return (
    <Card className="shadow-md border-slate-200 max-w-5xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-blue-600" />
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                Editar Caso: {caso.numero}
                {caso.isFavorite && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
              </CardTitle>
              <CardDescription>Modifique los datos, prioridades o requisitos del expediente</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          
          {state?.error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <p className="font-bold">Error</p>
                <p>{state.error}</p>
            </div>
          )}

          {/* Agregamos onSubmit para interceptar y preguntar */}
          <form action={dispatch} onSubmit={handleSubmit} className="space-y-8">
            
            <input type="hidden" name="id" value={caso.id} />

            {/* SECCIÓN 1: IDENTIFICACIÓN (CON CAMPOS BLOQUEADOS) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                <h2 className="text-lg font-semibold text-slate-800">Identificación del Caso</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                
                {/* NÚMERO - BLOQUEADO */}
                <div className="space-y-2">
                  <Label htmlFor="numero" className="flex items-center gap-2">
                    Nº Expediente <Lock className="w-3 h-3 text-slate-400"/>
                  </Label>
                  <Input 
                    id="numero" 
                    defaultValue={caso.numero} 
                    disabled 
                    className="bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                  />
                  {/* Input oculto para enviar el valor aunque esté disabled */}
                  <input type="hidden" name="numero" value={caso.numero} />
                </div>

                {/* FUERO - BLOQUEADO */}
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="flex items-center gap-2">
                    Materia / Tipo <Lock className="w-3 h-3 text-slate-400"/>
                  </Label>
                  <Select defaultValue={caso.tipo} disabled>
                    <SelectTrigger className="bg-slate-100 text-slate-500 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_CASO.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="tipo" value={caso.tipo} />
                </div>

                {/* ESTADO - EDITABLE CON ADVERTENCIA */}
                <div className="space-y-2">
                  <Label htmlFor="estado" className="font-bold text-blue-700">Etapa Procesal (Modificable)</Label>
                  <Select name="estado" value={etapaActual} onValueChange={setEtapaActual}>
                    <SelectTrigger className="bg-white border-blue-300 ring-offset-0 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Estado actual" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_CASO.map(estado => (
                        <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ALERTA VISUAL DE CAMBIO DE ESTADO */}
              {etapaActual !== etapaOriginal && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>
                        <span className="font-bold block"> Cambio de Etapa Detectado</span>
                        Estás moviendo el caso de <strong>{etapaOriginal}</strong> a <strong>{etapaActual}</strong>. 
                        Se te pedirá confirmación al guardar.
                    </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="titulo">Carátula / Título del Caso</Label>
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
            </div>

            {/* SECCIÓN 2: CLIENTE (BLOQUEADO) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">2</div>
                <h2 className="text-lg font-semibold text-slate-800">Cliente (Vinculado)</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente Asignado <Lock className="w-3 h-3 text-slate-400"/>
                  </Label>
                  
                  {/* Select deshabilitado para mostrar quién es */}
                  <Select defaultValue={caso.clienteId} disabled>
                    <SelectTrigger className="bg-slate-100 text-slate-500 border-slate-200">
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
                  
                  {/* Input oculto vital para el form action */}
                  <input type="hidden" name="clienteId" value={caso.clienteId} />
                  
                  <p className="text-xs text-slate-500 mt-1">
                    * El cliente no puede modificarse una vez creado el expediente. Si hubo un error, archive este caso y cree uno nuevo.
                  </p>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: RADICACIÓN Y DATOS FINANCIEROS (NUEVA) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">3</div>
                <h2 className="text-lg font-semibold text-slate-800">Radicación y Datos Financieros</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Fuero Jurisdiccional
                  </Label>
                  <Select name="fuero" defaultValue={caso.fuero || ""}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {FUEROS.map(fuero => (
                        <SelectItem key={fuero} value={fuero}>{fuero}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Juzgado / Secretaría</Label>
                  <Input 
                    name="juzgado" 
                    placeholder="Ej: Juzgado Nº 45 Civ. y Com."
                    defaultValue={caso.juzgado || ""}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Monto en Disputa ($)</Label>
                  <Input 
                    name="monto_disputa" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00"
                    defaultValue={caso.montoDisputa || ""}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ubicación Física del Expediente</Label>
                <Input 
                  name="ubicacion_fisica" 
                  placeholder="Ej: Bibliorato A - Estante 2"
                  defaultValue={caso.ubicacionFisica || ""}
                />
              </div>
            </div>

            {/* SECCIÓN 4: PRIORIDAD (ANTES 3) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">4</div>
                <h2 className="text-lg font-semibold text-slate-800">Prioridad y Seguimiento</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <Label htmlFor="priority" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" /> Prioridad
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

                <div className="p-4 bg-slate-50 rounded-lg flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    name="isFavorite" 
                    id="isFavorite" 
                    defaultChecked={caso.isFavorite}
                    className="w-5 h-5 accent-yellow-500 cursor-pointer" 
                  />
                  <Label htmlFor="isFavorite" className="flex items-center gap-2 cursor-pointer">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">Marcar como Favorito</p>
                      <p className="text-xs text-slate-600">Destacado en dashboard</p>
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            {/* Input oculto para mantener requisitos si no se tocan (opcional según tu lógica de controller) */}
            <input type="hidden" name="requirements" value={JSON.stringify(requisitos)} />

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