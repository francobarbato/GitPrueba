// app/reportes/rendimiento/components/TablaActividad.tsx
// Vista General: tabla resumen sin lista de casos individuales en expandible
'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  ChevronDown,
  ChevronRight,
  Briefcase,
  MapPin
} from "lucide-react"

interface AbogadoActividad {
  id: string
  nombre: string
  email: string
  casosActivos: number
  casosCerrados: number
  tasaExito: number
  valorRecuperado: number
  porcentajeRecuperacion: number
  distribucionActivos: Array<{ tipo: string; cantidad: number }>
  fuerosActivos: Array<{ fuero: string; cantidad: number }>
  perfilCasos: {
    distribucion: Array<{ tipo: string; cantidad: number }>
    porcentajeAcuerdos: number
  }
  detalleCierres: any[]
}

const formatMonto = (monto: number) => {
  if (monto >= 1000000) return `$${(monto / 1000000).toFixed(1)}M`
  if (monto >= 1000) return `$${(monto / 1000).toFixed(0)}K`
  return `$${monto}`
}

const TIPOS_LABEL: Record<string, string> = {
  'LABORAL': 'Laboral',
  'CIVIL_COMERCIAL': 'Civil y Com.',
  'FAMILIA': 'Familia',
  'PENAL': 'Penal',
  'SUCESIONES': 'Sucesiones',
  'CONTENCIOSO_ADMINISTRATIVO': 'Cont. Adm.',
  'OTRO': 'Otro',
}

function FilaAbogado({
  abogado,
  puedeExpandir
}: {
  abogado: AbogadoActividad
  puedeExpandir: boolean
}) {
  const [expandido, setExpandido] = useState(false)

  const handleClick = () => {
    if (puedeExpandir) setExpandido(!expandido)
  }

  const tieneContenido = abogado.casosActivos > 0 || abogado.casosCerrados > 0

  return (
    <>
      <tr
        className={`transition ${puedeExpandir && tieneContenido ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
        onClick={() => tieneContenido && handleClick()}
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            {puedeExpandir && tieneContenido ? (
              expandido ? (
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              )
            ) : (
              <span className="w-4" />
            )}
            <div>
              <p className="font-medium text-slate-900">{abogado.nombre}</p>
              <p className="text-xs text-slate-500">{abogado.email}</p>
            </div>
          </div>
        </td>

        <td className="px-5 py-4 text-center">
          <span className="text-lg font-bold text-slate-700">{abogado.casosActivos}</span>
        </td>

        <td className="px-5 py-4 text-center">
          <span className="text-lg font-bold text-slate-800">{abogado.casosCerrados}</span>
        </td>

        <td className="px-5 py-4 text-center">
          {abogado.casosCerrados > 0 ? (
            <Badge className={`${
              abogado.tasaExito >= 75 ? 'bg-emerald-100 text-emerald-700' :
              abogado.tasaExito >= 50 ? 'bg-amber-100 text-amber-700' :
              'bg-rose-100 text-rose-700'
            }`}>
              {abogado.tasaExito}%
            </Badge>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>

        <td className="px-5 py-4 text-center">
          {abogado.valorRecuperado > 0 ? (
            <div>
              <p className="text-lg font-bold text-indigo-600">
                {formatMonto(abogado.valorRecuperado)}
              </p>
              <p className="text-xs text-slate-500">
                {abogado.porcentajeRecuperacion}% recuperado
              </p>
            </div>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>
      </tr>

      {/* Expandible: carga por tipo + fueros + perfil cierres (sin lista de casos) */}
      {expandido && puedeExpandir && (
        <tr className="bg-slate-50/50">
          <td colSpan={5} className="px-5 py-4">
            <div className="ml-8 space-y-3">

              {/* Carga activa: tipo + fueros */}
              {abogado.casosActivos > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-600 uppercase mb-2 flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      Carga por tipo de caso
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {abogado.distribucionActivos.map((d, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {TIPOS_LABEL[d.tipo] || d.tipo} ({d.cantidad})
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-600 uppercase mb-2 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Fueros donde opera
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {abogado.fuerosActivos.map((f, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {f.fuero} ({f.cantidad})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Perfil de cierres (resumen, sin lista) */}
              {abogado.casosCerrados > 0 && (
                <div className="p-3 bg-white rounded border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-600 uppercase mb-2 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    Perfil de cierres en el período
                  </h4>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-wrap gap-1.5">
                      {abogado.perfilCasos.distribucion.map((d, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {TIPOS_LABEL[d.tipo] || d.tipo} ({d.cantidad})
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 border-l border-slate-200 pl-4 whitespace-nowrap">
                      <span className="font-bold text-emerald-600">{abogado.perfilCasos.porcentajeAcuerdos}%</span> por acuerdo
                    </div>
                  </div>
                </div>
              )}

              {abogado.casosActivos === 0 && abogado.casosCerrados === 0 && (
                <p className="text-sm text-slate-400 py-2">
                  Sin casos activos ni cierres en este período.
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function TablaActividad({
  data,
  userId
}: {
  data: AbogadoActividad[]
  userId?: string
}) {
  if (data.length === 0) return null

  return (
    <Card className="mb-6 border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">
              Actividad por Abogado
            </CardTitle>
            <CardDescription>
              {userId
                ? 'Resumen del equipo — hacé click en tu fila para ver tu detalle'
                : 'Carga actual, cierres y resultados — click en una fila para ver detalle'
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <th className="px-5 py-4 text-left font-semibold">Abogado</th>
                <th className="px-5 py-4 text-center font-semibold">Activos</th>
                <th className="px-5 py-4 text-center font-semibold">Cerrados</th>
                <th className="px-5 py-4 text-center font-semibold">Tasa Éxito</th>
                <th className="px-5 py-4 text-center font-semibold">Valor Recuperado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((abogado) => (
                <FilaAbogado
                  key={abogado.id}
                  abogado={abogado}
                  puedeExpandir={!userId || abogado.id === userId}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}