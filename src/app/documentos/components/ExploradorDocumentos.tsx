'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, MailOpen, Search, Briefcase, FolderClosed, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TelegramaSelector } from "./plantillas/telegrama/TelegramaSelector"
import { NavegadorCarpetas } from "./NavegadorCarpetas"

interface Caso {
  id: string
  numero: string
  titulo: string
  tipo: string
  estaCerrado: boolean
  _count: { documentos: number }
  cliente: { nombre: string; apellido: string | null }
}

interface ContextoAsistente {
  abogadoId: string
  abogadoNombre: string
  basePath: string
}

interface Props {
  casos: Caso[]
  userId: string
  userRol: string
  // Si está presente, indica que el explorador está siendo usado por un asistente
  // que ya eligió un abogado en el paso anterior. Habilita el botón "Cambiar abogado".
  contextoAsistente?: ContextoAsistente | null
  // Caso a pre-seleccionar al cargar (viene de ?caso=X en la URL).
  casoInicialId?: string | null
}

type TabActiva = 'documentos' | 'plantillas'

export function ExploradorDocumentos({
  casos,
  userId,
  userRol,
  contextoAsistente,
  casoInicialId,
}: Props) {
  const router = useRouter()

  const [tabActiva, setTabActiva] = useState<TabActiva>('documentos')
  const [casoSeleccionado, setCasoSeleccionado] = useState<Caso | null>(() => {
    if (!casoInicialId) return null
    return casos.find(c => c.id === casoInicialId) || null
  })
  const [busqueda, setBusqueda] = useState('')

  // Si la URL trae ?caso=X pero ese caso no está en la lista (cambió de abogado, etc),
  // limpiamos el state para evitar inconsistencia.
  useEffect(() => {
    if (casoSeleccionado && !casos.find(c => c.id === casoSeleccionado.id)) {
      setCasoSeleccionado(null)
    }
  }, [casos, casoSeleccionado])

  const seleccionarCaso = (caso: Caso) => {
    setCasoSeleccionado(caso)
    // Persistir en URL para que la selección sobreviva al refresh y se pueda compartir.
    const url = new URL(window.location.href)
    url.searchParams.set('caso', caso.id)
    router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false })
  }

  const cambiarAbogado = () => {
    if (contextoAsistente) {
      // Volver al selector de abogado, limpiando todos los params (incluido ?caso).
      router.push(contextoAsistente.basePath)
    }
  }

  const casosFiltrados = casos.filter(c => {
    const q = busqueda.toLowerCase()
    const cliente = `${c.cliente.nombre} ${c.cliente.apellido || ''}`.toLowerCase()
    return (
      c.numero.toLowerCase().includes(q) ||
      c.titulo.toLowerCase().includes(q) ||
      cliente.includes(q)
    )
  })

  const totalDocumentos = casos.reduce((sum, c) => sum + c._count.documentos, 0)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0 gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
          <p className="text-sm text-slate-500 mt-1">
            {contextoAsistente && (
              <>
                <span className="text-blue-600 font-medium">
                  {contextoAsistente.abogadoNombre}
                </span>
                <span className="mx-2 text-slate-300">·</span>
              </>
            )}
            {totalDocumentos} archivo{totalDocumentos === 1 ? '' : 's'} en {casos.length} expediente{casos.length === 1 ? '' : 's'}
          </p>
        </div>

        {contextoAsistente && (
          <Button
            variant="outline"
            size="sm"
            onClick={cambiarAbogado}
            className="gap-1.5 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Cambiar abogado
          </Button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="px-6 pt-3 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setTabActiva('documentos')}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-t-lg border-b-2 transition-colors ${
              tabActiva === 'documentos'
                ? 'border-blue-600 text-blue-700 font-medium'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="h-4 w-4" />
            Documentos
          </button>
          <button
            onClick={() => setTabActiva('plantillas')}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-t-lg border-b-2 transition-colors ${
              tabActiva === 'plantillas'
                ? 'border-blue-600 text-blue-700 font-medium'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MailOpen className="h-4 w-4" />
            Plantillas Oficiales
          </button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 min-h-0 flex flex-col">

        {tabActiva === 'documentos' && (
          <div className="flex flex-1 min-h-0">

            {/* Sidebar de expedientes */}
            <div className="w-80 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
              <div className="p-3 border-b border-slate-100 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Buscar expediente..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {casosFiltrados.length > 0 ? (
                  casosFiltrados.map(caso => {
                    const activo = casoSeleccionado?.id === caso.id
                    return (
                      <button
                        key={caso.id}
                        onClick={() => seleccionarCaso(caso)}
                        className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                          activo ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`p-1.5 rounded ${activo ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Briefcase className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-mono font-semibold ${activo ? 'text-blue-700' : 'text-slate-500'}`}>
                              {caso.numero}
                            </p>
                            <p className="text-sm font-medium text-slate-800 truncate">{caso.titulo}</p>
                            <p className="text-xs text-slate-400 truncate">
                              {caso.cliente.nombre} {caso.cliente.apellido || ''}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <p className="text-center text-xs text-slate-400 py-6">
                    {casos.length === 0
                      ? 'No hay expedientes para mostrar.'
                      : 'No se encontraron expedientes con ese filtro.'}
                  </p>
                )}
              </div>
            </div>

            {/* Panel derecho: navegador de carpetas */}
            <div className="flex-1 min-w-0 overflow-hidden">
              {casoSeleccionado ? (
                <NavegadorCarpetas
                  caso={casoSeleccionado}
                  userId={userId}
                  userRol={userRol}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-12">
                  <div className="p-4 bg-slate-100 rounded-full mb-4">
                    <FolderClosed className="h-10 w-10 text-slate-300" />
                  </div>
                  <p className="text-slate-600 font-medium">Elegí un expediente</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Seleccioná un expediente de la izquierda para ver y organizar sus documentos.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {tabActiva === 'plantillas' && (
          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/50">
            <TelegramaSelector casos={casos} />
          </div>
        )}
      </div>
    </div>
  )
}