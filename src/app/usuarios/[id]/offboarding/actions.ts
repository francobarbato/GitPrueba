'use server'

// src/app/usuarios/[id]/offboarding/actions.ts
//
// Server actions del flujo de baja gradual de usuarios (offboarding).
//
// CAMBIOS recientes:
//   - Reasignación de cartera propaga eventos vinculados automáticamente
//   - Traspaso de cartera cierra eventos vinculados con TRASPASO_EXPEDIENTE
//   - Asistente en offboarding: acción en lote al titular del expediente
//   - Panel intermedio del admin procesa eventos pendientes uno por uno
//     sin entrar al módulo de eventos (ADMIN es técnico, no entra a /gestion-tareas).
//     Dos actions: reasignarEventoPendienteAction y
//     cerrarEventoPorTraspasoEnOffboardingAction.
//   - ⬇ NUEVO ⬇ Traspaso/desactivación de cliente: cierra eventos libres del
//     cliente con motivo TRASPASO_CLIENTE Y desactiva el portal del cliente
//     (invalidando tokens y sesiones).

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { revalidatePath } from "next/cache"

// ============================================================================
// TIPOS PÚBLICOS
// ============================================================================

export type AbogadoDisponible = {
  id: string
  nombre: string | null
  apellido: string | null
  email: string
}

export type UsuarioDisponible = {
  id: string
  nombre: string | null
  apellido: string | null
  email: string
  rol: string
}

export type CasoOffboarding = {
  id: string
  numero: string
  titulo: string
  estaCerrado: boolean
  fechaCierre: string | null
  eventosActivosUsuarioCount: number
}

export type CarteraOffboarding = {
  cliente: {
    id: string
    nombre: string
    apellido: string | null
    numeroDocumento: string
  }
  casos: CasoOffboarding[]
  eventosActivosCount: number
}

export type ClienteSoloOffboarding = {
  cliente: {
    id: string
    nombre: string
    apellido: string | null
    numeroDocumento: string
  }
}

export type EventoLibrePendiente = {
  id: string
  titulo: string
  fechaVencimiento: string | null
  esResponsable: boolean
  esSupervisor: boolean
  // Si el evento tiene caso (huérfano que no se pudo auto-resolver), info para mostrar
  caso: { id: string; numero: string; titulo: string } | null
}

export type EstadoCuentaUsuario = {
  usuario: {
    id: string
    nombre: string | null
    apellido: string | null
    email: string
    rol: string
    isActive: boolean
  }
  carteras: CarteraOffboarding[]
  clientesSinCasos: ClienteSoloOffboarding[]
  eventosActivosTotal: number
  eventosVinculadosCount: number
  eventosLibresPendientes: EventoLibrePendiente[]
  contadores: {
    carteras: number
    clientesSinCasos: number
    eventosActivos: number
    eventosVinculados: number
    eventosLibres: number
  }
  abogadosDisponibles: AbogadoDisponible[]
  usuariosActivosParaReasignacion: UsuarioDisponible[]
  esAdminUnico: boolean
  puedeDesactivarse: boolean
  motivoBloqueo: string | null
}

// ============================================================================
// HELPERS PRIVADOS
// ============================================================================

const TAREAS_ACTIVAS = {
  estado: { not: 'COMPLETADA' as const },
  vencidaCerradaEn: null,
}

async function verificarAdmin() {
  const user = await getUserSessionServer()
  if (!user || user.rol !== 'ADMIN') {
    throw new Error("No autorizado. Solo administradores pueden ejecutar esta acción.")
  }
  return user
}

function formatearNombre(u: { nombre?: string | null; apellido?: string | null; email?: string }): string {
  const partes = `${u.nombre || ''} ${u.apellido || ''}`.trim()
  return partes || u.email || 'usuario desconocido'
}

async function contarCasosHuerfanos(userId: string): Promise<number> {
  return prisma.caso.count({
    where: {
      abogadoId: userId,
      cliente: { abogadoId: { not: userId } }
    }
  })
}

// ============================================================================
// 1. GET ESTADO DE CUENTA
// ============================================================================

