'use client'

import { useState } from "react"
import { Eye, Download, Trash2, Lock, FileText, FileImage, FileSpreadsheet, File } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
// import { DocumentoListItem, CARPETA_LABELS } from "@/lib/aplication/services/documento.service"
import { DocumentoListItem, CARPETA_LABELS } from "@/lib/aplication/services/documento.types"
import { eliminarDocumentoAction } from "@/app/casos/actions/documento-actions"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Caso {
  id: string
  numero: string
  titulo: string
}

interface Props {
  documento: DocumentoListItem
  modo: 'lista' | 'grilla'
  onPreview: () => void
  userId: string
  userRol: string
  casos: Caso[]
}

function IconoArchivo({ extension, className }: { extension: string; className?: string }) {
  const ext = extension.toLowerCase()
  if (['pdf'].includes(ext)) {
    return <FileText className={`${className} text-red-500`} />
  }
  if (['doc', 'docx', 'txt'].includes(ext)) {
    return <FileText className={`${className} text-blue-500`} />
  }
  if (['xls', 'xlsx'].includes(ext)) {
    return <FileSpreadsheet className={`${className} text-green-600`} />
  }
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    return <FileImage className={`${className} text-purple-500`} />
  }
  return <File className={`${className} text-slate-400`} />
}

function formatearTamanio(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function TarjetaDocumento({ documento, modo, onPreview, userId, userRol, casos }: Props) {
  const [eliminando, setEliminando] = useState(false)
  const puedeEliminar = userRol !== 'ASISTENTE'

  const handleEliminar = async () => {
    if (!confirm(`¿Seguro que querés eliminar "${documento.nombre}"?`)) return
    setEliminando(true)
    try {
      await eliminarDocumentoAction(documento.id, documento.storageKey)
    } catch (error) {
      console.error('Error eliminando:', error)
    } finally {
      setEliminando(false)
    }
  }

  const handleDescargar = () => {
    const link = document.createElement('a')
    link.href = documento.url
    link.download = documento.nombreOriginal
    link.click()
  }

  // ========== VISTA GRILLA ==========
  if (modo === 'grilla') {
    return (
      <div className={`bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all group ${
        eliminando ? 'opacity-50' : ''
      }`}>
        {/* Icono */}
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-slate-50 rounded-lg">
            <IconoArchivo extension={documento.extension} className="h-8 w-8" />
          </div>
        </div>

        {/* Nombre */}
        <p className="text-xs font-medium text-slate-800 truncate text-center mb-1">
          {documento.nombre}
        </p>

        {/* Metadata */}
        <p className="text-xs text-slate-400 text-center mb-2">
          {formatearTamanio(documento.tamanio)}
        </p>

        {/* Interno */}
        {documento.esInterno && (
          <div className="flex justify-center mb-2">
            <Badge className="bg-slate-100 text-slate-600 text-xs gap-1">
              <Lock className="h-2.5 w-2.5" />
              Interno
            </Badge>
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onPreview}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
            title="Ver"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDescargar}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
            title="Descargar"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          {puedeEliminar && (
            <button
              onClick={handleEliminar}
              disabled={eliminando}
              className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ========== VISTA LISTA ==========
  return (
    <tr className={`hover:bg-slate-50 transition-colors ${eliminando ? 'opacity-50' : ''}`}>
      {/* Nombre */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <IconoArchivo extension={documento.extension} className="h-5 w-5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-slate-800 text-sm truncate max-w-[250px]">
              {documento.nombre}
            </p>
            {documento.descripcion && (
              <p className="text-xs text-slate-400 truncate max-w-[250px]">
                {documento.descripcion}
              </p>
            )}
          </div>
          {documento.esInterno && (
            <Badge className="bg-slate-100 text-slate-600 text-xs gap-1 flex-shrink-0">
              <Lock className="h-2.5 w-2.5" />
              Interno
            </Badge>
          )}
        </div>
      </td>

      {/* Carpeta */}
      <td className="px-4 py-3">
        <Badge variant="outline" className="text-xs">
          {CARPETA_LABELS[documento.carpeta]}
        </Badge>
      </td>

      {/* Tamaño */}
      <td className="px-4 py-3 text-center text-xs text-slate-500">
        {formatearTamanio(documento.tamanio)}
      </td>

      {/* Subido por */}
      <td className="px-4 py-3 text-xs text-slate-600">
        {documento.subidoPor}
      </td>

      {/* Fecha */}
      <td className="px-4 py-3 text-xs text-slate-500">
        {format(documento.createdAt, "dd/MM/yyyy", { locale: es })}
      </td>

      {/* Acciones */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={onPreview}
            className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-500 hover:text-slate-800"
            title="Ver"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={handleDescargar}
            className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-500 hover:text-slate-800"
            title="Descargar"
          >
            <Download className="h-4 w-4" />
          </button>
          {puedeEliminar && (
            <button
              onClick={handleEliminar}
              disabled={eliminando}
              className="p-1.5 hover:bg-red-50 rounded transition-colors text-slate-400 hover:text-red-600"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}