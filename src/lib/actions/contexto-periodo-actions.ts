'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"

export type UsuarioDesactivado = {
  id: string
  nombre: string | null
  apellido: string | null
  rol: string
  fechaAprox: string  // ISO. Es aproximación: usamos updatedAt del user inactivo.
}

export type ContextoPeriodoReporte = {
  hayAlgo: boolean
  desde: string
  hasta: string
  usuariosDesactivados: UsuarioDesactivado[]
  casosTraspasados: number
  tareasCerradasPorCasoFinalizado: number
}

// ============================================================================
// Contexto del período: bajas de usuarios, traspasos y eventos cerrados
// automáticamente por finalización de caso, dentro del rango [desde, hasta].
//
// Pensado para mostrar una nota informativa arriba de los reportes que pueden
// verse afectados por esos eventos (carga de trabajo, cartera, evolución, etc.).
//
// Nota sobre "usuariosDesactivados": no tenemos un campo dedicado de fecha de
// desactivación. Aproximamos con `User.isActive=false` + `updatedAt` en rango.
// Es suficiente para una nota contextual; no se usa para cálculos críticos.
// ============================================================================

export async function getContextoPeriodoReporte(
  desde: string,
  hasta: string,
): Promise<ContextoPeriodoReporte> {
  const vacio: ContextoPeriodoReporte = {
    hayAlgo: false,
    desde,
    hasta,
    usuariosDesactivados: [],
    casosTraspasados: 0,
    tareasCerradasPorCasoFinalizado: 0,
  }

  const user = await getUserSessionServer()
  if (!user) return vacio

  const fechaDesde = new Date(desde)
  const fechaHasta = new Date(hasta)
  if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) return vacio

  try {
    const [usuariosRaw, casosTraspasados, tareasCerradasPorCasoFinalizado] = await Promise.all([
      prisma.user.findMany({
        where: {
          isActive: false,
          updatedAt: { gte: fechaDesde, lte: fechaHasta },
          rol: { in: ['ABOGADO', 'ASISTENTE'] },
        },
        select: { id: true, nombre: true, apellido: true, rol: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.caso.count({
        where: {
          esTraspasado: true,
          fechaTraspaso: { gte: fechaDesde, lte: fechaHasta },
        },
      }),
      prisma.bitacora.count({
        where: {
          accion: 'TAREA_CERRADA_POR_CASO_FINALIZADO',
          createdAt: { gte: fechaDesde, lte: fechaHasta },
        },
      }),
    ])

    const usuariosDesactivados: UsuarioDesactivado[] = usuariosRaw.map(u => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      rol: u.rol,
      fechaAprox: u.updatedAt.toISOString(),
    }))

    const hayAlgo =
      usuariosDesactivados.length > 0 ||
      casosTraspasados > 0 ||
      tareasCerradasPorCasoFinalizado > 0

    return {
      hayAlgo,
      desde,
      hasta,
      usuariosDesactivados,
      casosTraspasados,
      tareasCerradasPorCasoFinalizado,
    }
  } catch (error) {
    console.error("Error en getContextoPeriodoReporte:", error)
    return vacio
  }
}