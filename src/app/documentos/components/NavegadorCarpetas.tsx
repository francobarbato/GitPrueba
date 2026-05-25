'use client'

import { useState, useEffect, useCallback, useTransition } from "react"
import {
  Folder, FolderPlus, Upload, ChevronRight, Home, Loader2,
  FileText, FileImage, FileSpreadsheet, File, Eye, Download, Trash2, Lock,
  MoreVertical, Pencil, FolderInput
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ContenidoCarpeta, CarpetaListItem, DocumentoListItem } from "@/lib/aplication/services/documento.types"
import { fetchContenidoCarpeta } from "src/lib/actions/documento-actions"
import {
  crearCarpetaAction, eliminarCarpetaAction, renombrarCarpetaAction,
  eliminarDocumentoAction
} from "@/app/casos/actions/documento-actions"
import { SubirDocumentoDrawer } from "./SubirDocumentoDrawer"
import { PreviewDocumentoModal } from "./PreviewDocumentoModal"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Caso {
  id: string
  numero: string
  titulo: string
}

interface Props {
  caso: Caso
  userId: string
  userRol: string
}

function IconoArchivo({ extension, className }: { extension: string; className?: string }) {
  const ext = extension.toLowerCase()
  if (ext === 'pdf') return <FileText className={`${className} text-red-500`} />
  if (['doc', 'docx', 'txt'].includes(ext)) return <FileText className={`${className} text-blue-500`} />
  if (['xls', 'xlsx'].includes(ext)) return <FileSpreadsheet className={`${className} text-green-600`} />
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return <FileImage className={`${className} text-purple-500`} />
  return <File className={`${className} text-slate-400`} />
}

