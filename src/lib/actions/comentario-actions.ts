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
// NUEVO TIPO: Alerta de tarea próxima a vencer
// ============================================================================
export type AlertaProximaAVencer = {
  tareaId: string
  tituloTarea: string
  tipoTarea: "PROCESAL" | "INTERNA"
  prioridad: "BAJA" | "MEDIA" | "ALTA" | "FATAL"
  fechaVencimiento: string
  diasRestantes: number
  umbral: 20 | 10 | 5 // umbral más cercano ya cruzado
  caso: { numero: string } | null
}

// ============================================================================
// HELPERS
// ============================================================================

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
// FIX de race condition: el auto-marcado del autor se hace ANTES del insert
// del comentario, así el `createdAt` del comentario siempre es posterior al
// `ultimaLectura` del autor. Esto evita que el autor se vea su propio comentario
// como "nuevo" en la campanita, sin tocar la lectura de los otros usuarios.
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
    // ═══ FIX: primero marcar lectura del autor, DESPUÉS crear el comentario.
    // Así el createdAt del comentario es > ultimaLectura del autor.
    await prisma.tareaLectura.upsert({
      where: { userId_tareaId: { userId: user.id, tareaId: data.tareaId } },
      create: { userId: user.id, tareaId: data.tareaId, ultimaLectura: new Date() },
      update: { ultimaLectura: new Date() },
    })

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
// Se llama al abrir el Drawer de una tarea.
// También marca el umbral de vencimiento actual como visto (apaga la alerta
// amarilla de "próxima a vencer" hasta que se cruce el siguiente umbral).
// ============================================================================

const UMBRALES_VENCIMIENTO = [20, 10, 5] as const
type UmbralVencimiento = typeof UMBRALES_VENCIMIENTO[number]

/**
 * Dada cantidad de días restantes, devuelve el umbral más chico ya cruzado.
 * Ejemplos:
 *  - 25 días restantes → null (no cruzó ningún umbral)
 *  - 18 días → 20 (cruzó 20, faltan más de 10)
 *  - 8 días → 10 (cruzó 20 y 10, faltan más de 5)
 *  - 3 días → 5 (cruzó los tres)
 *  - -1 día (ya vencida) → 5 (último umbral)
 */
function umbralActual(diasRestantes: number): UmbralVencimiento | null {
  if (diasRestantes <= 5) return 5
  if (diasRestantes <= 10) return 10
  if (diasRestantes <= 20) return 20
  return null
}