export async function getEstadoCuentaUsuario(userId: string): Promise<EstadoCuentaUsuario> {
  await verificarAdmin()

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, nombre: true, apellido: true, email: true,
      rol: true, isActive: true,
    },
  })
  if (!usuario) throw new Error("Usuario no encontrado")

  let esAdminUnico = false
  if (usuario.rol === 'ADMIN' && usuario.isActive) {
    const adminsActivos = await prisma.user.count({
      where: { rol: 'ADMIN', isActive: true }
    })
    esAdminUnico = adminsActivos <= 1
  }

  // ════ EVENTOS DEL USUARIO ════
  const eventosVinculadosCount = await prisma.tarea.count({
    where: {
      OR: [{ responsableId: userId }, { supervisorId: userId }],
      casoId: { not: null },
      ...TAREAS_ACTIVAS,
    }
  })

  // Eventos libres (sin caso) — se procesan uno por uno desde el panel intermedio.
  // También sumamos eventos vinculados HUÉRFANOS: aquellos donde el titular del
  // caso también está inactivo, ya que la acción en lote no los pudo resolver.
  // Se identifican aquí para mostrarlos al admin.
  const eventosLibresRaw = await prisma.tarea.findMany({
    where: {
      OR: [{ responsableId: userId }, { supervisorId: userId }],
      casoId: null,
      ...TAREAS_ACTIVAS,
    },
    select: {
      id: true, titulo: true, fechaVencimiento: true,
      responsableId: true, supervisorId: true,
    },
    orderBy: { fechaVencimiento: 'asc' },
  })

  const eventosLibresPendientes: EventoLibrePendiente[] = eventosLibresRaw.map(t => ({
    id: t.id,
    titulo: t.titulo,
    fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null,
    esResponsable: t.responsableId === userId,
    esSupervisor: t.supervisorId === userId,
    caso: null,
  }))

  const eventosActivosTotal = eventosVinculadosCount + eventosLibresPendientes.length

  const abogadosDisponibles = await prisma.user.findMany({
    where: { rol: 'ABOGADO', isActive: true, id: { not: userId } },
    select: { id: true, nombre: true, apellido: true, email: true },
    orderBy: { nombre: 'asc' },
  })

  // Para los selectores del panel intermedio: cualquier ABOGADO o ASISTENTE activo
  const usuariosActivosParaReasignacion = await prisma.user.findMany({
    where: { rol: { in: ['ABOGADO', 'ASISTENTE'] }, isActive: true, id: { not: userId } },
    select: { id: true, nombre: true, apellido: true, email: true, rol: true },
    orderBy: [{ rol: 'asc' }, { nombre: 'asc' }],
  })

  // ════ ASISTENTE ════
  if (usuario.rol === 'ASISTENTE') {
    const puedeDesactivarse =
      eventosVinculadosCount === 0 &&
      eventosLibresPendientes.length === 0 &&
      !esAdminUnico

    return {
      usuario,
      carteras: [],
      clientesSinCasos: [],
      eventosActivosTotal,
      eventosVinculadosCount,
      eventosLibresPendientes,
      contadores: {
        carteras: 0, clientesSinCasos: 0,
        eventosActivos: eventosActivosTotal,
        eventosVinculados: eventosVinculadosCount,
        eventosLibres: eventosLibresPendientes.length,
      },
      abogadosDisponibles,
      usuariosActivosParaReasignacion,
      esAdminUnico,
      puedeDesactivarse,
      motivoBloqueo: esAdminUnico
        ? 'Es el único administrador activo del sistema'
        : eventosVinculadosCount > 0
          ? `Tiene ${eventosVinculadosCount} evento(s) vinculado(s) a expediente. Reasignalos al titular desde este panel.`
          : eventosLibresPendientes.length > 0
            ? `Tiene ${eventosLibresPendientes.length} evento(s) libre(s). Procesalos uno por uno desde la sección de eventos pendientes.`
            : null,
    }
  }

  // ════ NO ABOGADO Y NO ASISTENTE (ej. ADMIN) ════
  if (usuario.rol !== 'ABOGADO') {
    const puedeDesactivarse = eventosActivosTotal === 0 && !esAdminUnico
    return {
      usuario,
      carteras: [],
      clientesSinCasos: [],
      eventosActivosTotal,
      eventosVinculadosCount,
      eventosLibresPendientes,
      contadores: {
        carteras: 0, clientesSinCasos: 0,
        eventosActivos: eventosActivosTotal,
        eventosVinculados: eventosVinculadosCount,
        eventosLibres: eventosLibresPendientes.length,
      },
      abogadosDisponibles,
      usuariosActivosParaReasignacion,
      esAdminUnico,
      puedeDesactivarse,
      motivoBloqueo: esAdminUnico
        ? 'Es el único administrador activo del sistema'
        : eventosActivosTotal > 0
          ? `Tiene ${eventosActivosTotal} evento(s) activo(s) pendientes`
          : null,
    }
  }

  // ════ ABOGADO ════
  const clientesDelUser = await prisma.cliente.findMany({
    where: { abogadoId: userId, activo: true },
    select: {
      id: true, nombre: true, apellido: true, numeroDocumento: true,
      casos: {
        select: {
          id: true, numero: true, titulo: true, estaCerrado: true,
          fechaCierre: true,
          tareas: {
            where: {
              OR: [{ responsableId: userId }, { supervisorId: userId }],
              ...TAREAS_ACTIVAS,
            },
            select: { id: true },
          }
        },
        orderBy: { createdAt: 'desc' },
      }
    },
    orderBy: { nombre: 'asc' },
  })

  const casosHuerfanos = await contarCasosHuerfanos(userId)
  if (casosHuerfanos > 0) {
    console.warn(`[offboarding] Usuario ${userId} tiene ${casosHuerfanos} expediente(s) huérfanos (invariante rota).`)
  }

  const carteras: CarteraOffboarding[] = clientesDelUser
    .filter(c => c.casos.length > 0)
    .map(c => {
      const casos: CasoOffboarding[] = c.casos.map(caso => ({
        id: caso.id,
        numero: caso.numero,
        titulo: caso.titulo,
        estaCerrado: caso.estaCerrado,
        fechaCierre: caso.fechaCierre?.toISOString() ?? null,
        eventosActivosUsuarioCount: caso.tareas.length,
      }))
      return {
        cliente: {
          id: c.id, nombre: c.nombre, apellido: c.apellido, numeroDocumento: c.numeroDocumento,
        },
        casos,
        eventosActivosCount: casos.reduce((s, x) => s + x.eventosActivosUsuarioCount, 0),
      }
    })

  const clientesSinCasos: ClienteSoloOffboarding[] = clientesDelUser
    .filter(c => c.casos.length === 0)
    .map(c => ({
      cliente: {
        id: c.id, nombre: c.nombre, apellido: c.apellido, numeroDocumento: c.numeroDocumento,
      },
    }))

  const puedeDesactivarse =
    carteras.length === 0 &&
    clientesSinCasos.length === 0 &&
    eventosLibresPendientes.length === 0 &&
    casosHuerfanos === 0 &&
    !esAdminUnico

  let motivoBloqueo: string | null = null
  if (esAdminUnico) {
    motivoBloqueo = 'Es el único administrador activo del sistema'
  } else if (casosHuerfanos > 0) {
    motivoBloqueo = `Hay ${casosHuerfanos} expediente(s) con datos inconsistentes. Contactá al soporte técnico.`
  } else if (carteras.length > 0) {
    motivoBloqueo = `Quedan ${carteras.length} cartera(s) sin reasignar`
  } else if (clientesSinCasos.length > 0) {
    motivoBloqueo = `Quedan ${clientesSinCasos.length} cliente(s) sin reasignar`
  } else if (eventosLibresPendientes.length > 0) {
    motivoBloqueo = `Quedan ${eventosLibresPendientes.length} evento(s) libre(s) sin procesar.`
  }

  return {
    usuario,
    carteras,
    clientesSinCasos,
    eventosActivosTotal,
    eventosVinculadosCount,
    eventosLibresPendientes,
    contadores: {
      carteras: carteras.length,
      clientesSinCasos: clientesSinCasos.length,
      eventosActivos: eventosActivosTotal,
      eventosVinculados: eventosVinculadosCount,
      eventosLibres: eventosLibresPendientes.length,
    },
    abogadosDisponibles,
    usuariosActivosParaReasignacion,
    esAdminUnico,
    puedeDesactivarse,
    motivoBloqueo,
  }
}

