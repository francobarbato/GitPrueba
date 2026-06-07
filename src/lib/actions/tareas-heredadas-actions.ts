// src/app/configuracion/tareas-heredadas/actions/tareas-heredadas-actions.ts

'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { revalidatePath } from "next/cache"

// ============================================================================
// LISTAR TAREAS HEREDADAS DEL ADMIN ACTUAL
// ============================================================================
// Devuelve todas las tareas activas (no completadas, no vencidas cerradas)
// donde el admin actual figura como responsable o supervisor.
// Son tareas que cayeron al admin como fallback al desactivar a un usuario.
// ============================================================================

export async function getTareasHeredadasAdmin() {
  const user = await getUserSessionServer()
  if (!user?.id || user.rol?.toUpperCase() !== 'ADMIN') {
    return { error: "No autorizado", tareas: [] }
  }

  try {
    const tareas = await prisma.tarea.findMany({
      where: {
        OR: [
          { responsableId: user.id },
          { supervisorId: user.id },
        ],
        estado: { notIn: ['COMPLETADA'] },
        vencidaCerradaEn: null,
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        tipo: true,
        categoria: true,
        prioridad: true,
        estado: true,
        fechaVencimiento: true,
        lugarFisico: true,
        responsableId: true,
        supervisorId: true,
        createdAt: true,
        caso: {
          select: { id: true, numero: true, titulo: true }
        },
        cliente: {
          select: { id: true, nombre: true, apellido: true }
        },
        creador: {
          select: { id: true, nombre: true, apellido: true }
        },
      },
      orderBy: [
        { fechaVencimiento: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return { tareas }
  } catch (e: any) {
    console.error("Error obteniendo eventos heredados:", e)
    return { error: e.message || "Error al obtener eventos heredados", tareas: [] }
  }
}

// ============================================================================
// LISTAR ABOGADOS Y ASISTENTES ACTIVOS PARA DELEGAR
// ============================================================================

export async function getUsuariosParaDelegar() {
  const user = await getUserSessionServer()
  if (!user?.id || user.rol?.toUpperCase() !== 'ADMIN') {
    return { error: "No autorizado", usuarios: [] }
  }

  try {
    const usuarios = await prisma.user.findMany({
      where: {
        isActive: true,
        rol: { in: ['ABOGADO', 'ASISTENTE'] },
      },
      select: { id: true, nombre: true, apellido: true, rol: true },
      orderBy: [
        { rol: 'asc' },
        { nombre: 'asc' },
      ],
    })

    return { usuarios }
  } catch (e: any) {
    console.error("Error obteniendo usuarios para delegar:", e)
    return { error: e.message || "Error", usuarios: [] }
  }
}

// ============================================================================
// DELEGAR UNA TAREA HEREDADA A OTRO USUARIO
// ============================================================================
// El admin transfiere la tarea a un abogado o asistente activo.
// Si el admin era responsable, el nuevo responsable lo reemplaza.
// Si el admin era supervisor, se quita la supervisión (queda sin supervisor).
// ============================================================================

export async function delegarTareaHeredadaAction(
  tareaId: string,
  nuevoResponsableId: string
): Promise<{ error?: string; success?: boolean }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }
  if (user.rol?.toUpperCase() !== 'ADMIN') {
    return { error: "Solo el administrador puede delegar eventos heredados" }
  }

  try {
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
      select: {
        id: true,
        titulo: true,
        estado: true,
        responsableId: true,
        supervisorId: true,
        vencidaCerradaEn: true,
      }
    })

    if (!tarea) return { error: "Tarea no encontrada" }

    if (tarea.estado === 'COMPLETADA' || tarea.vencidaCerradaEn) {
      return { error: "La tarea ya está cerrada y no se puede delegar" }
    }

    // Verificar que la tarea efectivamente esté asignada al admin actual
    if (tarea.responsableId !== user.id && tarea.supervisorId !== user.id) {
      return { error: "Esta tarea no está asignada a vos. Refrescá la página." }
    }

    const eraResponsable = tarea.responsableId === user.id
    const eraSupervisor = tarea.supervisorId === user.id

    // Verificar el nuevo responsable
    const nuevoResp = await prisma.user.findUnique({
      where: { id: nuevoResponsableId },
      select: { id: true, nombre: true, apellido: true, isActive: true, rol: true }
    })

    if (!nuevoResp) {
      return { error: "El usuario seleccionado no existe" }
    }
    if (!nuevoResp.isActive) {
      return { error: "El usuario seleccionado está inactivo" }
    }
    if (!['ABOGADO', 'ASISTENTE'].includes(nuevoResp.rol)) {
      return { error: "Solo se pueden delegar tareas a abogados o asistentes" }
    }
    if (nuevoResp.id === user.id) {
      return { error: "No podés delegarte la tarea a vos mismo" }
    }

    // Si era supervisor, evitar que el responsable y el supervisor sean el mismo
    if (eraSupervisor && !eraResponsable && tarea.responsableId === nuevoResp.id) {
      return { error: "El usuario seleccionado ya es el responsable de esta tarea" }
    }

    const nombreNuevo = `${nuevoResp.nombre ?? ''} ${nuevoResp.apellido ?? ''}`.trim() || nuevoResp.rol

    // Update
    const updateData: { responsableId?: string; supervisorId?: string | null } = {}
    let textoBitacora = ""

    if (eraResponsable) {
      updateData.responsableId = nuevoResponsableId
      // Si el admin era también supervisor (raro), también lo limpiamos
      if (eraSupervisor) {
        updateData.supervisorId = null
      }
      textoBitacora = `Tarea heredada delegada por el administrador. Nuevo responsable: ${nombreNuevo}`
    } else if (eraSupervisor) {
      // El admin era solo supervisor → lo reemplazamos
      updateData.supervisorId = nuevoResponsableId
      textoBitacora = `Supervisión de tarea heredada delegada por el administrador. Nuevo supervisor: ${nombreNuevo}`
    }

    await prisma.$transaction([
      prisma.tarea.update({
        where: { id: tareaId },
        data: updateData,
      }),
      prisma.bitacora.create({
        data: {
          tareaId,
          texto: textoBitacora,
          tipo: 'auto',
          accion: 'Delegación de Tarea Heredada',
          usuarioId: user.id,
        }
      })
    ])

    revalidatePath('/configuracion/tareas-heredadas')
    return { success: true }
  } catch (e: any) {
    console.error("Error delegando tarea heredada:", e)
    return { error: e.message || "Error al delegar la tarea" }
  }
}