export async function marcarTareaLeidaAction(tareaId: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  const tareaData = await prisma.tarea.findUnique({
    where: { id: tareaId },
    select: { responsableId: true, supervisorId: true, fechaVencimiento: true, estado: true },
  })
  if (!tareaData) return { error: "Tarea no encontrada" }

  const tieneAcceso = tareaData.responsableId === user.id || tareaData.supervisorId === user.id
  if (!tieneAcceso) return { error: "Sin permisos" }

  // Calcular umbral actual para persistir "ya vi esta alerta"
  let umbralParaPersistir: UmbralVencimiento | null = null
  if (tareaData.fechaVencimiento && tareaData.estado !== "COMPLETADA") {
    const ahora = new Date()
    const diasRestantes = Math.ceil(
      (tareaData.fechaVencimiento.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
    )
    umbralParaPersistir = umbralActual(diasRestantes)
  }

  try {
    await prisma.tareaLectura.upsert({
      where: { userId_tareaId: { userId: user.id, tareaId } },
      create: {
        userId: user.id, tareaId,
        ultimaLectura: new Date(),
        ultimoUmbralVencimientoVisto: umbralParaPersistir,
      },
      update: {
        ultimaLectura: new Date(),
        // Solo actualizar el umbral si estamos viendo la alerta actual o uno más nuevo
        // (más chico). No pisar si ya estaba en un umbral más chico que el actual.
        ...(umbralParaPersistir !== null ? { ultimoUmbralVencimientoVisto: umbralParaPersistir } : {}),
      },
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
// RESETEAR UMBRAL DE VENCIMIENTO POR CAMBIO DE ESTADO
// Se llama desde cambiarEstadoTareaAction. Cuando cambia el estado de una
// tarea, el usuario probablemente quiere volver a ser notificado en el
// próximo umbral aunque ya haya visto la alerta anterior.
// ============================================================================

export async function resetearUmbralVencimientoAction(tareaId: string): Promise<void> {
  try {
    await prisma.tareaLectura.updateMany({
      where: { tareaId },
      data: { ultimoUmbralVencimientoVisto: null },
    })
  } catch (error) {
    console.error("Error reseteando umbral:", error)
  }
}

// ============================================================================
// BURBUJAS DE COMENTARIOS PARA LA CAMPANA
// ============================================================================
// Cambios vs versión anterior:
// 1. Incluye tareas VENCIDAS abiertas (accionables) además de PENDIENTE/EN_PROCESO/BLOQUEADA.
//    Razón: una vencida abierta puede tener comentarios nuevos que querés ver.
// 2. Excluye VENCIDA cerrada manualmente (ya es terminal, no se comenta más).
// 3. Excluye COMPLETADA (terminal).
// ============================================================================

export async function getBurbujasComentarios(): Promise<BurbujaTareaComentarios[]> {
  const user = await getUserSessionServer()
  if (!user?.id) return []

  const tareas = await prisma.tarea.findMany({
    where: {
      OR: [{ responsableId: user.id }, { supervisorId: user.id }],
      estado: { notIn: ["COMPLETADA"] }, // VENCIDA ahora sí se incluye (es accionable)
      // Excluimos las vencidas cerradas manualmente: son terminales de hecho
      NOT: {
        AND: [
          { estado: "VENCIDA" },
          { vencidaCerradaEn: { not: null } },
        ],
      },
    },
    select: {
      id: true,
      titulo: true,
      tipo: true,
      comentarios: {
        where: {
          autorId: { not: user.id },
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

  const lecturas = await prisma.tareaLectura.findMany({
    where: {
      userId: user.id,
      tareaId: { in: tareas.map(t => t.id) },
    },
    select: { tareaId: true, ultimaLectura: true },
  })
  const lecturasMap = new Map(lecturas.map(l => [l.tareaId, l.ultimaLectura]))

  const burbujas: BurbujaTareaComentarios[] = []
  for (const tarea of tareas) {
    if (tarea.comentarios.length === 0) continue
    const ultimaLectura = lecturasMap.get(tarea.id) ?? null
    const comentariosNuevos = ultimaLectura
      ? tarea.comentarios.filter(c => c.createdAt > ultimaLectura)
      : tarea.comentarios
    if (comentariosNuevos.length === 0) continue
    const ultimo = comentariosNuevos[0]
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

  burbujas.sort((a, b) =>
    new Date(b.ultimoComentario.createdAt).getTime() - new Date(a.ultimoComentario.createdAt).getTime()
  )

  return burbujas.slice(0, 15)
}

// ============================================================================
// ALERTAS DE TAREAS PRÓXIMAS A VENCER
// ============================================================================
// Devuelve tareas donde el usuario (responsable o supervisor) debería recibir
// alerta en la campanita porque:
//   1. Está activa (PENDIENTE/EN_PROCESO/BLOQUEADA o VENCIDA abierta)
//   2. Tiene fechaVencimiento y cruzó un umbral (20/10/5 días)
//   3. No vio la alerta del umbral actual todavía (ultimoUmbralVencimientoVisto > umbralActual)
//
// Nota: incluye VENCIDAS abiertas (<30 días) con días negativos. Para esas,
// el umbral es 5 (el más urgente), así se mantienen visibles hasta que el
// usuario las abra o las resuelva.
// ============================================================================

export async function getAlertasProximasAVencer(): Promise<AlertaProximaAVencer[]> {
  const user = await getUserSessionServer()
  if (!user?.id) return []

  const ahora = new Date()

  // Ventana máxima: 20 días futuros + hasta 30 días de vencidas abiertas
  const limiteFuturo = new Date(ahora.getTime() + 21 * 24 * 60 * 60 * 1000)
  const limitePasado = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)

  const tareas = await prisma.tarea.findMany({
    where: {
      OR: [{ responsableId: user.id }, { supervisorId: user.id }],
      estado: { notIn: ["COMPLETADA"] },
      NOT: {
        AND: [{ estado: "VENCIDA" }, { vencidaCerradaEn: { not: null } }],
      },
      fechaVencimiento: {
        not: null,
        lte: limiteFuturo,
        gte: limitePasado,
      },
    },
    select: {
      id: true,
      titulo: true,
      tipo: true,
      prioridad: true,
      estado: true,
      fechaVencimiento: true,
      vencidaCerradaEn: true,
      caso: { select: { numero: true } },
    },
  })

  if (tareas.length === 0) return []

  const lecturas = await prisma.tareaLectura.findMany({
    where: {
      userId: user.id,
      tareaId: { in: tareas.map(t => t.id) },
    },
    select: { tareaId: true, ultimoUmbralVencimientoVisto: true },
  })
  const umbralesVistos = new Map(
    lecturas.map(l => [l.tareaId, l.ultimoUmbralVencimientoVisto])
  )

  const alertas: AlertaProximaAVencer[] = []
  for (const t of tareas) {
    if (!t.fechaVencimiento) continue

    const diasRestantes = Math.ceil(
      (t.fechaVencimiento.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
    )
    const umbralCruzado = umbralActual(diasRestantes)
    if (umbralCruzado === null) continue // todavía no cruzó ningún umbral (>20 días)

    const umbralYaVisto = umbralesVistos.get(t.id) ?? null

    // Dispará la alerta si:
    //  - nunca vio ninguna (umbralYaVisto === null), o
    //  - el último visto era un umbral MÁS GRANDE que el actual (todavía estaba en 20 y ahora cruzó a 10)
    const debeAlertar = umbralYaVisto === null || umbralYaVisto > umbralCruzado
    if (!debeAlertar) continue

    alertas.push({
      tareaId: t.id,
      tituloTarea: t.titulo,
      tipoTarea: t.tipo,
      prioridad: t.prioridad,
      fechaVencimiento: t.fechaVencimiento.toISOString(),
      diasRestantes,
      umbral: umbralCruzado,
      caso: t.caso ? { numero: t.caso.numero } : null,
    })
  }

  // Ordenar: FATAL primero, luego por días restantes ascendentes (más urgentes arriba)
  alertas.sort((a, b) => {
    if (a.prioridad === "FATAL" && b.prioridad !== "FATAL") return -1
    if (b.prioridad === "FATAL" && a.prioridad !== "FATAL") return 1
    return a.diasRestantes - b.diasRestantes
  })

  return alertas.slice(0, 15)
}