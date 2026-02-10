'use client'

import { crearCasoAction } from "../actions" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Plus, Trash2, Star, Flame, AlertTriangle, Building, User, MapPin, Scale, Briefcase, UserPlus } from 'lucide-react' 
import Link from "next/link"
import { useFormState, useFormStatus } from "react-dom"
import { useState, useEffect } from "react" 
import { ClienteSearchCombobox } from "../components/ClienteSearchCombobox"
import { 
  PROVINCIAS_ARGENTINA, 
  getDepartamentosParaSelect,
  getProvinciasParaSelect 
} from "src/lib/data/argentina-ubicaciones"

// ENUM de tipos (CIVIL y COMERCIAL unificados)
const TIPOS_CASO = [
  { value: "LABORAL", label: "Laboral" },
  { value: "CIVIL_COMERCIAL", label: "Civil y Comercial" },
  { value: "FAMILIA", label: "Familia" },
  { value: "PENAL", label: "Penal" },
  { value: "SUCESIONES", label: "Sucesiones" },
  { value: "CONTENCIOSO_ADMINISTRATIVO", label: "Contencioso Administrativo" },
  { value: "OTRO", label: "Otro" }
]

const ESTADOS_CASO = [
  "Inicio / Demanda",
  "Mediación / Previo",
  "Prueba (Oficios/Pericias)",
  "Alegatos / Conclusiones",
  "Sentencia de 1ra Instancia",
  "Apelación / 2da Instancia",
  "Ejecución de Sentencia",
  "Terminado",
  "Archivado"
]

// Tipos
type ClienteSimple = { 
  id: string
  nombre: string
  apellido: string | null
  numeroDocumento: string
}

type AbogadoSimple = {
  id: string
  nombre: string | null
  apellido: string | null
  email: string
}

// Props del formulario
interface NuevoCasoFormProps {
  clientes: ClienteSimple[]
  abogados: AbogadoSimple[]
  userRol: string
  currentUserId: string
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button 
      type="submit" 
      disabled={pending || disabled} 
      className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
    >
      <Save className="h-4 w-4 mr-2" />
      {pending ? "Guardando..." : "Crear Caso"}
    </Button>
  )
}

