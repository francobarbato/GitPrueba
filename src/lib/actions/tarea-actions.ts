'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { revalidatePath } from "next/cache"
<<<<<<< Updated upstream
=======
import {
  TipoTarea, CategoriaTarea, AmbitoTarea, PrioridadTarea, EstadoTarea,
} from "@prisma/client"
import { resetearUmbralVencimientoAction } from "./comentario-actions"
>>>>>>> Stashed changes

export async function crearTareaAction(formData: FormData) {
  const user = await getUserSessionServer()
  
  if (!user || !user.id) {
    return { error: "No autorizado" }
  }

<<<<<<< Updated upstream
  const titulo = formData.get("titulo") as string
  const prioridad = formData.get("prioridad") as string
  const fatal = formData.get("fatal") === "on" // Checkbox
  const casoId = formData.get("casoId") as string // ID del caso seleccionado (opcional)
=======
export type TareaConRelaciones = {
  id: string
  titulo: string
  descripcion: string | null
  tipo: TipoTarea
  categoria: CategoriaTarea
  ambito: AmbitoTarea
  prioridad: PrioridadTarea
  estado: EstadoTarea
  motivoBloqueo: string | null
  motivoDesbloqueo: string | null
  fechaVencimiento: string | null
  fechaInicio: string | null
  fechaCompletada: string | null
  // Cierre manual de vencidas
  motivoCierreVencida: string | null
  vencidaCerradaEn: string | null
  vencidaCerradaPorId: string | null
  lugarFisico: string | null
  visibleCliente: boolean
  casoId: string | null
  clienteId: string | null
  creadorId: string
  responsableId: string
  supervisorId: string | null
  createdAt: string
  updatedAt: string
  caso: { id: string; numero: string; titulo: string } | null
  cliente: { id: string; nombre: string; apellido: string | null; usuarioPortalId: string | null } | null
  creador: { id: string; nombre: string | null; apellido: string | null }
  responsable: { id: string; nombre: string | null; apellido: string | null; rol: string }
  supervisor: { id: string; nombre: string | null; apellido: string | null } | null
}
>>>>>>> Stashed changes

  if (!titulo) return { error: "El título es obligatorio" }

  try {
    await prisma.tarea.create({
      data: {
        titulo,
        prioridad: prioridad || "Media",
        fatal,
        fecha: "Hoy", // Por defecto para la demo, o podrías poner un input de fecha
        usuarioId: user.id, // ¡USAMOS EL ID REAL!
        casoId: casoId === "none" ? null : casoId
      }
    })
    
    revalidatePath("/gestion-tareas")
    return { success: true }

<<<<<<< Updated upstream
  } catch (error) {
    console.error("Error creando tarea:", error)
    return { error: "Error al guardar la tarea" }
  }
}

