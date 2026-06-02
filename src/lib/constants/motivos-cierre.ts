// Labels legibles para los motivos de cierre.
// Fuente única de verdad — usar siempre que se muestre un motivo en UI.

export const MOTIVOS_CIERRE_LABELS: Record<string, string> = {
  FAVORABLE:                 "Sentencia Favorable",
  DESFAVORABLE:              "Sentencia Desfavorable",
  ACUERDO:                   "Acuerdo Extrajudicial",
  DESISTIMIENTO:             "Desistimiento",
  ARCHIVO:                   "Archivado",
  TRASPASADO_A_OTRO_ESTUDIO: "Traspasado a Otro Estudio",
}

// Paleta de colores asociada a cada motivo, para badges/tags en UI.
export const MOTIVOS_CIERRE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  FAVORABLE:                 { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  ACUERDO:                   { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  DESFAVORABLE:              { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  DESISTIMIENTO:             { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  ARCHIVO:                   { bg: "bg-slate-50",   text: "text-slate-700",   border: "border-slate-200" },
  TRASPASADO_A_OTRO_ESTUDIO: { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
}

const DEFAULT_COLOR = { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" }

export function getMotivoCierreLabel(motivo: string | null | undefined): string {
  if (!motivo) return "Sin especificar"
  return MOTIVOS_CIERRE_LABELS[motivo] || motivo
}

export function getMotivoCierreColors(motivo: string | null | undefined) {
  if (!motivo) return DEFAULT_COLOR
  return MOTIVOS_CIERRE_COLORS[motivo] || DEFAULT_COLOR
}

export const MOTIVOS_CIERRE_VALIDOS = Object.keys(MOTIVOS_CIERRE_LABELS)