// ============================================================================
// CIERRE FORZOSO DE TAREA HEREDADA
// ============================================================================
// El admin marca la tarea como cerrada (estado VENCIDA + vencidaCerradaEn).
// Se usa para descartar recordatorios personales del usuario que se fue.
// Queda registrada en bitácora pero no afecta análisis (es una baja administrativa).
// ============================================================================

export async function cerrarTareaHeredadaAction(
  tareaId: string
): Promise<{ error?: string; success?: boolean }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }
  if (user.rol?.toUpperCase() !== 'ADMIN') {
    return { error: "Solo el administrador puede cerrar eventos heredados" }
  }

  try {
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
      select: {
        id: true,
        titulo: true,
        estado: true,
        responsableId: true,
        supervisorId: true,
        vencidaCerradaEn: true,
      }
    })

    if (!tarea) return { error: "Tarea no encontrada" }

    if (tarea.estado === 'COMPLETADA' || tarea.vencidaCerradaEn) {
      return { error: "La tarea ya está cerrada" }
    }

    if (tarea.responsableId !== user.id && tarea.supervisorId !== user.id) {
      return { error: "Esta tarea no está asignada a vos. Refrescá la página." }
    }

    const motivo = "Cerrada por el administrador al limpiar eventos heredados (recordatorio personal del usuario desactivado)"

    await prisma.$transaction([
      prisma.tarea.update({
        where: { id: tareaId },
        data: {
          estado: 'VENCIDA',
          vencidaCerradaEn: new Date(),
          vencidaCerradaPorId: user.id,
          motivoCierreVencida: motivo,
        }
      }),
      prisma.bitacora.create({
        data: {
          tareaId,
          texto: motivo,
          tipo: 'auto',
          accion: 'Cierre Forzoso de Tarea Heredada',
          usuarioId: user.id,
        }
      })
    ])

    revalidatePath('/configuracion/tareas-heredadas')
    return { success: true }
  } catch (e: any) {
    console.error("Error cerrando tarea heredada:", e)
    return { error: e.message || "Error al cerrar la tarea" }
  }
}