export function NuevoCasoForm({ clientes, abogados, userRol, currentUserId }: NuevoCasoFormProps) {
  const initialState = { message: null, error: null }
  const [state, dispatch] = useFormState(crearCasoAction, initialState)
  
  const [requisitos, setRequisitos] = useState<{ description: string; dueDate: string }[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState("")
  const [mostrarAlertaConflicto, setMostrarAlertaConflicto] = useState(false)

  // Estados para ubicación geográfica
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState("")
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("")
  const [departamentosDisponibles, setDepartamentosDisponibles] = useState<{ value: string; label: string }[]>([])

  // Obtener lista de provincias para el select
  const provinciasParaSelect = getProvinciasParaSelect()

  // Actualizar departamentos cuando cambia la provincia
  useEffect(() => {
    if (provinciaSeleccionada) {
      const deptos = getDepartamentosParaSelect(provinciaSeleccionada)
      setDepartamentosDisponibles(deptos)
      setDepartamentoSeleccionado("") // Reset departamento al cambiar provincia
    } else {
      setDepartamentosDisponibles([])
      setDepartamentoSeleccionado("")
    }
  }, [provinciaSeleccionada])

  // Verificar si el usuario puede seleccionar abogado
  const puedeSeleccionarAbogado = userRol === 'ASISTENTE' || userRol === 'ADMIN'
  const esAbogado = userRol === 'ABOGADO'
  const esAsistente = userRol === 'ASISTENTE'

  // Verificar si hay clientes disponibles
  const hayClientesDisponibles = clientes.length > 0

  const agregarRequisito = () => setRequisitos([...requisitos, { description: "", dueDate: "" }])
  
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

  const verificarConflicto = async (dni: string) => {
    if (!dni || dni.length < 5) return
    const esCliente = clientes.some(c => c.numeroDocumento === dni)
    setMostrarAlertaConflicto(esCliente)
  }

  // Construir el valor del fuero combinando provincia y departamento
  const fueroValue = departamentoSeleccionado && provinciaSeleccionada
    ? `${departamentoSeleccionado}, ${PROVINCIAS_ARGENTINA.find(p => p.id === provinciaSeleccionada)?.nombre || ''}`
    : ''

  return (
    <Card className="max-w-5xl shadow-md border-slate-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Scale className="h-8 w-8 text-blue-600" />
          <div>
            <CardTitle>Nuevo Expediente</CardTitle>
            <CardDescription>Complete los datos iniciales para comenzar la gestión del caso</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {state?.error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p className="font-semibold">❌ Error</p>
            <p>{state.error}</p>
          </div>
        )}

        {/* Indicador de modo Asistente */}
        {esAsistente && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <strong>Modo Asistente:</strong> Solo puedes asignar clientes que hayas creado tú y que no tengan casos activos.
            Debes seleccionar un abogado responsable para este caso.
          </div>
        )}

        {/* Alerta si no hay clientes disponibles */}
        {!hayClientesDisponibles && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <UserPlus className="h-6 w-6 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">No hay clientes disponibles</p>
                {esAsistente ? (
                  <p className="text-sm text-blue-700 mt-1">
                    No tenés clientes creados o todos ya están asignados a casos activos.
                    <br />
                    <strong>Primero debés crear un cliente nuevo</strong> antes de poder crear un caso.
                  </p>
                ) : (
                  <p className="text-sm text-blue-700 mt-1">
                    No hay clientes registrados. Primero debés crear un cliente.
                  </p>
                )}
                <Link href="/clientes/nuevo" className="inline-block mt-3">
                  <Button size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Crear Cliente Nuevo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <form action={dispatch} className="space-y-8">
          
          {/* SECCIÓN 1: IDENTIFICACIÓN */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
              <h2 className="text-lg font-semibold text-slate-800">Identificación del Caso</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="numero">Nº Expediente / Carpeta *</Label>
                <Input id="numero" name="numero" placeholder="Ej: 2345/2024" required />
                <p className="text-xs text-slate-500">ID único del caso</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Fuero / Materia *</Label>
                <Select name="tipo" required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_CASO.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Etapa Procesal Inicial</Label>
                <Select name="estado" defaultValue="Inicio / Demanda">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CASO.map(estado => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">Carátula / Título del Caso *</Label>
              <Input id="titulo" name="titulo" placeholder="Ej: GÓMEZ, Juan c/ PÉREZ, María s/ DAÑOS Y PERJUICIOS" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción / Estrategia</Label>
              <Textarea id="descripcion" name="descripcion" rows={3} placeholder="Resumen del caso, estrategia legal, antecedentes relevantes..." />
            </div>
          </div>

          {/* SECCIÓN 2: CLIENTE Y PARTES */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">2</div>
              <h2 className="text-lg font-semibold text-slate-800">Cliente y Partes Involucradas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente (Nuestro Representado) *
                </Label>
                {hayClientesDisponibles ? (
                  <>
                    <ClienteSearchCombobox 
                      clientes={clientes}
                      onSelect={setClienteSeleccionado}
                    />
                    {esAsistente && (
                      <p className="text-xs text-slate-500">
                        Solo se muestran clientes que creaste y sin casos activos
                      </p>
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm">
                    No hay clientes disponibles. 
                    <Link href="/clientes/nuevo" className="text-blue-600 hover:underline ml-1">
                      Crear uno nuevo
                    </Link>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Contraparte (Adversario)
                </Label>
                <Input name="contraparte_nombre" placeholder="Nombre completo o razón social" />
                <Input 
                  name="contraparte_dni" 
                  placeholder="DNI/CUIT de la contraparte"
                  onBlur={(e) => verificarConflicto(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            {mostrarAlertaConflicto && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">⚠️ Posible Conflicto de Interés</p>
                  <p className="text-sm text-red-700 mt-1">
                    Esta persona aparece como cliente en otro expediente activo. Verifique antes de continuar.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 2.5: ABOGADO RESPONSABLE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                <Briefcase className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Abogado Responsable</h2>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              {/* Si es ASISTENTE o ADMIN: puede elegir abogado */}
              {puedeSeleccionarAbogado && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Seleccionar Abogado Responsable *
                  </Label>
                  <Select name="abogadoId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar abogado..." />
                    </SelectTrigger>
                    <SelectContent>
                      {abogados.map(abogado => (
                        <SelectItem key={abogado.id} value={abogado.id}>
                          {abogado.nombre || ''} {abogado.apellido || ''} 
                          <span className="text-slate-400 ml-2">({abogado.email})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    El abogado seleccionado será responsable de llevar este caso
                  </p>
                </div>
              )}

              {/* Si es ABOGADO: se asigna automáticamente a sí mismo */}
              {esAbogado && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-600">
                    <Briefcase className="h-4 w-4" />
                    Abogado Responsable
                  </Label>
                  <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Tú serás el responsable</p>
                      <p className="text-xs text-slate-500">El caso se asignará automáticamente a tu cuenta</p>
                    </div>
                  </div>
                  <input type="hidden" name="abogadoId" value={currentUserId} />
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: RADICACIÓN - ACTUALIZADA CON PROVINCIAS/DEPARTAMENTOS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">3</div>
              <h2 className="text-lg font-semibold text-slate-800">Radicación y Ubicación</h2>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg space-y-4">
              {/* Fila 1: Provincia y Ciudad/Departamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Provincia *
                  </Label>
                  <Select 
                    value={provinciaSeleccionada}
                    onValueChange={setProvinciaSeleccionada}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar provincia..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {provinciasParaSelect.map(prov => (
                        <SelectItem key={prov.value} value={prov.value}>
                          {prov.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Ciudad / Departamento *
                  </Label>
                  <Select 
                    value={departamentoSeleccionado}
                    onValueChange={setDepartamentoSeleccionado}
                    disabled={!provinciaSeleccionada}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={provinciaSeleccionada ? "Seleccionar ciudad..." : "Primero seleccione provincia"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {departamentosDisponibles.map(depto => (
                        <SelectItem key={depto.value} value={depto.value}>
                          {depto.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {provinciaSeleccionada && departamentosDisponibles.length === 0 && (
                    <p className="text-xs text-amber-600">No hay ciudades cargadas para esta provincia</p>
                  )}
                </div>
              </div>

              {/* Campo oculto con el fuero combinado */}
              <input type="hidden" name="fuero" value={fueroValue} />

              {/* Mostrar ubicación seleccionada */}
              {fueroValue && (
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Ubicación seleccionada:</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-500" />
                    {fueroValue}
                  </p>
                </div>
              )}

              {/* Fila 2: Juzgado y Monto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Juzgado / Secretaría</Label>
                  <Input name="juzgado" placeholder="Ej: Juzgado Nº 45 Civil y Comercial" />
                  <p className="text-xs text-slate-500">Nombre completo del juzgado asignado</p>
                </div>

                <div className="space-y-2">
                  <Label>Monto en Disputa ($)</Label>
                  <Input name="monto_disputa" type="number" step="0.01" placeholder="0.00" />
                  <p className="text-xs text-slate-500">Para reportes de cartera</p>
                </div>
              </div>

              {/* Fila 3: Ubicación física */}
              <div className="space-y-2">
                <Label>Ubicación Física del Expediente</Label>
                <Input name="ubicacion_fisica" placeholder="Ej: Bibliorato A - Estante 2 - Sector Laborales" />
              </div>
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
                <Label className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Nivel de Prioridad
                </Label>
                <Select name="priority" defaultValue="NORMAL">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">🔥 Alta (Urgente)</SelectItem>
                    <SelectItem value="NORMAL">📋 Normal</SelectItem>
                    <SelectItem value="LOW">📝 Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg flex items-center gap-3">
                <input type="checkbox" name="isFavorite" id="isFavorite" className="w-5 h-5 accent-yellow-500" />
                <Label htmlFor="isFavorite" className="flex items-center gap-2 cursor-pointer">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Marcar como Favorito</p>
                    <p className="text-xs text-slate-600">Aparecerá destacado en el dashboard</p>
                  </div>
                </Label>
              </div>
            </div>
          </div>

          {/* SECCIÓN 5: CHECKLIST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 flex-1">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-sm">5</div>
                <h2 className="text-lg font-semibold text-slate-800">Checklist de Requisitos Previos</h2>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={agregarRequisito}>
                <Plus className="h-4 w-4 mr-2" /> Agregar Item
              </Button>
            </div>

            <div className="space-y-3">
              {requisitos.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                  <p className="text-slate-500 mb-2">📋 No hay requisitos cargados</p>
                  <p className="text-xs text-slate-400">Agregue documentos o trámites previos necesarios</p>
                </div>
              ) : (
                requisitos.map((req, index) => (
                  <div key={index} className="flex gap-3 items-start p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex-1">
                      <Input 
                        placeholder="Ej: Solicitar certificado de trabajo al empleador"
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
                    <Button type="button" variant="ghost" size="icon" onClick={() => eliminarRequisito(index)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <input type="hidden" name="requirements" value={JSON.stringify(requisitos)} />

          {/* BOTONES */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/casos">
              <Button variant="outline" type="button">
                <ArrowLeft className="h-4 w-4 mr-2" /> Cancelar
              </Button>
            </Link>
            <SubmitButton disabled={!hayClientesDisponibles} />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}