'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { revalidatePath } from "next/cache"
import {
  TipoTarea, CategoriaTarea, AmbitoTarea, PrioridadTarea, EstadoTarea,
} from "@prisma/client"
import { resetearUmbralVencimientoAction } from "./comentario-actions"
import {
  TIPO_TAREA_LABELS,
  PRIORIDAD_TAREA_LABELS,
  ESTADO_TAREA_LABELS,
} from "src/lib/utils/labels"

// ============================================================================
// TIPOS
// ============================================================================

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
  motivoCierreVencida: string | null
  vencidaCerradaEn: string | null
  vencidaCerradaPorId: string | null
  motivoCierreAdmin: 'TRASPASO_ABOGADO' | 'TRASPASO_EXPEDIENTE' | null
  lugarFisico: string | null
  visibleCliente: boolean
  casoId: string | null
  clienteId: string | null
  creadorId: string
  responsableId: string
  supervisorId: string | null
  createdAt: string
  updatedAt: string
  caso: {
    id: string
    numero: string
    titulo: string
    estaCerrado: boolean
    esTraspasado: boolean
    abogadoId: string
  } | null
  cliente: { id: string; nombre: string; apellido: string | null; usuarioPortalId: string | null } | null
  creador:     { id: string; nombre: string | null; apellido: string | null; isActive: boolean }
  responsable: { id: string; nombre: string | null; apellido: string | null; rol: string; isActive: boolean }
  supervisor:  { id: string; nombre: string | null; apellido: string | null; isActive: boolean } | null
}

export type TareaNotificacion = {
  id: string
  titulo: string
  tipo: TipoTarea
  prioridad: PrioridadTarea
  estado: EstadoTarea
  fechaVencimiento: string | null
  updatedAt: string
  creador: { nombre: string | null; apellido: string | null }
  caso: { numero: string } | null
}

// ============================================================================
// HELPERS
// ============================================================================

function mapearTarea(t: any): TareaConRelaciones {
  return {
    id: t.id, titulo: t.titulo, descripcion: t.descripcion, tipo: t.tipo, categoria: t.categoria, ambito: t.ambito,
    prioridad: t.prioridad, estado: t.estado, motivoBloqueo: t.motivoBloqueo, motivoDesbloqueo: t.motivoDesbloqueo,
    fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null, fechaInicio: t.fechaInicio?.toISOString() ?? null,
    fechaCompletada: t.fechaCompletada?.toISOString() ?? null,
    motivoCierreVencida: t.motivoCierreVencida ?? null,
    vencidaCerradaEn: t.vencidaCerradaEn?.toISOString() ?? null,
    vencidaCerradaPorId: t.vencidaCerradaPorId ?? null,
    motivoCierreAdmin: t.motivoCierreAdmin ?? null,
    lugarFisico: t.lugarFisico, visibleCliente: t.visibleCliente,
    casoId: t.casoId, clienteId: t.clienteId, creadorId: t.creadorId, responsableId: t.responsableId, supervisorId: t.supervisorId,
    createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
    caso: t.caso ? {
      id: t.caso.id, numero: t.caso.numero, titulo: t.caso.titulo,
      estaCerrado: t.caso.estaCerrado, esTraspasado: t.caso.esTraspasado, abogadoId: t.caso.abogadoId,
    } : null,
    cliente: t.cliente ? { id: t.cliente.id, nombre: t.cliente.nombre, apellido: t.cliente.apellido, usuarioPortalId: t.cliente.usuarioPortalId } : null,
    creador:     { id: t.creador.id, nombre: t.creador.nombre, apellido: t.creador.apellido, isActive: t.creador.isActive ?? true },
    responsable: { id: t.responsable.id, nombre: t.responsable.nombre, apellido: t.responsable.apellido, rol: t.responsable.rol, isActive: t.responsable.isActive ?? true },
    supervisor:  t.supervisor ? { id: t.supervisor.id, nombre: t.supervisor.nombre, apellido: t.supervisor.apellido, isActive: t.supervisor.isActive ?? true } : null,
  }
}

