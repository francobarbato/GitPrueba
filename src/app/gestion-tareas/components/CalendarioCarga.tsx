'use client'

import { useMemo } from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { es } from "date-fns/locale"
import { Loader2 } from "lucide-react"

// ============================================================================
// CALENDARIO CON TINTE DE CARGA
// ============================================================================
// Niveles:
//   0 tareas:    sin tinte
//   1-2 tareas:  liviano (slate-200)
//   3-4 tareas:  medio (slate-400, texto blanco)
//   5+ tareas:   alto (slate-600, texto blanco)
//
// Sábados y domingos están deshabilitados (no son días hábiles judiciales).
// ============================================================================

type Props = {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  carga: Record<string, number>
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

// Helper: ¿es fin de semana? (sábado=6, domingo=0 según getDay())
function esFinDeSemana(d: Date): boolean {
  const dia = d.getDay()
  return dia === 0 || dia === 6
}

export function CalendarioCarga({ selected, onSelect, carga, loading = false, fromDate }: Props) {
  const hoy = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const minDate = fromDate ?? hoy

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

      if (nivel === 1) liviano.push(fecha)
      else if (nivel === 2) medio.push(fecha)
      else alto.push(fecha)
    }

    return { liviano, medio, alto }
  }, [carga])

  const renderDay = (day: Date) => {
    const key = formatDateKey(day)
    const cantidad = carga[key] ?? 0
    const finde = esFinDeSemana(day)
    const tooltip = finde
      ? "No es día hábil"
      : cantidad === 0
        ? undefined
        : cantidad === 1 ? "1 evento ese día" : `${cantidad} eventos ese día`
    return (
      <span title={tooltip} className="block w-full h-full flex items-center justify-center">
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
        // Deshabilitamos fines de semana. react-day-picker acepta una función predicado.
        // Días deshabilitados no son seleccionables y reciben la clase day_disabled.
        disabled={[
          { dayOfWeek: [0, 6] }, // 0 = domingo, 6 = sábado
        ]}
        modifiers={modifiers}
        modifiersClassNames={{
          liviano: "carga-liviano",
          medio: "carga-medio",
          alto: "carga-alto",
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
          day: "h-full w-full p-0 font-normal rounded-md hover:bg-slate-100 transition cursor-pointer text-slate-700",
          day_selected: "!bg-blue-600 !text-white hover:!bg-blue-700 font-semibold",
          day_today: "font-bold text-blue-600",
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
        .rdp-months {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .rdp-month {
          width: 100%;
        }
        .rdp-table {
          width: 100% !important;
          max-width: none !important;
        }
        .rdp-tbody, .rdp-head, .rdp-row, .rdp-head_row {
          width: 100%;
        }
        .rdp-button.carga-liviano {
          background-color: rgb(226 232 240) !important;
          color: rgb(51 65 85) !important;
        }
        .rdp-button.carga-liviano:hover {
          background-color: rgb(203 213 225) !important;
        }
        .rdp-button.carga-medio {
          background-color: rgb(148 163 184) !important;
          color: white !important;
          font-weight: 600;
        }
        .rdp-button.carga-medio:hover {
          background-color: rgb(100 116 139) !important;
        }
        .rdp-button.carga-alto {
          background-color: rgb(71 85 105) !important;
          color: white !important;
          font-weight: 700;
        }
        .rdp-button.carga-alto:hover {
          background-color: rgb(51 65 85) !important;
        }
        /* Días deshabilitados (fines de semana) — más apagados visualmente */
        .rdp-button.rdp-day_disabled,
        .rdp-button.rdp-day_disabled:hover {
          background-color: rgb(248 250 252) !important; /* slate-50 — distingue de días vacíos */
          color: rgb(203 213 225) !important; /* slate-300 — texto muy claro */
          cursor: not-allowed !important;
          font-weight: 400;
        }
        .rdp-button.rdp-day_selected,
        .rdp-button.rdp-day_selected.carga-liviano,
        .rdp-button.rdp-day_selected.carga-medio,
        .rdp-button.rdp-day_selected.carga-alto {
          background-color: rgb(37 99 235) !important;
          color: white !important;
        }
      `}</style>

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
            <div className="w-4 h-4 rounded bg-slate-200" />
            <span className="text-slate-600">1-2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-slate-400" />
            <span className="text-slate-600">3-4</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-slate-600" />
            <span className="text-slate-600">5+</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
          Solo es informativo — podés elegir cualquier día hábil. Sábados y domingos no son seleccionables.
        </p>
      </div>
    </div>
  )
}