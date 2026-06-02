// app/api/admin/usuarios/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"

// ===== GET: Obtener usuario por ID =====
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()

    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const usuario = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        ultimoAcceso: true,
        debeResetearPassword: true,
        _count: {
          select: {
            casos: {
              where: { estaCerrado: false }
            },
            clientes: true
          }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(usuario)

  } catch (error: any) {
    console.error("Error al obtener usuario:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// ===== PATCH: Actualizar usuario =====
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()

    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { nombre, apellido, email, rol, isActive } = body

    const existente = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existente) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (email && email !== existente.email) {
      const emailDuplicado = await prisma.user.findUnique({
        where: { email }
      })

      if (emailDuplicado) {
        return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 })
      }
    }

    const actualizado = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(apellido !== undefined && { apellido }),
        ...(email !== undefined && { email }),
        ...(rol !== undefined && { rol }),
        ...(isActive !== undefined && { isActive }),
        ...(nombre !== undefined && apellido !== undefined && {
          name: `${nombre} ${apellido}`
        })
      }
    })

    return NextResponse.json({
      id: actualizado.id,
      nombre: actualizado.nombre,
      apellido: actualizado.apellido,
      email: actualizado.email,
      rol: actualizado.rol,
      isActive: actualizado.isActive
    })

  } catch (error: any) {
    console.error("Error al actualizar usuario:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

// ===== DELETE: Soft delete con decisiones granulares por caso =====
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    let body: any = {}
    try { body = await req.json() } catch {}

    const decisiones:     Array<{ casoId: string; accion: 'reasignar' | 'traspasar'; abogadoDestino?: string }> = body.decisiones || []
    const estudioDestino: string | undefined = body.estudioDestino?.trim() || undefined
    const motivoTraspaso: string | undefined = body.motivoTraspaso?.trim() || undefined

    const usuario = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        casos: {
          where: { estaCerrado: false },
          select: { id: true, numero: true, titulo: true }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (usuario.rol === 'ADMIN' && usuario.isActive) {
      const adminsActivos = await prisma.user.count({
        where: { rol: 'ADMIN', isActive: true }
      })
      if (adminsActivos <= 1) {
        return NextResponse.json({
          error: "No se puede desactivar al único administrador activo del sistema"
        }, { status: 400 })
      }
    }

    const casosActivos = usuario.casos
    const cantidadCasos = casosActivos.length

    if (cantidadCasos > 0 && decisiones.length === 0) {
      return NextResponse.json({
        error: `El usuario tiene ${cantidadCasos} caso(s) activo(s). Debés indicar qué hacer con cada uno.`,
        casosActivos: cantidadCasos,
        requiereGestion: true
      }, { status: 400 })
    }

    if (cantidadCasos > 0) {
      const casoIdsDelUsuario   = new Set(casosActivos.map(c => c.id))
      const casoIdsEnDecisiones = new Set(decisiones.map(d => d.casoId))

      const sinDecision = casosActivos.filter(c => !casoIdsEnDecisiones.has(c.id))
      if (sinDecision.length > 0) {
        return NextResponse.json({
          error: `Faltan decisiones para ${sinDecision.length} caso(s).`
        }, { status: 400 })
      }

      const decisionesInvalidas = decisiones.filter(d => !casoIdsDelUsuario.has(d.casoId))
      if (decisionesInvalidas.length > 0) {
        return NextResponse.json({
          error: "Hay decisiones que referencian casos que no pertenecen al usuario."
        }, { status: 400 })
      }

      const abogadosDestinoIds = Array.from(new Set(
        decisiones.filter(d => d.accion === 'reasignar').map(d => d.abogadoDestino!).filter(Boolean)
      ))
      if (abogadosDestinoIds.length > 0) {
        const abogadosOk = await prisma.user.findMany({
          where:  { id: { in: abogadosDestinoIds }, isActive: true, rol: 'ABOGADO' },
          select: { id: true }
        })
        if (abogadosOk.length !== abogadosDestinoIds.length) {
          return NextResponse.json({
            error: "Alguno de los abogados destino no existe o está inactivo."
          }, { status: 400 })
        }
      }
    }

    // Mapa de abogadoId -> nombre, para bitácoras
    const abogadosDestinoMap: Record<string, string> = {}
    if (decisiones.some(d => d.accion === 'reasignar')) {
      const ids = Array.from(new Set(decisiones.filter(d => d.accion === 'reasignar').map(d => d.abogadoDestino!)))
      const abogs = await prisma.user.findMany({
        where:  { id: { in: ids } },
        select: { id: true, nombre: true, apellido: true }
      })
      abogs.forEach(a => {
        abogadosDestinoMap[a.id] = `${a.nombre || ''} ${a.apellido || ''}`.trim()
      })
    }

    const nombreUsuario = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.email

    let reasignados = 0
    let traspasados = 0

    // Mapa casoId -> nuevoTitularId (para casos reasignados)
    const reasignacionesMap: Record<string, string> = {}

    // ── 1. Aplicar decisiones sobre casos ────────────────────────────
    for (const decision of decisiones) {
      if (decision.accion === 'reasignar' && decision.abogadoDestino) {
        await prisma.caso.update({
          where: { id: decision.casoId },
          data: {
            abogadoId:              decision.abogadoDestino,
            recibidoEnReasignacion: true,
            fechaReasignacion:      new Date(),
          }
        })
        await prisma.bitacora.create({
          data: {
            casoId:    decision.casoId,
            texto:     `Caso reasignado de ${nombreUsuario} a ${abogadosDestinoMap[decision.abogadoDestino]} por desactivación de usuario`,
            tipo:      'auto',
            accion:    'Reasignación por Desactivación',
            usuarioId: user.id
          }
        })
        reasignacionesMap[decision.casoId] = decision.abogadoDestino
        reasignados++
      } else if (decision.accion === 'traspasar') {
        await prisma.caso.update({
          where: { id: decision.casoId },
          data: {
            estaCerrado:    true,
            esTraspasado:   true,
            fechaTraspaso:  new Date(),
            estudioDestino: estudioDestino || null,
            motivoTraspaso: motivoTraspaso || null,
          }
        })
        const det = estudioDestino ? ` (destino: ${estudioDestino})` : ""
        await prisma.bitacora.create({
          data: {
            casoId:    decision.casoId,
            texto:     `Caso traspasado a otro estudio por desactivación de ${nombreUsuario}${det}`,
            tipo:      'auto',
            accion:    'Traspaso a Otro Estudio',
            usuarioId: user.id
          }
        })
        traspasados++
      }
    }

    // ── 2. Política sobre tareas ──────────────────────────────────────
    // Filtro de tareas "activas" (no completadas, no cerradas-vencidas)
    const filtroActivas = {
      estado:           { not: 'COMPLETADA' as const },
      vencidaCerradaEn: null,
    }

    let tareasResponsableActualizadas = 0
    let tareasSupervisorActualizadas  = 0
    let tareasSinCasoReasignadasAdmin = 0
    let tareasSupervisorNulleadas     = 0

    // 2.A — Tareas en casos REASIGNADOS donde X era responsable o supervisor
    for (const [casoId, nuevoTitularId] of Object.entries(reasignacionesMap)) {
      // Responsable
      const tareasResp = await prisma.tarea.findMany({
        where: { casoId, responsableId: params.id, ...filtroActivas },
        select: { id: true }
      })
      if (tareasResp.length > 0) {
        await prisma.tarea.updateMany({
          where: { id: { in: tareasResp.map(t => t.id) } },
          data:  { responsableId: nuevoTitularId }
        })
        await prisma.bitacora.createMany({
          data: tareasResp.map(t => ({
            tareaId:   t.id,
            casoId:    casoId,
            texto:     `Responsable de la tarea reasignado de ${nombreUsuario} a ${abogadosDestinoMap[nuevoTitularId]} por desactivación`,
            tipo:      'auto',
            accion:    'Reasignación de Responsable',
            usuarioId: user.id,
          }))
        })
        tareasResponsableActualizadas += tareasResp.length
      }

      // Supervisor
      const tareasSup = await prisma.tarea.findMany({
        where: { casoId, supervisorId: params.id, ...filtroActivas },
        select: { id: true }
      })
      if (tareasSup.length > 0) {
        await prisma.tarea.updateMany({
          where: { id: { in: tareasSup.map(t => t.id) } },
          data:  { supervisorId: nuevoTitularId }
        })
        await prisma.bitacora.createMany({
          data: tareasSup.map(t => ({
            tareaId:   t.id,
            casoId:    casoId,
            texto:     `Supervisor de la tarea reasignado de ${nombreUsuario} a ${abogadosDestinoMap[nuevoTitularId]} por desactivación`,
            tipo:      'auto',
            accion:    'Reasignación de Supervisor',
            usuarioId: user.id,
          }))
        })
        tareasSupervisorActualizadas += tareasSup.length
      }
    }

    // 2.B — Tareas en casos AJENOS (no del usuario) donde X era supervisor
    const tareasAjenas = await prisma.tarea.findMany({
      where: {
        supervisorId: params.id,
        casoId:       { not: null },
        caso:         { abogadoId: { not: params.id }, estaCerrado: false },
        ...filtroActivas,
      },
      select: {
        id: true,
        casoId: true,
        caso: { select: { abogadoId: true } }
      }
    })
    for (const t of tareasAjenas) {
      if (!t.caso?.abogadoId) continue
      await prisma.tarea.update({
        where: { id: t.id },
        data:  { supervisorId: t.caso.abogadoId }
      })
      await prisma.bitacora.create({
        data: {
          tareaId:   t.id,
          casoId:    t.casoId,
          texto:     `Supervisor reasignado de ${nombreUsuario} al titular del caso (por desactivación)`,
          tipo:      'auto',
          accion:    'Reasignación de Supervisor',
          usuarioId: user.id,
        }
      })
      tareasSupervisorActualizadas++
    }

    // 2.C + 2.D — Tareas SIN caso donde X era responsable o supervisor
    // Política revisada:
    //   - X era responsable + hay supervisor (no X)  → la tarea se "devuelve" al ex-supervisor (que pasa a responsable, supervisor queda null)
    //   - X era responsable + NO hay supervisor    → fallback: al creador si está activo, sino al admin que ejecuta
    //   - X era supervisor + responsable distinto a X → el responsable se auto-supervisa (supervisorId = responsableId)
    const tareasSinCaso = await prisma.tarea.findMany({
      where: {
        casoId: null,
        OR: [
          { responsableId: params.id },
          { supervisorId:  params.id },
        ],
        ...filtroActivas,
      },
      select: {
        id:            true,
        responsableId: true,
        supervisorId:  true,
        creadorId:     true,
        creador:       { select: { id: true, isActive: true } },
      }
    })

    for (const t of tareasSinCaso) {
      const eraResponsable = t.responsableId === params.id
      const eraSupervisor  = t.supervisorId  === params.id

      const updateData: { responsableId?: string; supervisorId?: string | null } = {}
      let bitacoraTexto = ""
      let bitacoraAccion = ""

      // Caso 1: X era responsable (priorizamos esta lógica, incluso si también era supervisor)
      if (eraResponsable) {
        const haySupervisorValido = !!t.supervisorId && t.supervisorId !== params.id

        if (haySupervisorValido) {
          // Devolución al ex-supervisor: pasa a responsable y queda sin supervisor
          updateData.responsableId = t.supervisorId!
          updateData.supervisorId  = null
          bitacoraTexto  = `Tarea sin caso devuelta al ex-supervisor por desactivación de ${nombreUsuario}`
          bitacoraAccion = 'Devolución al Supervisor'
          tareasResponsableActualizadas++
        } else {
          // Fallback: creador si está activo, sino admin
          const creadorValido = !!t.creador && t.creador.isActive && t.creador.id !== params.id
          const nuevoResp = creadorValido ? t.creador!.id : user.id
          updateData.responsableId = nuevoResp
          updateData.supervisorId  = null
          bitacoraTexto = creadorValido
            ? `Tarea sin caso transferida al creador por desactivación de ${nombreUsuario}`
            : `Tarea sin caso transferida al administrador por desactivación de ${nombreUsuario} (sin supervisor ni creador disponibles)`
          bitacoraAccion = creadorValido ? 'Transferencia al Creador' : 'Transferencia al Administrador'
          tareasSinCasoReasignadasAdmin++
        }
      }
      // Caso 2: X era supervisor (y NO era responsable)
      else if (eraSupervisor) {
        // El responsable absorbe el rol de supervisor (auto-supervisión)
        updateData.supervisorId = t.responsableId
        bitacoraTexto  = `Tarea sin caso queda en auto-supervisión: el responsable absorbe el rol de supervisor por desactivación de ${nombreUsuario}`
        bitacoraAccion = 'Auto-supervisión por Desactivación'
        tareasSupervisorActualizadas++
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.tarea.update({
          where: { id: t.id },
          data:  updateData,
        })

        await prisma.bitacora.create({
          data: {
            tareaId:   t.id,
            texto:     bitacoraTexto,
            tipo:      'auto',
            accion:    bitacoraAccion,
            usuarioId: user.id,
          }
        })
      }
    }

    // ── 3. Resumen global ─────────────────────────────────────────────
    if (cantidadCasos > 0 || tareasResponsableActualizadas > 0 || tareasSupervisorActualizadas > 0 || tareasSinCasoReasignadasAdmin > 0 || tareasSupervisorNulleadas > 0) {
      const partesCasos: string[] = []
      if (reasignados > 0) partesCasos.push(`${reasignados} caso(s) reasignado(s)`)
      if (traspasados > 0) partesCasos.push(`${traspasados} caso(s) traspasado(s)${estudioDestino ? ` (${estudioDestino})` : ""}`)

      const partesTareas: string[] = []
      if (tareasResponsableActualizadas > 0) partesTareas.push(`${tareasResponsableActualizadas} tarea(s) con responsable actualizado`)
      if (tareasSupervisorActualizadas  > 0) partesTareas.push(`${tareasSupervisorActualizadas} tarea(s) con supervisor actualizado`)
      if (tareasSinCasoReasignadasAdmin > 0) partesTareas.push(`${tareasSinCasoReasignadasAdmin} tarea(s) sin caso transferidas al admin`)
      if (tareasSupervisorNulleadas     > 0) partesTareas.push(`${tareasSupervisorNulleadas} tarea(s) sin supervisor`)

      await prisma.bitacora.create({
        data: {
          texto:     `Gestión al desactivar ${usuario.email}. Casos: ${partesCasos.join(' / ') || 'ninguno'}. Tareas: ${partesTareas.join(' / ') || 'ninguna'}.`,
          tipo:      'auto',
          accion:    'Gestión Masiva al Desactivar',
          usuarioId: user.id
        }
      })
    }

    // ── 4. Invalidar tokens y soft delete ─────────────────────────────
    await prisma.accountActivationToken.updateMany({
      where: { userId: params.id, usedAt: null },
      data:  { usedAt: new Date() },
    })

    await prisma.user.update({
      where: { id: params.id },
      data:  { isActive: false }
    })

    await prisma.bitacora.create({
      data: {
        texto:     `Usuario desactivado: ${usuario.email}`,
        tipo:      'auto',
        accion:    'Desactivación de Usuario',
        usuarioId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: "Usuario desactivado correctamente.",
      detalle: {
        reasignados,
        traspasados,
        tareasResponsableActualizadas,
        tareasSupervisorActualizadas,
        tareasSinCasoReasignadasAdmin,
        tareasSupervisorNulleadas,
      }
    })
  } catch (error: any) {
    console.error("Error al eliminar usuario:", error)
    return NextResponse.json(
      { error: error.message || "Error al eliminar usuario" },
      { status: 500 }
    )
  }
}