// ============================================================================
// 2. REASIGNAR CARTERA
// ============================================================================

export type AccionCartera =
  | { tipo: 'reasignar'; abogadoDestinoId: string }
  | { tipo: 'traspasar'; estudioDestino?: string; motivoTraspaso?: string }

export async function reasignarCarteraAction(
  clienteId: string,
  userIdQueSeVa: string,
  accion: AccionCartera,
): Promise<{ success: true; mensaje: string } | { error: string }> {
  try {
    const admin = await verificarAdmin()

    // ⬇ MODIFICADO: Agregamos usuarioPortalId al select para poder gestionar
    // la baja del portal del cliente cuando se traspasa fuera del estudio.
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true, nombre: true, apellido: true,
        abogadoId: true, activo: true,
        usuarioPortalId: true,  // ⬅ NUEVO
      },
    })
    if (!cliente) return { error: "Cliente no encontrado" }
    if (cliente.abogadoId !== userIdQueSeVa) return { error: "El cliente no pertenece al usuario indicado" }
    if (!cliente.activo) return { error: "El cliente ya está desactivado" }

    const casos = await prisma.caso.findMany({
      where: { clienteId },
      select: { id: true, numero: true },
    })
    const casoIds = casos.map(c => c.id)

    const usuario = await prisma.user.findUnique({
      where: { id: userIdQueSeVa },
      select: { nombre: true, apellido: true, email: true },
    })
    if (!usuario) return { error: "Usuario que se desactiva no encontrado" }
    const nombreUsuario = formatearNombre(usuario)
    const clienteNombre = `${cliente.nombre} ${cliente.apellido || ''}`.trim()

    if (accion.tipo === 'reasignar') {
      const destino = await prisma.user.findFirst({
        where: { id: accion.abogadoDestinoId, isActive: true, rol: 'ABOGADO' },
        select: { id: true, nombre: true, apellido: true },
      })
      if (!destino) return { error: "Abogado destino no válido o inactivo" }
      const nombreDestino = formatearNombre(destino)

      const tareasAPropagar = casoIds.length > 0
        ? await prisma.tarea.findMany({
            where: {
              casoId: { in: casoIds },
              OR: [{ responsableId: userIdQueSeVa }, { supervisorId: userIdQueSeVa }],
              ...TAREAS_ACTIVAS,
            },
            select: { id: true, titulo: true, casoId: true, responsableId: true, supervisorId: true },
          })
        : []

      await prisma.$transaction(async (tx) => {
        await tx.cliente.update({
          where: { id: clienteId },
          data: { abogadoId: destino.id },
        })

        if (casoIds.length > 0) {
          await tx.caso.updateMany({
            where: { id: { in: casoIds } },
            data: {
              abogadoId: destino.id,
              recibidoEnReasignacion: true,
              fechaReasignacion: new Date(),
            },
          })

          for (const c of casos) {
            await tx.bitacora.create({
              data: {
                casoId: c.id,
                texto: `Expediente reasignado de ${nombreUsuario} a ${nombreDestino} por offboarding (cartera de ${clienteNombre})`,
                tipo: 'auto',
                accion: 'Reasignación por Desactivación',
                usuarioId: admin.id,
              }
            })
          }
        }

        for (const t of tareasAPropagar) {
          const data: any = {}
          if (t.responsableId === userIdQueSeVa) data.responsableId = destino.id
          if (t.supervisorId === userIdQueSeVa) data.supervisorId = destino.id

          await tx.tarea.update({ where: { id: t.id }, data })

          await tx.bitacora.create({
            data: {
              texto: `Evento "${t.titulo}" reasignado por offboarding`,
              tipo: 'auto',
              accion: 'TAREA_REASIGNADA_POR_OFFBOARDING',
              usuarioId: admin.id,
              casoId: t.casoId,
              tareaId: t.id,
              detalle: `Propagación automática del expediente: ${nombreUsuario} → ${nombreDestino}`,
            },
          })
        }

        await tx.bitacora.create({
          data: {
            texto: `Cartera de ${clienteNombre} reasignada de ${nombreUsuario} a ${nombreDestino}${casoIds.length > 0 ? ` (${casoIds.length} expediente(s), ${tareasAPropagar.length} evento(s) propagado(s))` : ''}`,
            tipo: 'auto',
            accion: 'Reasignación de Cliente',
            usuarioId: admin.id,
          }
        })
      })

      revalidatePath(`/usuarios/${userIdQueSeVa}/offboarding`)
      revalidatePath('/clientes')
      revalidatePath('/casos')
      revalidatePath('/gestion-tareas')
      return {
        success: true,
        mensaje: `Cartera de ${clienteNombre} reasignada a ${nombreDestino}${tareasAPropagar.length > 0 ? ` (${tareasAPropagar.length} evento(s) propagado(s))` : ''}.`
      }
    }

    // ────── TRASPASO ──────
    const estudioDestino = accion.estudioDestino?.trim() || null
    const motivoTraspaso = accion.motivoTraspaso?.trim() || null

    const tareasACerrar = casoIds.length > 0
      ? await prisma.tarea.findMany({
          where: {
            casoId: { in: casoIds },
            ...TAREAS_ACTIVAS,
          },
          select: { id: true, titulo: true, casoId: true },
        })
      : []

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⬇ NUEVO ⬇ Bug 9 — Buscar eventos libres del cliente (sin caso) que
    // estén activos. Estos se cierran con motivo TRASPASO_CLIENTE porque
    // pierden sentido cuando el cliente se va del estudio.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const tareasLibresDelCliente = await prisma.tarea.findMany({
      where: {
        clienteId: clienteId,
        casoId: null,
        ...TAREAS_ACTIVAS,
      },
      select: { id: true, titulo: true },
    })

    await prisma.$transaction(async (tx) => {
      if (casoIds.length > 0) {
        await tx.caso.updateMany({
          where: { id: { in: casoIds } },
          data: {
            estaCerrado: true,
            esTraspasado: true,
            fechaTraspaso: new Date(),
            estudioDestino,
            motivoTraspaso,
          },
        })

        for (const c of casos) {
          const det = estudioDestino ? ` (destino: ${estudioDestino})` : ""
          await tx.bitacora.create({
            data: {
              casoId: c.id,
              texto: `Expediente traspasado a otro estudio por offboarding de ${nombreUsuario}${det}`,
              tipo: 'auto',
              accion: 'Traspaso a Otro Estudio',
              usuarioId: admin.id,
            }
          })
        }
      }

      if (tareasACerrar.length > 0) {
        const motivoTexto = `Expediente traspasado a otro estudio${estudioDestino ? ` (${estudioDestino})` : ''}. Cierre automático por offboarding.`

        await tx.tarea.updateMany({
          where: { id: { in: tareasACerrar.map(t => t.id) } },
          data: {
            vencidaCerradaEn: new Date(),
            vencidaCerradaPorId: admin.id,
            motivoCierreAdmin: 'TRASPASO_EXPEDIENTE',
            motivoCierreVencida: motivoTexto,
          },
        })

        for (const t of tareasACerrar) {
          await tx.bitacora.create({
            data: {
              texto: `Evento "${t.titulo}" cerrado automáticamente por traspaso del expediente`,
              tipo: 'auto',
              accion: 'TAREA_CERRADA_POR_TRASPASO_EXPEDIENTE',
              usuarioId: admin.id,
              casoId: t.casoId,
              tareaId: t.id,
              detalle: motivoTexto,
            },
          })
        }
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ⬇ NUEVO ⬇ Bug 9 — Cerrar eventos libres del cliente
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (tareasLibresDelCliente.length > 0) {
        const motivoLibre = `Cliente traspasado a otro estudio${estudioDestino ? ` (${estudioDestino})` : ''}. Cierre automático del evento libre.`

        await tx.tarea.updateMany({
          where: { id: { in: tareasLibresDelCliente.map(t => t.id) } },
          data: {
            vencidaCerradaEn: new Date(),
            vencidaCerradaPorId: admin.id,
            motivoCierreAdmin: 'TRASPASO_CLIENTE',
            motivoCierreVencida: motivoLibre,
          },
        })

        for (const t of tareasLibresDelCliente) {
          await tx.bitacora.create({
            data: {
              texto: `Evento libre "${t.titulo}" cerrado automáticamente por traspaso del cliente`,
              tipo: 'auto',
              accion: 'TAREA_CERRADA_POR_TRASPASO_CLIENTE',
              usuarioId: admin.id,
              tareaId: t.id,
              detalle: motivoLibre,
            },
          })
        }
      }

      // Desactivar el cliente del estudio
      await tx.cliente.update({
        where: { id: clienteId },
        data: { activo: false },
      })

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ⬇ NUEVO ⬇ Bug 8 — Desactivar portal del cliente
      // Si el cliente tiene usuario de portal, lo desactivamos, invalidamos
      // sus tokens de activación pendientes y limpiamos sus sesiones para
      // que no pueda volver a entrar.
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (cliente.usuarioPortalId) {
        await tx.user.update({
          where: { id: cliente.usuarioPortalId },
          data: { isActive: false },
        })
        await tx.accountActivationToken.updateMany({
          where: { userId: cliente.usuarioPortalId, usedAt: null },
          data: { usedAt: new Date() },
        })
        await tx.session.deleteMany({
          where: { userId: cliente.usuarioPortalId },
        })

        await tx.bitacora.create({
          data: {
            texto: `Portal del cliente ${clienteNombre} desactivado automáticamente por traspaso fuera del estudio`,
            tipo: 'auto',
            accion: 'PORTAL_CLIENTE_DESACTIVADO_POR_TRASPASO',
            usuarioId: admin.id,
          }
        })
      }

      // Bitácora de cierre del traspaso
      const detalles: string[] = []
      if (casoIds.length > 0) detalles.push(`${casoIds.length} expediente(s)`)
      if (tareasACerrar.length > 0) detalles.push(`${tareasACerrar.length} evento(s) de expediente`)
      if (tareasLibresDelCliente.length > 0) detalles.push(`${tareasLibresDelCliente.length} evento(s) libre(s)`)
      if (cliente.usuarioPortalId) detalles.push('portal desactivado')
      const detallesStr = detalles.length > 0 ? ` (${detalles.join(', ')})` : ''

      await tx.bitacora.create({
        data: {
          texto: `Cartera de ${clienteNombre} traspasada a otro estudio por offboarding de ${nombreUsuario}. Cliente desactivado${detallesStr}.`,
          tipo: 'auto',
          accion: 'Desactivación de Cliente por Offboarding',
          usuarioId: admin.id,
        }
      })
    })

    revalidatePath(`/usuarios/${userIdQueSeVa}/offboarding`)
    revalidatePath('/clientes')
    revalidatePath('/casos')
    revalidatePath('/gestion-tareas')
    revalidatePath('/portal')  // ⬅ NUEVO: por si el cliente tenía sesión abierta

    // Mensaje de éxito con detalles
    const partesMsg: string[] = []
    if (tareasACerrar.length > 0) partesMsg.push(`${tareasACerrar.length} evento(s) de expediente cerrado(s)`)
    if (tareasLibresDelCliente.length > 0) partesMsg.push(`${tareasLibresDelCliente.length} evento(s) libre(s) cerrado(s)`)
    if (cliente.usuarioPortalId) partesMsg.push('portal desactivado')
    const detalleMsg = partesMsg.length > 0 ? ` (${partesMsg.join(', ')})` : ''

    return {
      success: true,
      mensaje: `Cartera de ${clienteNombre} traspasada${detalleMsg}. Cliente desactivado.`
    }
  } catch (error: any) {
    console.error('Error en reasignarCarteraAction:', error)
    return { error: error.message || 'Error al procesar la cartera' }
  }
}

