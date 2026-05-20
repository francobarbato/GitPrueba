'use client'

import { useState, useRef, useTransition } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { CarpetaDocumento } from "@prisma/client"
import { CARPETA_LABELS } from "@/lib/aplication/services/documento.types"
import { subirDocumentoAction } from "@/app/casos/actions/documento-actions"

interface Caso {
  id: string
  numero: string
  titulo: string
  estaCerrado: boolean
}

interface Props {
  abierto: boolean
  onCerrar: () => void
  casos: Caso[]
  casoIdPreseleccionado?: string
}

const TIPOS_ACEPTADOS = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
const MAX_MB = 10

export function SubirDocumentoDrawer({ abierto, onCerrar, casos, casoIdPreseleccionado }: Props) {
  const [isPending, startTransition] = useTransition()
  const [casoId, setCasoId] = useState(casoIdPreseleccionado || '')
  const [carpeta, setCarpeta] = useState<CarpetaDocumento | ''>('')
  const [descripcion, setDescripcion] = useState('')
  const [esInterno, setEsInterno] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [arrastrandoOver, setArrastrandoOver] = useState(false)
  const [resultado, setResultado] = useState<{ error?: string | null; message?: string | null } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setCasoId(casoIdPreseleccionado || '')
    setCarpeta('')
    setDescripcion('')
    setEsInterno(false)
    setArchivo(null)
    setResultado(null)
  }

  const handleCerrar = () => {
    resetForm()
    onCerrar()
  }

  const handleArchivo = (file: File) => {
    if (file.size > MAX_MB * 1024 * 1024) {
      setResultado({ error: `El archivo supera los ${MAX_MB}MB permitidos` })
      return
    }
    setArchivo(file)
    setResultado(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setArrastrandoOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleArchivo(file)
  }

  const handleSubmit = async () => {
    if (!casoId || !carpeta || !archivo) {
      setResultado({ error: 'Completá todos los campos obligatorios' })
      return
    }

    const formData = new FormData()
    formData.append('casoId', casoId)
    formData.append('carpeta', carpeta)
    formData.append('descripcion', descripcion)
    formData.append('esInterno', String(esInterno))
    formData.append('archivo', archivo)

    startTransition(async () => {
      const res = await subirDocumentoAction(null as any, formData)
      setResultado(res)
      if (res.message) {
        setTimeout(() => handleCerrar(), 1500)
      }
    })
  }

  return (
    <Sheet open={abierto} onOpenChange={handleCerrar}>
      <SheetContent className="w-[440px] sm:w-[480px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Subir documento
          </SheetTitle>
          <SheetDescription>
            Adjuntá un archivo al expediente seleccionado
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5">

          {/* Selector de caso */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Expediente <span className="text-red-500">*</span>
            </Label>
            <Select value={casoId} onValueChange={setCasoId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un expediente..." />
              </SelectTrigger>
              <SelectContent>
                {casos
                  .filter(c => !c.estaCerrado)
                  .map(caso => (
                    <SelectItem key={caso.id} value={caso.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{caso.numero}</span>
                        <span className="text-xs text-slate-500 truncate max-w-[280px]">
                          {caso.titulo}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          {/* Selector de carpeta */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Carpeta <span className="text-red-500">*</span>
            </Label>
            <Select value={carpeta} onValueChange={v => setCarpeta(v as CarpetaDocumento)}>
              <SelectTrigger>
                <SelectValue placeholder="¿Dónde va este documento?" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CARPETA_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                arrastrandoOver
                  ? 'border-blue-400 bg-blue-50'
                  : archivo
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              {archivo ? (
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {archivo.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(archivo.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setArchivo(null) }}
                    className="ml-auto p-1 hover:bg-emerald-100 rounded text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    Arrastrá un archivo o hacé click
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    PDF, Word, Excel, imágenes · Máx {MAX_MB}MB
                  </p>
                </>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={TIPOS_ACEPTADOS}
              className="hidden"
              onChange={e => e.target.files?.[0] && handleArchivo(e.target.files[0])}
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Descripción <span className="text-slate-400 font-normal">(opcional)</span>
            </Label>
            <Textarea
              placeholder="Breve descripción del documento..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
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
            <Button
              variant="outline"
              onClick={handleCerrar}
              className="flex-1"
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !casoId || !carpeta || !archivo}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? 'Subiendo...' : 'Subir documento'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}