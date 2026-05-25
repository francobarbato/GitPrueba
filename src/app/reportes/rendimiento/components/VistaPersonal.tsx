// app/reportes/rendimiento/components/VistaPersonal.tsx
// Vista Personal del abogado: todo el detalle incluida lista de casos
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, FileText, ExternalLink, User, MapPin } from "lucide-react"
import Link from "next/link"

interface DetalleCierre {
  id: string
  numero: string
  titulo: string
  tipo: string
  motivoCierre: string
  montoDisputa: number
  montoFinal: number
  fechaCierre: Date
}

interface DatosPersonales {
  nombre: string
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
  detalleCierres: DetalleCierre[]
}

const motivoConfig: Record<string, { color: string; label: string }> = {
  'Sentencia favorable': { color: 'bg-emerald-100 text-emerald-700', label: 'Favorable' },
  'Acuerdo/Conciliación': { color: 'bg-blue-100 text-blue-700', label: 'Acuerdo' },
  'Sentencia desfavorable': { color: 'bg-rose-100 text-rose-700', label: 'Desfavorable' },
  'Desistimiento': { color: 'bg-slate-100 text-slate-600', label: 'Desistimiento' },
  'Archivo': { color: 'bg-slate-100 text-slate-600', label: 'Archivo' },
}

const getMotivoBadge = (motivo: string) =>
  motivoConfig[motivo] || { color: 'bg-slate-100 text-slate-600', label: motivo }

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

export function VistaPersonal({ datos }: { datos: DatosPersonales }) {
  return (
    <div className="space-y-6">

      {/* Métricas */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <User className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                Tu Actividad — {datos.nombre}
              </CardTitle>
              <CardDescription>
                Resumen de tus casos y resultados en el período seleccionado
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 text-center">
              <p className="text-xs font-medium text-slate-500 uppercase">Activos</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{datos.casosActivos}</p>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 text-center">
              <p className="text-xs font-medium text-slate-500 uppercase">Cerrados</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{datos.casosCerrados}</p>
            </div>
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/30 text-center">
              <p className="text-xs font-medium text-slate-500 uppercase">Tasa Éxito</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {datos.casosCerrados > 0 ? `${datos.tasaExito}%` : '—'}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/30 text-center">
              <p className="text-xs font-medium text-slate-500 uppercase">Recuperado</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {datos.valorRecuperado > 0 ? formatMonto(datos.valorRecuperado) : '—'}
              </p>
              {datos.porcentajeRecuperacion > 0 && (
                <p className="text-xs text-slate-500">{datos.porcentajeRecuperacion}% de lo disputado</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carga actual: tipo + fueros */}
      {datos.casosActivos > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-slate-600" />
              <CardTitle className="text-base font-bold text-slate-800">
                Tu Carga Actual
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <p className="text-xs font-bold text-slate-600 uppercase mb-2">Por tipo de caso</p>
                <div className="flex flex-wrap gap-1.5">
                  {datos.distribucionActivos.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {TIPOS_LABEL[d.tipo] || d.tipo} ({d.cantidad})
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <p className="text-xs font-bold text-slate-600 uppercase mb-2 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Fueros donde operás
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {datos.fuerosActivos.map((f, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {f.fuero} ({f.cantidad})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Perfil de cierres */}
      {datos.casosCerrados > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-slate-600" />
              <CardTitle className="text-base font-bold text-slate-800">
                Perfil de Cierres
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Distribución por tipo</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {datos.perfilCasos.distribucion.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {TIPOS_LABEL[d.tipo] || d.tipo} ({d.cantidad})
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <p className="text-xs text-slate-500">Resolución por acuerdo</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">
                  {datos.perfilCasos.porcentajeAcuerdos}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de casos cerrados */}
      {datos.detalleCierres.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-600" />
                <CardTitle className="text-base font-bold text-slate-800">
                  Casos Cerrados en el Período
                </CardTitle>
              </div>
              <Badge variant="outline">{datos.detalleCierres.length} casos</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-1.5">
              {datos.detalleCierres.map(caso => {
                const motivo = getMotivoBadge(caso.motivoCierre)
                return (
                  <Link
                    key={caso.id}
                    href={`/casos/${caso.id}`}
                    className="flex items-center justify-between p-3 rounded-md border border-slate-200 hover:border-slate-300 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-600">{caso.numero}</span>
                        <Badge className={`text-[10px] ${motivo.color}`}>{motivo.label}</Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {TIPOS_LABEL[caso.tipo] || caso.tipo}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 mt-0.5">{caso.titulo}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      {caso.montoFinal > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-700">
                            {formatMonto(caso.montoFinal)}
                          </p>
                          {caso.montoDisputa > 0 && (
                            <p className="text-[10px] text-slate-400">
                              de {formatMonto(caso.montoDisputa)}
                            </p>
                          )}
                        </div>
                      )}
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}