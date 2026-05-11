'use client'

// src/components/CalendarioCarga.tsx

import { useMemo } from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { es } from "date-fns/locale"
import { Loader2 } from "lucide-react"

// ============================================================================
// CALENDARIO CON TINTE DE CARGA (Escala de Violetas) + FERIADOS
// ============================================================================
// Niveles de carga:
//   0 tareas:    sin tinte (blanco)
//   1-2 tareas:  liviano (violet-50)
//   3-4 tareas:  medio (violet-200)
//   5+ tareas:   alto (violet-400, texto blanco)
//
// Feriados (nacionales + judiciales):
//   - Deshabilitados (no seleccionables)
//   - Fondo gris claro (igual que fines de semana)
//   - Borde/tinte naranja para diferenciarlos de los fines de semana
//   - Tooltip: "Feriado" o "Feriado judicial"
// ============================================================================

type Props = {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  carga: Record<string, number>
  // Set de fechas "YYYY-MM-DD" no laborables (nacionales + judiciales)
  feriadosSet?: Set<string>
  loading?: boolean
  fromDate?: Date
}

function formatDateKey(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function nivelDeCarga(cantidad: number): 0 | 1 | 2 | 3 {
  if (cantidad === 0) return 0
  if (cantidad <= 2) return 1
  if (cantidad <= 4) return 2
  return 3
}

function esFinDeSemana(d: Date): boolean {
  const dia = d.getDay()
  return dia === 0 || dia === 6
}

export function CalendarioCarga({
  selected,
  onSelect,
  carga,
  feriadosSet = new Set(),
  loading = false,
  fromDate,
}: Props) {
  const hoy = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const minDate = fromDate ?? hoy

  // Convertir feriadosSet a objetos Date para DayPicker
  const feriadosDates = useMemo(() => {
    return Array.from(feriadosSet).map(key => {
      const [y, m, d] = key.split("-").map(Number)
      return new Date(y, m - 1, d)
    })
  }, [feriadosSet])

  const modifiers = useMemo(() => {
    const liviano: Date[] = []
    const medio: Date[] = []
    const alto: Date[] = []

    for (const [key, cantidad] of Object.entries(carga)) {
      const nivel = nivelDeCarga(cantidad)
      if (nivel === 0) continue

      const [y, m, d] = key.split("-").map(Number)
      if (!y || !m || !d) continue
      const fecha = new Date(y, m - 1, d)

      // No pintar días de carga en feriados (ya están deshabilitados)
      if (feriadosSet.has(key)) continue

      if (nivel === 1) liviano.push(fecha)
      else if (nivel === 2) medio.push(fecha)
      else alto.push(fecha)
    }

    return {
      liviano,
      medio,
      alto,
      feriado: feriadosDates,
    }
  }, [carga, feriadosSet, feriadosDates])

  const renderDay = (day: Date) => {
    const key = formatDateKey(day)
    const cantidad = carga[key] ?? 0
    const esFeriado = feriadosSet.has(key)
    const finde = esFinDeSemana(day)

    let tooltip: string | undefined
    if (esFeriado) {
      tooltip = "Feriado — día no hábil"
    } else if (finde) {
      tooltip = "No es día hábil"
    } else if (cantidad === 1) {
      tooltip = "1 evento ese día"
    } else if (cantidad > 1) {
      tooltip = `${cantidad} eventos ese día`
    }

    return (
      <span
        title={tooltip}
        className="block w-full h-full flex items-center justify-center"
      >
        {day.getDate()}
      </span>
    )
  }

  return (
    <div className="relative bg-white rounded-xl border border-slate-200 p-4">
      {loading && (
        <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando agenda...
          </div>
        </div>
      )}

      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        locale={es}
        weekStartsOn={1}
        fromDate={minDate}
        disabled={[
          { dayOfWeek: [0, 6] },
          ...feriadosDates,
        ]}
        modifiers={modifiers}
        modifiersClassNames={{
          liviano: "carga-liviano",
          medio: "carga-medio",
          alto: "carga-alto",
          feriado: "dia-feriado",
        }}
        components={{
          DayContent: ({ date }) => renderDay(date),
        }}
        classNames={{
          months: "flex flex-col w-full",
          month: "space-y-3 w-full",
          caption: "flex justify-center pt-1 relative items-center mb-2",
          caption_label: "text-sm font-bold text-slate-800 capitalize",
          nav: "flex items-center gap-1",
          nav_button: "h-7 w-7 bg-transparent hover:bg-slate-100 rounded-md transition flex items-center justify-center text-slate-600",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse",
          head_row: "flex w-full",
          head_cell: "text-slate-400 flex-1 font-medium text-[11px] uppercase text-center",
          row: "flex w-full mt-1",
          cell: "flex-1 text-center text-sm relative aspect-square",
          day: "h-full w-full p-0 font-normal rounded-md hover:bg-slate-50 transition cursor-pointer text-slate-700",
          day_selected: "!bg-blue-600 !text-white hover:!bg-blue-700 font-semibold !rounded-full scale-90",
          day_today: "font-bold text-blue-600 ring-1 ring-inset ring-blue-200",
          day_outside: "text-slate-300 opacity-50",
          day_disabled: "text-slate-300 opacity-40 cursor-not-allowed hover:bg-transparent",
        }}
      />

      <style jsx global>{`
        .rdp {
          --rdp-cell-size: auto !important;
          margin: 0 !important;
          width: 100%;
        }

        /* ── Niveles de carga — escala violeta ── */
        .rdp-button.carga-liviano {
          background-color: #f5f3ff !important;
          color: #5b21b6 !important;
        }
        .rdp-button.carga-medio {
          background-color: #ddd6fe !important;
          color: #4c1d95 !important;
          font-weight: 600;
        }
        .rdp-button.carga-alto {
          background-color: #a78bfa !important;
          color: white !important;
          font-weight: 700;
        }

        /* ── Feriados — gris base + acento naranja ── */
        .rdp-button.dia-feriado {
          background-color: #f1f5f9 !important; /* slate-100, igual que fin de semana */
          color: #94a3b8 !important;             /* slate-400 */
          box-shadow: inset 0 0 0 1.5px #fb923c !important; /* orange-400: borde interior naranja */
          cursor: not-allowed !important;
        }
        /* Tooltip nativo ya aparece con title — el borde naranja es el diferenciador visual */

        /* ── Selección azul sobrepasa todo ── */
        .rdp-button.rdp-day_selected,
        .rdp-button.rdp-day_selected.carga-liviano,
        .rdp-button.rdp-day_selected.carga-medio,
        .rdp-button.rdp-day_selected.carga-alto {
          background-color: #2563eb !important;
          color: white !important;
          border-radius: 9999px !important;
          transform: scale(0.85);
          transition: all 0.2s ease;
          box-shadow: none !important;
        }

        .rdp-button.rdp-day_disabled:not(.dia-feriado) {
          background-color: #f8fafc !important;
          color: #cbd5e1 !important;
        }
      `}</style>

      {/* Leyenda */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Carga del responsable
        </p>
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border border-slate-200 bg-white" />
            <span className="text-slate-600">Sin eventos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-[#f5f3ff] border border-[#ddd6fe]" />
            <span className="text-slate-600">1–2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-[#ddd6fe]" />
            <span className="text-slate-600">3–4</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-[#a78bfa]" />
            <span className="text-slate-600">5+</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-slate-100 shadow-[inset_0_0_0_1.5px_#fb923c]" />
            <span className="text-slate-600">Feriado</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
          Solo es informativo — los colores violetas indican densidad de eventos.
          Tu selección se marcará en <strong>azul circular</strong>.
          Los días con borde naranja son feriados nacionales o judiciales.
        </p>
      </div>
    </div>
  )
}