export async function crearComentarioAction(texto: string) {
=======
function mapearTarea(t: any): TareaConRelaciones {
  return {
    id: t.id, titulo: t.titulo, descripcion: t.descripcion, tipo: t.tipo, categoria: t.categoria, ambito: t.ambito,
    prioridad: t.prioridad, estado: t.estado, motivoBloqueo: t.motivoBloqueo, motivoDesbloqueo: t.motivoDesbloqueo,
    fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null, fechaInicio: t.fechaInicio?.toISOString() ?? null,
    fechaCompletada: t.fechaCompletada?.toISOString() ?? null,
    motivoCierreVencida: t.motivoCierreVencida ?? null,
    vencidaCerradaEn: t.vencidaCerradaEn?.toISOString() ?? null,
    vencidaCerradaPorId: t.vencidaCerradaPorId ?? null,
    lugarFisico: t.lugarFisico, visibleCliente: t.visibleCliente,
    casoId: t.casoId, clienteId: t.clienteId, creadorId: t.creadorId, responsableId: t.responsableId, supervisorId: t.supervisorId,
    createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
    caso: t.caso ? { id: t.caso.id, numero: t.caso.numero, titulo: t.caso.titulo } : null,
    cliente: t.cliente ? { id: t.cliente.id, nombre: t.cliente.nombre, apellido: t.cliente.apellido, usuarioPortalId: t.cliente.usuarioPortalId } : null,
    creador: { id: t.creador.id, nombre: t.creador.nombre, apellido: t.creador.apellido },
    responsable: { id: t.responsable.id, nombre: t.responsable.nombre, apellido: t.responsable.apellido, rol: t.responsable.rol },
    supervisor: t.supervisor ? { id: t.supervisor.id, nombre: t.supervisor.nombre, apellido: t.supervisor.apellido } : null,
  }
}

const includeRelaciones = {
  caso: { select: { id: true, numero: true, titulo: true } },
  cliente: { select: { id: true, nombre: true, apellido: true, usuarioPortalId: true } },
  creador: { select: { id: true, nombre: true, apellido: true } },
  responsable: { select: { id: true, nombre: true, apellido: true, rol: true } },
  supervisor: { select: { id: true, nombre: true, apellido: true } },
}

// ============================================================================
// TRANSICIONES VÁLIDAS
// ============================================================================
// COMPLETADA es terminal absoluta: una tarea completada NO se reabre.
// VENCIDA ya NO es terminal: puede completarse con demora (VENCIDA → COMPLETADA).
// El "cierre sin cumplir" no es una transición de estado: la tarea queda VENCIDA
// pero se marcan los campos vencidaCerradaEn/motivoCierreVencida como decisión consciente.
// ============================================================================
const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  PENDIENTE: ["EN_PROCESO", "BLOQUEADA", "COMPLETADA"],
  EN_PROCESO: ["COMPLETADA", "BLOQUEADA"],
  BLOQUEADA: ["PENDIENTE"],
  COMPLETADA: [],
  VENCIDA: ["COMPLETADA"], // completar con demora
}

// ============================================================================
// QUERIES
// ============================================================================

export async function getTareasDelUsuario(): Promise<TareaConRelaciones[]> {
>>>>>>> Stashed changes
  const user = await getUserSessionServer()
  if (!user || !user.id) return { error: "No autorizado" }

<<<<<<< Updated upstream
=======
export async function getTareasDeCaso(casoId: string): Promise<TareaConRelaciones[]> {
  const user = await getUserSessionServer()
  if (!user) return []
  const tareas = await prisma.tarea.findMany({ where: { casoId }, include: includeRelaciones, orderBy: [{ fechaVencimiento: "asc" }, { createdAt: "desc" }] })
  return tareas.map(mapearTarea)
}

export async function getUsuariosAsignables() {
  return prisma.user.findMany({ where: { isActive: true, rol: { in: ["ABOGADO", "ASISTENTE"] } }, select: { id: true, nombre: true, apellido: true, rol: true }, orderBy: { nombre: "asc" } })
}

export async function getCasosDisponibles() {
  const user = await getUserSessionServer()
  if (!user) return []
  const where = user.rol === "ABOGADO" ? { abogadoId: user.id, estaCerrado: false } : { estaCerrado: false }
  return prisma.caso.findMany({ where, select: { id: true, numero: true, titulo: true }, orderBy: { updatedAt: "desc" }, take: 100 })
}

export async function getClientesDisponibles() {
  const user = await getUserSessionServer()
  if (!user) return []
  const where = user.rol === "ABOGADO" ? { abogadoId: user.id, activo: true } : { activo: true }
  return prisma.cliente.findMany({ where, select: { id: true, nombre: true, apellido: true, tipoPersona: true, tipoSociedad: true, usuarioPortalId: true }, orderBy: { nombre: "asc" }, take: 200 })
}

// ============================================================================
// DETALLE DE TAREA — para el Drawer
// ============================================================================

export async function getTareaDetalle(tareaId: string): Promise<TareaConRelaciones | null> {
  const user = await getUserSessionServer()
  if (!user) return null

  const tarea = await prisma.tarea.findUnique({
    where: { id: tareaId },
    include: includeRelaciones,
  })

  if (!tarea) return null

  const tieneAcceso =
    tarea.creadorId === user.id ||
    tarea.responsableId === user.id ||
    tarea.supervisorId === user.id ||
    user.rol === "ASISTENTE"

  if (!tieneAcceso) return null

  return mapearTarea(tarea)
}

// ============================================================================
// ÚLTIMO ACCESO A TAREAS
// ============================================================================

export async function getUltimoAccesoTareas(): Promise<string | null> {
  const user = await getUserSessionServer()
  if (!user) return null
  const userData = await prisma.user.findUnique({ where: { id: user.id }, select: { ultimoAccesoTareas: true } })
  return userData?.ultimoAccesoTareas?.toISOString() ?? null
}

export async function marcarTareasComoVistasAction(): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }
>>>>>>> Stashed changes
  try {
    await prisma.bitacora.create({
      data: {
        texto,
        tipo: 'manual',
        usuarioId: user.id
      }
    })
    revalidatePath("/gestion-tareas") // ¡Esto actualiza la pantalla!
    return { success: true }
  } catch (error) {
    console.error("Error bitácora:", error)
    return { error: "No se pudo guardar" }
  }
}

