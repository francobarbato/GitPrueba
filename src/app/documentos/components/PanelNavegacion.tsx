'use client'

import { useState } from "react"
import { ChevronDown, ChevronRight, Folder, FolderOpen, FileText, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CarpetaDocumento } from "@prisma/client"
import { DocumentosPorCarpeta, CARPETA_LABELS } from "@/lib/aplication/services/documento.types"
import { FiltroActivo } from "./ExploradorDocumentos"

interface Caso {
  id: string
  numero: string
  titulo: string
  tipo: string
  estaCerrado: boolean
  _count: { documentos: number }
}

interface Props {
  casos: Caso[]
  documentosPorCaso: Array<{ caso: Caso; grupos: DocumentosPorCarpeta[] }>
  filtroActivo: FiltroActivo
  onCambiarFiltro: (filtro: FiltroActivo) => void
  totalDocumentos: number
}

// Conteo de docs por carpeta global
function calcularTotalPorCarpeta(
  documentosPorCaso: Props['documentosPorCaso']
): Record<CarpetaDocumento, number> {
  const totales = {} as Record<CarpetaDocumento, number>
  documentosPorCaso.forEach(d => {
    d.grupos.forEach(g => {
      totales[g.carpeta] = (totales[g.carpeta] || 0) + g.cantidad
    })
  })
  return totales
}

export function PanelNavegacion({
  casos,
  documentosPorCaso,
  filtroActivo,
  onCambiarFiltro,
  totalDocumentos
}: Props) {
  const [casosExpandidos, setCasosExpandidos] = useState<Set<string>>(new Set())
  const totalPorCarpeta = calcularTotalPorCarpeta(documentosPorCaso)
  const [busquedaCaso, setBusquedaCaso] = useState("")

  const toggleCaso = (casoId: string) => {
    const nuevo = new Set(casosExpandidos)
    if (nuevo.has(casoId)) {
      nuevo.delete(casoId)
    } else {
      nuevo.add(casoId)
    }
    setCasosExpandidos(nuevo)
  }

  const estaActivo = (filtro: FiltroActivo) => {
    if (filtro.tipo === 'todos' && filtroActivo.tipo === 'todos') return true
    if (filtro.tipo === 'caso' && filtroActivo.tipo === 'caso' && filtro.casoId === filtroActivo.casoId) return true
    if (filtro.tipo === 'carpeta' && filtroActivo.tipo === 'carpeta' && filtro.carpeta === filtroActivo.carpeta) return true
    return false
  }

  return (
    <div className="p-3 space-y-1">

      {/* Todos los documentos */}
      <button
        onClick={() => onCambiarFiltro({ tipo: 'todos' })}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
          estaActivo({ tipo: 'todos' })
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-slate-700 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Todos los documentos
        </div>
        <Badge variant="outline" className="text-xs">
          {totalDocumentos}
        </Badge>
      </button>

      {/* Separador */}
      <div className="pt-2 pb-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 mb-2">
          Por expediente
        </p>
        <div className="px-2">
          <input
            type="text"
            placeholder="Buscar expediente..."
            value={busquedaCaso}
            onChange={e => setBusquedaCaso(e.target.value)}
            className="w-full h-7 px-2.5 text-xs border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-300 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Lista de casos */}
      {casos.filter(caso => {
        if (!busquedaCaso.trim()) return true
        const q = busquedaCaso.toLowerCase()
        return caso.numero.toLowerCase().includes(q) || caso.titulo.toLowerCase().includes(q)
      }).map(caso => {
        const datosDoc = documentosPorCaso.find(d => d.caso.id === caso.id)
        const totalCaso = caso._count.documentos
        const expandido = casosExpandidos.has(caso.id)

        return (
          <div key={caso.id}>
            {/* Fila del caso */}
            <div
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                estaActivo({ tipo: 'caso', casoId: caso.id })
                  ? 'bg-blue-50'
                  : 'hover:bg-slate-50'
              }`}
            >
              {/* Expandir/colapsar */}
              <button
                onClick={() => toggleCaso(caso.id)}
                className="p-0.5 text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                {expandido
                  ? <ChevronDown className="h-3.5 w-3.5" />
                  : <ChevronRight className="h-3.5 w-3.5" />
                }
              </button>

              {/* Nombre del caso */}
              <button
                onClick={() => onCambiarFiltro({ tipo: 'caso', casoId: caso.id })}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                {expandido
                  ? <FolderOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  : <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
                }
                <div className="min-w-0">
                  <p className={`text-xs font-medium truncate ${
                    estaActivo({ tipo: 'caso', casoId: caso.id })
                      ? 'text-blue-700'
                      : 'text-slate-700'
                  }`}>
                    {caso.numero}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {caso.titulo}
                  </p>
                </div>
              </button>

              {totalCaso > 0 && (
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {totalCaso}
                </Badge>
              )}
            </div>

            {/* Carpetas del caso expandido */}
            {expandido && datosDoc && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                {datosDoc.grupos
                  .filter(g => g.cantidad > 0)
                  .map(grupo => (
                    <button
                      key={grupo.carpeta}
                      onClick={() => onCambiarFiltro({
                        tipo: 'caso',
                        casoId: caso.id
                      })}
                      className="w-full flex items-center justify-between px-2 py-1 rounded text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        {grupo.carpeta === 'NOTAS_INTERNOS'
                          ? <Lock className="h-3 w-3 text-slate-400" />
                          : <Folder className="h-3 w-3 text-slate-400" />
                        }
                        <span className="truncate max-w-[130px]">
                          {grupo.label}
                        </span>
                      </div>
                      <span className="text-slate-400">{grupo.cantidad}</span>
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        )
      })}

      {/* Separador */}
      <div className="pt-3 pb-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3">
          Por carpeta
        </p>
      </div>

      {/* Carpetas globales */}
      {Object.entries(CARPETA_LABELS).map(([carpeta, label]) => {
        const total = totalPorCarpeta[carpeta as CarpetaDocumento] || 0
        if (total === 0) return null

        return (
          <button
            key={carpeta}
            onClick={() => onCambiarFiltro({
              tipo: 'carpeta',
              carpeta: carpeta as CarpetaDocumento
            })}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              estaActivo({ tipo: 'carpeta', carpeta: carpeta as CarpetaDocumento })
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              {carpeta === 'NOTAS_INTERNOS'
                ? <Lock className="h-4 w-4 text-slate-400" />
                : <Folder className="h-4 w-4 text-slate-400" />
              }
              <span className="text-xs truncate max-w-[150px]">{label}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {total}
            </Badge>
          </button>
        )
      })}
    </div>
  )
}