function formatearTamanio(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function NavegadorCarpetas({ caso, userId, userRol }: Props) {
  const esAbogado = userRol?.toUpperCase() === 'ABOGADO'
  const puedeCrearCarpeta = ['ABOGADO', 'ASISTENTE'].includes(userRol?.toUpperCase() || '')
  const puedeEliminarDoc = userRol?.toUpperCase() !== 'ASISTENTE'

  const [carpetaActualId, setCarpetaActualId] = useState<string | null>(null)
  const [contenido, setContenido] = useState<ContenidoCarpeta | null>(null)
  const [cargando, setCargando] = useState(true)
  const [, startTransition] = useTransition()

  // Modales
  const [drawerSubir, setDrawerSubir] = useState(false)
  const [modalNuevaCarpeta, setModalNuevaCarpeta] = useState(false)
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState('')
  const [carpetaARenombrar, setCarpetaARenombrar] = useState<CarpetaListItem | null>(null)
  const [nombreRenombrar, setNombreRenombrar] = useState('')
  const [carpetaABorrar, setCarpetaABorrar] = useState<CarpetaListItem | null>(null)
  const [docABorrar, setDocABorrar] = useState<DocumentoListItem | null>(null)
  const [docPreview, setDocPreview] = useState<DocumentoListItem | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [errorAccion, setErrorAccion] = useState('')

  const cargarContenido = useCallback(async (carpetaId: string | null) => {
    setCargando(true)
    try {
      const res = await fetchContenidoCarpeta(caso.id, carpetaId)
      setContenido(res)
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al cargar el contenido')
    } finally {
      setCargando(false)
    }
  }, [caso.id])

  // Al cambiar de expediente, volver a la raíz.
  useEffect(() => {
    setCarpetaActualId(null)
  }, [caso.id])

  // Cargar contenido cada vez que cambia el nivel.
  useEffect(() => {
    cargarContenido(carpetaActualId)
  }, [carpetaActualId, cargarContenido])

  const refrescar = () => cargarContenido(carpetaActualId)

  const entrarCarpeta = (id: string) => setCarpetaActualId(id)
  const irARaiz = () => setCarpetaActualId(null)
  const irACarpeta = (id: string | null) => setCarpetaActualId(id)

  // ── Crear carpeta ──
  const handleCrearCarpeta = async () => {
    if (!nombreNuevaCarpeta.trim()) return
    setProcesando(true); setErrorAccion('')
    const res = await crearCarpetaAction(caso.id, nombreNuevaCarpeta, carpetaActualId)
    setProcesando(false)
    if (res.error) { setErrorAccion(res.error); return }
    setModalNuevaCarpeta(false); setNombreNuevaCarpeta('')
    startTransition(refrescar)
  }

  // ── Renombrar carpeta ──
  const handleRenombrar = async () => {
    if (!carpetaARenombrar || !nombreRenombrar.trim()) return
    setProcesando(true); setErrorAccion('')
    const res = await renombrarCarpetaAction(carpetaARenombrar.id, nombreRenombrar, caso.id)
    setProcesando(false)
    if (res.error) { setErrorAccion(res.error); return }
    setCarpetaARenombrar(null); setNombreRenombrar('')
    startTransition(refrescar)
  }

  // ── Eliminar carpeta ──
  const handleEliminarCarpeta = async () => {
    if (!carpetaABorrar) return
    setProcesando(true)
    const res = await eliminarCarpetaAction(carpetaABorrar.id, caso.id)
    setProcesando(false)
    setCarpetaABorrar(null)
    if (res.error) { setErrorAccion(res.error); return }
    startTransition(refrescar)
  }

  // ── Eliminar documento ──
  const handleEliminarDoc = async () => {
    if (!docABorrar) return
    setProcesando(true)
    const res = await eliminarDocumentoAction(docABorrar.id, caso.id)
    setProcesando(false)
    setDocABorrar(null)
    if (res.error) { setErrorAccion(res.error); return }
    startTransition(refrescar)
  }

  const handleDescargar = (doc: DocumentoListItem) => {
    const link = document.createElement('a')
    link.href = doc.url
    link.download = doc.nombreOriginal
    link.click()
  }

  const subcarpetas = contenido?.subcarpetas || []
  const documentos = contenido?.documentos || []
  const ruta = contenido?.ruta || []
  const vacio = subcarpetas.length === 0 && documentos.length === 0

  return (
    <div className="flex flex-col h-full">

      {/* ── Barra superior: breadcrumb + acciones ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 flex-shrink-0 gap-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm min-w-0 overflow-x-auto">
          <button
            onClick={irARaiz}
            className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 flex-shrink-0 ${
              carpetaActualId === null ? 'text-blue-700 font-medium' : 'text-slate-500'
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">{caso.numero}</span>
          </button>
          {ruta.map((c) => (
            <div key={c.id} className="flex items-center gap-1 flex-shrink-0">
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <button
                onClick={() => irACarpeta(c.id)}
                className={`px-2 py-1 rounded hover:bg-slate-100 truncate max-w-[160px] ${
                  c.id === carpetaActualId ? 'text-blue-700 font-medium' : 'text-slate-500'
                }`}
              >
                {c.nombre}
              </button>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {puedeCrearCarpeta && (
            <Button
              variant="outline" size="sm"
              onClick={() => { setNombreNuevaCarpeta(''); setErrorAccion(''); setModalNuevaCarpeta(true) }}
              className="gap-1.5 h-8"
            >
              <FolderPlus className="h-4 w-4" /> Nueva carpeta
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setDrawerSubir(true)}
            className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-8"
          >
            <Upload className="h-4 w-4" /> Subir
          </Button>
        </div>
      </div>

      {/* Error de acción */}
      {errorAccion && (
        <div className="mx-6 mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
          {errorAccion}
        </div>
      )}

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {cargando ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <p className="text-sm">Cargando contenido...</p>
          </div>
        ) : vacio ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-slate-100 rounded-full mb-4">
              <Folder className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-slate-600 font-medium">Esta carpeta está vacía</p>
            <p className="text-slate-400 text-sm mt-1">
              Subí un documento o creá una carpeta para empezar a organizar.
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Carpetas */}
            {subcarpetas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Carpetas</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {subcarpetas.map(c => (
                    <div
                      key={c.id}
                      className="group relative flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                      onDoubleClick={() => entrarCarpeta(c.id)}
                    >
                      <div className="p-2 bg-amber-50 rounded-lg text-amber-500 flex-shrink-0">
                        <Folder className="h-5 w-5" />
                      </div>
                      <button onClick={() => entrarCarpeta(c.id)} className="min-w-0 flex-1 text-left">
                        <p className="text-sm font-medium text-slate-800 truncate">{c.nombre}</p>
                        <p className="text-xs text-slate-400">
                          {c.cantidadDocumentos} doc · {c.cantidadSubcarpetas} carp.
                        </p>
                      </button>

                      {/* Menú de carpeta */}
                      {puedeCrearCarpeta && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setCarpetaARenombrar(c); setNombreRenombrar(c.nombre); setErrorAccion('') }}>
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Renombrar
                            </DropdownMenuItem>
                            {esAbogado && (
                              <DropdownMenuItem
                                onClick={() => setCarpetaABorrar(c)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentos */}
            {documentos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Documentos</p>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-2.5 text-left font-semibold">Nombre</th>
                        <th className="px-4 py-2.5 text-center font-semibold">Tamaño</th>
                        <th className="px-4 py-2.5 text-left font-semibold">Subido por</th>
                        <th className="px-4 py-2.5 text-left font-semibold">Fecha</th>
                        <th className="px-4 py-2.5 text-center font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {documentos.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <IconoArchivo extension={doc.extension} className="h-5 w-5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 text-sm truncate max-w-[260px]">{doc.nombre}</p>
                                {doc.descripcion && (
                                  <p className="text-xs text-slate-400 truncate max-w-[260px]">{doc.descripcion}</p>
                                )}
                              </div>
                              {doc.esInterno && (
                                <Badge className="bg-slate-100 text-slate-600 text-xs gap-1 flex-shrink-0">
                                  <Lock className="h-2.5 w-2.5" /> Interno
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-slate-500">{formatearTamanio(doc.tamanio)}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{doc.subidoPor}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {format(doc.createdAt, "dd/MM/yyyy", { locale: es })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setDocPreview(doc)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" title="Ver">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDescargar(doc)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" title="Descargar">
                                <Download className="h-4 w-4" />
                              </button>
                              {puedeEliminarDoc && (
                                <button onClick={() => setDocABorrar(doc)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600" title="Eliminar">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Drawer de subida (al nivel actual) ── */}
      <SubirDocumentoDrawer
        abierto={drawerSubir}
        onCerrar={() => { setDrawerSubir(false); startTransition(refrescar) }}
        caso={caso}
        carpetaActualId={carpetaActualId}
      />

      {/* ── Modal nueva carpeta ── */}
      <Dialog open={modalNuevaCarpeta} onOpenChange={setModalNuevaCarpeta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva carpeta</DialogTitle>
            <DialogDescription>
              Se creará {carpetaActualId ? 'dentro de la carpeta actual' : `en la raíz del expediente ${caso.numero}`}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm">Nombre de la carpeta</Label>
            <Input
              value={nombreNuevaCarpeta}
              onChange={e => setNombreNuevaCarpeta(e.target.value)}
              placeholder="Ej: Prueba documental"
              onKeyDown={e => { if (e.key === 'Enter') handleCrearCarpeta() }}
              autoFocus
            />
            {errorAccion && <p className="text-xs text-red-600">{errorAccion}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNuevaCarpeta(false)} disabled={procesando}>Cancelar</Button>
            <Button onClick={handleCrearCarpeta} disabled={procesando || !nombreNuevaCarpeta.trim()} className="bg-blue-600 hover:bg-blue-700">
              {procesando ? 'Creando...' : 'Crear carpeta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal renombrar carpeta ── */}
      <Dialog open={!!carpetaARenombrar} onOpenChange={(o) => !o && setCarpetaARenombrar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar carpeta</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm">Nuevo nombre</Label>
            <Input
              value={nombreRenombrar}
              onChange={e => setNombreRenombrar(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRenombrar() }}
              autoFocus
            />
            {errorAccion && <p className="text-xs text-red-600">{errorAccion}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCarpetaARenombrar(null)} disabled={procesando}>Cancelar</Button>
            <Button onClick={handleRenombrar} disabled={procesando || !nombreRenombrar.trim()} className="bg-blue-600 hover:bg-blue-700">
              {procesando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmación eliminar carpeta ── */}
      <AlertDialog open={!!carpetaABorrar} onOpenChange={(o) => !o && setCarpetaABorrar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Eliminar carpeta</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar la carpeta <span className="font-medium text-slate-700">"{carpetaABorrar?.nombre}"</span> con
              <span className="font-medium text-slate-700"> todo su contenido</span>: {carpetaABorrar?.cantidadDocumentos} documento(s)
              y {carpetaABorrar?.cantidadSubcarpetas} subcarpeta(s), incluyendo lo que haya dentro de ellas.
              Esta acción es permanente y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleEliminarCarpeta() }}
              disabled={procesando}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {procesando ? 'Eliminando...' : 'Eliminar todo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirmación eliminar documento ── */}
      <AlertDialog open={!!docABorrar} onOpenChange={(o) => !o && setDocABorrar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Eliminar documento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que querés eliminar <span className="font-medium text-slate-700">"{docABorrar?.nombre}"</span>?
              Esta acción es permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleEliminarDoc() }}
              disabled={procesando}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {procesando ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Preview ── */}
      {docPreview && (
        <PreviewDocumentoModal documento={docPreview} onCerrar={() => setDocPreview(null)} />
      )}
    </div>
  )
}