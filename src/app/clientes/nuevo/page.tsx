'use client'

import { crearClienteAction } from "../../../lib/actions/clientes-actions" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Save, User, Building2, FileText, Phone, Mail, MapPin, Hash, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from "next/link"
import { useFormState, useFormStatus } from "react-dom"
import { useState, useEffect } from "react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700 text-white">
      <Save className="h-4 w-4 mr-2" />
      {pending ? "Creando..." : "Crear Cliente"}
    </Button>
  )
}

export default function NuevoClientePage() {
  const initialState = { message: null, error: null }
  const [state, dispatch] = useFormState(crearClienteAction, initialState)
  
  const [tipoPersona, setTipoPersona] = useState<"FISICA" | "JURIDICA">("FISICA")
  const [documentoTipo, setDocumentoTipo] = useState<string>("DNI")
  const [numeroDocumento, setNumeroDocumento] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [telefono, setTelefono] = useState<string>("")
  
  // Validaciones en tiempo real
  const [validaciones, setValidaciones] = useState({
    email: { valido: true, mensaje: "" },
    telefono: { valido: true, mensaje: "" },
    documento: { valido: true, mensaje: "" }
  })

  // Validar email
  useEffect(() => {
    if (email.length === 0) {
      setValidaciones(prev => ({ ...prev, email: { valido: true, mensaje: "" }}))
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const esValido = emailRegex.test(email)
    setValidaciones(prev => ({ 
      ...prev, 
      email: { 
        valido: esValido, 
        mensaje: esValido ? "" : "Formato de email inválido" 
      }
    }))
  }, [email])

  // Validar teléfono argentino
  useEffect(() => {
    if (telefono.length === 0) {
      setValidaciones(prev => ({ ...prev, telefono: { valido: true, mensaje: "" }}))
      return
    }
    // Acepta formatos: +54 9 11 1234-5678, 11 1234 5678, etc.
    const telefonoRegex = /^(\+?54)?[\s-]?(\d{2,4})[\s-]?\d{4}[\s-]?\d{4}$/
    const esValido = telefonoRegex.test(telefono)
    setValidaciones(prev => ({ 
      ...prev, 
      telefono: { 
        valido: esValido, 
        mensaje: esValido ? "" : "Formato sugerido: +54 9 11 1234-5678" 
      }
    }))
  }, [telefono])

  // Validar formato de documento según tipo
  useEffect(() => {
    if (numeroDocumento.length === 0) {
      setValidaciones(prev => ({ ...prev, documento: { valido: true, mensaje: "" }}))
      return
    }

    let esValido = false
    let mensaje = ""

    switch(documentoTipo) {
      case "DNI":
        // DNI: 8 dígitos
        esValido = /^\d{7,8}$/.test(numeroDocumento.replace(/\./g, ''))
        mensaje = esValido ? "" : "DNI debe tener 7-8 dígitos"
        break
      case "CUIT":
      case "CUIL":
        // CUIT/CUIL: formato 20-12345678-9 o 20123456789
        esValido = /^\d{2}-?\d{8}-?\d{1}$/.test(numeroDocumento)
        mensaje = esValido ? "" : "Formato: 20-12345678-9 (11 dígitos)"
        break
      case "PASAPORTE":
        // Pasaporte: Alfanumérico 6-9 caracteres
        esValido = /^[A-Z0-9]{6,9}$/i.test(numeroDocumento)
        mensaje = esValido ? "" : "6-9 caracteres alfanuméricos"
        break
      default:
        esValido = numeroDocumento.length >= 5
        mensaje = esValido ? "" : "Mínimo 5 caracteres"
    }

    setValidaciones(prev => ({ 
      ...prev, 
      documento: { valido: esValido, mensaje }
    }))
  }, [numeroDocumento, documentoTipo])

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-md border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle>Nuevo Cliente</CardTitle>
                <CardDescription>Complete la información del cliente para agregarlo al sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {state?.error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Error al crear cliente</p>
                  <p>{state.error}</p>
                </div>
              </div>
            )}

            {state?.message && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Éxito</p>
                  <p>{state.message}</p>
                </div>
              </div>
            )}

            <form action={dispatch} className="space-y-8">
              
              {/* SECCIÓN 1: TIPO DE PERSONA */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                  <h2 className="text-lg font-semibold text-slate-800">Tipo de Persona</h2>
                  <span className="ml-auto text-xs text-slate-500">Obligatorio</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Label 
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      tipoPersona === 'FISICA' 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoPersona"
                      value="FISICA"
                      checked={tipoPersona === 'FISICA'}
                      onChange={() => setTipoPersona('FISICA')}
                      className="w-5 h-5 accent-blue-600"
                      required
                    />
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900">Persona Física</p>
                      <p className="text-xs text-slate-600">Individuo (requiere apellido)</p>
                    </div>
                  </Label>

                  <Label 
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      tipoPersona === 'JURIDICA' 
                        ? 'border-purple-500 bg-purple-50 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoPersona"
                      value="JURIDICA"
                      checked={tipoPersona === 'JURIDICA'}
                      onChange={() => setTipoPersona('JURIDICA')}
                      className="w-5 h-5 accent-purple-600"
                    />
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-semibold text-slate-900">Persona Jurídica</p>
                      <p className="text-xs text-slate-600">Empresa / Sociedad</p>
                    </div>
                  </Label>
                </div>
              </div>

              {/* SECCIÓN 2: DATOS PERSONALES */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">2</div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {tipoPersona === 'FISICA' ? 'Datos Personales' : 'Razón Social'}
                  </h2>
                  <span className="ml-auto text-xs text-slate-500">Obligatorio</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {tipoPersona === 'FISICA' ? 'Nombre/s' : 'Razón Social'}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="nombre"
                      placeholder={tipoPersona === 'FISICA' ? "Ej: Juan Carlos" : "Ej: Acme Corporation S.A."}
                      minLength={2}
                      required
                      className="border-slate-300"
                    />
                  </div>

                  {tipoPersona === 'FISICA' && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Apellido/s
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="apellido"
                        placeholder="Ej: Pérez González"
                        minLength={2}
                        required
                        className="border-slate-300"
                      />
                    </div>
                  )}

                  {tipoPersona === 'JURIDICA' && (
                    <input type="hidden" name="apellido" value="" />
                  )}
                </div>
              </div>

              {/* SECCIÓN 3: DOCUMENTACIÓN */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">3</div>
                  <h2 className="text-lg font-semibold text-slate-800">Documentación Fiscal</h2>
                  <span className="ml-auto text-xs text-slate-500">Obligatorio - Único en sistema</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Tipo de Documento
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      name="tipoDocumento" 
                      value={documentoTipo}
                      onValueChange={setDocumentoTipo}
                      required
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DNI">DNI - Documento Nacional</SelectItem>
                        <SelectItem value="CUIT">CUIT - Clave Única Tributaria</SelectItem>
                        <SelectItem value="CUIL">CUIL - Clave Única Laboral</SelectItem>
                        <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                        <SelectItem value="OTRO">Otro Documento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Número de Documento
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="numeroDocumento"
                      placeholder={
                        documentoTipo === 'DNI' ? "Ej: 12345678" :
                        documentoTipo === 'CUIT' || documentoTipo === 'CUIL' ? "Ej: 20-12345678-9" :
                        documentoTipo === 'PASAPORTE' ? "Ej: AAA123456" :
                        "Ingrese el número"
                      }
                      value={numeroDocumento}
                      onChange={(e) => setNumeroDocumento(e.target.value)}
                      minLength={5}
                      required
                      className={`border-2 ${
                        numeroDocumento.length > 0 
                          ? validaciones.documento.valido 
                            ? 'border-green-500' 
                            : 'border-red-500'
                          : 'border-slate-300'
                      }`}
                    />
                    {numeroDocumento.length > 0 && (
                      <p className={`text-xs flex items-center gap-1 ${
                        validaciones.documento.valido ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {validaciones.documento.valido ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Formato válido
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3" />
                            {validaciones.documento.mensaje}
                          </>
                        )}
                      </p>
                    )}
                    {numeroDocumento.length === 0 && (
                      <p className="text-xs text-slate-500">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Debe ser único en el sistema (previene duplicados)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-2">
                      Condición frente al IVA
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select name="condicionIva" required>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Seleccionar condición..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</SelectItem>
                        <SelectItem value="MONOTRIBUTISTA">Monotributista</SelectItem>
                        <SelectItem value="EXENTO">Exento</SelectItem>
                        <SelectItem value="CONSUMIDOR_FINAL">Consumidor Final</SelectItem>
                        <SelectItem value="NO_CATEGORIZADO">No Categorizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">Utilizado para facturación y reportes financieros</p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: CONTACTO */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">4</div>
                  <h2 className="text-lg font-semibold text-slate-800">Datos de Contacto</h2>
                  <span className="ml-auto text-xs text-slate-500">Opcional (recomendado)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input 
                      type="email" 
                      name="email" 
                      placeholder="cliente@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`border-2 ${
                        email.length > 0 
                          ? validaciones.email.valido 
                            ? 'border-green-500' 
                            : 'border-red-500'
                          : 'border-slate-300'
                      }`}
                    />
                    {email.length > 0 && !validaciones.email.valido && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validaciones.email.mensaje}
                      </p>
                    )}
                    {email.length > 0 && validaciones.email.valido && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Válido para notificaciones
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </Label>
                    <Input 
                      type="tel" 
                      name="telefono" 
                      placeholder="+54 9 11 1234-5678"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className={`border-2 ${
                        telefono.length > 0 
                          ? validaciones.telefono.valido 
                            ? 'border-green-500' 
                            : 'border-yellow-500'
                          : 'border-slate-300'
                      }`}
                    />
                    {telefono.length > 0 && !validaciones.telefono.valido && (
                      <p className="text-xs text-yellow-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validaciones.telefono.mensaje}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Dirección
                    </Label>
                    <Input 
                      name="direccion" 
                      placeholder="Calle, número, localidad, provincia"
                    />
                    <p className="text-xs text-slate-500">Útil para logística y envíos de documentación</p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 5: ADICIONAL */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-sm">5</div>
                  <h2 className="text-lg font-semibold text-slate-800">Información Adicional</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Notas Internas</Label>
                    <Textarea
                      name="notasInternas"
                      rows={4}
                      placeholder="Observaciones, contexto del cliente, preferencias de comunicación, etc."
                      className="resize-none"
                    />
                    <p className="text-xs text-slate-500">
                      Información no estructurada para uso interno del estudio
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <input
                      type="checkbox"
                      name="activo"
                      id="activo"
                      defaultChecked={true}
                      className="w-5 h-5 accent-green-600 mt-0.5"
                    />
                    <Label htmlFor="activo" className="cursor-pointer flex-1">
                      <p className="font-semibold text-green-900">Cliente Activo</p>
                      <p className="text-sm text-green-700">
                        Los clientes inactivos se mantienen en el historial pero no aparecen en listados principales
                      </p>
                    </Label>
                  </div>
                </div>
              </div>

              {/* BOTONES */}
              <div className="flex justify-between items-center gap-3 pt-6 border-t-2 border-slate-200">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Los campos marcados con <span className="text-red-500">*</span> son obligatorios
                </p>
                <div className="flex gap-3">
                  <Link href="/clientes">
                    <Button variant="outline" type="button" className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Cancelar
                    </Button>
                  </Link>
                  <SubmitButton />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}