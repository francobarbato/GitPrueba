// ═══════════════════════════════════════════════════════════════════════════
// Límites del cuerpo por tipo de telegrama (para el contador del formulario).
// ═══════════════════════════════════════════════════════════════════════════
//   • "Hasta 30 palabras" (Renuncia, Ausencia) → límite en PALABRAS = 30
//   • "Más de 30 palabras" (Otro, ARCA) → límite en CARACTERES, calibrado
//     empíricamente midiendo el texto real que entra en cada PDF:
//       Otro:  entran ~1651 chars → límite 1568 (con margen)
//       ARCA:  entran ~1250 chars → límite 1187 (con margen)
//
// La validación REAL la hace la action (mismos límites). Esto es la referencia
// del contador. NO lleva 'use server'.
// ═══════════════════════════════════════════════════════════════════════════

export type UnidadLimite = 'palabras' | 'caracteres'

interface LimiteCuerpo {
  unidad: UnidadLimite
  max: number
}

export const LIMITES_CUERPO: Record<string, LimiteCuerpo> = {
  // Hasta 30 palabras
  'renuncia': { unidad: 'palabras', max: 30 },
  'comunicacion-renuncia': { unidad: 'palabras', max: 30 },
  'hasta-30': { unidad: 'palabras', max: 30 },
  'ausencia': { unidad: 'palabras', max: 30 },
  'comunicacion-ausencia-23789': { unidad: 'palabras', max: 30 },

  // Más de 30 palabras (calibrado por caracteres reales)
  'mas-30': { unidad: 'caracteres', max: 1568 },
  'otro': { unidad: 'caracteres', max: 1568 },
  'otro-tipo-comunicacion-laboral': { unidad: 'caracteres', max: 1568 },
  'arca': { unidad: 'caracteres', max: 1187 },
  'comunicacion-ARCA-articulo-11': { unidad: 'caracteres', max: 1187 },
}

export function contarPalabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length
}