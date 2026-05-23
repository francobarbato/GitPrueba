'use client'

import { useState, useMemo } from "react"
import { FileText, LayoutGrid, List, Upload, Search, MailOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" 
import { CarpetaDocumento } from "@prisma/client"
import { DocumentoListItem, DocumentosPorCarpeta, CARPETA_LABELS } from "@/lib/aplication/services/documento.types"
import { PanelNavegacion } from "./PanelNavegacion"
import { PanelContenido } from "./PanelContenido"
import { SubirDocumentoDrawer } from "./SubirDocumentoDrawer"
import { TelegramaSelector } from "./plantillas/telegrama/TelegramaSelector"
import { CartaFormulario } from "./plantillas/carta/CartaFormulario"
import { PlantillasSection } from "./plantillas/PlantillasSection"

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

      {/* ── Tabs manuales principales ── */}
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

      {/* ── Contenido Dinámico de las Tabs ── */}
      <div className="flex-1 min-h-0 flex flex-col">
        
        {/* 1. SECCIÓN EXPLORADOR DE ARCHIVOS TRADICIONAL */}
        {tabActiva === 'documentos' && (
          <div className="flex flex-1 min-h-0"> 

            {/* Panel izquierdo */}
            <div className="w-82 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0">
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

              {/* Barra superior de búsqueda/vista */}
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

        {/* 2. SECCIÓN GENERADORA DE DOCUMENTOS POSTALES (Fase 4) 🚀 */}
        {tabActiva === 'plantillas' && (
          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
            <Tabs defaultValue="telegramas" className="w-full">
              
              {/* Interruptor superior para elegir el tipo de correspondencia */}
              <TabsList className="grid w-full grid-cols-2 max-w-[450px] mx-auto bg-slate-200/70 p-1 rounded-xl shadow-sm border mb-6">
                <TabsTrigger value="telegramas" className="rounded-lg text-sm font-semibold py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
                  Telegramas Laborales (Ley 23.789)
                </TabsTrigger>
                <TabsTrigger value="cartas" className="rounded-lg text-sm font-semibold py-2 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm transition-all">
                  Cartas Documento Oficiales
                </TabsTrigger>
              </TabsList>

              {/* Contenedor dinámico de Telegramas */}
              <TabsContent value="telegramas" className="mt-2 focus-visible:outline-none">
                <TelegramaSelector casos={casos} />
              </TabsContent>

              {/* Contenedor dinámico de Cartas Documento */}
              <TabsContent value="cartas" className="mt-2 focus-visible:outline-none">
                <CartaFormulario casos={casos} />
              </TabsContent>

            </Tabs>
            <div className="flex-1 overflow-y-auto">
            <PlantillasSection casos={casos} />
          </div>
            
          </div>
            
        )}
      </div>

      {/* Drawer lateral de carga de archivos tradicionales */}
      <SubirDocumentoDrawer
        abierto={drawerAbierto}
        onCerrar={() => setDrawerAbierto(false)}
        casos={casos}
        casoIdPreseleccionado={filtro.tipo === 'caso' ? filtro.casoId : undefined}
      />
    </div>
  )
}