'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { useState } from "react"

interface RendimientoAbogado {
  id: string
  nombre: string
  email: string
  casosCerrados: number
  tiempoPromedio: number
  tiempoMinimo: number
  tiempoMaximo: number
  posicionRanking: number
  tendencia: 'mejora' | 'estable' | 'empeora'
  desglosePorTipo: { tipo: string; cantidad: number; tiempoPromedio: number }[]
}

const getTendenciaConfig = (tendencia: string) => {
  switch (tendencia) {
    case 'mejora':
      return { 
        icon: TrendingDown, 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50',
        label: 'Mejora'
      }
    case 'empeora':
      return { 
        icon: TrendingUp, 
        color: 'text-rose-600', 
        bg: 'bg-rose-50',
        label: 'Empeora'
      }
    default:
      return { 
        icon: Minus, 
        color: 'text-slate-500', 
        bg: 'bg-slate-50',
        label: 'Estable'
      }
  }
}

function FilaAbogado({ abogado }: { abogado: RendimientoAbogado }) {
  const [expandido, setExpandido] = useState(false)
  const tendencia = getTendenciaConfig(abogado.tendencia)
  const TendenciaIcon = tendencia.icon

  return (
    <>
      <tr 
        className="hover:bg-slate-50 transition cursor-pointer"
        onClick={() => setExpandido(!expandido)}
      >
        {/* Posición */}
        <td className="px-6 py-4 text-center">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
            abogado.posicionRanking <= 3 
              ? 'bg-amber-100 text-amber-700' 
              : 'bg-slate-100 text-slate-600'
          }`}>
            {abogado.posicionRanking}
          </span>
        </td>

        {/* Abogado */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {abogado.desglosePorTipo.length > 0 && (
              expandido 
                ? <ChevronDown className="h-4 w-4 text-slate-400" />
                : <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
            <div>
              <p className="font-medium text-slate-900">{abogado.nombre}</p>
              <p className="text-xs text-slate-500">{abogado.email}</p>
            </div>
          </div>
        </td>

        {/* Casos Cerrados */}
        <td className="px-6 py-4 text-center">
          <span className="text-lg font-bold text-slate-800">
            {abogado.casosCerrados}
          </span>
        </td>

        {/* Tiempo Promedio */}
        <td className="px-6 py-4 text-center">
          <Badge className={`${
            abogado.tiempoPromedio < 60 ? 'bg-emerald-100 text-emerald-700' :
            abogado.tiempoPromedio < 120 ? 'bg-blue-100 text-blue-700' :
            abogado.tiempoPromedio < 180 ? 'bg-amber-100 text-amber-700' :
            'bg-rose-100 text-rose-700'
          }`}>
            {abogado.tiempoPromedio} días
          </Badge>
        </td>

        {/* Rango */}
        <td className="px-6 py-4 text-center">
          <span className="text-xs text-slate-500">
            {abogado.tiempoMinimo} - {abogado.tiempoMaximo} días
          </span>
        </td>

        {/* Tendencia */}
        <td className="px-6 py-4 text-center">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${tendencia.bg}`}>
            <TendenciaIcon className={`h-4 w-4 ${tendencia.color}`} />
            <span className={`text-xs font-medium ${tendencia.color}`}>
              {tendencia.label}
            </span>
          </div>
        </td>
      </tr>

      {/* Fila expandida con desglose por tipo */}
      {expandido && abogado.desglosePorTipo.length > 0 && (
        <tr className="bg-slate-50/50">
          <td colSpan={6} className="px-6 py-3">
            <div className="ml-10 pl-4 border-l-2 border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-2">Desglose por tipo de caso:</p>
              <div className="flex flex-wrap gap-2">
                {abogado.desglosePorTipo.map((item, idx) => (
                  <div 
                    key={idx}
                    className="px-3 py-1.5 bg-white rounded border border-slate-200 text-xs"
                  >
                    <span className="font-medium text-slate-700">{item.tipo}:</span>{' '}
                    <span className="text-slate-600">
                      {item.cantidad} casos, {item.tiempoPromedio}d promedio
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function TablaRendimientoAbogados({ data }: { data: RendimientoAbogado[] }) {
  if (data.length === 0) return null

  return (
    <Card className="mb-6 border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">
              Rendimiento Detallado por Abogado
            </CardTitle>
            <CardDescription>
              Ordenado por velocidad de resolución (más rápido primero)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <th className="px-6 py-4 text-center font-semibold w-16">#</th>
                <th className="px-6 py-4 text-left font-semibold">Abogado</th>
                <th className="px-6 py-4 text-center font-semibold">Cerrados</th>
                <th className="px-6 py-4 text-center font-semibold">Promedio</th>
                <th className="px-6 py-4 text-center font-semibold">Rango</th>
                <th className="px-6 py-4 text-center font-semibold">Tendencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(abogado => (
                <FilaAbogado key={abogado.id} abogado={abogado} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