// ============================================================================
// 3. REASIGNAR CLIENTE SIN EXPEDIENTES
// ============================================================================

export type AccionCliente =
  | { tipo: 'reasignar'; abogadoDestinoId: string }
  | { tipo: 'desactivar' }

export async function reasignarClienteSoloAction(
  clienteId: string,
  userIdQueSeVa: string,
  accion: AccionCliente,
): Promise<{ success: true; mensaje: string } | { error: string }> {
  try {
    const admin = await verificarAdmin()

    // ⬇ MODIFICADO: incluimos usuarioPortalId para gestionar el portal al desactivar
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true, nombre: true, apellido: true,
        abogadoId: true, activo: true,
        usuarioPortalId: true,  // ⬅ NUEVO
      },
    })
    if (!cliente) return { error: "Cliente no encontrado" }
    if (cliente.abogadoId !== userIdQueSeVa) return { error: "El cliente no pertenece al usuario indicado" }
    if (!cliente.activo) return { error: "El cliente ya está desactivado" }

    const cualquierCaso = await prisma.caso.count({ where: { clienteId } })
    if (cualquierCaso > 0) {
      return { error: "El cliente tiene expedientes. Usá la reasignación de cartera completa." }
    }

    const usuario = await prisma.user.findUnique({
      where: { id: userIdQueSeVa },
      select: { nombre: true, apellido: true, email: true },
    })
    if (!usuario) return { error: "Usuario no encontrado" }
    const nombreUsuario = formatearNombre(usuario)
    const clienteNombre = `${cliente.nombre} ${cliente.apellido || ''}`.trim()

    if (accion.tipo === 'reasignar') {
      const destino = await prisma.user.findFirst({
        where: { id: accion.abogadoDestinoId, isActive: true, rol: 'ABOGADO' },
        select: { id: true, nombre: true, apellido: true },
      })
      if (!destino) return { error: "Abogado destino no válido o inactivo" }
      const nombreDestino = formatearNombre(destino)

      await prisma.$transaction([
        prisma.cliente.update({
          where: { id: clienteId },
          data: { abogadoId: destino.id },
        }),
        prisma.bitacora.create({
          data: {
            texto: `Cliente ${clienteNombre} reasignado de ${nombreUsuario} a ${nombreDestino} por offboarding (sin expedientes)`,
            tipo: 'auto',
            accion: 'Reasignación de Cliente',
            usuarioId: admin.id,
          }
        }),
      ])

      revalidatePath(`/usuarios/${userIdQueSeVa}/offboarding`)
      revalidatePath('/clientes')
      return { success: true, mensaje: `Cliente ${clienteNombre} reasignado a ${nombreDestino}.` }
    }

    // ────── DESACTIVAR ──────
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⬇ NUEVO ⬇ Bug 9 — Buscar eventos libres del cliente
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const tareasLibresDelCliente = await prisma.tarea.findMany({
      where: {
        clienteId: clienteId,
        casoId: null,
        ...TAREAS_ACTIVAS,
      },
      select: { id: true, titulo: true },
    })

    await prisma.$transaction(async (tx) => {
      // 1. Desactivar el cliente
      await tx.cliente.update({
        where: { id: clienteId },
        data: { activo: false },
      })

      // 2. NUEVO Bug 9 — Cerrar eventos libres del cliente
      if (tareasLibresDelCliente.length > 0) {
        const motivoLibre = `Cliente desactivado del estudio por offboarding de ${nombreUsuario}. Cierre automático del evento libre.`

        await tx.tarea.updateMany({
          where: { id: { in: tareasLibresDelCliente.map(t => t.id) } },
          data: {
            vencidaCerradaEn: new Date(),
            vencidaCerradaPorId: admin.id,
            motivoCierreAdmin: 'TRASPASO_CLIENTE',
            motivoCierreVencida: motivoLibre,
          },
        })

        for (const t of tareasLibresDelCliente) {
          await tx.bitacora.create({
            data: {
              texto: `Evento libre "${t.titulo}" cerrado automáticamente por desactivación del cliente`,
              tipo: 'auto',
              accion: 'TAREA_CERRADA_POR_TRASPASO_CLIENTE',
              usuarioId: admin.id,
              tareaId: t.id,
              detalle: motivoLibre,
            },
          })
        }
      }

      // 3. NUEVO Bug 8 — Desactivar portal del cliente
      if (cliente.usuarioPortalId) {
        await tx.user.update({
          where: { id: cliente.usuarioPortalId },
          data: { isActive: false },
        })
        await tx.accountActivationToken.updateMany({
          where: { userId: cliente.usuarioPortalId, usedAt: null },
          data: { usedAt: new Date() },
        })
        await tx.session.deleteMany({
          where: { userId: cliente.usuarioPortalId },
        })

        await tx.bitacora.create({
          data: {
            texto: `Portal del cliente ${clienteNombre} desactivado automáticamente por desactivación del cliente`,
            tipo: 'auto',
            accion: 'PORTAL_CLIENTE_DESACTIVADO_POR_TRASPASO',
            usuarioId: admin.id,
          }
        })
      }

      // 4. Bitácora de cierre
      const detalles: string[] = []
      if (tareasLibresDelCliente.length > 0) detalles.push(`${tareasLibresDelCliente.length} evento(s) libre(s) cerrado(s)`)
      if (cliente.usuarioPortalId) detalles.push('portal desactivado')
      const detallesStr = detalles.length > 0 ? ` (${detalles.join(', ')})` : ''

      await tx.bitacora.create({
        data: {
          texto: `Cliente ${clienteNombre} desactivado por offboarding de ${nombreUsuario} (sin expedientes)${detallesStr}`,
          tipo: 'auto',
          accion: 'Desactivación de Cliente por Offboarding',
          usuarioId: admin.id,
        }
      })
    })

    revalidatePath(`/usuarios/${userIdQueSeVa}/offboarding`)
    revalidatePath('/clientes')
    revalidatePath('/portal')  // ⬅ NUEVO

    // Mensaje con detalles
    const partesMsg: string[] = []
    if (tareasLibresDelCliente.length > 0) partesMsg.push(`${tareasLibresDelCliente.length} evento(s) libre(s) cerrado(s)`)
    if (cliente.usuarioPortalId) partesMsg.push('portal desactivado')
    const detalleMsg = partesMsg.length > 0 ? ` (${partesMsg.join(', ')})` : ''

    return { success: true, mensaje: `Cliente ${clienteNombre} desactivado${detalleMsg}.` }
  } catch (error: any) {
    console.error('Error en reasignarClienteSoloAction:', error)
    return { error: error.message || 'Error al procesar el cliente' }
  }
}

