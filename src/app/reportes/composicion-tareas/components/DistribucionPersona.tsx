'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Scale, Users } from "lucide-react"
import type { PersonaComposicion } from "../page"

const CATEGORIA_LABELS: Record<string, string> = {
  PRESENTACION_ESCRITO: "Presentación / Escrito", AUDIENCIA: "Audiencia",
  NOTIFICACION_CEDULA: "Notificación / Cédula", CONTROL_EXPEDIENTE: "Control de Expediente",
  APELACION_RECURSO: "Apelación / Recurso", PERICIA_PRUEBA: "Pericia / Prueba",
  REUNION_CLIENTE: "Reunión con Cliente", REDACCION_DOCUMENTACION: "Redacción / Documentación",
  TRAMITE_ADMINISTRATIVO: "Trámite Administrativo", REQUERIMIENTO_CLIENTE: "Req. al Cliente",
  GESTION_FINANCIERA: "Gestión Financiera", REUNION_EQUIPO: "Reunión de Equipo",
  VENCIMIENTO_PLAZO: "Vencimiento / Plazo",
}

const UMBRAL_MUESTRA_MINIMA = 3

function porcentajesExactos2(v1: number, v2: number): [number, number] {
  const total = v1 + v2
  if (total === 0) return [0, 0]
  const exacto1 = (v1 / total) * 100
  const piso1 = Math.floor(exacto1)
  const fraccion1 = exacto1 - piso1
  if (fraccion1 >= 0.5 && piso1 < 100) return [piso1 + 1, 100 - (piso1 + 1)]
  return [piso1, 100 - piso1]
}

function TablaPersonas({ titulo, icono: Icon, iconColor, data }: {
  titulo: string; icono: any; iconColor: string; data: PersonaComposicion[]
}) {
  if (data.length === 0) return null

  return (
    <div className="mb-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2 px-4">
        <Icon className={`w-4 h-4 ${iconColor}`} />{titulo}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Profesional</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Total</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-indigo-600 uppercase tracking-wider">Procesales</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Internas</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Distribución</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría dominante</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, idx) => {
              const [pctProcesal, pctInterna] = porcentajesExactos2(p.procesales, p.internas)
              const muestraInsuficiente = p.total < UMBRAL_MUESTRA_MINIMA
              return (
                <tr key={p.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.nombre}</td>
                  <td className="px-3 py-3 text-center font-bold text-slate-800">{p.total}</td>
                  <td className="px-3 py-3 text-center text-indigo-600 font-medium">{p.procesales}</td>
                  <td className="px-3 py-3 text-center text-slate-600 font-medium">{p.internas}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-2 w-24 rounded-full overflow-hidden bg-slate-100">
                        {p.procesales > 0 && <div className="bg-indigo-500" style={{ width: `${pctProcesal}%` }} />}
                        {p.internas > 0 && <div className="bg-slate-500" style={{ width: `${pctInterna}%` }} />}
                      </div>
                      <span className="text-[10px] whitespace-nowrap">
                        <span className="text-indigo-600 font-semibold">{pctProcesal}%</span>
                        <span className="text-slate-300 mx-0.5">/</span>
                        <span className="text-slate-600 font-semibold">{pctInterna}%</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {muestraInsuficiente ? (
                      <span className="text-slate-400 italic" title={`Muestra insuficiente (<${UMBRAL_MUESTRA_MINIMA} eventos)`}>
                        —
                      </span>
                    ) : p.categoriaDominante ? (
                      <span>
                        {CATEGORIA_LABELS[p.categoriaDominante.nombre] ?? p.categoriaDominante.nombre}
                        <span className="text-slate-400 ml-1">({p.categoriaDominante.cantidad})</span>
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function DistribucionPersona({ data }: { data: PersonaComposicion[] }) {
  if (data.length === 0) return null

  const abogados = data.filter(p => p.rol === "ABOGADO")
  const asistentes = data.filter(p => p.rol === "ASISTENTE")

  return (
    <Card className="bg-white border border-slate-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Composición por profesional
        </CardTitle>
        <p className="text-xs text-slate-500">Cómo se compone el trabajo de cada miembro del equipo: tipos, volumen y categoría más frecuente.</p>
      </CardHeader>
      <CardContent className="pt-2 px-0 pb-0">
        <TablaPersonas titulo="Abogados / Socios" icono={Scale} iconColor="text-indigo-500" data={abogados} />
        <TablaPersonas titulo="Asistentes / Administrativos" icono={Users} iconColor="text-slate-500" data={asistentes} />
      </CardContent>
    </Card>
  )
}