const includeRelaciones = {
  caso:        { select: { id: true, numero: true, titulo: true, estaCerrado: true, esTraspasado: true, abogadoId: true } },
  cliente:     { select: { id: true, nombre: true, apellido: true, usuarioPortalId: true } },
  creador:     { select: { id: true, nombre: true, apellido: true, isActive: true } },
  responsable: { select: { id: true, nombre: true, apellido: true, rol: true, isActive: true } },
  supervisor:  { select: { id: true, nombre: true, apellido: true, isActive: true } },
}

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  PENDIENTE: ["EN_PROCESO", "BLOQUEADA", "COMPLETADA"],
  EN_PROCESO: ["COMPLETADA", "BLOQUEADA"],
  BLOQUEADA: ["PENDIENTE"],
  COMPLETADA: [],
  VENCIDA: ["COMPLETADA"],
}

// ============================================================================
// HELPER: marcarLecturaPara
// ============================================================================
// Cuando un usuario ejecuta una action sobre una tarea (crear, editar, cambiar
// estado, cerrar), registramos su lectura. Eso evita que el propio usuario
// reciba notificaciones de sus propias acciones.
//
// El filtro de getTareasParaNotificaciones compara ultimaLectura >= updatedAt.
// Si seteamos ultimaLectura = now() después de cada update, el usuario que
// actuó queda al día con esa tarea.
//
// Es seguro llamarlo desde cualquier action: si falla, no rompe la acción
// principal porque está envuelto en try/catch.
// ============================================================================

async function marcarLecturaPara(tareaId: string, userId: string): Promise<void> {
  try {
    await prisma.tareaLectura.upsert({
      where: { userId_tareaId: { userId, tareaId } },
      create: { userId, tareaId, ultimaLectura: new Date() },
      update: { ultimaLectura: new Date() },
    })
  } catch (error) {
    console.error(`Error registrando lectura tarea=${tareaId} user=${userId}:`, error)
  }
}

// ============================================================================
// QUERIES
// ============================================================================

export async function getTareasDelUsuario(): Promise<TareaConRelaciones[]> {
  const user = await getUserSessionServer()
  if (!user) return []
  const tareas = await prisma.tarea.findMany({
    where: { OR: [{ responsableId: user.id }, { supervisorId: user.id }] },
    include: includeRelaciones, orderBy: [{ fechaVencimiento: "asc" }, { createdAt: "desc" }],
  })
  return tareas.map(mapearTarea)
}

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
  const where = user.rol === "ABOGADO"
    ? { abogadoId: user.id, estaCerrado: false }
    : { estaCerrado: false }
  return prisma.caso.findMany({
    where,
    select: { id: true, numero: true, titulo: true, estaCerrado: true, abogadoId: true, clienteId: true },
    orderBy: { updatedAt: "desc" },
    take: 100
  })
}

export async function getClientesDisponibles() {
  const user = await getUserSessionServer()
  if (!user) return []
  const where = user.rol === "ABOGADO" ? { abogadoId: user.id, activo: true } : { activo: true }
  return prisma.cliente.findMany({ where, select: { id: true, nombre: true, apellido: true, tipoPersona: true, tipoSociedad: true, usuarioPortalId: true, abogadoId: true }, orderBy: { nombre: "asc" }, take: 200 })
}

export async function getTareaDetalle(tareaId: string): Promise<TareaConRelaciones | null> {
  const user = await getUserSessionServer()
  if (!user) return null
  const tarea = await prisma.tarea.findUnique({ where: { id: tareaId }, include: includeRelaciones })
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
// ÚLTIMO ACCESO / NOTIFICACIONES
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
  try {
    await prisma.user.update({ where: { id: user.id }, data: { ultimoAccesoTareas: new Date() } })
    revalidatePath("/gestion-tareas"); revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error actualizando último acceso:", error)
    return { error: "Error al marcar como vistas" }
  }
}