// ============================================================================
// 4. REASIGNAR EVENTOS VINCULADOS EN LOTE (asistente principalmente)
// ============================================================================

export async function reasignarEventosExpedienteDelUsuarioAction(
  userIdQueSeVa: string,
): Promise<{ success: true; mensaje: string; cantidad: number } | { error: string }> {
  try {
    const admin = await verificarAdmin()

    const usuario = await prisma.user.findUnique({
      where: { id: userIdQueSeVa },
      select: { nombre: true, apellido: true, email: true, rol: true },
    })
    if (!usuario) return { error: "Usuario no encontrado" }
    const nombreUsuario = formatearNombre(usuario)

    const tareasAPropagar = await prisma.tarea.findMany({
      where: {
        OR: [{ responsableId: userIdQueSeVa }, { supervisorId: userIdQueSeVa }],
        casoId: { not: null },
        ...TAREAS_ACTIVAS,
      },
      select: {
        id: true, titulo: true, casoId: true, responsableId: true, supervisorId: true,
        caso: { select: { abogadoId: true, numero: true } },
      },
    })

    if (tareasAPropagar.length === 0) {
      return { success: true, mensaje: "No hay eventos vinculados a expediente para reasignar.", cantidad: 0 }
    }

    let cantidadEfectiva = 0
    await prisma.$transaction(async (tx) => {
      for (const t of tareasAPropagar) {
        if (!t.caso) continue
        const titularCasoId = t.caso.abogadoId

        if (titularCasoId === userIdQueSeVa) continue

        const titular = await tx.user.findUnique({
          where: { id: titularCasoId },
          select: { isActive: true, nombre: true, apellido: true },
        })
        if (!titular || !titular.isActive) continue

        const data: any = {}
        if (t.responsableId === userIdQueSeVa) data.responsableId = titularCasoId
        if (t.supervisorId === userIdQueSeVa) data.supervisorId = titularCasoId

        if (Object.keys(data).length === 0) continue

        await tx.tarea.update({ where: { id: t.id }, data })

        const nombreTitular = formatearNombre(titular)
        await tx.bitacora.create({
          data: {
            texto: `Evento "${t.titulo}" reasignado al titular del expediente por offboarding`,
            tipo: 'auto',
            accion: 'TAREA_REASIGNADA_AL_TITULAR_DEL_CASO',
            usuarioId: admin.id,
            casoId: t.casoId,
            tareaId: t.id,
            detalle: `${nombreUsuario} → ${nombreTitular} (titular del expediente ${t.caso.numero})`,
          },
        })
        cantidadEfectiva++
      }
    })

    revalidatePath(`/usuarios/${userIdQueSeVa}/offboarding`)
    revalidatePath('/gestion-tareas')
    revalidatePath('/')

    return {
      success: true,
      mensaje: `${cantidadEfectiva} evento(s) reasignado(s) al titular del expediente.`,
      cantidad: cantidadEfectiva,
    }
  } catch (error: any) {
    console.error('Error en reasignarEventosExpedienteDelUsuarioAction:', error)
    return { error: error.message || 'Error al reasignar los eventos' }
  }
}

