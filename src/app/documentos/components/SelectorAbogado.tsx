'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User2, Briefcase } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Abogado {
  id: string
  nombre: string | null
  apellido: string | null
  email: string
  _count: { casos: number }
}

interface Props {
  abogados: Abogado[]
  // Ruta base a la que se vuelve con el abogado elegido como ?abogado=<id>.
  // Se usa para reutilizar el selector en /documentos y /plantillas.
  basePath: string
  // Texto opcional del header. Si no se pasa, usa el default.
  titulo?: string
  subtitulo?: string
}

export function SelectorAbogado({
  abogados,
  basePath,
  titulo = '¿De qué abogado son los documentos?',
  subtitulo = 'Como asistente del estudio, primero elegí el abogado titular del expediente.',
}: Props) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')

  const filtrados = abogados.filter(a => {
    const q = busqueda.toLowerCase()
    const nombre = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase()
    return nombre.includes(q) || a.email.toLowerCase().includes(q)
  })

  const elegir = (abogadoId: string) => {
    router.push(`${basePath}?abogado=${abogadoId}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">{titulo}</h2>
        <p className="text-sm text-slate-500 mt-1">{subtitulo}</p>
      </div>

      {/* Búsqueda */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-slate-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Grid de abogados */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-slate-100 rounded-full mb-3">
              <User2 className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm">
              {abogados.length === 0
                ? 'No hay abogados activos en el estudio.'
                : 'No se encontraron abogados con ese filtro.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtrados.map(ab => {
              const nombreCompleto = `${ab.nombre ?? ''} ${ab.apellido ?? ''}`.trim() || ab.email
              return (
                <button
                  key={ab.id}
                  onClick={() => elegir(ab.id)}
                  className="text-left p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors flex-shrink-0">
                      <User2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                        {nombreCompleto}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{ab.email}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {ab._count.casos} expediente{ab._count.casos === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}