'use client'

import { useState } from "react"
import { FolderOpen } from "lucide-react"
import { DocumentoListItem, DocumentosPorCarpeta, CARPETA_LABELS } from "@/lib/aplication/services/documento.types"
import { TarjetaDocumento } from "./TarjetaDocumento"
import { PreviewDocumentoModal } from "./PreviewDocumentoModal"
import { FiltroActivo } from "./ExploradorDocumentos"

interface Caso {
  id: string
  numero: string
  titulo: string
}

interface Props {
  documentos: DocumentoListItem[]
  vistaGrilla: boolean
  filtro: FiltroActivo
  casos: Caso[]
  userId: string
  userRol: string
}

export function PanelContenido({
  documentos,
  vistaGrilla,
  casos,
  userId,
  userRol
}: Props) {
  const [docPreview, setDocPreview] = useState<DocumentoListItem | null>(null)

  if (documentos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="p-4 bg-slate-100 rounded-full mb-4">
          <FolderOpen className="h-10 w-10 text-slate-300" />
        </div>
        <p className="text-slate-500 font-medium">No hay documentos aquí</p>
        <p className="text-slate-400 text-sm mt-1">
          Subí el primer documento usando el botón superior
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">

      {/* Vista Grilla */}
      {vistaGrilla ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {documentos.map(doc => (
            <TarjetaDocumento
              key={doc.id}
              documento={doc}
              modo="grilla"
              onPreview={() => setDocPreview(doc)}
              userId={userId}
              userRol={userRol}
              casos={casos}
            />
          ))}
        </div>
      ) : (
        /* Vista Lista */
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold">Carpeta</th>
                <th className="px-4 py-3 text-center font-semibold">Tamaño</th>
                <th className="px-4 py-3 text-left font-semibold">Subido por</th>
                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                <th className="px-4 py-3 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documentos.map(doc => (
                <TarjetaDocumento
                  key={doc.id}
                  documento={doc}
                  modo="lista"
                  onPreview={() => setDocPreview(doc)}
                  userId={userId}
                  userRol={userRol}
                  casos={casos}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de preview */}
      {docPreview && (
        <PreviewDocumentoModal
          documento={docPreview}
          onCerrar={() => setDocPreview(null)}
        />
      )}
    </div>
  )
}