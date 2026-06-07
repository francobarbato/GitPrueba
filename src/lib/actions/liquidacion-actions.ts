'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { revalidatePath } from "next/cache"
import { TipoLiquidacion } from "@prisma/client"
import { TIPO_LIQUIDACION_LABELS, labelOrFallback } from "src/lib/utils/labels"

// ============================================================================
// TIPOS
// ============================================================================

export type LiquidacionConRelaciones = {
  id: string
  tipo: TipoLiquidacion
  montoTotal: string                      // Decimal → string para no perder precisión en el cliente
  detalle: any                            // snapshot del cálculo (Json)
  descripcion: string | null
  casoId: string | null
  caso: { id: string; numero: string; titulo: string } | null
  creadoPorId: string
  creadoPor: { id: string; nombre: string | null; apellido: string | null }
  createdAt: string
  updatedAt: string
  eliminadoEn: string | null
}

export type LiquidacionResumen = {
  id: string
  tipo: TipoLiquidacion
  montoTotal: string
  descripcion: string | null
  casoNumero: string | null
  creadoPorNombre: string
  createdAt: string
}

// ============================================================================
// HELPERS
// ============================================================================

const includeRelaciones = {
  caso: { select: { id: true, numero: true, titulo: true } },
  creadoPor: { select: { id: true, nombre: true, apellido: true } },
}

function mapearLiquidacion(l: any): LiquidacionConRelaciones {
  return {
    id: l.id,
    tipo: l.tipo,
    montoTotal: l.montoTotal.toString(),
    detalle: l.detalle,
    descripcion: l.descripcion,
    casoId: l.casoId,
    caso: l.caso ? { id: l.caso.id, numero: l.caso.numero, titulo: l.caso.titulo } : null,
    creadoPorId: l.creadoPorId,
    creadoPor: { id: l.creadoPor.id, nombre: l.creadoPor.nombre, apellido: l.creadoPor.apellido },
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    eliminadoEn: l.eliminadoEn?.toISOString() ?? null,
  }
}

// Filtro estándar: solo no eliminadas. Siempre incluirlo en queries.
const noEliminadas = { eliminadoEn: null }

// Helper para formatear el Decimal de Prisma como string con separador
// argentino. Convertimos a Number primero porque el toLocaleString() de
// Object.prototype no acepta argumentos y rompe la compilación de TS.
function formatearMonto(monto: any): string {
  return Number(monto.toString()).toLocaleString("es-AR")
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Lista las liquidaciones del usuario (las que creó). Excluye eliminadas.
 * Para listas personales (mis cálculos).
 */
export async function getLiquidacionesDelUsuario(): Promise<LiquidacionConRelaciones[]> {
  const user = await getUserSessionServer()
  if (!user) return []

  const liquidaciones = await prisma.liquidacion.findMany({
    where: { ...noEliminadas, creadoPorId: user.id },
    include: includeRelaciones,
    orderBy: { createdAt: "desc" },
  })

  return liquidaciones.map(mapearLiquidacion)
}

/**
 * Liquidaciones de un caso específico (para mostrar en la pestaña Documentación
 * del expediente). Excluye eliminadas.
 */
export async function getLiquidacionesDeCaso(casoId: string): Promise<LiquidacionConRelaciones[]> {
  const user = await getUserSessionServer()
  if (!user) return []

  // Verificar acceso al caso (mismo criterio que en tareas)
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    select: { abogadoId: true },
  })
  if (!caso) return []

  const tieneAcceso = caso.abogadoId === user.id || user.rol === "ASISTENTE" || user.rol === "ADMIN"
  if (!tieneAcceso) return []

  const liquidaciones = await prisma.liquidacion.findMany({
    where: { ...noEliminadas, casoId },
    include: includeRelaciones,
    orderBy: { createdAt: "desc" },
  })

  return liquidaciones.map(mapearLiquidacion)
}

/**
 * Detalle de una liquidación. Para abrir el modal de visualización o el PDF.
 */
export async function getLiquidacionDetalle(liquidacionId: string): Promise<LiquidacionConRelaciones | null> {
  const user = await getUserSessionServer()
  if (!user) return null

  const liquidacion = await prisma.liquidacion.findUnique({
    where: { id: liquidacionId },
    include: includeRelaciones,
  })

  if (!liquidacion || liquidacion.eliminadoEn) return null

  // Acceso: el creador, o asistente, o el abogado del caso vinculado
  let tieneAcceso = liquidacion.creadoPorId === user.id || user.rol === "ASISTENTE"
  if (!tieneAcceso && liquidacion.casoId) {
    const caso = await prisma.caso.findUnique({
      where: { id: liquidacion.casoId },
      select: { abogadoId: true },
    })
    if (caso?.abogadoId === user.id) tieneAcceso = true
  }
  if (!tieneAcceso) return null

  return mapearLiquidacion(liquidacion)
}