// ============================================================================
// 5. REASIGNAR UN EVENTO INDIVIDUAL DESDE EL PANEL DE OFFBOARDING
// ============================================================================

export async function reasignarEventoPendienteAction(
  tareaId: string,
  userIdQueSeVa: string,
  destinoId: string,
): Promise<{ success: true; mensaje: string } | { error: string }> {
  try {
    const admin = await verificarAdmin()

    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
      select: {
        id: true, titulo: true, casoId: true,
        responsableId: true, supervisorId: true,
        estado: true, vencidaCerradaEn: true,
      },
    })
    if (!tarea) return { error: "Evento no encontrado" }
    if (tarea.estado === "COMPLETADA") return { error: "El evento ya fue completado" }
    if (tarea.vencidaCerradaEn) return { error: "El evento ya fue cerrado" }

    const elSalienteEsResponsable = tarea.responsableId === userIdQueSeVa
    const elSalienteEsSupervisor = tarea.supervisorId === userIdQueSeVa
    if (!elSalienteEsResponsable && !elSalienteEsSupervisor) {
      return { error: "El usuario que se va no figura en este evento" }
    }

    const destino = await prisma.user.findUnique({
      where: { id: destinoId },
      select: { id: true, nombre: true, apellido: true, email: true, rol: true, isActive: true },
    })
    if (!destino) return { error: "Usuario destino no encontrado" }
    if (!destino.isActive) return { error: "El usuario destino está inactivo" }
    if (destino.rol !== 'ABOGADO' && destino.rol !== 'ASISTENTE') {
      return { error: "El destino debe ser un abogado o asistente" }
    }
    if (destino.id === userIdQueSeVa) return { error: "No se puede reasignar al mismo usuario" }

    const usuario = await prisma.user.findUnique({
      where: { id: userIdQueSeVa },
      select: { nombre: true, apellido: true, email: true },
    })
    const nombreUsuario = formatearNombre(usuario ?? {})
    const nombreDestino = formatearNombre(destino)

    const data: any = {}
    const cambios: string[] = []
    if (elSalienteEsResponsable) {
      data.responsableId = destino.id
      cambios.push("responsable")
    }
    if (elSalienteEsSupervisor) {
      data.supervisorId = destino.id
      cambios.push("supervisor")
    }

    await prisma.$transaction([
      prisma.tarea.update({ where: { id: tareaId }, data }),
      prisma.bitacora.create({
        data: {
          texto: `Evento "${tarea.titulo}" reasignado por offboarding`,
          tipo: 'auto',
          accion: 'TAREA_REASIGNADA_DESDE_OFFBOARDING',
          usuarioId: admin.id,
          casoId: tarea.casoId || null,
          tareaId: tareaId,
          detalle: `${nombreUsuario} → ${nombreDestino} (${cambios.join(' y ')})`,
        },
      }),
    ])

    revalidatePath(`/usuarios/${userIdQueSeVa}/offboarding`)
    revalidatePath('/gestion-tareas')
    revalidatePath('/')
    if (tarea.casoId) revalidatePath(`/casos/${tarea.casoId}`)

    return {
      success: true,
      mensaje: `Evento reasignado a ${nombreDestino} (${cambios.join(' y ')}).`,
    }
  } catch (error: any) {
    console.error('Error en reasignarEventoPendienteAction:', error)
    return { error: error.message || 'Error al reasignar el evento' }
  }
}

