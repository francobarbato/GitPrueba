'use client'

import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Search } from "lucide-react"
import { useState } from "react"

type Caso = {
  id: string
  numero: string
  titulo: string
  estado: string
  tipo: string
  cliente: { nombre: string; apellido: string | null } | null
}

export function SelectorCasoMejorado({ casos, casoActual }: { casos: Caso[]; casoActual?: string }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')

  const handleChange = (casoId: string) => {
    router.push(`/reportes/tiempo-por-etapa?casoId=${casoId}`)
  }

  // Filtrar casos por búsqueda
  const casosFiltrados = casos.filter(caso => {
    if (!searchTerm) return true
    const termLower = searchTerm.toLowerCase()
    return (
      caso.numero.toLowerCase().includes(termLower) ||
      caso.titulo.toLowerCase().includes(termLower) ||
      caso.cliente?.nombre.toLowerCase().includes(termLower) ||
      caso.cliente?.apellido?.toLowerCase().includes(termLower)
    )
  })

  const casoSeleccionado = casos.find(c => c.id === casoActual)

  return (
    <Card className="shadow-md border-slate-200 mb-6">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base font-bold text-slate-800">
              Seleccionar Expediente para Analizar
            </CardTitle>
          </div>
          {casos.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {casos.length} caso{casos.length !== 1 ? 's' : ''} disponible{casos.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        
        {/* Caso actual seleccionado (información destacada) */}
        {casoSeleccionado && (
          <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-xs text-slate-600 mb-2 font-semibold">CASO ACTUAL:</p>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-lg mb-1">
                  {casoSeleccionado.titulo}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-600 font-mono">
                    #{casoSeleccionado.numero}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {casoSeleccionado.tipo}
                  </Badge>
                  <Badge className="text-xs bg-blue-100 text-blue-700">
                    {casoSeleccionado.estado}
                  </Badge>
                </div>
                {casoSeleccionado.cliente && (
                  <p className="text-xs text-slate-500 mt-2">
                    Cliente: {casoSeleccionado.cliente.nombre} {casoSeleccionado.cliente.apellido}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Selector de casos */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Cambiar a otro expediente:
          </label>
          
          <Select value={casoActual} onValueChange={handleChange}>
            <SelectTrigger className="w-full h-auto min-h-[44px]">
              <SelectValue placeholder="Buscar por número, carátula o cliente..." />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {/* Input de búsqueda dentro del select */}
              <div className="p-2 border-b sticky top-0 bg-white z-10">
                <input
                  type="text"
                  placeholder="Filtrar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {casosFiltrados.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No se encontraron casos
                </div>
              ) : (
                casosFiltrados.map(caso => (
                  <SelectItem key={caso.id} value={caso.id} className="py-3">
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {caso.titulo}
                        </span>
                        {caso.id === casoActual && (
                          <Badge className="text-[10px] bg-blue-100 text-blue-700">
                            ACTUAL
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                        <span className="font-mono">{caso.numero}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-[10px]">
                          {caso.tipo}
                        </Badge>
                        {caso.cliente && (
                          <>
                            <span>•</span>
                            <span>{caso.cliente.nombre} {caso.cliente.apellido}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <p className="text-xs text-slate-500">
            Solo se muestran los casos a los que tenés acceso según tu rol
          </p>
        </div>
      </CardContent>
    </Card>
  )
}