/**
 * Casos disponibles para vincular una liquidación (el diálogo de "Guardar").
 * Reutiliza el criterio de tareas: solo casos activos del abogado (o todos para asistentes).
 */
export async function getCasosDisponiblesParaLiquidacion() {
  const user = await getUserSessionServer()
  if (!user) return []
  const where = user.rol === "ABOGADO"
    ? { abogadoId: user.id, estaCerrado: false }
    : { estaCerrado: false }
  return prisma.caso.findMany({
    where,
    select: { id: true, numero: true, titulo: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  })
}

// ============================================================================
// GUARDAR LIQUIDACIÓN
// ============================================================================

export async function guardarLiquidacionAction(data: {
  tipo: TipoLiquidacion
  montoTotal: number
  detalle: any                            // snapshot completo del cálculo
  descripcion?: string
  casoId?: string                         // opcional: cálculo suelto o vinculado
}): Promise<{ success?: boolean; error?: string; liquidacionId?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  const esAbogado = user.rol === "ABOGADO"
  const esAsistente = user.rol === "ASISTENTE"
  if (!esAbogado && !esAsistente) return { error: "Sin permisos para guardar cálculos" }

  if (!data.tipo) return { error: "El tipo de cálculo es obligatorio" }
  if (!data.montoTotal || data.montoTotal <= 0) return { error: "El monto total debe ser mayor a cero" }
  if (!data.detalle) return { error: "Falta el detalle del cálculo" }

  // Si se vincula a un caso, verificar que existe, no esté cerrado, y que el usuario tenga acceso
  if (data.casoId) {
    const caso = await prisma.caso.findUnique({
      where: { id: data.casoId },
      select: { abogadoId: true, estaCerrado: true, numero: true },
    })
    if (!caso) return { error: "El expediente seleccionado no existe" }
    if (caso.estaCerrado) return { error: "No se puede vincular a un expediente cerrado" }

    const esAbogadoDelCaso = caso.abogadoId === user.id
    if (!esAbogadoDelCaso && !esAsistente) {
      return { error: "Sin permisos sobre este expediente" }
    }
  }

  try {
    const tipoLabel = labelOrFallback(data.tipo, TIPO_LIQUIDACION_LABELS)
    const liquidacion = await prisma.liquidacion.create({
      data: {
        tipo: data.tipo,
        montoTotal: data.montoTotal,
        detalle: data.detalle,
        descripcion: data.descripcion?.trim() || null,
        casoId: data.casoId || null,
        creadoPorId: user.id,
      },
    })

    await prisma.bitacora.create({
      data: {
        texto: data.casoId
          ? `Cálculo de ${tipoLabel} guardado en el expediente`
          : `Cálculo de ${tipoLabel} guardado (sin vincular)`,
        tipo: "auto",
        accion: "LIQUIDACION_CREADA",
        usuarioId: user.id,
        casoId: data.casoId || null,
        liquidacionId: liquidacion.id,
        detalle: `Tipo: ${tipoLabel} | Monto: $${data.montoTotal.toLocaleString("es-AR")}${data.descripcion ? ` | "${data.descripcion}"` : ""}`,
      },
    })

    revalidatePath("/calculos-indemnizacion")
    if (data.casoId) revalidatePath(`/casos/${data.casoId}`)
    revalidatePath("/reportes/cuantia-liquidaciones")
    return { success: true, liquidacionId: liquidacion.id }
  } catch (error) {
    console.error("Error guardando liquidación:", error)
    return { error: "Error al guardar el cálculo" }
  }
}

// ============================================================================
// EDITAR LIQUIDACIÓN
// ============================================================================
// Solo se permiten editar campos "blandos": descripción y vínculo al caso.
// El detalle/monto NO se edita: si el abogado quiere cambiar parámetros,
// debe recalcular y guardar una nueva versión (mantiene la inmutabilidad).
// ============================================================================

export async function editarLiquidacionAction(
  liquidacionId: string,
  data: {
    descripcion?: string | null
    casoId?: string | null
  },
): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  try {
    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id: liquidacionId },
      select: {
        creadoPorId: true,
        casoId: true,
        tipo: true,
        eliminadoEn: true,
      },
    })
    if (!liquidacion) return { error: "Cálculo no encontrado" }
    if (liquidacion.eliminadoEn) return { error: "El cálculo está eliminado" }

    const esCreador = liquidacion.creadoPorId === user.id
    if (!esCreador && user.rol !== "ASISTENTE") return { error: "Solo el creador puede editar el cálculo" }

    // Si cambia el casoId, validar el nuevo
    if (data.casoId !== undefined && data.casoId !== null && data.casoId !== liquidacion.casoId) {
      const nuevoCaso = await prisma.caso.findUnique({
        where: { id: data.casoId },
        select: { abogadoId: true, estaCerrado: true },
      })
      if (!nuevoCaso) return { error: "El expediente seleccionado no existe" }
      if (nuevoCaso.estaCerrado) return { error: "No se puede vincular a un expediente cerrado" }
      const esAbogadoDelCaso = nuevoCaso.abogadoId === user.id
      if (!esAbogadoDelCaso && user.rol !== "ASISTENTE") return { error: "Sin permisos sobre el expediente destino" }
    }

    const updateData: any = {}
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion?.trim() || null
    if (data.casoId !== undefined) updateData.casoId = data.casoId

    await prisma.liquidacion.update({ where: { id: liquidacionId }, data: updateData })

    const cambios: string[] = []
    if (data.descripcion !== undefined) cambios.push("descripción")
    if (data.casoId !== undefined && data.casoId !== liquidacion.casoId) cambios.push("vínculo a expediente")

    const tipoLabel = labelOrFallback(liquidacion.tipo, TIPO_LIQUIDACION_LABELS)
    await prisma.bitacora.create({
      data: {
        texto: `Cálculo de ${tipoLabel} editado`,
        tipo: "auto",
        accion: "LIQUIDACION_EDITADA",
        usuarioId: user.id,
        casoId: data.casoId ?? liquidacion.casoId ?? null,
        liquidacionId: liquidacionId,
        detalle: cambios.length > 0 ? `Cambios: ${cambios.join(", ")}` : null,
      },
    })

    revalidatePath("/calculos-indemnizacion")
    if (liquidacion.casoId) revalidatePath(`/casos/${liquidacion.casoId}`)
    if (data.casoId && data.casoId !== liquidacion.casoId) revalidatePath(`/casos/${data.casoId}`)
    revalidatePath("/reportes/cuantia-liquidaciones")
    return { success: true }
  } catch (error) {
    console.error("Error editando liquidación:", error)
    return { error: "Error al editar el cálculo" }
  }
}