export async function marcarTareaComoLeidaAction(tareaId: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }
  try {
    await prisma.tareaLectura.upsert({
      where: { userId_tareaId: { userId: user.id, tareaId } },
      create: { userId: user.id, tareaId, ultimaLectura: new Date() },
      update: { ultimaLectura: new Date() },
    })
    revalidatePath("/gestion-tareas"); revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error marcando tarea como leída:", error)
    return { error: "Error al marcar como leída" }
  }
}

async function validarAccesoAlCasoParaTarea(
  casoId: string,
  responsableId: string,
  supervisorId?: string | null,
): Promise<string | null> {
  const caso = await prisma.caso.findUnique({ where: { id: casoId }, select: { abogadoId: true } })
  if (!caso) return "Caso no encontrado"

  const respData = await prisma.user.findUnique({ where: { id: responsableId }, select: { rol: true, isActive: true } })
  if (!respData || !respData.isActive) return "El responsable no es válido o está inactivo"
  if (responsableId !== caso.abogadoId && respData.rol !== "ASISTENTE") {
    return "El responsable debe ser el titular del caso o un asistente"
  }

  if (supervisorId) {
    const supData = await prisma.user.findUnique({ where: { id: supervisorId }, select: { rol: true, isActive: true } })
    if (!supData || !supData.isActive) return "El supervisor no es válido o está inactivo"
    if (supervisorId !== caso.abogadoId && supData.rol !== "ASISTENTE") {
      return "El supervisor debe ser el titular del caso o un asistente"
    }
  }

  return null
}

