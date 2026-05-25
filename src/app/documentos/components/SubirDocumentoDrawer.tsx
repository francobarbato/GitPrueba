'use client'

import { useState, useRef, useTransition, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Upload, X, FileText, AlertCircle, CheckCircle2, FolderOpen, Home } from "lucide-react"
import { subirDocumentoAction } from "@/app/casos/actions/documento-actions"

interface Caso {
  id: string
  numero: string
  titulo: string
}

interface Props {
  abierto: boolean
  onCerrar: () => void
  caso: Caso
  carpetaActualId: string | null      // null = raíz del expediente
  nombreCarpetaActual?: string        // para mostrar dónde se sube (opcional)
}

const TIPOS_ACEPTADOS = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
const MAX_MB = 10

export function SubirDocumentoDrawer({ abierto, onCerrar, caso, carpetaActualId, nombreCarpetaActual }: Props) {
  const [isPending, startTransition] = useTransition()
  const [descripcion, setDescripcion] = useState('')
  const [esInterno, setEsInterno] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [arrastrandoOver, setArrastrandoOver] = useState(false)
  const [resultado, setResultado] = useState<{ error?: string | null; message?: string | null } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setDescripcion(''); setEsInterno(false); setArchivo(null); setResultado(null)
  }

  // Limpiar al abrir.
  useEffect(() => {
    if (abierto) resetForm()
  }, [abierto])

  const handleCerrar = () => { resetForm(); onCerrar() }

  const handleArchivo = (file: File) => {
    if (file.size > MAX_MB * 1024 * 1024) {
      setResultado({ error: `El archivo supera los ${MAX_MB}MB permitidos` })
      return
    }
    setArchivo(file); setResultado(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setArrastrandoOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleArchivo(file)
  }

  const handleSubmit = async () => {
    if (!archivo) { setResultado({ error: 'Seleccioná un archivo' }); return }

    const formData = new FormData()
    formData.append('casoId', caso.id)
    if (carpetaActualId) formData.append('carpetaId', carpetaActualId)
    formData.append('descripcion', descripcion)
    formData.append('esInterno', String(esInterno))
    formData.append('archivo', archivo)

    startTransition(async () => {
      const res = await subirDocumentoAction(null as any, formData)
      setResultado(res)
      if (res.message) {
        setTimeout(() => handleCerrar(), 1200)
      }
    })
  }

  // Dónde se va a guardar (para el cartel informativo).
  const ubicacion = carpetaActualId
    ? (nombreCarpetaActual ? `Carpeta "${nombreCarpetaActual}"` : 'Carpeta actual')
    : `Raíz del expediente ${caso.numero}`

  return (
    <Sheet open={abierto} onOpenChange={handleCerrar}>
      <SheetContent className="w-[440px] sm:w-[480px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Subir documento
          </SheetTitle>
          <SheetDescription>
            Adjuntá un archivo al expediente {caso.numero}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5">

          {/* Ubicación de destino */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
            {carpetaActualId ? <FolderOpen className="h-4 w-4 flex-shrink-0" /> : <Home className="h-4 w-4 flex-shrink-0" />}
            <span>Se guardará en: <span className="font-medium">{ubicacion}</span></span>
          </div>

          {/* Zona de drop */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Archivo <span className="text-red-500">*</span>
            </Label>
            <div
              onDragOver={e => { e.preventDefault(); setArrastrandoOver(true) }}
              onDragLeave={() => setArrastrandoOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                arrastrandoOver ? 'border-blue-400 bg-blue-50'
                : archivo ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              {archivo ? (
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{archivo.name}</p>
                    <p className="text-xs text-slate-500">{(archivo.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setArchivo(null) }} className="ml-auto p-1 hover:bg-emerald-100 rounded text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">Arrastrá un archivo o hacé click</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, Word, Excel, imágenes · Máx {MAX_MB}MB</p>
                </>
              )}
            </div>
            <input ref={inputRef} type="file" accept={TIPOS_ACEPTADOS} className="hidden"
              onChange={e => e.target.files?.[0] && handleArchivo(e.target.files[0])} />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Descripción <span className="text-slate-400 font-normal">(opcional)</span>
            </Label>
            <Textarea placeholder="Breve descripción del documento..." value={descripcion}
              onChange={e => setDescripcion(e.target.value)} rows={2} className="resize-none text-sm" />
          </div>

          {/* Toggle interno */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Documento interno</p>
              <p className="text-xs text-slate-500">No visible para el cliente</p>
            </div>
            <Switch checked={esInterno} onCheckedChange={setEsInterno} />
          </div>

          {/* Resultado */}
          {resultado?.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{resultado.error}</p>
            </div>
          )}
          {resultado?.message && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700">{resultado.message}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleCerrar} className="flex-1" disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !archivo} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {isPending ? 'Subiendo...' : 'Subir documento'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}