'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Moon, CheckCircle2 } from "lucide-react"

// Definimos el tipo de datos para un abogado
export interface AbogadoCarga {
  id: string
  nombre: string
  email: string
  avatar?: string | null
  cargaTotal: number
  casosDormidos: number
  cerradosMes: number
  estado: 'Disponible' | 'Activo' | 'Saturado'
}

// CORRECCIÓN AQUÍ: Agregamos esAdmin a las props
interface MatrizProps {
  data: AbogadoCarga[]
  esAdmin: boolean
}

const getEstadoConfig = (estado: string) => {
  switch (estado) {
    case 'Disponible':
      return {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'DISPONIBLE'
      }
    case 'Activo':
      return {
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        label: 'ACTIVO'
      }
    case 'Saturado':
      return {
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        label: 'SATURADO'
      }
    default:
      return {
        color: 'bg-slate-50 text-slate-600 border-slate-200',
        label: estado.toUpperCase()
      }
  }
}

const getInitials = (nombre: string) => {
  return nombre
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function MatrizCargaEquipo({ data, esAdmin }: MatrizProps) {
  // Calcular totales para el resumen
  const totalCarga = data.reduce((acc, a) => acc + a.cargaTotal, 0)
  const totalDormidos = data.reduce((acc, a) => acc + a.casosDormidos, 0)
  const saturados = data.filter(a => a.estado === 'Saturado').length

  return (
    <Card className="border-slate-200 shadow-sm mb-6">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                {/* Título dinámico según si es admin o no */}
                {esAdmin ? "Matriz de Carga del Equipo" : "Tu Posición en el Equipo"}
              </CardTitle>
              <CardDescription>
                Estado operativo de cada profesional del estudio
              </CardDescription>
            </div>
          </div>
          
          {/* Resumen rápido visible en escritorio */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="text-center">
              <p className="font-bold text-slate-700">{totalCarga}</p>
              <p className="text-slate-500">Total Casos</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center">
              <p className={`font-bold ${totalDormidos > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                {totalDormidos}
              </p>
              <p className="text-slate-500">Inactivos</p>
            </div>
            {saturados > 0 && (
              <>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-center">
                  <p className="font-bold text-rose-600">{saturados}</p>
                  <p className="text-slate-500">Saturados</p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <th className="px-6 py-4 text-left font-semibold">Profesional</th>
                <th className="px-6 py-4 text-center font-semibold">Carga Total</th>
                <th className="px-6 py-4 text-center font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <Moon className="h-3 w-3" />
                    Inactivos
                  </div>
                </th>
                <th className="px-6 py-4 text-center font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Cerrados (30d)
                  </div>
                </th>
                <th className="px-6 py-4 text-center font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((abogado) => {
                const estadoConfig = getEstadoConfig(abogado.estado)
                
                return (
                  <tr 
                    key={abogado.id} 
                    className={`hover:bg-slate-50 transition ${
                      abogado.estado === 'Saturado' ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    {/* Profesional */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={abogado.avatar || undefined} />
                          <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-medium">
                            {getInitials(abogado.nombre)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900">{abogado.nombre}</p>
                          <p className="text-xs text-slate-500">{abogado.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Carga Total */}
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xl font-bold ${
                        abogado.cargaTotal > 15 ? 'text-rose-600' :
                        abogado.cargaTotal > 8 ? 'text-amber-600' :
                        'text-slate-700'
                      }`}>
                        {abogado.cargaTotal}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">casos</span>
                    </td>

                    {/* Casos Dormidos */}
                    <td className="px-6 py-4 text-center">
                      {abogado.casosDormidos > 0 ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          abogado.casosDormidos > 5 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Moon className="h-3 w-3" />
                          {abogado.casosDormidos}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Cerrados Mes */}
                    <td className="px-6 py-4 text-center">
                      {abogado.cerradosMes > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          {abogado.cerradosMes}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 text-center">
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-bold ${estadoConfig.color}`}
                      >
                        {estadoConfig.label}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {data.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No hay abogados registrados en el sistema
          </div>
        )}
      </CardContent>
    </Card>
  )
}