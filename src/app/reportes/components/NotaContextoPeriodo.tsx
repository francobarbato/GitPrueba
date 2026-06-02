'use client'

import { useEffect, useState } from "react"
import { Info } from "lucide-react"
import {
  getContextoPeriodoReporte,
  type ContextoPeriodoReporte,
} from "src/lib/actions/contexto-periodo-actions"

type Props = {
  desde: string         // ISO string (ej: new Date().toISOString())
  hasta: string         // ISO string
  rangoLabel?: string   // texto que va entre paréntesis. ej: "últimos 90 días"
}

// ============================================================================
// Nota sutil al pie/arriba de un reporte que explica posibles distorsiones
// debidas a bajas de usuarios, traspasos de casos o eventos cerrados
// automáticamente por finalización de caso en el período dado.
//
// Si no hay nada que reportar, NO renderiza (devuelve null).
// ============================================================================

export function NotaContextoPeriodo({ desde, hasta, rangoLabel }: Props) {
  const [data, setData] = useState<ContextoPeriodoReporte | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    getContextoPeriodoReporte(desde, hasta)
      .then(r => { if (!cancelado) setData(r) })
      .catch(err => {
        console.error("Error cargando contexto del período:", err)
        if (!cancelado) setData(null)
      })
      .finally(() => { if (!cancelado) setLoading(false) })
    return () => { cancelado = true }
  }, [desde, hasta])

  if (loading) return null
  if (!data || !data.hayAlgo) return null

  const formatRol = (rol: string) =>
    rol === 'ABOGADO'   ? 'abogado'   :
    rol === 'ASISTENTE' ? 'asistente' :
    rol.toLowerCase()

  return (
    <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
      <div className="flex gap-2">
        <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-600 leading-relaxed flex-1">
          <p className="font-semibold text-slate-700">
            Contexto del período{rangoLabel ? ` (${rangoLabel})` : ""}
          </p>
          <ul className="mt-1 space-y-0.5">
            {data.usuariosDesactivados.length > 0 && (
              <li>
                {data.usuariosDesactivados.length === 1 ? "Se dio de baja a " : "Se dieron de baja a "}
                {data.usuariosDesactivados.map((u, i) => {
                  const nombreCompleto = `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim() || "Usuario sin nombre"
                  return (
                    <span key={u.id}>
                      <span className="font-medium text-slate-700">{nombreCompleto}</span>
                      <span className="text-slate-500"> ({formatRol(u.rol)})</span>
                      {i < data.usuariosDesactivados.length - 1 && ", "}
                    </span>
                  )
                })}
                .
              </li>
            )}
            {data.casosTraspasados > 0 && (
              <li>
                {data.casosTraspasados === 1
                  ? "1 expediente fue traspasado a otro estudio."
                  : `${data.casosTraspasados} expedientes fueron traspasados a otros estudios.`}
              </li>
            )}
            {data.tareasCerradasPorCasoFinalizado > 0 && (
              <li>
                {data.tareasCerradasPorCasoFinalizado === 1
                  ? "1 evento se cerró automáticamente por finalización del expediente asociado."
                  : `${data.tareasCerradasPorCasoFinalizado} eventos se cerraron automáticamente por finalización del expediente asociado.`}
              </li>
            )}
          </ul>
          <p className="mt-1.5 text-slate-500 italic">
            Algunos números a continuación pueden reflejar estos cambios.
          </p>
        </div>
      </div>
    </div>
  )
}