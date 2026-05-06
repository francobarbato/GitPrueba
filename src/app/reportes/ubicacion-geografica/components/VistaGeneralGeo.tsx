'use client'

// app/reportes/ubicacion-geografica/components/VistaGeneralGeo.tsx
// Vista gerencial — no repite casos individuales
// Muestra: carga por ciudad, oportunidades de coordinación, zonas que necesitan atención

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MapPin, Users, Car, Building2,
  Navigation, AlertTriangle, ArrowRight, Handshake
} from "lucide-react"

// ============================================================================
// TIPOS
// ============================================================================

export type CasoGeneral = {
  id: string
  numero: string
  titulo: string
  estado: string
  priority: string
  abogadoId: string
  abogadoNombre: string
  distanciaKm: number
}

export type ZonaGeneral = {
  ciudad: string
  provincia: string
  distanciaKm: number
  clasificacionDistancia: {
    tipo: 'local' | 'cercano' | 'medio' | 'lejano'
    label: string
    color: string
  }
  totalCasos: number
  abogados: {
    id: string
    nombre: string
    cantidadCasos: number
    tieneAltaPrioridad: boolean
  }[]
  tieneAltaPrioridad: boolean
  requiereViaje: boolean
}

// ============================================================================
// KPIs GERENCIALES
// ============================================================================

