'use client'

import { useEffect, useState } from 'react'
import { FileText, ArrowLeft, Printer, Loader2, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SelectorExpediente } from '../SelectorExpediente'
import { obtenerDatosCasoParaCarta, generarCartaPdfAction, DatosCartaDocumento } from './cartaAction'

interface Caso {
  id: string
  numero: string
  titulo: string
  cliente: { nombre: string; apellido: string | null }
}

interface CartaFormularioProps {
  casos: Caso[]
}

export function CartaFormulario({ casos }: CartaFormularioProps) {
  const [casoId, setCasoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [procesandoPdf, setProcesandoPdf] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState<DatosCartaDocumento>({
    casoId: '', remitenteNombre: '', remitenteDni: '', remitenteDomicilio: '', remitenteLocalidad: '', remitenteProvincia: '',
    destinatarioNombre: '', destinatarioDomicilio: '', destinatarioLocalidad: '', destinatarioProvincia: '', cuerpoTexto: ''
  })

  useEffect(() => {
    if (!casoId) return
    async function cargarDatos() {
      setLoading(true)
      try {
        const res = await obtenerDatosCasoParaCarta(casoId!)
        if (res.success && res.caso) {
          const c = res.caso
          setFormData({
            casoId: c.id,
            remitenteNombre: `${c.cliente.nombre} ${c.cliente.apellido || ''}`.trim(),
            remitenteDni: c.cliente.numeroDocumento || '',
            remitenteDomicilio: c.cliente.direccion || '', 
            remitenteLocalidad: '', 
            remitenteProvincia: '', 
            destinatarioNombre: c.contraparte?.nombre || '',
            destinatarioDomicilio: c.contraparte?.domicilio || '',
            destinatarioLocalidad: c.contraparte?.localidad || '',
            destinatarioProvincia: c.contraparte?.provincia || '',
            cuerpoTexto: 'INTIMO A USTED EN SU CARÁCTER DE PROPIETARIO AL PAGO DE LAS SUMAS ADEUDADAS EN CONCEPTO DE...'
          })
        }
      } catch (err) {
        setError('Error al pre-cargar expediente.')
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [casoId])

  const handleGenerar = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcesandoPdf(true)
    try {
      const res = await generarCartaPdfAction(formData)
      if (res.success && res.pdfBase64) {
        const bytes = Uint8Array.from(atob(res.pdfBase64), c => c.charCodeAt(0))
        const blob = new Blob([bytes], { type: 'application/pdf' })
        const ventana = window.open(URL.createObjectURL(blob))
        if (ventana) ventana.focus()
      } else {
        setError(res.error || 'No se pudo generar el PDF.')
      }
    } catch {
      setError('Error al compilar el documento.')
    } finally {
      setProcesandoPdf(false)
    }
  }

  // Si no hay caso seleccionado, primero mostramos el buscador común
  if (!casoId) {
    return <SelectorExpediente casos={casos} onSeleccionarCaso={(id) => setCasoId(id)} />
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Buscando remitente en la base de datos...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleGenerar} className="max-w-4xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <Button type="button" variant="ghost" size="sm" onClick={() => setCasoId(null)} className="gap-1 text-slate-500">
          <ArrowLeft className="h-4 w-4" /> Cambiar de expediente
        </Button>
        <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 text-xs font-semibold">
          <FileText className="h-3.5 w-3.5" /> Formulario Oficial Carta Documento
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Remitente */}
        <div className="space-y-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
          <h4 className="font-semibold text-slate-900 text-sm border-b pb-1 text-blue-600">REMITENTE</h4>
          <div className="space-y-2"><Label className="text-xs">Nombre Completo</Label><Input value={formData.remitenteNombre} onChange={e => setFormData({...formData, remitenteNombre: e.target.value})} required className="h-8 text-sm" /></div>
          <div className="space-y-2"><Label className="text-xs">DNI / CUIT</Label><Input value={formData.remitenteDni} onChange={e => setFormData({...formData, remitenteDni: e.target.value})} required className="h-8 text-sm" /></div>
          <div className="space-y-2"><Label className="text-xs">Domicilio</Label><Input value={formData.remitenteDomicilio} onChange={e => setFormData({...formData, remitenteDomicilio: e.target.value})} required className="h-8 text-sm" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2"><Label className="text-xs">Localidad</Label><Input value={formData.remitenteLocalidad} onChange={e => setFormData({...formData, remitenteLocalidad: e.target.value})} className="h-8 text-sm" /></div>
            <div className="space-y-2"><Label className="text-xs">Provincia</Label><Input value={formData.remitenteProvincia} onChange={e => setFormData({...formData, remitenteProvincia: e.target.value})} className="h-8 text-sm" /></div>
          </div>
        </div>

        {/* Destinatario */}
        <div className="space-y-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
          <h4 className="font-semibold text-slate-900 text-sm border-b pb-1 text-purple-600">DESTINATARIO</h4>
          <div className="space-y-2"><Label className="text-xs">Nombre / Razón Social</Label><Input value={formData.destinatarioNombre} onChange={e => setFormData({...formData, destinatarioNombre: e.target.value})} required className="h-8 text-sm" /></div>
          <div className="space-y-2"><Label className="text-xs">Domicilio Postal</Label><Input value={formData.destinatarioDomicilio} onChange={e => setFormData({...formData, destinatarioDomicilio: e.target.value})} required className="h-8 text-sm" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2"><Label className="text-xs">Localidad</Label><Input value={formData.destinatarioLocalidad} onChange={e => setFormData({...formData, destinatarioLocalidad: e.target.value})} className="h-8 text-sm" /></div>
            <div className="space-y-2"><Label className="text-xs">Provincia</Label><Input value={formData.destinatarioProvincia} onChange={e => setFormData({...formData, destinatarioProvincia: e.target.value})} className="h-8 text-sm" /></div>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t">
        <Label className="text-sm font-semibold text-slate-700">Texto de la Carta Documento</Label>
        <Textarea value={formData.cuerpoTexto} onChange={e => setFormData({...formData, cuerpoTexto: e.target.value})} required rows={6} className="font-mono text-sm uppercase bg-purple-50/10 border-purple-200" />
      </div>

      <Button type="submit" disabled={procesandoPdf} className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11 text-base font-medium shadow-md gap-2">
        {procesandoPdf ? <><Loader2 className="h-5 w-5 animate-spin" /> Estampando Carta Documento...</> : <><Printer className="h-5 w-5" /> Rellenar e Imprimir Carta Documento</>}
      </Button>
    </form>
  )
}