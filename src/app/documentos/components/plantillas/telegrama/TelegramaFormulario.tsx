'use client'

import { useEffect, useState } from 'react'
import { FileText, ArrowLeft, Printer, Loader2, AlertCircle, Landmark } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "src/components/ui/alert"
import { obtenerDatosCasoParaTelegrama, generarTelegramaPdfAction, DatosTelegrama } from './telegramaAction'
import { LIMITES_CUERPO, contarPalabras } from './limites-telegrama'

interface TelegramaFormularioProps {
  casoId: string
  tipoTelegrama: 'renuncia' | 'hasta-30' | 'mas-30' | 'arca'
  onVolver: () => void
}

export function TelegramaFormulario({ casoId, tipoTelegrama, onVolver }: TelegramaFormularioProps) {
  const [loading, setLoading] = useState(true)
  const [procesandoPdf, setProcesandoPdf] = useState(false)
  const [error, setError] = useState('')

  // ARCA tiene destinatario fijo (Agencia de Recaudación, preimpreso en el PDF).
  const esArca = tipoTelegrama === 'arca'

  const [formData, setFormData] = useState<DatosTelegrama>({
    casoId,
    tipoTelegrama,
    remitenteNombre: '',
    remitenteDni: '',
    remitenteDomicilio: '',
    remitenteLocalidad: '',
    remitenteProvincia: '',
    remitenteTelefono: '',
    destinatarioNombre: '',
    destinatarioCuit: '',
    destinatarioDomicilio: '',
    destinatarioLocalidad: '',
    destinatarioProvincia: '',
    destinatarioActividad: '',
    cuerpoTexto: ''
  })

  // ── Límite del cuerpo según el tipo (palabras o caracteres) ──
  const limite = LIMITES_CUERPO[tipoTelegrama] ?? { unidad: 'caracteres' as const, max: 350 }
  const cantidadActual = limite.unidad === 'palabras'
    ? contarPalabras(formData.cuerpoTexto)
    : formData.cuerpoTexto.length
  const seePasa = cantidadActual > limite.max
  const unidadLabel = limite.unidad === 'palabras' ? 'palabras' : 'caracteres'

  useEffect(() => {
    async function cargarDatos() {
      try {
        const res = await obtenerDatosCasoParaTelegrama(casoId)
        if (!res.success || !res.caso) {
          setError(res.error || 'Error al recuperar datos.')
          return
        }

        const c = res.caso
        setFormData(prev => ({
          ...prev,
          remitenteNombre: `${c.cliente.nombre} ${c.cliente.apellido || ''}`.trim(),
          remitenteDni: c.cliente.numeroDocumento || '',
          remitenteDomicilio: c.cliente.direccion || '',
          remitenteTelefono: c.cliente.telefono || '',
          // En ARCA el destinatario es fijo (preimpreso), no se carga.
          destinatarioNombre: esArca ? '' : (c.contraparte?.nombre || ''),
          destinatarioCuit: esArca ? '' : (c.contraparte?.documento || ''),
          destinatarioDomicilio: esArca ? '' : (c.contraparte?.domicilio || ''),
          destinatarioLocalidad: esArca ? '' : (c.contraparte?.localidad || ''),
          destinatarioProvincia: esArca ? '' : (c.contraparte?.provincia || ''),
          destinatarioActividad: esArca ? '' : (c.contraparte?.rol || ''),
          cuerpoTexto: tipoTelegrama === 'renuncia'
            ? 'RENUNCIO A MI EMPLEO DESDE EL DIA... EN EL PUESTO DE... QUEDANDO USTED DEBIDAMENTE NOTIFICADO.'
            : tipoTelegrama === 'arca'
            ? 'COMUNICACIÓN ARCA (ART. 11) - INTIMACIÓN A ORGANISMO DE RECAUDACIÓN'
            : 'ANTE NEGATIVA DE TAREAS E INCUMPLIMIENTO DE REGISTRACIÓN...'
        }))
      } catch (err) {
        setError('Ocurrió un error inesperado al conectar el servidor.')
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [casoId, tipoTelegrama, esArca])

  const handleGenerarEImprimir = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcesandoPdf(true)
    setError('')

    try {
      const res = await generarTelegramaPdfAction(formData)
      if (!res.success || !res.pdfBase64) {
        setError(res.error || 'No se pudo estampar el PDF.')
        return
      }

      const bytes = Uint8Array.from(atob(res.pdfBase64), c => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const ventanaImpresion = window.open(url)
      if (ventanaImpresion) ventanaImpresion.focus()
    } catch (err) {
      setError('Error al compilar el documento final.')
    } finally {
      setProcesandoPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Pre-cargando expediente desde la base de datos...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleGenerarEImprimir} className="max-w-4xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">

      <div className="flex items-center justify-between border-b pb-4">
        <Button type="button" variant="ghost" size="sm" onClick={onVolver} className="gap-1 text-slate-500">
          <ArrowLeft className="h-4 w-4" /> Volver al buscador
        </Button>
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 text-xs font-semibold">
          <FileText className="h-3.5 w-3.5" /> Modelo Oficial Correo Argentino
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error operativo</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* En ARCA mostramos una sola columna (remitente); el destinatario es fijo */}
      <div className={esArca ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>

        {/* Remitente */}
        <div className="space-y-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
          <h4 className="font-semibold text-slate-900 text-sm border-b pb-1 text-blue-600">REMITENTE (Trabajador)</h4>
          <div className="space-y-2">
            <Label className="text-xs">Apellido y Nombre</Label>
            <Input value={formData.remitenteNombre} onChange={e => setFormData({...formData, remitenteNombre: e.target.value})} required className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2"><Label className="text-xs">DNI N°</Label><Input value={formData.remitenteDni} onChange={e => setFormData({...formData, remitenteDni: e.target.value})} required className="h-8 text-sm" /></div>
            <div className="space-y-2"><Label className="text-xs">Teléfono</Label><Input value={formData.remitenteTelefono} onChange={e => setFormData({...formData, remitenteTelefono: e.target.value})} className="h-8 text-sm" /></div>
          </div>
          <div className="space-y-2"><Label className="text-xs">Domicilio Real</Label><Input value={formData.remitenteDomicilio} onChange={e => setFormData({...formData, remitenteDomicilio: e.target.value})} required className="h-8 text-sm" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2"><Label className="text-xs">Localidad</Label><Input value={formData.remitenteLocalidad} onChange={e => setFormData({...formData, remitenteLocalidad: e.target.value})} required className="h-8 text-sm" /></div>
            <div className="space-y-2"><Label className="text-xs">Provincia</Label><Input value={formData.remitenteProvincia} onChange={e => setFormData({...formData, remitenteProvincia: e.target.value})} required className="h-8 text-sm" /></div>
          </div>
        </div>

        {/* Destinatario — solo si NO es ARCA */}
        {!esArca && (
          <div className="space-y-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
            <h4 className="font-semibold text-slate-900 text-sm border-b pb-1 text-purple-600">DESTINATARIO (Empleador)</h4>
            <div className="space-y-2">
              <Label className="text-xs">Razón Social / Nombre</Label>
              <Input value={formData.destinatarioNombre} onChange={e => setFormData({...formData, destinatarioNombre: e.target.value})} required className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2"><Label className="text-xs">CUIT N°</Label><Input value={formData.destinatarioCuit} onChange={e => setFormData({...formData, destinatarioCuit: e.target.value})} className="h-8 text-sm" /></div>
              <div className="space-y-2"><Label className="text-xs">Actividad Principal</Label><Input value={formData.destinatarioActividad} onChange={e => setFormData({...formData, destinatarioActividad: e.target.value})} className="h-8 text-sm" /></div>
            </div>
            <div className="space-y-2"><Label className="text-xs">Domicilio Laboral</Label><Input value={formData.destinatarioDomicilio} onChange={e => setFormData({...formData, destinatarioDomicilio: e.target.value})} required className="h-8 text-sm" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2"><Label className="text-xs">Localidad</Label><Input value={formData.destinatarioLocalidad} onChange={e => setFormData({...formData, destinatarioLocalidad: e.target.value})} required className="h-8 text-sm" /></div>
              <div className="space-y-2"><Label className="text-xs">Provincia</Label><Input value={formData.destinatarioProvincia} onChange={e => setFormData({...formData, destinatarioProvincia: e.target.value})} required className="h-8 text-sm" /></div>
            </div>
          </div>
        )}

      </div>

      {/* Cartel aclaratorio del destinatario fijo en ARCA */}
      {esArca && (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <Landmark className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-800 leading-relaxed">
            <span className="font-semibold">Destinatario fijo:</span> en este formulario el destinatario es la Agencia
            de Recaudación y Control Aduanero (ARCA), que ya viene preimpresa en el modelo oficial. No es necesario
            completar datos del destinatario.
          </p>
        </div>
      )}

      {/* Cuerpo del Mensaje */}
      <div className="space-y-2 pt-2 border-t">
        <Label className="text-sm font-semibold text-slate-700">Texto de la comunicación</Label>
        <Textarea
          value={formData.cuerpoTexto}
          onChange={e => setFormData({...formData, cuerpoTexto: e.target.value})}
          required
          rows={limite.unidad === 'palabras' ? 4 : 8}
          className="font-mono text-sm uppercase bg-amber-50/20 border-amber-200"
          placeholder="Escribí acá el cuerpo de la intimación..."
        />

        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <p>
              {tipoTelegrama === 'renuncia'
                ? 'El texto se reparte en los 3 renglones oficiales del formulario.'
                : limite.unidad === 'palabras'
                ? 'Formulario oficial de hasta 30 palabras.'
                : 'El texto se acomoda en el recuadro del formulario.'}
            </p>
            <span className={seePasa ? "text-red-600 font-semibold" : "text-slate-500"}>
              {cantidadActual} / {limite.max} {unidadLabel}
            </span>
          </div>

          {seePasa && (
            <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md p-2 mt-1">
              {limite.unidad === 'palabras'
                ? `Este formulario admite hasta ${limite.max} palabras. Recortá ${cantidadActual - limite.max} palabra(s).`
                : `El texto supera el espacio del formulario. Recortá unos ${cantidadActual - limite.max} caracteres.`}
            </p>
          )}
        </div>

        <p className="text-xs text-slate-400 pt-1">Nota: El texto se estampará en mayúsculas de manera exacta en el cuerpo del formulario.</p>
      </div>

      <Button
        type="submit"
        disabled={procesandoPdf || seePasa}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base font-medium shadow-md gap-2 disabled:opacity-50"
      >
        {procesandoPdf ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Procesando formulario oficial...</>
        ) : (
          <><Printer className="h-5 w-5" /> Rellenar e Imprimir Telegrama</>
        )}
      </Button>

    </form>
  )
}