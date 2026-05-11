// src/lib/feriados-judiciales.ts
//
// Feriados y asuetos judiciales del Poder Judicial de Córdoba.
// Actualizar manualmente cuando el Tribunal Superior los publique.
// Formato: "YYYY-MM-DD"
//
// Fuente oficial: https://www.justiciacordoba.gob.ar/

export const FERIADOS_JUDICIALES_2026: string[] = [
  // Ejemplos — reemplazar con los publicados oficialmente:
  // "2026-01-02", // Asueto judicial — feria de enero
  // "2026-07-17", // Asueto judicial — feria de julio
]

export const FERIADOS_JUDICIALES_2025: string[] = [
  // "2025-01-02",
  // "2025-01-03",
]

// Unificados por si el formulario abarca fin/inicio de año
export function getFeriadosJudiciales(): string[] {
  return [
    ...FERIADOS_JUDICIALES_2025,
    ...FERIADOS_JUDICIALES_2026,
  ]
}