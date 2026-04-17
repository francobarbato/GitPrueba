'use client'

// src/app/portal/components/CasosToggle.tsx

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight, Inbox, CheckCircle2 } from 'lucide-react'
import { format } from "date-fns"
import { es } from "date-fns/locale"

type CasoActivo = {
  id: string; numero: string; titulo: string
  tipo: string; estado: string; fechaInicio: Date
}
type CasoCerrado = {
  id: string; numero: string; titulo: string
  tipo: string; estado: string; fechaCierre: Date | null; motivoCierre: string | null
}

const MOTIVO_CONFIG: Record<string, { label: string; color: string }> = {
  FAVORABLE:     { label: "Sentencia Favorable",   color: "bg-green-100 text-green-700 border-green-200"  },
  DESFAVORABLE:  { label: "Sentencia Desfavorable", color: "bg-red-100 text-red-700 border-red-200"       },
  ACUERDO:       { label: "Acuerdo",                color: "bg-blue-100 text-blue-700 border-blue-200"    },
  DESISTIMIENTO: { label: "Desistimiento",          color: "bg-orange-100 text-orange-700 border-orange-200" },
  ARCHIVO:       { label: "Archivado",              color: "bg-slate-100 text-slate-600 border-slate-200" },
}

export function CasosToggle({ casosActivos, casosCerrados }: {
  casosActivos: CasoActivo[]
  casosCerrados: CasoCerrado[]
}) {
  const [vista, setVista] = useState<"activos" | "cerrados">("activos")

  return (
    <>
      {/* Toggle */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button onClick={() => setVista("activos")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            vista === "activos" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}>
          Activos
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
            {casosActivos.length}
          </span>
        </button>
        <button onClick={() => setVista("cerrados")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            vista === "cerrados" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}>
          Finalizados
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
            {casosCerrados.length}
          </span>
        </button>
      </div>

      {/* Activos */}
      {vista === "activos" && (
        <>
          {casosActivos.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
              <Inbox className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No tiene casos activos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {casosActivos.map(caso => (
                <Link key={caso.id} href={`/portal/casos/${caso.id}`}>
                  <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-mono text-slate-500 font-medium">{caso.numero}</span>
                          <Badge variant="outline" className="text-xs">{caso.tipo}</Badge>
                        </div>
                        <p className="font-semibold text-slate-900 mb-1">{caso.titulo}</p>
                        <p className="text-sm text-slate-500">
                          Etapa actual: <span className="font-medium text-slate-700">{caso.estado}</span>
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 mt-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Cerrados */}
      {vista === "cerrados" && (
        <>
          {casosCerrados.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
              <CheckCircle2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No tiene casos finalizados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {casosCerrados.map(caso => {
                const motivoCfg = caso.motivoCierre ? MOTIVO_CONFIG[caso.motivoCierre] : null
                return (
                  <div key={caso.id} className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-mono text-slate-500 font-medium">{caso.numero}</span>
                          <Badge variant="outline" className="text-xs">{caso.tipo}</Badge>
                          {motivoCfg && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${motivoCfg.color}`}>
                              {motivoCfg.label}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-slate-900">{caso.titulo}</p>
                        {caso.fechaCierre && (
                          <p className="text-sm text-slate-500 mt-1">
                            Cerrado el {format(new Date(caso.fechaCierre), "d 'de' MMMM yyyy", { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </>
  )
}