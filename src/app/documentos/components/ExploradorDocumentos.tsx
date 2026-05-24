'use client'

import { useState, useMemo } from "react"
import { FileText, LayoutGrid, List, Upload, Search, MailOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CarpetaDocumento } from "@prisma/client"
import { DocumentoListItem, DocumentosPorCarpeta, CARPETA_LABELS } from "@/lib/aplication/services/documento.types"
import { PanelNavegacion } from "./PanelNavegacion"
import { PanelContenido } from "./PanelContenido"
import { SubirDocumentoDrawer } from "./SubirDocumentoDrawer"
import { TelegramaSelector } from "./plantillas/telegrama/TelegramaSelector"

// ═══════════════════════════════════════════════════════════════════════════
// LIMPIEZA del tab "Plantillas Oficiales":
//   • Se eliminó el <Tabs> Telegramas/Cartas (solo existen telegramas).
//   • Se eliminó CartaFormulario (PDF inexistente → ENOENT) y su import.
//   • Se eliminó la doble renderización (PlantillasSection + TelegramaSelector
//     mostraban lo mismo). Ahora el tab muestra DIRECTO el TelegramaSelector.
//   • Scroll unificado: un solo contenedor con overflow en cada panel.
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

interface Props {
  casos: Caso[]
  documentosPorCaso: Array<{
    caso: Caso
    grupos: DocumentosPorCarpeta[]
  }>
  userId: string
  userRol: string
}

export type FiltroActivo = {
  tipo: 'todos' | 'caso' | 'carpeta'
  casoId?: string
  carpeta?: CarpetaDocumento
}

type TabActiva = 'documentos' | 'plantillas'

export function ExploradorDocumentos({ casos, documentosPorCaso, userId, userRol }: Props) {
  const [tabActiva, setTabActiva] = useState<TabActiva>('documentos')
  const [filtro, setFiltro] = useState<FiltroActivo>({ tipo: 'todos' })
  const [vistaGrilla, setVistaGrilla] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  const documentosFiltrados = useMemo(() => {
    let docs: DocumentoListItem[] = []

    if (filtro.tipo === 'todos') {
      docs = documentosPorCaso.flatMap(d => d.grupos.flatMap(g => g.documentos))
    } else if (filtro.tipo === 'caso' && filtro.casoId) {
      const datosCaso = documentosPorCaso.find(d => d.caso.id === filtro.casoId)
      docs = datosCaso?.grupos.flatMap(g => g.documentos) || []
    } else if (filtro.tipo === 'carpeta' && filtro.carpeta) {
      docs = documentosPorCaso.flatMap(d =>
        d.grupos.filter(g => g.carpeta === filtro.carpeta).flatMap(g => g.documentos)
      )
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      docs = docs.filter(d =>
        d.nombre.toLowerCase().includes(q) ||
        d.descripcion?.toLowerCase().includes(q)
      )
    }

    return docs
  }, [filtro, busqueda, documentosPorCaso])

  const totalDocumentos = documentosPorCaso.reduce(
    (sum, d) => sum + d.grupos.reduce((s, g) => s + g.cantidad, 0), 0
  )

  const tituloPanelDerecho = useMemo(() => {
    if (filtro.tipo === 'todos') return 'Todos los documentos'
    if (filtro.tipo === 'caso') {
      const caso = casos.find(c => c.id === filtro.casoId)
      return caso ? `${caso.numero} - ${caso.titulo}` : 'Caso'
    }
    if (filtro.tipo === 'carpeta') return CARPETA_LABELS[filtro.carpeta!]
    return 'Documentos'
  }, [filtro, casos])

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* ── Header del módulo ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalDocumentos} archivos en {casos.length} expedientes
          </p>
        </div>
        <Button onClick={() => setDrawerAbierto(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Upload className="h-4 w-4" />
          Subir documento
        </Button>
      </div>

      {/* ── Tabs principales ── */}
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

      {/* ── Contenido dinámico ── */}
      <div className="flex-1 min-h-0 flex flex-col">

        {/* 1. EXPLORADOR DE ARCHIVOS */}
        {tabActiva === 'documentos' && (
          <div className="flex flex-1 min-h-0">

            {/* Panel izquierdo (navegación por expediente/carpeta) */}
            <div className="w-80 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0">
              <PanelNavegacion
                casos={casos}
                documentosPorCaso={documentosPorCaso}
                filtroActivo={filtro}
                onCambiarFiltro={setFiltro}
                totalDocumentos={totalDocumentos}
              />
            </div>

            {/* Panel derecho */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

              {/* Barra de búsqueda/vista */}
              <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-slate-800 text-sm truncate max-w-[300px]">
                    {tituloPanelDerecho}
                  </h2>
                  <Badge variant="outline" className="text-xs">
                    {documentosFiltrados.length} archivos
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Buscar archivos..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      className="pl-9 h-8 w-56 text-sm"
                    />
                  </div>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setVistaGrilla(false)}
                      className={`p-1.5 ${!vistaGrilla ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setVistaGrilla(true)}
                      className={`p-1.5 ${vistaGrilla ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <PanelContenido
                documentos={documentosFiltrados}
                vistaGrilla={vistaGrilla}
                filtro={filtro}
                casos={casos}
                userId={userId}
                userRol={userRol}
              />
            </div>
          </div>
        )}

        {/* 2. GENERADOR DE TELEGRAMAS — directo, sin tabs intermedios */}
        {tabActiva === 'plantillas' && (
          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/50">
            <TelegramaSelector casos={casos} />
          </div>
        )}
      </div>

      {/* Drawer de carga de archivos */}
      <SubirDocumentoDrawer
        abierto={drawerAbierto}
        onCerrar={() => setDrawerAbierto(false)}
        casos={casos}
        casoIdPreseleccionado={filtro.tipo === 'caso' ? filtro.casoId : undefined}
      />
    </div>
  )
}