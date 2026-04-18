'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { revalidatePath } from "next/cache"

// ============================================================================
// TIPOS
// ============================================================================

export type ComentarioConAutor = {
  id: string
  texto: string
  tareaId: string
  autorId: string
  createdAt: string
  autor: {
    id: string
    nombre: string | null
    apellido: string | null
  }
  citaComentario: {
    id: string
    texto: string
    autor: { nombre: string | null; apellido: string | null }
  } | null
}

export type BurbujaTareaComentarios = {
  tareaId: string
  tituloTarea: string
  tipoTarea: "PROCESAL" | "INTERNA"
  cantidadNuevos: number
  ultimoComentario: {
    id: string
    textoPreview: string
    autor: { nombre: string | null; apellido: string | null }
    createdAt: string
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Valida que el usuario tenga acceso a los comentarios de una tarea.
 * Solo responsable y supervisor pueden leer/escribir comentarios.
 */
async function puedeAccederComentarios(tareaId: string, userId: string): Promise<boolean> {
  const tarea = await prisma.tarea.findUnique({
    where: { id: tareaId },
    select: { responsableId: true, supervisorId: true },
  })
  if (!tarea) return false
  return tarea.responsableId === userId || tarea.supervisorId === userId
}

// ============================================================================
// OBTENER COMENTARIOS DE UNA TAREA
// ============================================================================

export async function getComentariosTarea(tareaId: string): Promise<ComentarioConAutor[]> {
  const user = await getUserSessionServer()
  if (!user?.id) return []

  const tieneAcceso = await puedeAccederComentarios(tareaId, user.id)
  if (!tieneAcceso) return []

  const comentarios = await prisma.comentarioTarea.findMany({
    where: { tareaId },
    include: {
      autor: { select: { id: true, nombre: true, apellido: true } },
      citaComentario: {
        select: {
          id: true,
          texto: true,
          autor: { select: { nombre: true, apellido: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return comentarios.map(c => ({
    id: c.id,
    texto: c.texto,
    tareaId: c.tareaId,
    autorId: c.autorId,
    createdAt: c.createdAt.toISOString(),
    autor: {
      id: c.autor.id,
      nombre: c.autor.nombre,
      apellido: c.autor.apellido,
    },
    citaComentario: c.citaComentario
      ? {
          id: c.citaComentario.id,
          texto: c.citaComentario.texto,
          autor: {
            nombre: c.citaComentario.autor.nombre,
            apellido: c.citaComentario.autor.apellido,
          },
        }
      : null,
  }))
}

// ============================================================================
// CREAR COMENTARIO
// ============================================================================

export async function crearComentarioAction(data: {
  tareaId: string
  texto: string
  citaComentarioId?: string
}): Promise<{ success?: boolean; error?: string; comentario?: ComentarioConAutor }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  if (!data.texto?.trim()) return { error: "El comentario no puede estar vacío" }
  if (data.texto.length > 2000) return { error: "El comentario es demasiado largo (máx 2000 caracteres)" }

  const tieneAcceso = await puedeAccederComentarios(data.tareaId, user.id)
  if (!tieneAcceso) return { error: "Sin permisos para comentar en esta tarea" }

  // Si hay cita, verificar que existe y pertenece a la misma tarea
  if (data.citaComentarioId) {
    const cita = await prisma.comentarioTarea.findUnique({
      where: { id: data.citaComentarioId },
      select: { tareaId: true },
    })
    if (!cita || cita.tareaId !== data.tareaId) {
      return { error: "El comentario citado no es válido" }
    }
  }

  try {
    const nuevo = await prisma.comentarioTarea.create({
      data: {
        texto: data.texto.trim(),
        tareaId: data.tareaId,
        autorId: user.id,
        citaComentarioId: data.citaComentarioId || null,
      },
      include: {
        autor: { select: { id: true, nombre: true, apellido: true } },
        citaComentario: {
          select: {
            id: true,
            texto: true,
            autor: { select: { nombre: true, apellido: true } },
          },
        },
      },
    })

    // Auto-marcar esta tarea como leída por el autor (acaba de escribir, no es un comentario nuevo para sí mismo)
    await prisma.tareaLectura.upsert({
      where: { userId_tareaId: { userId: user.id, tareaId: data.tareaId } },
      create: { userId: user.id, tareaId: data.tareaId, ultimaLectura: new Date() },
      update: { ultimaLectura: new Date() },
    })

    revalidatePath("/gestion-tareas")
    revalidatePath("/")

    return {
      success: true,
      comentario: {
        id: nuevo.id,
        texto: nuevo.texto,
        tareaId: nuevo.tareaId,
        autorId: nuevo.autorId,
        createdAt: nuevo.createdAt.toISOString(),
        autor: {
          id: nuevo.autor.id,
          nombre: nuevo.autor.nombre,
          apellido: nuevo.autor.apellido,
        },
        citaComentario: nuevo.citaComentario
          ? {
              id: nuevo.citaComentario.id,
              texto: nuevo.citaComentario.texto,
              autor: {
                nombre: nuevo.citaComentario.autor.nombre,
                apellido: nuevo.citaComentario.autor.apellido,
              },
            }
          : null,
      },
    }
  } catch (error) {
    console.error("Error creando comentario:", error)
    return { error: "Error al guardar el comentario" }
  }
}

// ============================================================================
// MARCAR TAREA COMO LEÍDA
// Se llama al abrir el Drawer de una tarea. Actualiza el timestamp de última
// lectura del usuario, lo que hace que los comentarios previos se consideren vistos.
// ============================================================================

export async function marcarTareaLeidaAction(tareaId: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  const tieneAcceso = await puedeAccederComentarios(tareaId, user.id)
  if (!tieneAcceso) return { error: "Sin permisos" }

  try {
    await prisma.tareaLectura.upsert({
      where: { userId_tareaId: { userId: user.id, tareaId } },
      create: { userId: user.id, tareaId, ultimaLectura: new Date() },
      update: { ultimaLectura: new Date() },
    })

    revalidatePath("/gestion-tareas")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error marcando lectura:", error)
    return { error: "Error al marcar como leída" }
  }
}

// ============================================================================
// BURBUJAS DE COMENTARIOS PARA LA CAMPANA
// Agrupa comentarios no leídos por tarea y devuelve una burbuja por cada tarea
// con comentarios nuevos. Excluye comentarios propios del usuario.
// ============================================================================

export async function getBurbujasComentarios(): Promise<BurbujaTareaComentarios[]> {
  const user = await getUserSessionServer()
  if (!user?.id) return []

  // 1. Obtener todas las tareas donde el usuario es responsable o supervisor
  const tareas = await prisma.tarea.findMany({
    where: {
      OR: [{ responsableId: user.id }, { supervisorId: user.id }],
      estado: { notIn: ["COMPLETADA", "VENCIDA"] },
    },
    select: {
      id: true,
      titulo: true,
      tipo: true,
      comentarios: {
        where: {
          autorId: { not: user.id }, // excluir propios
        },
        select: {
          id: true,
          texto: true,
          createdAt: true,
          autorId: true,
          autor: { select: { nombre: true, apellido: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  // 2. Para cada tarea, obtener la última lectura del usuario
  const lecturas = await prisma.tareaLectura.findMany({
    where: {
      userId: user.id,
      tareaId: { in: tareas.map(t => t.id) },
    },
    select: { tareaId: true, ultimaLectura: true },
  })
  const lecturasMap = new Map(lecturas.map(l => [l.tareaId, l.ultimaLectura]))

  // 3. Filtrar tareas con comentarios nuevos (posteriores a última lectura)
  const burbujas: BurbujaTareaComentarios[] = []
  for (const tarea of tareas) {
    if (tarea.comentarios.length === 0) continue
    const ultimaLectura = lecturasMap.get(tarea.id) ?? null
    const comentariosNuevos = ultimaLectura
      ? tarea.comentarios.filter(c => c.createdAt > ultimaLectura)
      : tarea.comentarios
    if (comentariosNuevos.length === 0) continue
    const ultimo = comentariosNuevos[0] // ya están ordenados desc
    burbujas.push({
      tareaId: tarea.id,
      tituloTarea: tarea.titulo,
      tipoTarea: tarea.tipo,
      cantidadNuevos: comentariosNuevos.length,
      ultimoComentario: {
        id: ultimo.id,
        textoPreview: ultimo.texto.length > 80 ? ultimo.texto.slice(0, 80) + "..." : ultimo.texto,
        autor: {
          nombre: ultimo.autor.nombre,
          apellido: ultimo.autor.apellido,
        },
        createdAt: ultimo.createdAt.toISOString(),
      },
    })
  }

  // 4. Ordenar por fecha del último comentario descendente (más recientes primero)
  burbujas.sort((a, b) =>
    new Date(b.ultimoComentario.createdAt).getTime() - new Date(a.ultimoComentario.createdAt).getTime()
  )

  return burbujas.slice(0, 15) // límite razonable
}