export async function getTareasParaNotificaciones(): Promise<{ nuevas: TareaNotificacion[]; totalNuevas: number }> {
  const user = await getUserSessionServer()
  if (!user) return { nuevas: [], totalNuevas: 0 }

  const userData = await prisma.user.findUnique({ where: { id: user.id }, select: { ultimoAccesoTareas: true } })
  const ultimoAcceso = userData?.ultimoAccesoTareas

  const tareasRaw = await prisma.tarea.findMany({
    where: {
      OR: [{ responsableId: user.id }, { supervisorId: user.id }],
      estado: { notIn: ["COMPLETADA" as EstadoTarea, "VENCIDA" as EstadoTarea] },
      ...(ultimoAcceso ? { updatedAt: { gt: ultimoAcceso } } : {}),
    },
    select: {
      id: true, titulo: true, tipo: true, prioridad: true, estado: true,
      fechaVencimiento: true, responsableId: true, updatedAt: true, createdAt: true, creadorId: true,
      creador: { select: { nombre: true, apellido: true } },
      caso: { select: { numero: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 25,
  })

  const lecturas = await prisma.tareaLectura.findMany({
    where: { userId: user.id, tareaId: { in: tareasRaw.map(t => t.id) } },
    select: { tareaId: true, ultimaLectura: true },
  })
  const lecturasMap = new Map(lecturas.map(l => [l.tareaId, l.ultimaLectura]))

  const UMBRAL_MS = 5000
  const tareasFiltradas = tareasRaw.filter(t => {
    if (t.creadorId === user.id && t.responsableId === user.id) return false
    if (t.creadorId === user.id) {
      const diffMs = Math.abs(t.updatedAt.getTime() - t.createdAt.getTime())
      if (diffMs <= UMBRAL_MS) return false
    }
    const ultimaLectura = lecturasMap.get(t.id)
    if (ultimaLectura && ultimaLectura >= t.updatedAt) return false
    return true
  })

  const tareas = tareasFiltradas.slice(0, 20)

  return {
    nuevas: tareas.map(t => ({
      id: t.id, titulo: t.titulo, tipo: t.tipo, prioridad: t.prioridad, estado: t.estado,
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
  if (user.rol !== "ABOGADO" && user.rol !== "ASISTENTE") return { error: "Sin permisos para crear eventos" }
  if (!data.titulo?.trim()) return { error: "El título es obligatorio" }
  if (!data.responsableId) return { error: "Debe asignar un responsable" }

  if (data.visibleCliente && data.clienteId) {
    const cliente = await prisma.cliente.findUnique({ where: { id: data.clienteId }, select: { usuarioPortalId: true } })
    if (!cliente?.usuarioPortalId) return { error: "El cliente no tiene acceso al portal. No se puede marcar como visible." }
  }

  let casoValidoId = data.casoId || null
  let tipoFinal = data.tipo

  if (data.casoId) {
    const caso = await prisma.caso.findUnique({ where: { id: data.casoId }, select: { estaCerrado: true } })
    if (caso?.estaCerrado) { casoValidoId = null; tipoFinal = "INTERNA" }
  }

  if (casoValidoId) {
    const errorAcceso = await validarAccesoAlCasoParaTarea(casoValidoId, data.responsableId, data.supervisorId)
    if (errorAcceso) return { error: errorAcceso }
  }

  try {
    const tarea = await prisma.tarea.create({
      data: {
        titulo: data.titulo.trim(),
        descripcion: data.descripcion?.trim() || null,
        tipo: tipoFinal, categoria: data.categoria, ambito: data.ambito,
        prioridad: data.prioridad, estado: "PENDIENTE",
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento + "T12:00:00") : null,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
        lugarFisico: data.lugarFisico?.trim() || null,
        visibleCliente: data.visibleCliente ?? false,
        casoId: casoValidoId,
        clienteId: data.clienteId || null,
        responsableId: data.responsableId,
        supervisorId: data.supervisorId || null,
        creadorId: user.id,
      },
    })

    const responsable = await prisma.user.findUnique({
      where: { id: data.responsableId }, select: { nombre: true, apellido: true },
    })
    const nombreResponsable = responsable
      ? `${responsable.nombre ?? ''} ${responsable.apellido ?? ''}`.trim() || "sin definir"
      : "sin definir"

    const tipoLabel = TIPO_TAREA_LABELS[tipoFinal] ?? tipoFinal
    const prioridadLabel = PRIORIDAD_TAREA_LABELS[data.prioridad] ?? data.prioridad

    await prisma.bitacora.create({
      data: {
        texto: `Tarea creada: ${data.titulo}`,
        tipo: "auto", accion: "TAREA_CREADA",
        usuarioId: user.id, casoId: casoValidoId, tareaId: tarea.id,
        detalle: casoValidoId
          ? `Tipo: ${tipoLabel} | Prioridad: ${prioridadLabel} | Responsable: ${nombreResponsable}`
          : `⚠️ Expediente cerrado → evento convertido a Interna | Prioridad: ${prioridadLabel} | Responsable: ${nombreResponsable}`,
      },
    })

    // ⬅ Auto-marcar lectura para el creador (evita autonotificación)
    await marcarLecturaPara(tarea.id, user.id)

    revalidatePath("/gestion-tareas"); revalidatePath("/")
    if (data.casoId) revalidatePath(`/casos/${data.casoId}`)
    return { success: true, tareaId: tarea.id }
  } catch (error) { console.error("Error creando tarea:", error); return { error: "Error al guardar la tarea" } }
}

// ============================================================================
// CAMBIAR ESTADO
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

    if (tarea.estado === "VENCIDA" && tarea.vencidaCerradaEn) {
      return { error: "Esta tarea vencida ya fue cerrada. No se puede modificar." }
    }

    const transicionesPermitidas = TRANSICIONES_VALIDAS[tarea.estado] ?? []
    if (!transicionesPermitidas.includes(nuevoEstado)) return { error: `No se puede pasar de ${tarea.estado} a ${nuevoEstado}` }

    const esResponsable = tarea.responsableId === user.id
    if (!esResponsable) return { error: "Solo el responsable puede cambiar el estado de esta tarea" }

    const dataUpdate: any = { estado: nuevoEstado }
    if (nuevoEstado === "BLOQUEADA") { dataUpdate.motivoBloqueo = motivo; dataUpdate.motivoDesbloqueo = null }
    else if (nuevoEstado === "PENDIENTE" && tarea.estado === "BLOQUEADA") { dataUpdate.motivoDesbloqueo = motivo }
    else { dataUpdate.motivoBloqueo = null; dataUpdate.motivoDesbloqueo = null }
    if (nuevoEstado === "COMPLETADA") dataUpdate.fechaCompletada = new Date()

    await resetearUmbralVencimientoAction(tareaId)
    await prisma.tarea.update({ where: { id: tareaId }, data: dataUpdate })

    const esCompletadaConDemora = tarea.estado === "VENCIDA" && nuevoEstado === "COMPLETADA"
    const esDesbloqueo = tarea.estado === "BLOQUEADA" && nuevoEstado === "PENDIENTE"

    let accionBitacora: string, textoBitacora: string, detalleBitacora: string | null

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
      textoBitacora = `Tarea "${tarea.titulo}" → ${ESTADO_TAREA_LABELS[nuevoEstado] ?? nuevoEstado}`
      detalleBitacora = motivo ? `Motivo: ${motivo}` : null
    }

    await prisma.bitacora.create({
      data: {
        texto: textoBitacora, tipo: "auto", accion: accionBitacora,
        usuarioId: user.id, casoId: tarea.casoId || null, tareaId: tareaId,
        estadoAnterior: tarea.estado, estadoNuevo: nuevoEstado, detalle: detalleBitacora,
      },
    })

    // ⬅ Auto-marcar lectura para quien cambió el estado
    await marcarLecturaPara(tareaId, user.id)

    revalidatePath("/gestion-tareas"); revalidatePath("/")
    if (tarea.casoId) revalidatePath(`/casos/${tarea.casoId}`)
    return { success: true }
  } catch (error) { console.error("Error cambiando estado:", error); return { error: "Error al actualizar el estado" } }
}

// ============================================================================
// CERRAR VENCIDA SIN CUMPLIR
// ============================================================================

export async function cerrarVencidaAction(tareaId: string, motivo: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }
  if (!motivo?.trim()) return { error: "El motivo de cierre es obligatorio" }

  try {
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
      select: { casoId: true, responsableId: true, creadorId: true, supervisorId: true, titulo: true, estado: true, vencidaCerradaEn: true },
    })
    if (!tarea) return { error: "Tarea no encontrada" }
    if (tarea.estado !== "VENCIDA") return { error: "Solo se pueden cerrar tareas vencidas" }
    if (tarea.vencidaCerradaEn) return { error: "Esta tarea ya fue cerrada" }

    const esResponsable = tarea.responsableId === user.id
    if (!esResponsable) return { error: "Solo el responsable puede cambiar el estado de esta tarea" }

    await prisma.tarea.update({
      where: { id: tareaId },
      data: { vencidaCerradaEn: new Date(), vencidaCerradaPorId: user.id, motivoCierreVencida: motivo.trim() },
    })

    await prisma.bitacora.create({
      data: {
        texto: `Tarea vencida "${tarea.titulo}" cerrada sin cumplir`,
        tipo: "auto", accion: "TAREA_VENCIDA_CERRADA_MANUAL",
        usuarioId: user.id, casoId: tarea.casoId || null, tareaId: tareaId,
        detalle: `Motivo: ${motivo.trim()}`,
      },
    })

    // ⬅ Auto-marcar lectura para quien cerró la vencida
    await marcarLecturaPara(tareaId, user.id)

    revalidatePath("/gestion-tareas"); revalidatePath("/")
    if (tarea.casoId) revalidatePath(`/casos/${tarea.casoId}`)
    return { success: true }
  } catch (error) { console.error("Error cerrando vencida:", error); return { error: "Error al cerrar la tarea" } }
}

