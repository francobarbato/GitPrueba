'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"

// ============================================================================
// CARGA DEL RESPONSABLE POR DÍA
// ============================================================================
// Devuelve un mapa { "YYYY-MM-DD": cantidadDeTareas } para los próximos N días
// del usuario indicado. Solo cuenta tareas activas (PENDIENTE/EN_PROCESO/BLOQUEADA)
// con fechaVencimiento en el rango. Útil para colorear el calendario al crear
// un evento y darle al responsable visibilidad de cuán cargada está su agenda.
//
// Notas:
//  - El filtro por usuario es server-side. No exponemos data de otros responsables.
//  - El rango es desde HOY (00:00 hora local del server) hasta HOY + diasAdelante.
//  - La key del mapa es la fecha local del vencimiento en formato YYYY-MM-DD,
//    NO el ISO. Esto evita que tareas que vencen "el día 30 a las 23:59" caigan
//    al "día 31" por timezone.
// ============================================================================

const DIAS_RANGO_DEFAULT = 180

export async function getCargaResponsableAction(
  userId: string,
  diasAdelante: number = DIAS_RANGO_DEFAULT
): Promise<{ carga: Record<string, number>; error?: string }> {
  const session = await getUserSessionServer()
  if (!session?.id) return { carga: {}, error: "No autorizado" }

  // Validación básica de input
  if (!userId) return { carga: {}, error: "userId requerido" }
  if (diasAdelante < 1 || diasAdelante > 365) diasAdelante = DIAS_RANGO_DEFAULT

  try {
    const ahora = new Date()
    const desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0)
    const hasta = new Date(desde.getTime() + diasAdelante * 24 * 60 * 60 * 1000)

    const tareas = await prisma.tarea.findMany({
      where: {
        responsableId: userId,
        estado: { in: ["PENDIENTE", "EN_PROCESO", "BLOQUEADA"] },
        fechaVencimiento: {
          gte: desde,
          lte: hasta,
        },
      },
      select: { fechaVencimiento: true },
    })

    // Agrupar por día local. Usamos ISO date para la key (YYYY-MM-DD)
    // basado en hora local, no UTC.
    const carga: Record<string, number> = {}
    for (const t of tareas) {
      if (!t.fechaVencimiento) continue
      const f = t.fechaVencimiento
      const yyyy = f.getFullYear()
      const mm = String(f.getMonth() + 1).padStart(2, "0")
      const dd = String(f.getDate()).padStart(2, "0")
      const key = `${yyyy}-${mm}-${dd}`
      carga[key] = (carga[key] ?? 0) + 1
    }

    return { carga }
  } catch (err) {
    console.error("Error obteniendo carga del responsable:", err)
    return { carga: {}, error: "Error al obtener la carga" }
  }
}