'use client'

import { useState } from "react"
import { FileText, MailOpen, Search, Briefcase, FolderClosed } from "lucide-react"
import { Input } from "@/components/ui/input"
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

interface Props {
  casos: Caso[]
  userId: string
  userRol: string
}

type TabActiva = 'documentos' | 'plantillas'

export function ExploradorDocumentos({ casos, userId, userRol }: Props) {
  const [tabActiva, setTabActiva] = useState<TabActiva>('documentos')
  const [casoSeleccionado, setCasoSeleccionado] = useState<Caso | null>(null)
  const [busqueda, setBusqueda] = useState('')

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
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalDocumentos} archivos en {casos.length} expedientes
          </p>
        </div>
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

        {/* DOCUMENTOS: sidebar de expedientes + navegador de carpetas */}
        {tabActiva === 'documentos' && (
          <div className="flex flex-1 min-h-0">

            {/* Sidebar de expedientes con buscador */}
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
                        onClick={() => setCasoSeleccionado(caso)}
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
                    No se encontraron expedientes.
                  </p>
                )}
              </div>
            </div>

            {/* Panel derecho: navegador de carpetas del expediente elegido */}
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

        {/* PLANTILLAS: directo al selector de telegramas */}
        {tabActiva === 'plantillas' && (
          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/50">
            <TelegramaSelector casos={casos} />
          </div>
        )}
      </div>
    </div>
  )
}