// ============================================================================
// EDITAR TAREA — con CONTEXTO ADMINISTRATIVO
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
      select: {
        creadorId: true, responsableId: true, supervisorId: true, casoId: true,
        estado: true, titulo: true, vencidaCerradaEn: true,
        responsable: { select: { isActive: true } },
        supervisor: { select: { isActive: true } },
      },
    })
    if (!tarea) return { error: "Tarea no encontrada" }
    if (tarea.estado === "COMPLETADA") return { error: "No se puede editar una tarea completada" }
    if (tarea.vencidaCerradaEn) return { error: "No se puede editar una tarea cerrada" }

    const responsableInactivo = tarea.responsable && !tarea.responsable.isActive
    const supervisorInactivo  = tarea.supervisor  && !tarea.supervisor.isActive
    const esContextoAdmin = !!(responsableInactivo || supervisorInactivo)

    const esCreadorOSupervisor = tarea.creadorId === user.id || tarea.supervisorId === user.id
    const esResponsable = tarea.responsableId === user.id
    const esAbogadoOAsistente = user.rol === "ABOGADO" || user.rol === "ASISTENTE"

    if (esContextoAdmin) {
      if (!esAbogadoOAsistente) {
        return { error: "Sin permisos para editar esta tarea" }
      }
    } else {
      if (!esCreadorOSupervisor && !esResponsable && user.rol !== "ASISTENTE") {
        return { error: "Sin permisos para editar esta tarea" }
      }
    }

    const camposInmutables = ["categoria", "ambito", "clienteId"] as const
    for (const campo of camposInmutables) {
      if (data[campo] !== undefined) {
        return { error: `El campo "${campo}" no se puede modificar después de crear la tarea` }
      }
    }

    const puedeTocarEstructurales = esContextoAdmin
      ? esAbogadoOAsistente
      : (esCreadorOSupervisor || user.rol === "ASISTENTE")

    const camposEstructurales = ["titulo", "prioridad", "responsableId", "supervisorId"] as const
    if (!puedeTocarEstructurales) {
      for (const campo of camposEstructurales) {
        if (data[campo] !== undefined) {
          return { error: `Solo el creador o supervisor puede modificar "${campo}"` }
        }
      }
    }

    if (tarea.casoId && (data.responsableId || data.supervisorId !== undefined)) {
      const responsableFinal = data.responsableId ?? tarea.responsableId
      const supervisorFinal = data.supervisorId === undefined ? tarea.supervisorId : data.supervisorId
      const errorAcceso = await validarAccesoAlCasoParaTarea(tarea.casoId, responsableFinal, supervisorFinal)
      if (errorAcceso) return { error: errorAcceso }
    }

    const updateData: any = {}
    if (data.fechaVencimiento !== undefined) {
      updateData.fechaVencimiento = data.fechaVencimiento === null
        ? null
        : data.fechaVencimiento
          ? new Date(data.fechaVencimiento + "T12:00:00")
          : undefined
    }
    if (data.lugarFisico !== undefined) updateData.lugarFisico = data.lugarFisico?.trim() || null
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion?.trim() || null
    if (data.visibleCliente !== undefined) updateData.visibleCliente = data.visibleCliente

    if (puedeTocarEstructurales) {
      if (data.titulo) updateData.titulo = data.titulo.trim()
      if (data.prioridad) updateData.prioridad = data.prioridad
      if (data.responsableId) updateData.responsableId = data.responsableId
      if (data.supervisorId !== undefined) updateData.supervisorId = data.supervisorId
    }

    const cambiosSignificativos: string[] = []
    if (data.titulo && data.titulo !== tarea.titulo) cambiosSignificativos.push(`Título: "${data.titulo}"`)
    if (data.prioridad) cambiosSignificativos.push(`Prioridad: ${data.prioridad}`)
    if (data.fechaVencimiento !== undefined) cambiosSignificativos.push("Fecha de vencimiento actualizada")
    if (data.responsableId && data.responsableId !== tarea.responsableId) cambiosSignificativos.push("Responsable reasignado")
    if (data.supervisorId !== undefined && data.supervisorId !== tarea.supervisorId) cambiosSignificativos.push("Supervisor reasignado")

    await prisma.tarea.update({ where: { id: tareaId }, data: updateData })

    if (cambiosSignificativos.length > 0) {
      await prisma.bitacora.create({
        data: {
          texto: `Tarea "${tarea.titulo}" editada${esContextoAdmin ? ' (contexto administrativo)' : ''}`,
          tipo: "auto",
          accion: esContextoAdmin ? "TAREA_EDITADA_ADMIN" : "TAREA_EDITADA",
          usuarioId: user.id,
          casoId: tarea.casoId || null,
          tareaId: tareaId,
          detalle: cambiosSignificativos.join(" | "),
        },
      })
    }

    // ⬅ Auto-marcar lectura para quien editó
    await marcarLecturaPara(tareaId, user.id)

    revalidatePath("/gestion-tareas"); revalidatePath("/")
    if (tarea.casoId) revalidatePath(`/casos/${tarea.casoId}`)
    return { success: true }
  } catch (error) { console.error("Error editando tarea:", error); return { error: "Error al editar la tarea" } }
}