<<<<<<< Updated upstream
// Acción para marcar como completada (Check)
export async function toggleTareaAction(id: string, estadoActual: boolean) {
  try {
    await prisma.tarea.update({
      where: { id },
      data: { completada: !estadoActual }
    })
    revalidatePath("/gestion-tareas")
  } catch (error) {
    console.error("Error actualizando tarea:", error)
  }
}

=======
// ============================================================================
// NOTIFICACIONES PARA LA CAMPANITA (Header)
// ============================================================================

export async function getTareasParaNotificaciones(): Promise<{ nuevas: TareaNotificacion[]; totalNuevas: number }> {
  const user = await getUserSessionServer()
  if (!user) return { nuevas: [], totalNuevas: 0 }

  const userData = await prisma.user.findUnique({ where: { id: user.id }, select: { ultimoAccesoTareas: true } })
  const ultimoAcceso = userData?.ultimoAccesoTareas

  // OJO: VENCIDA ahora es accionable, así que puede interesar notificarla.
  // Decisión: seguimos excluyendo COMPLETADA y VENCIDA de notificaciones.
  // Lógica: el usuario ya sabe cuáles están vencidas (es un estado derivado del tiempo, no de actividad de otro).
  // Si queremos destacar vencidas, tiene que ser por otra vía (el KPI "Vencidas" en Supervisadas ya lo hace).
  const tareasRaw = await prisma.tarea.findMany({
    where: {
      OR: [{ responsableId: user.id }, { supervisorId: user.id }],
      estado: { notIn: ["COMPLETADA" as EstadoTarea, "VENCIDA" as EstadoTarea] },
      ...(ultimoAcceso ? { updatedAt: { gt: ultimoAcceso } } : {}),
    },
    select: {
      id: true, titulo: true, tipo: true, prioridad: true, estado: true,
      fechaVencimiento: true, updatedAt: true, createdAt: true, creadorId: true,
      creador: { select: { nombre: true, apellido: true } },
      caso: { select: { numero: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 25,
  })

  const UMBRAL_MS = 5000
  const tareasFiltradas = tareasRaw.filter(t => {
    if (t.creadorId !== user.id) return true
    const diffMs = Math.abs(t.updatedAt.getTime() - t.createdAt.getTime())
    return diffMs > UMBRAL_MS
  })

  const tareas = tareasFiltradas.slice(0, 20)

  return {
    nuevas: tareas.map(t => ({
      id: t.id,
      titulo: t.titulo,
      tipo: t.tipo,
      prioridad: t.prioridad,
      estado: t.estado,
      fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null,
      updatedAt: t.updatedAt.toISOString(),
      creador: { nombre: t.creador.nombre, apellido: t.creador.apellido },
      caso: t.caso ? { numero: t.caso.numero } : null,
    })),
    totalNuevas: tareas.length,
  }
}

// ============================================================================
// CREAR TAREA
// ============================================================================

export async function crearTareaAction(data: {
  titulo: string; descripcion?: string; tipo: TipoTarea; categoria: CategoriaTarea; ambito: AmbitoTarea
  prioridad: PrioridadTarea; fechaVencimiento?: string; fechaInicio?: string; lugarFisico?: string
  visibleCliente?: boolean; casoId?: string; clienteId?: string; responsableId: string; supervisorId?: string
}): Promise<{ success?: boolean; error?: string; tareaId?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }
  if (user.rol !== "ABOGADO" && user.rol !== "ASISTENTE") return { error: "Sin permisos para crear tareas" }
  if (!data.titulo?.trim()) return { error: "El título es obligatorio" }
  if (!data.responsableId) return { error: "Debe asignar un responsable" }

  if (data.visibleCliente && data.clienteId) {
    const cliente = await prisma.cliente.findUnique({ where: { id: data.clienteId }, select: { usuarioPortalId: true } })
    if (!cliente?.usuarioPortalId) return { error: "El cliente no tiene acceso al portal. No se puede marcar como visible." }
  }

  let casoValidoId = data.casoId || null
  let tipoFinal = data.tipo

  if (data.casoId) {
    const caso = await prisma.caso.findUnique({
      where: { id: data.casoId },
      select: { estaCerrado: true }
    })

    if (caso?.estaCerrado) {
      // 🔥 Auto-conversión inteligente
      casoValidoId = null
      tipoFinal = "INTERNA"
    }
  }

  try {
    const tarea = await prisma.tarea.create({
      data: {
        titulo: data.titulo.trim(),
        descripcion: data.descripcion?.trim() || null, 
        tipo: tipoFinal,
        ambito: data.ambito, 
        prioridad: data.prioridad, 
        estado: "PENDIENTE",
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
        lugarFisico: data.lugarFisico?.trim() || null, 
        visibleCliente: data.visibleCliente ?? false,
        categoria: data.categoria,
        casoId: casoValidoId, 
        clienteId: data.clienteId || null, 
        creadorId: user.id,
        responsableId: data.responsableId, 
        supervisorId: data.supervisorId || null,
      },
    })

    await prisma.bitacora.create({
      data: {
        texto: `Tarea creada: ${data.titulo}`,
        tipo: "auto",
        accion: "TAREA_CREADA",
        usuarioId: user.id,
        casoId: casoValidoId,
        tareaId: tarea.id,
        detalle: casoValidoId
        ? `Tipo: ${tipoFinal} | Prioridad: ${data.prioridad} | Responsable: ${data.responsableId}`
        : `⚠️ Caso cerrado → tarea convertida a INTERNA | Prioridad: ${data.prioridad}`,
      },
    })

    revalidatePath("/gestion-tareas"); revalidatePath("/")
    if (data.casoId) revalidatePath(`/casos/${data.casoId}`)
    return { success: true, tareaId: tarea.id }
  } catch (error) { console.error("Error creando tarea:", error); return { error: "Error al guardar la tarea" } }
}

// ============================================================================
// CAMBIAR ESTADO
// ============================================================================
// Cambios clave en esta versión:
// - Permite VENCIDA → COMPLETADA (completar con demora).
// - Cuando la transición es VENCIDA → COMPLETADA, registramos accion "TAREA_COMPLETADA_CON_DEMORA"
//   en la bitácora con el detalle de los días de atraso (útil para auditoría).
// ============================================================================

export async function cambiarEstadoTareaAction(tareaId: string, nuevoEstado: EstadoTarea, motivo?: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }
  if (nuevoEstado === "BLOQUEADA" && !motivo?.trim()) return { error: "El motivo de bloqueo es obligatorio" }
  if (nuevoEstado === "PENDIENTE" && !motivo?.trim()) return { error: "El motivo de desbloqueo es obligatorio" }

  try {
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
      select: {
        casoId: true, responsableId: true, creadorId: true, supervisorId: true,
        titulo: true, estado: true, fechaVencimiento: true, vencidaCerradaEn: true,
      },
    })
    if (!tarea) return { error: "Tarea no encontrada" }

    // Una vencida ya cerrada manualmente no se puede completar ni reabrir.
    // Si el usuario quiere "deshacer" ese cierre, debería ser otra acción explícita
    // (no implementada en este commit; si hace falta se agrega después).
    if (tarea.estado === "VENCIDA" && tarea.vencidaCerradaEn) {
      return { error: "Esta tarea vencida ya fue cerrada. No se puede modificar." }
    }

    const transicionesPermitidas = TRANSICIONES_VALIDAS[tarea.estado] ?? []
    if (!transicionesPermitidas.includes(nuevoEstado)) return { error: `No se puede pasar de ${tarea.estado} a ${nuevoEstado}` }

    const puedeModificar = tarea.responsableId === user.id || tarea.creadorId === user.id || tarea.supervisorId === user.id || user.rol === "ASISTENTE"
    if (!puedeModificar) return { error: "Sin permisos para modificar esta tarea" }

    const dataUpdate: any = { estado: nuevoEstado }
    if (nuevoEstado === "BLOQUEADA") { dataUpdate.motivoBloqueo = motivo; dataUpdate.motivoDesbloqueo = null }
    else if (nuevoEstado === "PENDIENTE" && tarea.estado === "BLOQUEADA") { dataUpdate.motivoDesbloqueo = motivo }
    else { dataUpdate.motivoBloqueo = null; dataUpdate.motivoDesbloqueo = null }
    if (nuevoEstado === "COMPLETADA") dataUpdate.fechaCompletada = new Date()

    await resetearUmbralVencimientoAction(tareaId)

    // ═══ BITÁCORA ═══
    // Discriminamos tres casos para el accion en la bitácora:
    // 1. VENCIDA → COMPLETADA  → TAREA_COMPLETADA_CON_DEMORA (con días de demora en detalle)
    // 2. BLOQUEADA → PENDIENTE → TAREA_DESBLOQUEADA
    // 3. Resto                 → TAREA_ESTADO_CHANGE
    const esCompletadaConDemora = tarea.estado === "VENCIDA" && nuevoEstado === "COMPLETADA"
    const esDesbloqueo = tarea.estado === "BLOQUEADA" && nuevoEstado === "PENDIENTE"

    let accionBitacora: string
    let textoBitacora: string
    let detalleBitacora: string | null

    if (esCompletadaConDemora) {
      accionBitacora = "TAREA_COMPLETADA_CON_DEMORA"
      const diasDemora = tarea.fechaVencimiento
        ? Math.max(0, Math.floor((new Date().getTime() - new Date(tarea.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24)))
        : null
      textoBitacora = `Tarea "${tarea.titulo}" completada con demora`
      detalleBitacora = diasDemora !== null ? `Completada ${diasDemora} día(s) después del vencimiento` : "Completada fuera de plazo"
    } else if (esDesbloqueo) {
      accionBitacora = "TAREA_DESBLOQUEADA"
      textoBitacora = `Tarea "${tarea.titulo}" desbloqueada → PENDIENTE`
      detalleBitacora = motivo ? `Motivo: ${motivo}` : null
    } else {
      accionBitacora = "TAREA_ESTADO_CHANGE"
      textoBitacora = `Tarea "${tarea.titulo}" → ${nuevoEstado}`
      detalleBitacora = motivo ? `Motivo: ${motivo}` : null
    }

    await prisma.bitacora.create({
      data: {
        texto: textoBitacora,
        tipo: "auto",
        accion: accionBitacora,
        usuarioId: user.id,
        casoId: tarea.casoId || null,
        tareaId: tareaId,
        estadoAnterior: tarea.estado,
        estadoNuevo: nuevoEstado,
        detalle: detalleBitacora,
      },
    })

    revalidatePath("/gestion-tareas"); revalidatePath("/")
    if (tarea.casoId) revalidatePath(`/casos/${tarea.casoId}`)
    return { success: true }
  } catch (error) { console.error("Error cambiando estado:", error); return { error: "Error al actualizar el estado" } }
}

