'use client'

import { useState } from 'react'
import { FileText, ArrowLeft, Landmark } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SelectorExpediente } from '../SelectorExpediente'
import { TelegramaFormulario } from './TelegramaFormulario'

// ═══════════════════════════════════════════════════════════════════════════
// Selector de telegramas: 4 tipos (Renuncia, Ausencia, Otro, ARCA).
// Flujo: elegir tipo → buscar expediente → formulario.
// ═══════════════════════════════════════════════════════════════════════════

interface Caso {
  id: string
  numero: string
  titulo: string
  cliente: {
    nombre: string
    apellido: string | null
  }
}

interface TelegramaSelectorProps {
  casos: Caso[]
}

type TipoTelegrama = 'renuncia' | 'hasta-30' | 'mas-30' | 'arca' | null

export function TelegramaSelector({ casos }: TelegramaSelectorProps) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoTelegrama>(null)
  const [casoIdSeleccionado, setCasoIdSeleccionado] = useState<string | null>(null)

  if (!tipoSeleccionado) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Modelos de Telegrama Laboral (Ley N° 23.789)</h2>
          <p className="text-sm text-slate-500">
            Seleccioná el tipo de comunicación postal oficial que necesitás emitir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* 1. Renuncia */}
          <Card
            className="hover:border-blue-500 hover:shadow-md cursor-pointer transition-all border-slate-200"
            onClick={() => setTipoSeleccionado('renuncia')}
          >
            <CardHeader className="space-y-1">
              <div className="p-2 bg-blue-50 text-blue-600 w-fit rounded-lg mb-2">
                <FileText className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">1. Comunicación de Renuncia</CardTitle>
              <CardDescription className="text-xs">
                Hasta 30 palabras. Para rescisión de contrato por voluntad del trabajador.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* 2. Ausencia */}
          <Card
            className="hover:border-blue-500 hover:shadow-md cursor-pointer transition-all border-slate-200"
            onClick={() => setTipoSeleccionado('hasta-30')}
          >
            <CardHeader className="space-y-1">
              <div className="p-2 bg-amber-50 text-amber-600 w-fit rounded-lg mb-2">
                <FileText className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">2. Ausencia / Intimación Corta</CardTitle>
              <CardDescription className="text-xs">
                Hasta 30 palabras. Para ausencias por enfermedad o intimaciones breves.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* 3. Otro tipo (+30 palabras) */}
          <Card
            className="hover:border-blue-500 hover:shadow-md cursor-pointer transition-all border-slate-200"
            onClick={() => setTipoSeleccionado('mas-30')}
          >
            <CardHeader className="space-y-1">
              <div className="p-2 bg-purple-50 text-purple-600 w-fit rounded-lg mb-2">
                <FileText className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">3. Otro Tipo de Comunicación</CardTitle>
              <CardDescription className="text-xs">
                Más de 30 palabras. Intimaciones complejas, empleo en negro o reclamos salariales.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* 4. ARCA / Art. 11 */}
          <Card
            className="hover:border-blue-500 hover:shadow-md cursor-pointer transition-all border-slate-200"
            onClick={() => setTipoSeleccionado('arca')}
          >
            <CardHeader className="space-y-1">
              <div className="p-2 bg-emerald-50 text-emerald-600 w-fit rounded-lg mb-2">
                <Landmark className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">4. Comunicación ARCA (Art. 11)</CardTitle>
              <CardDescription className="text-xs">
                Intimación a organismo de recaudación (ex AFIP) por empleo no registrado, Ley 24.013.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  if (!casoIdSeleccionado) {
    return (
      <div className="space-y-4">
        <div className="max-w-2xl mx-auto px-6 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTipoSeleccionado(null)}
            className="text-slate-500 gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Cambiar tipo de telegrama
          </Button>
        </div>
        <SelectorExpediente
          casos={casos}
          onSeleccionarCaso={(id) => setCasoIdSeleccionado(id)}
        />
      </div>
    )
  }

  return (
    <TelegramaFormulario
      casoId={casoIdSeleccionado}
      tipoTelegrama={tipoSeleccionado}
      onVolver={() => setCasoIdSeleccionado(null)}
    />
  )
}