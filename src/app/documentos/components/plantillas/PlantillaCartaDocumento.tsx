'use client'

import { useState } from "react"
import { ArrowLeft, Printer, RotateCcw, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  onVolver: () => void
}

type FormData = {
  remNombre: string
  remDomicilio: string
  remCodigoPostal: string
  remLocalidad: string
  remProvincia: string
  destNombre: string
  destDomicilio: string
  destCodigoPostal: string
  destLocalidad: string
  destProvincia: string
  cuerpo: string
}

const estadoInicial: FormData = {
  remNombre: '', remDomicilio: '', remCodigoPostal: '', remLocalidad: '', remProvincia: '',
  destNombre: '', destDomicilio: '', destCodigoPostal: '', destLocalidad: '', destProvincia: '',
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

export function PlantillaCartaDocumento({ onVolver }: Props) {
  const [form, setForm] = useState<FormData>(estadoInicial)

  const set = (campo: keyof FormData) => (valor: string) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  const handleReset = () => setForm(estadoInicial)

  const handleImprimir = () => {
    const contenido = generarHTMLImpresion(form)
    const ventana = window.open('', '_blank', 'width=800,height=900')
    if (!ventana) return
    ventana.document.write(contenido)
    ventana.document.close()
    ventana.focus()
    setTimeout(() => ventana.print(), 500)
  }

  return (
    <div>   
    {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onVolver} className="gap-2 text-slate-500">
            <ArrowLeft className="h-4 w-4" />
            Plantillas
          </Button>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <FileText className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Carta Documento</h2>
              <p className="text-xs text-slate-500">Formulario oficial</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar
          </Button>
          <Button size="sm" onClick={handleImprimir} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Nota */}
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-xs text-indigo-800">
              La carta documento se imprime en hoja tamaño oficio sobre el formulario preimpreso adquirido en el correo.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Remitente */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-4">
                Remitente
              </h3>
              <div className="space-y-3">
                <Campo label="Apellido y Nombre / Razón Social" value={form.remNombre} onChange={set('remNombre')} />
                <Campo label="Domicilio" value={form.remDomicilio} onChange={set('remDomicilio')} />
                <div className="grid grid-cols-2 gap-2">
                  <Campo label="Código Postal" value={form.remCodigoPostal} onChange={set('remCodigoPostal')} />
                  <Campo label="Localidad" value={form.remLocalidad} onChange={set('remLocalidad')} />
                </div>
                <Campo label="Provincia" value={form.remProvincia} onChange={set('remProvincia')} />
              </div>
            </div>

            {/* Destinatario */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-4">
                Destinatario
              </h3>
              <div className="space-y-3">
                <Campo label="Apellido y Nombre / Razón Social" value={form.destNombre} onChange={set('destNombre')} />
                <Campo label="Domicilio" value={form.destDomicilio} onChange={set('destDomicilio')} />
                <div className="grid grid-cols-2 gap-2">
                  <Campo label="Código Postal" value={form.destCodigoPostal} onChange={set('destCodigoPostal')} />
                  <Campo label="Localidad" value={form.destLocalidad} onChange={set('destLocalidad')} />
                </div>
                <Campo label="Provincia" value={form.destProvincia} onChange={set('destProvincia')} />
              </div>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-3">
              Texto de la carta documento
            </h3>
            <Textarea
              value={form.cuerpo}
              onChange={e => set('cuerpo')(e.target.value)}
              placeholder="Redactá aquí el contenido de la carta documento..."
              rows={10}
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

function generarHTMLImpresion(form: FormData): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Carta Documento</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          padding: 15mm 12mm;
          color: #000;
        }

        /* Título */
        h1 {
          font-size: 15px;
          text-align: center;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
          border-bottom: 2px solid #000;
          padding-bottom: 6px;
          margin-bottom: 4px;
        }
        .subtitulo {
          font-size: 9px;
          text-align: center;
          color: #555;
          margin-bottom: 14px;
        }

        /* Grid de remitente / destinatario */
        .encabezado {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          border: 1px solid #999;
          margin-bottom: 14px;
        }
        .col {
          padding: 8px 10px;
        }
        .col:first-child {
          border-right: 1px solid #999;
        }
        .col-titulo {
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #1a56a5;
          border-bottom: 1px solid #ccc;
          padding-bottom: 4px;
          margin-bottom: 8px;
        }

        /* Cada campo del encabezado */
        .fila {
          display: flex;
          align-items: flex-end;
          margin-bottom: 6px;
          gap: 4px;
        }
        .fila label {
          font-size: 8px;
          color: #777;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .fila .linea {
          flex: 1;
          border-bottom: 1px solid #999;
          min-height: 13px;
          font-size: 10px;
          padding-bottom: 1px;
          padding-left: 2px;
        }

        /* Fila compacta CP + Localidad + Provincia */
        .fila-triple {
          display: grid;
          grid-template-columns: 80px 1fr 1fr;
          gap: 6px;
          margin-bottom: 6px;
        }
        .fila-triple .campo-inner {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .fila-triple label {
          font-size: 8px;
          color: #777;
        }
        .fila-triple .linea {
          border-bottom: 1px solid #999;
          min-height: 13px;
          font-size: 10px;
          padding-bottom: 1px;
          padding-left: 2px;
        }

        /* Cuerpo del documento */
        .cuerpo {
          border: 1px solid #999;
          min-height: 160px;
          padding: 10px;
        }
        .cuerpo-titulo {
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
          color: #1a56a5;
          border-bottom: 1px solid #ccc;
          padding-bottom: 3px;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        .cuerpo p {
          font-size: 11px;
          line-height: 1.8;
          white-space: pre-wrap;
        }

        @media print {
          body { padding: 8mm 10mm; }
        }
      </style>
    </head>
    <body>
      <h1>Carta Documento</h1>
      <p class="subtitulo">La carta documento se imprime en hoja tamaño oficio sobre el formulario preimpreso adquirido en el correo.</p>

      <div class="encabezado">
        <!-- Remitente -->
        <div class="col">
          <div class="col-titulo">Remitente</div>
          <div class="fila">
            <label>Apellido y Nombre / R. Social:</label>
            <span class="linea">${form.remNombre}</span>
          </div>
          <div class="fila">
            <label>Domicilio:</label>
            <span class="linea">${form.remDomicilio}</span>
          </div>
          <div class="fila-triple">
            <div class="campo-inner">
              <label>Cód. Postal</label>
              <span class="linea">${form.remCodigoPostal}</span>
            </div>
            <div class="campo-inner">
              <label>Localidad</label>
              <span class="linea">${form.remLocalidad}</span>
            </div>
            <div class="campo-inner">
              <label>Provincia</label>
              <span class="linea">${form.remProvincia}</span>
            </div>
          </div>
        </div>

        <!-- Destinatario -->
        <div class="col">
          <div class="col-titulo">Destinatario</div>
          <div class="fila">
            <label>Apellido y Nombre / R. Social:</label>
            <span class="linea">${form.destNombre}</span>
          </div>
          <div class="fila">
            <label>Domicilio:</label>
            <span class="linea">${form.destDomicilio}</span>
          </div>
          <div class="fila-triple">
            <div class="campo-inner">
              <label>Cód. Postal</label>
              <span class="linea">${form.destCodigoPostal}</span>
            </div>
            <div class="campo-inner">
              <label>Localidad</label>
              <span class="linea">${form.destLocalidad}</span>
            </div>
            <div class="campo-inner">
              <label>Provincia</label>
              <span class="linea">${form.destProvincia}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cuerpo -->
      <div class="cuerpo">
        <div class="cuerpo-titulo">Texto de la carta documento</div>
        <p>${form.cuerpo || ''}</p>
      </div>
    </body>
    </html>
  `
}