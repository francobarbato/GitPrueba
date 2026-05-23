'use client'

import { useState } from "react"
import { Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TelegramaSelector } from "./telegrama/TelegramaSelector"

// ═══════════════════════════════════════════════════════════════════════════
// CAMBIO: se quitó la tarjeta "Carta Documento".
//   Motivo: no existe el PDF correspondiente (carta-documento.pdf no está en
//   src/assets/modelos-correo). Apuntaba a un archivo inexistente y rompía con
//   ENOENT. Se elimina la opción y su import de CartaFormulario.
//   Si en el futuro conseguís el PDF de carta documento, se reincorpora.
// ═══════════════════════════════════════════════════════════════════════════

interface Caso {
  id: string
  numero: string
  titulo: string
  tipo: string
  estaCerrado: boolean
  _count: { documentos: number }
  cliente: {
    nombre: string
    apellido: string | null
  }
}

interface PlantillasSectionProps {
  casos: Caso[]
}

type PlantillaActiva = 'telegrama' | null

export function PlantillasSection({ casos }: PlantillasSectionProps) {
  const [plantillaActiva, setPlantillaActiva] = useState<PlantillaActiva>(null)

  // Si eligen Telegrama, renderizamos el flujo inteligente de telegramas
  if (plantillaActiva === 'telegrama') {
    return (
      <div className="space-y-4 bg-slate-50/50 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => setPlantillaActiva(null)} className="text-slate-500 gap-1 mb-4">
            <ArrowLeft className="h-4 w-4" /> Volver al menú de plantillas
          </Button>
        </div>
        <TelegramaSelector casos={casos} />
      </div>
    )
  }

  // Menú de plantillas
  return (
    <div className="p-8 bg-slate-50/30 min-h-screen">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Plantillas de documentos oficiales</h2>
          <p className="text-sm text-slate-500 mt-1">
            Completá los datos del expediente y generá el formulario del Correo Argentino listo para imprimir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setPlantillaActiva('telegrama')}
            className="text-left p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="inline-flex p-3 rounded-lg mb-4 bg-blue-50">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                Telegramas Laborales
              </h3>
              <p className="text-xs font-medium text-slate-500 mb-2">
                Ley N° 23.789
              </p>
              <p className="text-sm text-slate-500">
                Telegramas oficiales de correo para denuncias, ausencias, renuncias o intimaciones (ARCA / Art. 11).
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}