// ============================================================================
// CERRAR EVENTO POR TRASPASO DEL ABOGADO (motivo administrativo)
// ============================================================================

export async function cerrarEventoPorTraspasoAbogadoAction(
  tareaId: string,
  motivoExtra?: string,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  try {
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
      select: {
        id: true, titulo: true, casoId: true,
        responsableId: true, supervisorId: true, creadorId: true,
        estado: true, vencidaCerradaEn: true,
        responsable: { select: { isActive: true, nombre: true, apellido: true } },
        supervisor: { select: { isActive: true, nombre: true, apellido: true } },
      },
    })
    if (!tarea) return { error: "Evento no encontrado" }
    if (tarea.estado === "COMPLETADA") return { error: "Este evento ya fue completado" }
    if (tarea.vencidaCerradaEn) return { error: "Este evento ya fue cerrado" }

    const responsableInactivo = tarea.responsable && !tarea.responsable.isActive
    const supervisorInactivo = tarea.supervisor && !tarea.supervisor.isActive
    const esContextoAdmin = !!(responsableInactivo || supervisorInactivo)

    const esResponsableOSupervisor = tarea.responsableId === user.id || tarea.supervisorId === user.id
    const esAbogadoOAsistenteActivo = (user.rol === "ABOGADO" || user.rol === "ASISTENTE")

    const autorizado = esResponsableOSupervisor || (esContextoAdmin && esAbogadoOAsistenteActivo)
    if (!autorizado) {
      return { error: "Sin permisos para cerrar este evento administrativamente" }
    }

    const motivoBase = "Evento cerrado administrativamente por traspaso del abogado"
    const motivoTexto = motivoExtra?.trim()
      ? `${motivoBase}. ${motivoExtra.trim()}`
      : `${motivoBase}.`

    await prisma.tarea.update({
      where: { id: tareaId },
      data: {
        vencidaCerradaEn: new Date(),
        vencidaCerradaPorId: user.id,
        motivoCierreAdmin: 'TRASPASO_ABOGADO',
        motivoCierreVencida: motivoTexto,
      },
    })

    await prisma.bitacora.create({
      data: {
        texto: `Evento "${tarea.titulo}" cerrado por traspaso del abogado`,
        tipo: "auto",
        accion: "TAREA_CERRADA_POR_TRASPASO_ABOGADO",
        usuarioId: user.id,
        casoId: tarea.casoId || null,
        tareaId: tareaId,
        detalle: motivoTexto,
      },
    })

    // ⬅ Auto-marcar lectura para quien cerró
    await marcarLecturaPara(tareaId, user.id)

    revalidatePath("/gestion-tareas"); revalidatePath("/")
    if (tarea.casoId) revalidatePath(`/casos/${tarea.casoId}`)
    return { success: true }
  } catch (error) {
    console.error("Error cerrando evento por traspaso del abogado:", error)
    return { error: "Error al cerrar el evento" }
  }
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
        tipo: "auto", accion: "TAREA_ELIMINADA",
        usuarioId: user.id, casoId: tarea.casoId || null,
      },
    })

    await prisma.tarea.delete({ where: { id: tareaId } })

    revalidatePath("/gestion-tareas"); revalidatePath("/")
    if (tarea.casoId) revalidatePath(`/casos/${tarea.casoId}`)
    return { success: true }
  } catch (error) { console.error("Error eliminando tarea:", error); return { error: "Error al eliminar la tarea" } }
}

