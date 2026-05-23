'use client'

import { useState } from 'react'
import { Search, Briefcase, ChevronRight } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Caso {
  id: string
  numero: string
  titulo: string
  cliente: {
    nombre: string
    apellido: string | null
  }
}

interface SelectorExpedienteProps {
  casos: Caso[]
  onSeleccionarCaso: (casoId: string) => void
}

export function SelectorExpediente({ casos, onSeleccionarCaso }: SelectorExpedienteProps) {
  const [busqueda, setBusqueda] = useState('')

  // Filtrar expedientes en tiempo real por número, título o nombre del cliente
  const casosFiltrados = casos.filter(caso => {
    const q = busqueda.toLowerCase()
    const nombreCliente = caso.cliente 
      ? `${caso.cliente.nombre} ${caso.cliente.apellido || ''}`.toLowerCase()
      : ''
    return (
      (caso.numero?.toLowerCase() || '').includes(q) ||
      (caso.titulo?.toLowerCase() || '').includes(q) ||
      nombreCliente.includes(q)
    )
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-slate-800">
          ¿A qué expediente corresponde este documento?
        </h3>
        <p className="text-sm text-slate-500">
          Seleccioná el caso para pre-cargar automáticamente los datos del remitente y destinatario.
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por N° expediente, título o cliente..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="pl-10 h-11 text-base bg-white shadow-sm"
        />
      </div>

      {/* Lista de resultados */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {casosFiltrados.length > 0 ? (
          casosFiltrados.map(caso => (
            <Card 
              key={caso.id} 
              className="hover:border-blue-300 hover:bg-slate-50 cursor-pointer transition-all shadow-sm"
              onClick={() => onSeleccionarCaso(caso.id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 font-mono">
                      EXP. N° {caso.numero}
                    </p>
                    <h4 className="font-medium text-slate-800 text-sm">
                      {caso.titulo}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cliente: {caso.cliente.nombre} {caso.cliente.apellido}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-sm text-slate-400 py-6">
            No se encontraron expedientes coincidentes.
          </p>
        )}
      </div>
    </div>
  )
}