// ============================================================================
// CERRAR VENCIDA SIN CUMPLIR
// ============================================================================
// Nueva acción: una tarea VENCIDA se cierra formalmente sin haberse cumplido.
// Resultado: la tarea queda VENCIDA (no cambia estado) pero se setean los campos
// vencidaCerradaEn + vencidaCerradaPorId + motivoCierreVencida.
// El reporte de Cumplimiento sigue contándola como "vencida" (no cambia nada ahí).
// Lo que gana la UI: la tarea deja de mostrar botones accionables y sale del board activo.
// Motivo OBLIGATORIO (decisión UX consciente, como el bloqueo).
// ============================================================================

export async function cerrarVencidaAction(tareaId: string, motivo: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }
  if (!motivo?.trim()) return { error: "El motivo de cierre es obligatorio" }

  try {
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
      select: {
        casoId: true, responsableId: true, creadorId: true, supervisorId: true,
        titulo: true, estado: true, vencidaCerradaEn: true,
      },
    })
    if (!tarea) return { error: "Tarea no encontrada" }
    if (tarea.estado !== "VENCIDA") return { error: "Solo se pueden cerrar tareas vencidas" }
    if (tarea.vencidaCerradaEn) return { error: "Esta tarea ya fue cerrada" }

    const puedeModificar = tarea.responsableId === user.id || tarea.creadorId === user.id || tarea.supervisorId === user.id || user.rol === "ASISTENTE"
    if (!puedeModificar) return { error: "Sin permisos para cerrar esta tarea" }

    await prisma.tarea.update({
      where: { id: tareaId },
      data: {
        vencidaCerradaEn: new Date(),
        vencidaCerradaPorId: user.id,
        motivoCierreVencida: motivo.trim(),
      },
    })

    await prisma.bitacora.create({
      data: {
        texto: `Tarea vencida "${tarea.titulo}" cerrada sin cumplir`,
        tipo: "auto",
        accion: "TAREA_VENCIDA_CERRADA_MANUAL",
        usuarioId: user.id,
        casoId: tarea.casoId || null,
        tareaId: tareaId,
        detalle: `Motivo: ${motivo.trim()}`,
      },
    })

    revalidatePath("/gestion-tareas"); revalidatePath("/")
    if (tarea.casoId) revalidatePath(`/casos/${tarea.casoId}`)
    return { success: true }
  } catch (error) { console.error("Error cerrando vencida:", error); return { error: "Error al cerrar la tarea" } }
}

