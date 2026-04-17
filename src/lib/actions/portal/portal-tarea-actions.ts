'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { revalidatePath } from "next/cache"

// ============================================================================
// TIPOS
// ============================================================================

export type TareaPortal = {
  id: string
  titulo: string
  descripcion: string | null
  estado: string
  fechaVencimiento: string | null
  lugarFisico: string | null
  updatedAt: string
  caso: { numero: string; titulo: string } | null
}

// ============================================================================
// QUERIES
// ============================================================================

export async function getTareasVisiblesClienteAction(): Promise<TareaPortal[]> {
  const user = await getUserSessionServer()
  if (!user || user.rol?.toUpperCase() !== "CLIENTE") return []

  const cliente = await prisma.cliente.findFirst({
    where: { usuarioPortalId: user.id },
    select: { id: true },
  })
  if (!cliente) return []

  const tareas = await prisma.tarea.findMany({
    where: {
      clienteId: cliente.id,
      visibleCliente: true,
      estado: { notIn: ["COMPLETADA", "VENCIDA"] },
    },
    orderBy: { fechaVencimiento: "asc" },
    take: 20,
    select: {
      id: true, titulo: true, descripcion: true, estado: true,
      fechaVencimiento: true, lugarFisico: true, updatedAt: true,
      caso: { select: { numero: true, titulo: true } },
    },
  })

  return tareas.map(t => ({
    id: t.id, titulo: t.titulo, descripcion: t.descripcion, estado: t.estado,
    fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null,
    lugarFisico: t.lugarFisico, updatedAt: t.updatedAt.toISOString(),
    caso: t.caso ? { numero: t.caso.numero, titulo: t.caso.titulo } : null,
  }))
}

// ============================================================================
// NOTIFICACIONES — tareas nuevas/modificadas desde último acceso
// ============================================================================

export async function getNotificacionesPortalAction(): Promise<{
  tareas: TareaPortal[]
  totalNuevas: number
}> {
  const user = await getUserSessionServer()
  if (!user || user.rol?.toUpperCase() !== "CLIENTE") return { tareas: [], totalNuevas: 0 }

  const cliente = await prisma.cliente.findFirst({
    where: { usuarioPortalId: user.id },
    select: { id: true, ultimoAccesoPortal: true },
  })
  if (!cliente) return { tareas: [], totalNuevas: 0 }

  const ultimoAcceso = cliente.ultimoAccesoPortal

  const tareas = await prisma.tarea.findMany({
    where: {
      clienteId: cliente.id,
      visibleCliente: true,
      estado: { notIn: ["COMPLETADA", "VENCIDA"] },
      ...(ultimoAcceso ? { updatedAt: { gt: ultimoAcceso } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true, titulo: true, descripcion: true, estado: true,
      fechaVencimiento: true, lugarFisico: true, updatedAt: true,
      caso: { select: { numero: true, titulo: true } },
    },
  })

  return {
    tareas: tareas.map(t => ({
      id: t.id, titulo: t.titulo, descripcion: t.descripcion, estado: t.estado,
      fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null,
      lugarFisico: t.lugarFisico, updatedAt: t.updatedAt.toISOString(),
      caso: t.caso ? { numero: t.caso.numero, titulo: t.caso.titulo } : null,
    })),
    totalNuevas: tareas.length,
  }
}

// ============================================================================
// MARCAR COMO VISTAS
// ============================================================================

export async function marcarPortalComoVistoAction(): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user || user.rol?.toUpperCase() !== "CLIENTE") return { error: "No autorizado" }

  const cliente = await prisma.cliente.findFirst({
    where: { usuarioPortalId: user.id },
    select: { id: true },
  })
  if (!cliente) return { error: "Cliente no encontrado" }

  try {
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: { ultimoAccesoPortal: new Date() },
    })
    revalidatePath("/portal")
    return { success: true }
  } catch (error) {
    console.error("Error actualizando último acceso portal:", error)
    return { error: "Error al marcar como visto" }
  }
}