// ============================================================================
// CERRAR TAREA POR CASO FINALIZADO
// ============================================================================

export async function cerrarTareaPorCasoFinalizadoAction(tareaId: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  try {
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
      select: {
        casoId: true, responsableId: true, creadorId: true, supervisorId: true,
        titulo: true, estado: true, vencidaCerradaEn: true,
        caso: { select: { estaCerrado: true, esTraspasado: true, estudioDestino: true, motivoCierre: true } },
      },
    })
    if (!tarea) return { error: "Evento no encontrado" }
    if (!tarea.casoId || !tarea.caso) return { error: "Esta acción solo aplica a eventos vinculados a un expediente" }
    if (!tarea.caso.estaCerrado && !tarea.caso.esTraspasado) return { error: "El expediente asociado no está cerrado ni traspasado" }
    if (tarea.estado === "COMPLETADA") return { error: "Este evento ya fue completado" }
    if (tarea.vencidaCerradaEn) return { error: "Este evento ya fue cerrado" }

    const tieneAcceso =
      tarea.responsableId === user.id || tarea.supervisorId === user.id || tarea.creadorId === user.id
    if (!tieneAcceso) return { error: "Solo el responsable, supervisor o creador pueden cerrar este evento" }

    let motivoAuto = ""
    if (tarea.caso.esTraspasado) {
      motivoAuto = "Expediente traspasado a otro estudio"
      if (tarea.caso.estudioDestino) motivoAuto += ` (${tarea.caso.estudioDestino})`
      motivoAuto += ". Evento cerrado automáticamente."
    } else if (tarea.caso.estaCerrado) {
      motivoAuto = `Expediente cerrado${tarea.caso.motivoCierre ? ` (${tarea.caso.motivoCierre})` : ""}. Evento cerrado automáticamente.`
    }

    await prisma.tarea.update({
      where: { id: tareaId },
      data: {
        estado: "VENCIDA",
        vencidaCerradaEn: new Date(),
        vencidaCerradaPorId: user.id,
        motivoCierreVencida: motivoAuto,
        motivoCierreAdmin: tarea.caso.esTraspasado ? 'TRASPASO_EXPEDIENTE' : null,
      },
    })

    await prisma.bitacora.create({
      data: {
        texto: `Evento "${tarea.titulo}" cerrado por finalización del expediente asociado`,
        tipo: "auto", accion: "TAREA_CERRADA_POR_CASO_FINALIZADO",
        usuarioId: user.id, casoId: tarea.casoId, tareaId: tareaId,
        detalle: motivoAuto,
      },
    })

    // ⬅ Auto-marcar lectura para quien cerró por caso finalizado
    await marcarLecturaPara(tareaId, user.id)

    revalidatePath("/gestion-tareas"); revalidatePath("/")
    if (tarea.casoId) revalidatePath(`/casos/${tarea.casoId}`)
    return { success: true }
  } catch (error) {
    console.error("Error cerrando evento por caso finalizado:", error)
    return { error: "Error al cerrar el evento" }
  }
}

// ============================================================================
// MARCAR VENCIDAS — cron, no necesita auto-marcar lectura
// ============================================================================

export async function marcarTareasVencidasAction() {
  try {
    await prisma.tarea.updateMany({
      where: { estado: { in: ["PENDIENTE", "EN_PROCESO", "BLOQUEADA"] }, fechaVencimiento: { lt: new Date() } },
      data: { estado: "VENCIDA" }
    })
    revalidatePath("/gestion-tareas"); revalidatePath("/")
    return { success: true }
  } catch (error) { console.error("Error marcando vencidas:", error); return { error: "Error al marcar vencidas" } }
}