// ============================================================================
// ELIMINAR LIQUIDACIÓN (SOFT DELETE)
// ============================================================================
// NO borra físicamente. Setea eliminadoEn + eliminadoPorId.
// El registro deja de aparecer en queries (todas filtran por noEliminadas).
// Queda trazabilidad completa: quién la creó, quién la borró, cuándo.
// Como es soft delete, el liquidacionId de la bitácora sigue siendo válido
// y el reporte puede mostrar la info de la liquidación aunque esté "borrada".
// ============================================================================

export async function eliminarLiquidacionAction(
  liquidacionId: string,
  motivo?: string,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  try {
    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id: liquidacionId },
      select: { creadoPorId: true, casoId: true, tipo: true, montoTotal: true, descripcion: true, eliminadoEn: true },
    })
    if (!liquidacion) return { error: "Cálculo no encontrado" }
    if (liquidacion.eliminadoEn) return { error: "El cálculo ya fue eliminado" }

    const esCreador = liquidacion.creadoPorId === user.id
    if (!esCreador && user.rol !== "ASISTENTE") return { error: "Solo el creador puede eliminar el cálculo" }

    await prisma.liquidacion.update({
      where: { id: liquidacionId },
      data: {
        eliminadoEn: new Date(),
        eliminadoPorId: user.id,
      },
    })

    const tipoLabel = labelOrFallback(liquidacion.tipo, TIPO_LIQUIDACION_LABELS)
    const montoFmt = formatearMonto(liquidacion.montoTotal)
    await prisma.bitacora.create({
      data: {
        texto: `Cálculo de ${tipoLabel} eliminado`,
        tipo: "auto",
        accion: "LIQUIDACION_ELIMINADA",
        usuarioId: user.id,
        casoId: liquidacion.casoId || null,
        liquidacionId: liquidacionId,
        detalle: motivo?.trim()
          ? `Monto: $${montoFmt} | Motivo: ${motivo.trim()}`
          : `Monto: $${montoFmt}`,
      },
    })

    revalidatePath("/calculos-indemnizacion")
    if (liquidacion.casoId) revalidatePath(`/casos/${liquidacion.casoId}`)
    revalidatePath("/reportes/cuantia-liquidaciones")
    return { success: true }
  } catch (error) {
    console.error("Error eliminando liquidación:", error)
    return { error: "Error al eliminar el cálculo" }
  }
}