// ============================================================================
// 6. CIERRE POR TRASPASO DEL ABOGADO DESDE EL PANEL DE OFFBOARDING
// ============================================================================

export async function cerrarEventoPorTraspasoEnOffboardingAction(
  tareaId: string,
  userIdQueSeVa: string,
  motivoExtra?: string,
): Promise<{ success: true; mensaje: string } | { error: string }> {
  try {
    const admin = await verificarAdmin()

    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
      select: {
        id: true, titulo: true, casoId: true,
        responsableId: true, supervisorId: true,
        estado: true, vencidaCerradaEn: true,
      },
    })
    if (!tarea) return { error: "Evento no encontrado" }
    if (tarea.estado === "COMPLETADA") return { error: "El evento ya fue completado" }
    if (tarea.vencidaCerradaEn) return { error: "El evento ya fue cerrado" }

    const elSalienteFigura =
      tarea.responsableId === userIdQueSeVa ||
      tarea.supervisorId === userIdQueSeVa
    if (!elSalienteFigura) {
      return { error: "El usuario que se va no figura en este evento" }
    }

    const usuario = await prisma.user.findUnique({
      where: { id: userIdQueSeVa },
      select: { nombre: true, apellido: true, email: true },
    })
    const nombreUsuario = formatearNombre(usuario ?? {})

    const motivoBase = `Cerrado por traspaso del abogado en offboarding de ${nombreUsuario}`
    const motivoTexto = motivoExtra?.trim()
      ? `${motivoBase}. ${motivoExtra.trim()}`
      : `${motivoBase}.`

    await prisma.$transaction([
      prisma.tarea.update({
        where: { id: tareaId },
        data: {
          vencidaCerradaEn: new Date(),
          vencidaCerradaPorId: admin.id,
          motivoCierreAdmin: 'TRASPASO_ABOGADO',
          motivoCierreVencida: motivoTexto,
        },
      }),
      prisma.bitacora.create({
        data: {
          texto: `Evento "${tarea.titulo}" cerrado por traspaso del abogado (offboarding)`,
          tipo: 'auto',
          accion: 'TAREA_CERRADA_POR_TRASPASO_ABOGADO_OFFBOARDING',
          usuarioId: admin.id,
          casoId: tarea.casoId || null,
          tareaId: tareaId,
          detalle: motivoTexto,
        },
      }),
    ])

    revalidatePath(`/usuarios/${userIdQueSeVa}/offboarding`)
    revalidatePath('/gestion-tareas')
    revalidatePath('/')
    if (tarea.casoId) revalidatePath(`/casos/${tarea.casoId}`)

    return {
      success: true,
      mensaje: `Evento "${tarea.titulo}" cerrado administrativamente.`,
    }
  } catch (error: any) {
    console.error('Error en cerrarEventoPorTraspasoEnOffboardingAction:', error)
    return { error: error.message || 'Error al cerrar el evento' }
  }
}