function KPIsGenerales({ zonas }: { zonas: ZonaGeneral[] }) {
  const totalCasos = zonas.reduce((s, z) => s + z.totalCasos, 0)
  const ciudadesConVariosAbogados = zonas.filter(z => z.abogados.length > 1).length
  const ciudadesConAltaPrioridad = zonas.filter(z => z.tieneAltaPrioridad && z.requiereViaje).length
  const ciudadesConViaje = zonas.filter(z => z.requiereViaje).length

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-50 rounded">
              <MapPin className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-xs text-slate-500">Ciudades activas</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{zonas.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">{totalCasos} casos en total</p>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-indigo-50 rounded">
              <Car className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="text-xs text-slate-500">Requieren viaje</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{ciudadesConViaje}</p>
          <p className="text-xs text-slate-500 mt-0.5">fuera de Córdoba</p>
        </CardContent>
      </Card>

      <Card className={`${ciudadesConVariosAbogados > 0 ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded ${ciudadesConVariosAbogados > 0 ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              <Handshake className={`h-4 w-4 ${ciudadesConVariosAbogados > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <span className="text-xs text-slate-500">Coordinables</span>
          </div>
          <p className={`text-2xl font-bold ${ciudadesConVariosAbogados > 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
            {ciudadesConVariosAbogados}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">ciudades con +1 abogado</p>
        </CardContent>
      </Card>

      <Card className={`${ciudadesConAltaPrioridad > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded ${ciudadesConAltaPrioridad > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
              <AlertTriangle className={`h-4 w-4 ${ciudadesConAltaPrioridad > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            </div>
            <span className="text-xs text-slate-500">Necesitan atención</span>
          </div>
          <p className={`text-2xl font-bold ${ciudadesConAltaPrioridad > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {ciudadesConAltaPrioridad}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">zonas lejanas con prioridad alta</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// TABLA DE CARGA POR CIUDAD
// ============================================================================

function TablaCargaCiudades({ zonas }: { zonas: ZonaGeneral[] }) {
  const totalCasos = zonas.reduce((s, z) => s + z.totalCasos, 0)
  const sorted = [...zonas].sort((a, b) => b.totalCasos - a.totalCasos)

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          Carga por ciudad
        </CardTitle>
        <p className="text-xs text-slate-500">
          Concentración de casos del estudio por ubicación geográfica.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ciudad</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Provincia</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Casos</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">% del total</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Abogados</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Distancia</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((zona, idx) => {
              const pct = totalCasos > 0 ? Math.round((zona.totalCasos / totalCasos) * 100) : 0
              return (
                <tr
                  key={zona.ciudad + zona.provincia}
                  className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">{zona.ciudad}</td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{zona.provincia}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">{zona.totalCasos}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {zona.abogados.map(a => (
                        <span
                          key={a.id}
                          className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full"
                          title={a.nombre}
                        >
                          {a.nombre.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-xs text-slate-500">
                      <Navigation className="w-3 h-3" />
                      {zona.distanciaKm} km
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {zona.tieneAltaPrioridad && zona.requiereViaje && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200 font-medium">
                          Atención
                        </span>
                      )}
                      {zona.abogados.length > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200 font-medium">
                          Coordinable
                        </span>
                      )}
                      {!zona.tieneAltaPrioridad && zona.abogados.length <= 1 && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// PANEL DE COORDINACIÓN
// ============================================================================

function PanelCoordinacion({ zonas }: { zonas: ZonaGeneral[] }) {
  const coordinables = zonas.filter(z => z.abogados.length > 1 && z.requiereViaje)

  if (coordinables.length === 0) return null

  return (
    <Card className="bg-white border border-emerald-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Handshake className="w-5 h-5 text-emerald-600" />
          Oportunidades de coordinación
        </CardTitle>
        <p className="text-xs text-slate-500">
          Ciudades donde más de un abogado tiene expedientes activos — pueden coordinar el viaje.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {coordinables.map(zona => (
          <div
            key={zona.ciudad + zona.provincia}
            className="p-4 rounded-lg border border-emerald-100 bg-emerald-50/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">{zona.ciudad}</span>
                  <span className="text-sm text-slate-500">{zona.provincia}</span>
                  <Badge variant="outline" className={`text-xs ${zona.clasificacionDistancia.color}`}>
                    {zona.clasificacionDistancia.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {zona.abogados.map((a, i) => (
                    <div key={a.id} className="flex items-center gap-1">
                      <span className="text-sm text-slate-700 font-medium">{a.nombre}</span>
                      <span className="text-xs text-slate-400">({a.cantidadCasos} caso{a.cantidadCasos > 1 ? 's' : ''})</span>
                      {i < zona.abogados.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-slate-400 mx-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-emerald-700">{zona.totalCasos}</p>
                <p className="text-xs text-slate-500">casos totales</p>
                <p className="text-xs text-slate-400 mt-0.5">{zona.distanciaKm} km</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// PANEL DE ZONAS QUE NECESITAN ATENCIÓN
// ============================================================================

function PanelAtencion({ zonas }: { zonas: ZonaGeneral[] }) {
  const atencion = zonas.filter(z => z.tieneAltaPrioridad && z.requiereViaje)

  if (atencion.length === 0) return null

  return (
    <Card className="bg-white border border-amber-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Zonas que necesitan atención
        </CardTitle>
        <p className="text-xs text-slate-500">
          Ciudades fuera de Córdoba con casos de prioridad alta.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {atencion.sort((a, b) => b.distanciaKm - a.distanciaKm).map(zona => (
          <div
            key={zona.ciudad + zona.provincia}
            className="p-4 rounded-lg border border-amber-100 bg-amber-50/50"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{zona.ciudad}</span>
                    <span className="text-sm text-slate-500">{zona.provincia}</span>
                    <Badge variant="outline" className={`text-xs ${zona.clasificacionDistancia.color}`}>
                      {zona.clasificacionDistancia.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {zona.abogados.filter(a => a.tieneAltaPrioridad).map(a => (
                      <span key={a.id} className="text-xs text-amber-700">
                        {a.nombre} — {a.cantidadCasos} caso{a.cantidadCasos > 1 ? 's' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-amber-700">{zona.distanciaKm} km</p>
                <p className="text-xs text-slate-400">desde Córdoba</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function VistaGeneralGeo({ zonas }: { zonas: ZonaGeneral[] }) {
  if (zonas.length === 0) {
    return (
      <div className="p-12 bg-white border border-slate-200 rounded-lg text-center">
        <Users className="h-16 w-16 mx-auto text-slate-300 mb-4" />
        <p className="text-lg font-medium text-slate-600">Sin datos para la vista general</p>
        <p className="text-sm text-slate-400 mt-2">No hay expedientes activos con ubicación registrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <KPIsGenerales zonas={zonas} />
      <PanelCoordinacion zonas={zonas} />
      <PanelAtencion zonas={zonas} />
      <TablaCargaCiudades zonas={zonas} />
    </div>
  )
}