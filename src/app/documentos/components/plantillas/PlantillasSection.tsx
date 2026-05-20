'use client'

import { useState } from "react"
import { FileText, Mail } from "lucide-react"
import { PlantillaTelegrama } from "./PlantillaTelegrama"
import { PlantillaCartaDocumento } from "./PlantillaCartaDocumento"

type PlantillaActiva = 'telegrama' | 'carta' | null

const PLANTILLAS = [
  {
    id: 'telegrama' as PlantillaActiva,
    titulo: 'Telegrama',
    subtitulo: 'Ley N° 23.789',
    descripcion: 'Telegrama laboral de denuncia, despido o intimación al empleador',
    icon: Mail,
    color: 'blue'
  },
  {
    id: 'carta' as PlantillaActiva,
    titulo: 'Carta Documento',
    subtitulo: 'Formulario oficial',
    descripcion: 'Carta documento para comunicaciones formales con valor legal',
    icon: FileText,
    color: 'indigo'
  }
]

export function PlantillasSection() {
  const [plantillaActiva, setPlantillaActiva] = useState<PlantillaActiva>(null)

  if (plantillaActiva === 'telegrama') {
    return <PlantillaTelegrama onVolver={() => setPlantillaActiva(null)} />
  }
  if (plantillaActiva === 'carta') {
    return <PlantillaCartaDocumento onVolver={() => setPlantillaActiva(null)} />
  }
  return (
        <div className="p-8">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Plantillas de documentos</h2>
              <p className="text-sm text-slate-500 mt-1">
                Completá los datos y generá el documento listo para imprimir
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PLANTILLAS.map(plantilla => {
                const Icon = plantilla.icon
                return (
                  <button
                    key={plantilla.id}
                    onClick={() => setPlantillaActiva(plantilla.id)}
                    className="text-left p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className={`inline-flex p-3 rounded-lg mb-4 ${
                      plantilla.color === 'blue' ? 'bg-blue-50' : 'bg-indigo-50'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        plantilla.color === 'blue' ? 'text-blue-600' : 'text-indigo-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {plantilla.titulo}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mb-2">
                        {plantilla.subtitulo}
                      </p>
                      <p className="text-sm text-slate-500">
                        {plantilla.descripcion}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
  )
}