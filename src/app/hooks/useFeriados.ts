// src/hooks/useFeriados.ts
//
// Combina feriados nacionales (API nolaborables.com.ar) con
// feriados judiciales hardcodeados en feriados-judiciales.ts
//
// Devuelve:
//   feriadosSet   → Set<string> con todas las fechas "YYYY-MM-DD" no laborables
//   loading       → true mientras fetchea
//   error         → string | null si algo falló (usa solo judiciales como fallback)

import { useState, useEffect, useCallback } from "react"
import { getFeriadosJudiciales } from "../../lib/feriados-judiciales"

type FeriadoAPI = {
  fecha: string  // "YYYY-MM-DD" directo
  nombre: string
  tipo: string
}

function formatKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

async function fetchFeriadosAnio(year: number): Promise<string[]> {
  const res = await fetch(
    `https://api.argentinadatos.com/v1/feriados/${year}`
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: FeriadoAPI[] = await res.json()
  return data.map(f => f.fecha)
}

export function useFeriados(years?: number[]) {
  const aniosAFetchear = years ?? [new Date().getFullYear()]

  const [feriadosSet, setFeriadosSet] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)

    const judiciales = getFeriadosJudiciales()

    try {
      const resultados = await Promise.all(aniosAFetchear.map(fetchFeriadosAnio))
      const nacionales = resultados.flat()
      setFeriadosSet(new Set([...nacionales, ...judiciales]))
    } catch (err) {
      console.warn("[useFeriados] No se pudo cargar la API. Usando solo judiciales.", err)
      setError("No se pudieron cargar los feriados nacionales. Se usan solo los judiciales registrados.")
      setFeriadosSet(new Set(judiciales))
    } finally {
      setLoading(false)
    }
  }, [aniosAFetchear.join(",")])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { feriadosSet, loading, error }
}