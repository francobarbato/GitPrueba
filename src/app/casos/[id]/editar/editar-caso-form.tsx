'use client'

import { actualizarCasoAction } from "../../actions" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Save, Star, AlertCircle, Scale, User, Lock, AlertTriangle, MapPin, Ban } from 'lucide-react' 
import Link from "next/link"
import { useFormState, useFormStatus } from "react-dom"
import { useState, useEffect, FormEvent } from "react"
import { 
  getProvinciasParaSelect, 
  getDepartamentosParaSelect 
} from "src/lib/data/argentina-ubicaciones"

// ========== TIPOS DE CASO ACTUALIZADOS ==========
const TIPOS_CASO = [
  { value: "LABORAL", label: "Laboral" },
  { value: "CIVIL_COMERCIAL", label: "Civil y Comercial" },
  { value: "FAMILIA", label: "Familia" },
  { value: "PENAL", label: "Penal" },
  { value: "SUCESIONES", label: "Sucesiones" },
  { value: "CONTENCIOSO_ADMINISTRATIVO", label: "Contencioso Administrativo" },
  { value: "OTRO", label: "Otro" }
]

// ========== ESTADOS ACTIVOS (sin duplicados) ==========
const ESTADOS_CASO_ACTIVOS = [
  "Inicio / Demanda",
  "Mediación / Previo",
  "Prueba (Oficios/Pericias)",
  "Alegatos / Conclusiones",
  "Sentencia de 1ra Instancia",
  "Apelación / 2da Instancia",
  "Ejecución de Sentencia"
  // REMOVIDOS: "Terminado", "Archivado" - Ahora se manejan con el flujo de cierre
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

// Función para extraer provincia y departamento del fuero existente
function extraerProvinciaYDepartamento(fuero: string | null): { provincia: string; departamento: string } {
  if (!fuero) return { provincia: '', departamento: '' }
  
  const partes = fuero.split(',').map(p => p.trim())
  if (partes.length >= 2) {
    return { departamento: partes[0], provincia: partes[1] }
  }
  
  // Si no tiene coma, intentar detectar si es una provincia conocida
  return { provincia: '', departamento: partes[0] || '' }
}

export function EditarCasoForm({ caso, clientes }: { caso: any, clientes: any[] }) {
  const initialState = { message: null, error: null }
  // @ts-ignore
  const [state, dispatch] = useFormState(actualizarCasoAction, initialState)

  // Control de estado para la etapa procesal
  const [etapaActual, setEtapaActual] = useState(caso.estado)
  const etapaOriginal = caso.estado

  // Verificar si el caso está cerrado
  const casoCerrado = caso.estaCerrado === true

  // ========== ESTADOS PARA UBICACIÓN GEOGRÁFICA ==========
  const { provincia: provInicial, departamento: deptoInicial } = extraerProvinciaYDepartamento(caso.fuero)
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState(provInicial)
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(deptoInicial)
  const [departamentosDisponibles, setDepartamentosDisponibles] = useState<{value: string; label: string}[]>([])

  // Cargar provincias
  const provincias: { value: string; label: string }[] = getProvinciasParaSelect()

  // Cargar departamentos cuando cambia la provincia
  useEffect(() => {
    if (provinciaSeleccionada) {
      const deptos = getDepartamentosParaSelect(provinciaSeleccionada)
      setDepartamentosDisponibles(deptos)
      
      // Si el departamento actual no está en la lista, limpiar
      if (departamentoSeleccionado && !deptos.find(d => d.value === departamentoSeleccionado)) {
        // Mantener el valor original si viene del caso existente
        if (deptoInicial && provinciaSeleccionada === provInicial) {
          // No limpiar, mantener el valor original
        } else {
          setDepartamentoSeleccionado('')
        }
      }
    } else {
      setDepartamentosDisponibles([])
    }
  }, [provinciaSeleccionada])

  // Construir el valor del fuero
  const fueroValue = departamentoSeleccionado && provinciaSeleccionada 
    ? `${departamentoSeleccionado}, ${provinciaSeleccionada}`
    : caso.fuero || ''

  // Función auxiliar para formatear fecha
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ""
    try {
      return new Date(dateString).toISOString().split('T')[0]
    } catch {
      return ""
    }
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
            e.preventDefault()
        }
    }
  }

  // Obtener el label del tipo actual (para casos con tipos legacy)
  const getTipoLabel = (tipoValue: string) => {
    // Mapear tipos legacy a nuevos
    if (tipoValue === 'CIVIL' || tipoValue === 'COMERCIAL') {
      return 'Civil y Comercial (Legacy)'
    }
    const tipo = TIPOS_CASO.find(t => t.value === tipoValue)
    return tipo?.label || tipoValue
  }

  // Si el caso está cerrado, mostrar mensaje y no permitir edición
  if (casoCerrado) {
    return (
      <Card className="shadow-md border-red-200 max-w-5xl mx-auto">
        <CardHeader className="bg-red-50">
          <div className="flex items-center gap-3">
            <Ban className="h-8 w-8 text-red-600" />
            <div className="flex-1">
              <CardTitle className="text-red-800">Caso Cerrado</CardTitle>
              <CardDescription className="text-red-600">
                Este expediente ha sido cerrado y no puede editarse
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                <strong>Motivo de cierre:</strong> {caso.motivoCierre || 'No especificado'}
              </p>
              {caso.fechaCierre && (
                <p className="text-red-700 text-sm mt-2">
                  Cerrado el: {new Date(caso.fechaCierre).toLocaleDateString('es-AR')}
                </p>
              )}
              {caso.observacionCierre && (
                <p className="text-red-700 text-sm mt-2">
                  <strong>Observaciones:</strong> {caso.observacionCierre}
                </p>
              )}
            </div>
            
            <p className="text-sm text-slate-600">
              Si necesita reabrir este caso, contacte al Administrador del sistema.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href={`/casos/${caso.id}`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Caso
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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

          {/* AVISO: Para cerrar el caso usar el botón específico */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
            <strong>💡 Tip:</strong> Para cerrar o archivar este caso, use el botón 
            <span className="font-semibold"> "Cerrar Caso"</span> en la vista del expediente. 
            El cierre requiere información adicional (motivo, monto final, etc.) para los reportes.
          </div>

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
                  <input type="hidden" name="numero" value={caso.numero} />
                </div>

                {/* TIPO - BLOQUEADO (muestra el tipo actual) */}
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="flex items-center gap-2">
                    Materia / Tipo <Lock className="w-3 h-3 text-slate-400"/>
                  </Label>
                  <Input 
                    id="tipo-display" 
                    value={getTipoLabel(caso.tipo)} 
                    disabled 
                    className="bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                  />
                  <input type="hidden" name="tipo" value={caso.tipo} />
                </div>

                {/* ESTADO - EDITABLE (SOLO ESTADOS ACTIVOS) */}
                <div className="space-y-2">
                  <Label htmlFor="estado" className="font-bold text-blue-700">Etapa Procesal (Modificable)</Label>
                  <Select name="estado" value={etapaActual} onValueChange={setEtapaActual}>
                    <SelectTrigger className="bg-white border-blue-300 ring-offset-0 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Estado actual" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_CASO_ACTIVOS.map(estado => (
                        <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                      ))}
                      {/* Si el estado actual no está en la lista, mostrarlo igual */}
                      {!ESTADOS_CASO_ACTIVOS.includes(etapaActual) && etapaActual && (
                        <SelectItem key={etapaActual} value={etapaActual}>
                          {etapaActual} (Estado anterior)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Solo estados activos. Para cerrar, use el botón "Cerrar Caso".
                  </p>
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
                  
                  <input type="hidden" name="clienteId" value={caso.clienteId} />
                  
                  <p className="text-xs text-slate-500 mt-1">
                    * El cliente no puede modificarse una vez creado el expediente.
                  </p>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: RADICACIÓN Y DATOS FINANCIEROS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">3</div>
                <h2 className="text-lg font-semibold text-slate-800">Radicación y Datos Financieros</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                {/* PROVINCIA */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Provincia
                  </Label>
                  <Select 
                    value={provinciaSeleccionada} 
                    onValueChange={(value) => {
                      setProvinciaSeleccionada(value)
                      setDepartamentoSeleccionado('')
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar provincia..." />
                    </SelectTrigger>
                    <SelectContent>
                      {provincias.map(prov => (
                        <SelectItem key={prov.value} value={prov.value}>
                          {prov.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* CIUDAD/DEPARTAMENTO */}
                <div className="space-y-2">
                  <Label>Ciudad / Departamento</Label>
                  <Select 
                    value={departamentoSeleccionado} 
                    onValueChange={setDepartamentoSeleccionado}
                    disabled={!provinciaSeleccionada}
                  >
                    <SelectTrigger className={provinciaSeleccionada ? "bg-white" : "bg-slate-100"}>
                      <SelectValue placeholder={provinciaSeleccionada ? "Seleccionar ciudad..." : "Primero seleccione provincia"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentosDisponibles.map(depto => (
                        <SelectItem key={depto.value} value={depto.value}>
                          {depto.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Campo oculto con el fuero combinado */}
                <input type="hidden" name="fuero" value={fueroValue} />

                {/* Preview de ubicación seleccionada */}
                {fueroValue && (
                  <div className="md:col-span-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                    <strong>Ubicación:</strong> {fueroValue}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Juzgado / Secretaría</Label>
                  <Input 
                    name="juzgado" 
                    placeholder="Ej: Juzgado Nº 45 Civ. y Com."
                    defaultValue={caso.juzgado || ""}
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

            {/* SECCIÓN 4: PRIORIDAD */}
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

            <input type="hidden" name="requirements" value={JSON.stringify(requisitos)} />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href={`/casos/${caso.id}`}>
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