// ============================================================================
// EDITAR TAREA
// ============================================================================
// Mantiene la regla: no se edita COMPLETADA ni VENCIDA.
// Las vencidas solo se accionan vía "Completar con demora" o "Cerrar sin cumplir".
// ============================================================================

export async function editarTareaAction(
  tareaId: string,
  data: {
    titulo?: string; descripcion?: string; prioridad?: PrioridadTarea; fechaVencimiento?: string | null
    lugarFisico?: string; visibleCliente?: boolean; responsableId?: string; supervisorId?: string | null
    categoria?: CategoriaTarea; ambito?: AmbitoTarea; clienteId?: string | null
  }
): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  try {
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
      select: { creadorId: true, responsableId: true, supervisorId: true, casoId: true, estado: true, titulo: true },
    })
    if (!tarea) return { error: "Tarea no encontrada" }
    if (tarea.estado === "COMPLETADA" || tarea.estado === "VENCIDA") return { error: "No se puede editar una tarea finalizada" }

    const esCreadorOSupervisor = tarea.creadorId === user.id || tarea.supervisorId === user.id
    const esResponsable = tarea.responsableId === user.id
    const esAsistente = user.rol === "ASISTENTE"

    if (!esCreadorOSupervisor && !esResponsable && !esAsistente) {
      return { error: "Sin permisos para editar esta tarea" }
    }

    const camposEstructurales = ["titulo", "prioridad", "responsableId"] as const
    const camposInmutables = ["categoria", "ambito", "clienteId"] as const

    for (const campo of camposInmutables) {
      if (data[campo] !== undefined) {
        return { error: `El campo "${campo}" no se puede modificar después de crear la tarea` }
      }
    }

    if (!esCreadorOSupervisor && !esAsistente) {
      for (const campo of camposEstructurales) {
        if (data[campo] !== undefined) {
          return { error: `Solo el creador o supervisor puede modificar "${campo}"` }
        }
      }
    }

    const updateData: any = {}

    if (data.fechaVencimiento !== undefined) {
      updateData.fechaVencimiento = data.fechaVencimiento === null ? null : data.fechaVencimiento ? new Date(data.fechaVencimiento) : undefined
    }
    if (data.lugarFisico !== undefined) updateData.lugarFisico = data.lugarFisico?.trim() || null
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion?.trim() || null
    if (data.visibleCliente !== undefined) updateData.visibleCliente = data.visibleCliente

    if (esCreadorOSupervisor || esAsistente) {
      if (data.titulo) updateData.titulo = data.titulo.trim()
      if (data.prioridad) updateData.prioridad = data.prioridad
      if (data.responsableId) updateData.responsableId = data.responsableId
      if (data.supervisorId !== undefined) updateData.supervisorId = data.supervisorId
    }

    const cambiosSignificativos: string[] = []
    if (data.titulo && data.titulo !== tarea.titulo) cambiosSignificativos.push(`Título: "${data.titulo}"`)
    if (data.prioridad) cambiosSignificativos.push(`Prioridad: ${data.prioridad}`)
    if (data.fechaVencimiento !== undefined) cambiosSignificativos.push("Fecha de vencimiento actualizada")
    if (data.responsableId) cambiosSignificativos.push("Responsable reasignado")

    await prisma.tarea.update({ where: { id: tareaId }, data: updateData })

    if (cambiosSignificativos.length > 0) {
      await prisma.bitacora.create({
        data: {
          texto: `Tarea "${tarea.titulo}" editada`,
          tipo: "auto",
          accion: "TAREA_EDITADA",
          usuarioId: user.id,
          casoId: tarea.casoId || null,
          tareaId: tareaId,
          detalle: cambiosSignificativos.join(" | "),
        },
      })
    }

    revalidatePath("/gestion-tareas"); revalidatePath("/")
    if (tarea.casoId) revalidatePath(`/casos/${tarea.casoId}`)
    return { success: true }
  } catch (error) { console.error("Error editando tarea:", error); return { error: "Error al editar la tarea" } }
}

