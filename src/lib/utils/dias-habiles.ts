// src/lib/utils/dias-habiles.ts
//
// Cuenta días hábiles entre dos fechas, excluyendo:
//   1. Sábados y domingos
//   2. Feriados nacionales argentinos (vía API de ArgentinaDatos, con cache 24h)
//   3. Feriados judiciales (lista hardcodeada en src/lib/feriados-judiciales.ts)
//
// IMPORTANTE: usa la MISMA fuente de feriados que el hook `useFeriados` del
// frontend (`src/hooks/useFeriados.ts`) — así el cron de mails y el calendario
// in-app comparten una sola fuente de verdad. Cuando se actualicen los feriados
// judiciales en `feriados-judiciales.ts`, ambos sistemas se actualizan.
//
// Si la API de ArgentinaDatos falla, el cron sigue funcionando con los
// feriados judiciales y los fines de semana. No es perfecto pero es robusto.

import { getFeriadosJudiciales } from "src/lib/feriados-judiciales"

const ARGENTINA_DATOS_URL = "https://api.argentinadatos.com/v1/feriados"
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

type FeriadoApi = {
  fecha: string  // formato "YYYY-MM-DD"
  tipo: string
  nombre: string
}

// Cache por proceso. En Vercel cada serverless function tiene su propia
// instancia, así que cada cron tiene su propia cache. No es problema —
// el cron corre 1 vez por día.
let cacheFeriados: Set<string> | null = null
let cacheTimestamp: number = 0

/**
 * Trae todos los feriados (nacionales + judiciales) y los devuelve como
 * Set de strings "YYYY-MM-DD" para lookup O(1).
 *
 * Estrategia:
 *   1. Siempre incluye los judiciales (no dependen de red).
 *   2. Si la API de nacionales responde OK, los suma.
 *   3. Si la API falla, devuelve solo los judiciales (degradación elegante).
 */
async function obtenerFeriados(): Promise<Set<string>> {
  const ahora = Date.now()
  if (cacheFeriados && (ahora - cacheTimestamp) < CACHE_TTL_MS) {
    return cacheFeriados
  }

  // Base inamovible: los judiciales (hardcodeados, no dependen de red)
  const feriadosSet = new Set<string>(getFeriadosJudiciales())

  const anioActual = new Date().getFullYear()
  const anios = [anioActual, anioActual + 1] // este año + el siguiente

  try {
    for (const anio of anios) {
      const res = await fetch(`${ARGENTINA_DATOS_URL}/${anio}`, {
        next: { revalidate: 86400 } // 24h en el cache de Next
      })
      if (!res.ok) continue
      const data = (await res.json()) as FeriadoApi[]
      for (const f of data) {
        feriadosSet.add(f.fecha)
      }
    }
    cacheFeriados = feriadosSet
    cacheTimestamp = ahora
  } catch (error) {
    console.error("[dias-habiles] Error trayendo feriados nacionales:", error)
    // Degradación elegante: devolvemos lo que tenemos (judiciales + lo que
    // se haya alcanzado a traer de la API antes del error). NO cacheamos
    // porque puede ser parcial.
    return feriadosSet
  }

  return feriadosSet
}

/**
 * Devuelve true si la fecha dada es día hábil (lunes-viernes, no feriado).
 */
function esDiaHabil(fecha: Date, feriadosSet: Set<string>): boolean {
  const dia = fecha.getUTCDay()
  // 0 = domingo, 6 = sábado
  if (dia === 0 || dia === 6) return false
  const iso = fecha.toISOString().split("T")[0]
  return !feriadosSet.has(iso)
}

/**
 * Cuenta días hábiles entre `desde` (no incluido) y `hasta` (incluido).
 *
 * Ejemplos:
 *   diasHabilesEntre(hoy, mañana) = 1 si mañana es hábil, 0 si no.
 *   diasHabilesEntre(hoy, hoy+7) = ~5 si no hay feriados.
 *   Si `hasta` está antes de `desde`, devuelve negativo (tarea vencida).
 *
 * Importante: si entre las dos fechas hay una feria judicial (ej: vencimiento
 * 5 de febrero contado desde 15 de enero), los días de feria NO se cuentan,
 * porque los plazos legales están suspendidos.
 */
export async function diasHabilesEntre(desde: Date, hasta: Date): Promise<number> {
  const feriadosSet = await obtenerFeriados()

  // Normalizar a inicio del día UTC para evitar problemas de timezone
  const a = new Date(Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate()))
  const b = new Date(Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate()))

  if (a.getTime() === b.getTime()) return 0

  const adelante = b.getTime() > a.getTime()
  const inicio = adelante ? a : b
  const fin = adelante ? b : a

  let contador = 0
  const cursor = new Date(inicio)
  cursor.setUTCDate(cursor.getUTCDate() + 1)

  while (cursor.getTime() <= fin.getTime()) {
    if (esDiaHabil(cursor, feriadosSet)) {
      contador++
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return adelante ? contador : -contador
}

/**
 * Helper que devuelve el umbral cruzado (20/10/5) según días hábiles
 * restantes. Misma semántica que `umbralActual` de comentario-actions.ts.
 *
 * Si la tarea está vencida (días <= 0), devuelve 5 (umbral más urgente).
 * Si todavía no cruzó ningún umbral (>20 días hábiles), devuelve null.
 */
export function umbralPorDiasHabiles(diasHabiles: number): 20 | 10 | 5 | null {
  if (diasHabiles <= 5) return 5
  if (diasHabiles <= 10) return 10
  if (diasHabiles <= 20) return 20
  return null
}