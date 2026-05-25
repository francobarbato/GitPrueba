'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Lock, Calendar, User, HardDrive } from "lucide-react"
import { DocumentoListItem } from "@/lib/aplication/services/documento.types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Props {
  documento: DocumentoListItem
  onCerrar: () => void
}

const EXTENSIONES_PREVIEW = ['pdf', 'jpg', 'jpeg', 'png', 'webp']

export function PreviewDocumentoModal({ documento, onCerrar }: Props) {
  const tienePreview = EXTENSIONES_PREVIEW.includes(documento.extension.toLowerCase())
  const esImagen = ['jpg', 'jpeg', 'png', 'webp'].includes(documento.extension.toLowerCase())

  const handleDescargar = () => {
    const link = document.createElement('a')
    link.href = documento.url
    link.download = documento.nombreOriginal
    link.click()
  }

  return (
    <Dialog open onOpenChange={onCerrar}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base pr-8">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <span className="truncate">{documento.nombre}</span>
            {documento.esInterno && (
              <Badge className="bg-slate-100 text-slate-600 text-xs gap-1 flex-shrink-0">
                <Lock className="h-2.5 w-2.5" />
                Interno
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 py-3 border-y border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {format(documento.createdAt, "dd 'de' MMMM 'de' yyyy", { locale: es })}
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {documento.subidoPor}
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-slate-400" />
            {(documento.tamanio / (1024 * 1024)).toFixed(2)} MB
          </div>
        </div>

        {/* Preview o mensaje sin preview */}
        <div className="flex-1 overflow-auto min-h-[300px] bg-slate-50 rounded-lg">
          {tienePreview ? (
            esImagen ? (
              <img
                src={documento.url}
                alt={documento.nombre}
                className="max-w-full h-auto mx-auto block"
              />
            ) : (
              // PDF
              <iframe
                src={`${documento.url}#toolbar=1`}
                className="w-full h-full min-h-[400px] rounded-lg"
                title={documento.nombre}
              />
            )
          ) : (
            // Sin preview
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
              <FileText className="h-16 w-16 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium mb-1">
                Vista previa no disponible
              </p>
              <p className="text-slate-400 text-sm">
                Este tipo de archivo no se puede previsualizar directamente.
                Descargalo para abrirlo.
              </p>
            </div>
          )}
        </div>

        {/* Descripción */}
        {documento.descripcion && (
          <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
            {documento.descripcion}
          </p>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCerrar}>
            Cerrar
          </Button>
          <Button
            onClick={handleDescargar}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Download className="h-4 w-4" />
            Descargar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}