// ============================================================================
// 7. DESACTIVACIÓN DEFINITIVA
// ============================================================================

export async function desactivarUsuarioDefinitivamenteAction(
  userId: string,
): Promise<{ success: true; mensaje: string } | { error: string }> {
  try {
    const admin = await verificarAdmin()

    const estado = await getEstadoCuentaUsuario(userId)
    if (!estado.puedeDesactivarse) {
      return { error: estado.motivoBloqueo || "El usuario todavía no se puede desactivar" }
    }

    const huerfanos = await contarCasosHuerfanos(userId)
    if (huerfanos > 0) {
      return {
        error: `Detectados ${huerfanos} expediente(s) con datos inconsistentes. Desactivación bloqueada.`
      }
    }

    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, nombre: true, apellido: true, isActive: true },
    })
    if (!usuario) return { error: "Usuario no encontrado" }
    if (!usuario.isActive) return { error: "El usuario ya está desactivado" }

    await prisma.$transaction([
      prisma.accountActivationToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      }),
      prisma.bitacora.create({
        data: {
          texto: `Usuario desactivado: ${usuario.email}`,
          tipo: 'auto',
          accion: 'Desactivación de Usuario',
          usuarioId: admin.id,
        }
      }),
    ])

    revalidatePath('/configuracion')
    revalidatePath(`/usuarios/${userId}/offboarding`)
    return { success: true, mensaje: `Usuario ${usuario.email} desactivado correctamente.` }
  } catch (error: any) {
    console.error('Error en desactivarUsuarioDefinitivamenteAction:', error)
    return { error: error.message || 'Error al desactivar el usuario' }
  }
}