// ============================================================================
// ELIMINAR TAREA
// ============================================================================

export async function eliminarTareaAction(tareaId: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }
  try {
    const tarea = await prisma.tarea.findUnique({ where: { id: tareaId }, select: { creadorId: true, casoId: true, titulo: true } })
    if (!tarea) return { error: "Tarea no encontrada" }
    if (tarea.creadorId !== user.id && user.rol !== "ASISTENTE") return { error: "Solo el creador puede eliminar la tarea" }

    await prisma.bitacora.create({
      data: {
        texto: `Tarea eliminada: "${tarea.titulo}"`,
        tipo: "auto",
        accion: "TAREA_ELIMINADA",
        usuarioId: user.id,
        casoId: tarea.casoId || null,
      },
    })

    await prisma.tarea.delete({ where: { id: tareaId } })

    revalidatePath("/gestion-tareas"); revalidatePath("/")
    if (tarea.casoId) revalidatePath(`/casos/${tarea.casoId}`)
    return { success: true }
  } catch (error) { console.error("Error eliminando tarea:", error); return { error: "Error al eliminar la tarea" } }
}

// ============================================================================
// MARCAR VENCIDAS
// ============================================================================
// El cron sigue haciendo lo mismo que antes: PENDIENTE/EN_PROCESO/BLOQUEADA vencidas → VENCIDA.
// La diferencia es que ahora ese VENCIDA no es terminal: puede resolverse con
// "Completar con demora" o "Cerrar sin cumplir".
// ============================================================================

export async function marcarTareasVencidasAction() {
  try {
    await prisma.tarea.updateMany({ where: { estado: { in: ["PENDIENTE", "EN_PROCESO", "BLOQUEADA"] }, fechaVencimiento: { lt: new Date() } }, data: { estado: "VENCIDA" } })
    revalidatePath("/gestion-tareas"); revalidatePath("/")
    return { success: true }
  } catch (error) { console.error("Error marcando vencidas:", error); return { error: "Error al marcar vencidas" } }
}
>>>>>>> Stashed changes
