'use client'

import { useState, useRef } from "react"
import { ArrowLeft, Printer, RotateCcw, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface Props {
  onVolver: () => void
}

const MOTIVOS_AFIP = [
  'Trabajo No Registrado',
  'Trabajo Parcialmente Registrado',
  'Otra Fecha de Ingreso',
  'Otro Motivo'
]

type FormData = {
  // Destinatario / Empleador
  destNombre: string
  destRamo: string
  destCuit: string
  destDomicilio: string
  destCodigoPostal: string
  destLocalidad: string
  destProvincia: string
  // Solo AFIP
  motivo: string
  // Remitente
  remNombre: string
  remDni: string
  remFecha: string
  remDomicilio: string
  remCodigoPostal: string
  remLocalidad: string
  remProvincia: string
  remTelefono: string
  remEmail: string
  // Cuerpo
  cuerpo: string
}

const estadoInicial: FormData = {
  destNombre: '', destRamo: '', destCuit: '', destDomicilio: '',
  destCodigoPostal: '', destLocalidad: '', destProvincia: '',
  motivo: 'Trabajo No Registrado',
  remNombre: '', remDni: '', remFecha: new Date().toISOString().split('T')[0],
  remDomicilio: '', remCodigoPostal: '', remLocalidad: '', remProvincia: '',
  remTelefono: '', remEmail: '',
  cuerpo: ''
}

function Campo({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-slate-600">{label}</Label>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
    </div>
  )
}

export function PlantillaTelegrama({ onVolver }: Props) {
  const [esAfip, setEsAfip] = useState(false)
  const [form, setForm] = useState<FormData>(estadoInicial)
  const printRef = useRef<HTMLDivElement>(null)

  const set = (campo: keyof FormData) => (valor: string) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  const handleReset = () => setForm(estadoInicial)

  const handleImprimir = () => {
    const contenido = generarHTMLImpresion(form, esAfip)
    const ventana = window.open('', '_blank', 'width=800,height=900')
    if (!ventana) return
    ventana.document.write(contenido)
    ventana.document.close()
    ventana.focus()
    setTimeout(() => {
      ventana.print()
    }, 500)
  }

  return (
    <div>    
     {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onVolver} className="gap-2 text-slate-500">
            <ArrowLeft className="h-4 w-4" />
            Plantillas
          </Button>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Telegrama</h2>
              <p className="text-xs text-slate-500">Ley N° 23.789</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle AFIP */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <Label className="text-xs text-slate-600 cursor-pointer">
              Telegrama a AFIP
            </Label>
            <Switch
              checked={esAfip}
              onCheckedChange={setEsAfip}
              className="scale-75"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar
          </Button>
          <Button size="sm" onClick={handleImprimir} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Nota informativa */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              El telegrama se imprime en hoja tamaño A4.
              {esAfip && ' Modalidad: Telegrama a AFIP activado.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Columna Destinatario / Empleador */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
                  {esAfip ? 'Empleador' : 'Destinatario'}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {esAfip ? 'Telegrama a AFIP' : 'Estándar'}
                </Badge>
              </div>
              <div className="space-y-3">
                <Campo label="Nombre / Razón Social" value={form.destNombre} onChange={set('destNombre')} />
                <Campo label="Ramo / Actividad" value={form.destRamo} onChange={set('destRamo')} />
                <Campo label="N° CUIT" value={form.destCuit} onChange={set('destCuit')} placeholder="XX-XXXXXXXX-X" />
                <Campo label="Domicilio Laboral" value={form.destDomicilio} onChange={set('destDomicilio')} />
                <div className="grid grid-cols-2 gap-2">
                  <Campo label="Código Postal" value={form.destCodigoPostal} onChange={set('destCodigoPostal')} />
                  <Campo label="Localidad" value={form.destLocalidad} onChange={set('destLocalidad')} />
                </div>
                <Campo label="Provincia" value={form.destProvincia} onChange={set('destProvincia')} />

                {/* Motivos AFIP */}
                {esAfip && (
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <Label className="text-xs text-slate-600">Motivo</Label>
                    <div className="space-y-2">
                      {MOTIVOS_AFIP.map(motivo => (
                        <label key={motivo} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="motivo"
                            value={motivo}
                            checked={form.motivo === motivo}
                            onChange={() => set('motivo')(motivo)}
                            className="accent-blue-600"
                          />
                          <span className="text-sm text-slate-700">{motivo}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Columna Remitente */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-4">
                Remitente
              </h3>
              <div className="space-y-3">
                <Campo label="Apellido y Nombre" value={form.remNombre} onChange={set('remNombre')} />
                <div className="grid grid-cols-2 gap-2">
                  <Campo label="DNI N°" value={form.remDni} onChange={set('remDni')} />
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Fecha</Label>
                    <Input
                      type="date"
                      value={form.remFecha}
                      onChange={e => set('remFecha')(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <Campo label="Domicilio Real" value={form.remDomicilio} onChange={set('remDomicilio')} />
                <div className="grid grid-cols-2 gap-2">
                  <Campo label="Código Postal" value={form.remCodigoPostal} onChange={set('remCodigoPostal')} />
                  <Campo label="Localidad" value={form.remLocalidad} onChange={set('remLocalidad')} />
                </div>
                <Campo label="Provincia" value={form.remProvincia} onChange={set('remProvincia')} />
                {esAfip && (
                  <>
                    <Campo label="Teléfono" value={form.remTelefono} onChange={set('remTelefono')} />
                    <Campo label="E-Mail" value={form.remEmail} onChange={set('remEmail')} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Cuerpo del telegrama */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-3">
              Texto del telegrama
            </h3>
            <Textarea
              value={form.cuerpo}
              onChange={e => set('cuerpo')(e.target.value)}
              placeholder="Redactá aquí el contenido del telegrama..."
              rows={8}
              className="resize-none text-sm"
            />
            <p className="text-xs text-slate-400 mt-2 text-right">
              {form.cuerpo.length} caracteres
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function generarHTMLImpresion(form: FormData, esAfip: boolean): string {
  const fechaFormateada = form.remFecha
    ? new Date(form.remFecha + 'T00:00:00').toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      })
    : ''

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Telegrama Ley N° 23.789</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; padding: 20mm 15mm; color: #000; }
        h1 { font-size: 14px; text-align: center; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .nota { background: #e8f4fd; border: 1px solid #90c4e4; padding: 6px 10px; font-size: 10px; margin-bottom: 12px; border-radius: 3px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px; }
        .seccion h2 { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #1a56a5; border-bottom: 1px solid #1a56a5; padding-bottom: 3px; margin-bottom: 8px; }
        .campo { display: flex; gap: 6px; margin-bottom: 5px; align-items: baseline; }
        .campo label { font-size: 9px; color: #555; min-width: 95px; flex-shrink: 0; }
        .campo span { font-size: 10px; border-bottom: 1px solid #999; flex: 1; min-height: 14px; padding-bottom: 1px; }
        .motivos { margin-top: 8px; padding-top: 8px; border-top: 1px dotted #ccc; }
        .motivos p { font-size: 9px; margin-bottom: 4px; font-weight: bold; }
        .motivo-item { font-size: 10px; margin: 2px 0; padding-left: 8px; }
        .motivo-item.seleccionado { font-weight: bold; }
        .motivo-item.seleccionado::before { content: "● "; }
        .motivo-item:not(.seleccionado)::before { content: "○ "; }
        .cuerpo { margin-top: 16px; border: 1px solid #ccc; padding: 12px; min-height: 120px; border-radius: 3px; }
        .cuerpo h2 { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1a56a5; margin-bottom: 8px; }
        .cuerpo p { font-size: 11px; line-height: 1.6; white-space: pre-wrap; }
        .fila-triple { display: grid; grid-template-columns: 70px 1fr 1fr; gap: 6px; margin-bottom: 5px; }
        .fila-triple .ci { display: flex; flex-direction: column; gap: 1px; }
        .fila-triple label { font-size: 8px; color: #777; }
        .fila-triple .linea { border-bottom: 1px solid #999; min-height: 13px; font-size: 10px; padding-left: 2px; }

        @media print { body { padding: 10mm; } }
      </style>
    </head>
    <body>
      <h1>Telegrama Ley N° 23.789${esAfip ? ' — A AFIP' : ''}</h1>
      <div class="nota">El telegrama se imprime en hoja tamaño A4.</div>
      <div class="grid">
        <div class="seccion">
          <h2>${esAfip ? 'Empleador' : 'Destinatario'}</h2>
          <div class="campo"><label>Nombre / R. Social:</label><span>${form.destNombre}</span></div>
          <div class="campo"><label>Ramo / Actividad:</label><span>${form.destRamo}</span></div>
          <div class="campo"><label>N° CUIT:</label><span>${form.destCuit}</span></div>
          <div class="campo"><label>Domicilio Laboral:</label><span>${form.destDomicilio}</span></div>
            <div class="fila-triple">
            <div class="ci"><label>Cód. Postal</label><span class="linea">${form.destCodigoPostal}</span></div>
            <div class="ci"><label>Localidad</label><span class="linea">${form.destLocalidad}</span></div>
            <div class="ci"><label>Provincia</label><span class="linea">${form.destProvincia}</span></div>
            </div>
          ${esAfip ? `
          <div class="motivos">
            <p>Motivo:</p>
            ${['Trabajo No Registrado','Trabajo Parcialmente Registrado','Otra Fecha de Ingreso','Otro Motivo']
              .map(m => `<div class="motivo-item ${m === form.motivo ? 'seleccionado' : ''}">${m}</div>`)
              .join('')
            }
          </div>` : ''}
        </div>
        <div class="seccion">
          <h2>Remitente</h2>
          <div class="campo"><label>Apellido y Nombre:</label><span>${form.remNombre}</span></div>
          <div class="campo"><label>DNI N°:</label><span>${form.remDni}</span></div>
          <div class="campo"><label>Fecha:</label><span>${fechaFormateada}</span></div>
          <div class="campo"><label>Domicilio Real:</label><span>${form.remDomicilio}</span></div>
          <div class="fila-triple">
            <div class="ci"><label>Cód. Postal</label><span class="linea">${form.destCodigoPostal}</span></div>
            <div class="ci"><label>Localidad</label><span class="linea">${form.destLocalidad}</span></div>
            <div class="ci"><label>Provincia</label><span class="linea">${form.destProvincia}</span></div>
            </div>
          ${esAfip ? `
          <div class="campo"><label>Teléfono:</label><span>${form.remTelefono}</span></div>
          <div class="campo"><label>E-Mail:</label><span>${form.remEmail}</span></div>` : ''}
        </div>
      </div>
      <div class="cuerpo">
        <h2>Texto del Telegrama</h2>
        <p>${form.cuerpo || ''}</p>
      </div>
    </body>
    </html>
  `
}