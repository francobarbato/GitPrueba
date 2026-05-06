// lib/aplication/services/dashboard.service.ts
import prisma from 'src/lib/db/prisma'

export class DashboardService {

  // ============================================================================
  // 1. ESTADÍSTICAS POR ROL
  // ============================================================================
  async getStats(userId: string, rol: string) {
    try {
      const rolUpper = rol?.toUpperCase()

      if (rolUpper === 'ADMIN') {
        return await this.getStatsAdmin()
      } else if (rolUpper === 'ASISTENTE') {
        return await this.getStatsAsistente()
      } else {
        return await this.getStatsAbogado(userId)
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      return {
        cards: [
          { label: 'Expedientes Activos', value: 0, color: 'blue' },
          { label: 'Cerrados', value: 0, color: 'emerald' },
          { label: 'Clientes', value: 0, color: 'purple' },
          { label: 'Total Estudio', value: 0, color: 'slate' },
        ]
      }
    }
  }

  private async getStatsAbogado(userId: string) {
    const [misActivos, misCerrados, misClientes, totalEstudio] = await Promise.all([
      prisma.caso.count({ where: { abogadoId: userId, estaCerrado: false } }),
      prisma.caso.count({ where: { abogadoId: userId, estaCerrado: true } }),
      prisma.cliente.count({
          where: {
            abogadoId: userId
          }
        }),
      prisma.caso.count({ where: { estaCerrado: false } }),
    ])

    return {
      cards: [
        { label: 'Mis expedientes activos', value: misActivos, color: 'blue' },
        { label: 'Mis clientes', value: misClientes, color: 'purple' },
        { label: 'Expedientes activos en el Estudio', value: totalEstudio, color: 'slate' },
      ]
    }
  }

  private async getStatsAdmin() {
    const [activosTotales, cerradosTotales, clientesTotales, abogadosActivos] = await Promise.all([
      prisma.caso.count({ where: { estaCerrado: false } }),
      prisma.caso.count({ where: { estaCerrado: true } }),
      prisma.cliente.count(),
      prisma.user.count({ where: { rol: 'ABOGADO', isActive: true } }),
    ])

    return {
      cards: [
        { label: 'Expedientes Activos', value: activosTotales, color: 'blue' },
        { label: 'Casos Cerrados', value: cerradosTotales, color: 'emerald' },
        { label: 'Clientes', value: clientesTotales, color: 'purple' },
        { label: 'Abogados Activos', value: abogadosActivos, color: 'indigo' },
      ]
    }
  }

  private async getStatsAsistente() {
    const [activosTotales, clientesTotales, abogadosActivos, casosSinMovimiento] = await Promise.all([
      prisma.caso.count({ where: { estaCerrado: false } }),
      prisma.cliente.count(),
      prisma.user.count({ where: { rol: 'ABOGADO', isActive: true } }),
      prisma.caso.count({
        where: {
          estaCerrado: false,
          updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),
    ])

    return {
      cards: [
        { label: 'Expedientes Activos', value: activosTotales, color: 'blue' },
        { label: 'Clientes', value: clientesTotales, color: 'purple' },
        { label: 'Abogados', value: abogadosActivos, color: 'indigo' },
        { label: 'Sin Movimiento (30d)', value: casosSinMovimiento, color: 'amber' },
      ]
    }
  }

  // ============================================================================
  // 2. ACTIVIDAD RECIENTE (últimos casos actualizados)
  // ============================================================================
  async getActividadReciente(userId: string, rol: string) {
    const rolUpper = rol?.toUpperCase()
    const whereUser = rolUpper === 'ADMIN' || rolUpper === 'ASISTENTE'
      ? {}
      : { abogadoId: userId }

    return await prisma.caso.findMany({
      where: whereUser,
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        cliente: { select: { nombre: true, apellido: true } },
        abogado: { select: { nombre: true, apellido: true } }
      }
    })
  }

  // ============================================================================
  // 3. CLIENTES SIN CASOS ACTIVOS
  // ============================================================================
  async getClientesSinCasosActivos(userId: string, rol: string) {
    const rolUpper = rol?.toUpperCase()

    const whereCliente = rolUpper === 'ADMIN' || rolUpper === 'ASISTENTE'
      ? {}
      : { casos: { some: { abogadoId: userId } } }

    const clientes = await prisma.cliente.findMany({
      where: whereCliente,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        casos: {
          select: { id: true, estaCerrado: true },
        }
      }
    })

    return clientes
      .filter(c => c.casos.length === 0 || c.casos.every(caso => caso.estaCerrado))
      .map(c => ({
        id: c.id,
        nombre: c.nombre,
        apellido: c.apellido,
        totalCasos: c.casos.length,
        todosCerrados: c.casos.length > 0
      }))
      .slice(0, 5)
  }

  // ============================================================================
  // 4. DISTRIBUCIÓN POR ETAPA (mini resumen para admin)
  // ============================================================================
  async getDistribucionEtapas() {
    const casos = await prisma.caso.findMany({
      where: { estaCerrado: false },
      select: { estado: true }
    })

    const distribucion = new Map<string, number>()
    casos.forEach(c => {
      distribucion.set(c.estado, (distribucion.get(c.estado) || 0) + 1)
    })

    return Array.from(distribucion.entries())
      .map(([etapa, cantidad]) => ({ etapa, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5)
  }

  // ============================================================================
  // 5. CASOS CON CAMPOS PENDIENTES (juzgado o ubicación física vacíos)
  // ============================================================================
  async getCasosIncompletos(userId: string, rol: string) {
    const rolUpper = rol?.toUpperCase()
    
    const where = {
      estaCerrado: false,
      OR: [
        { juzgado: null },
        { juzgado: '' },
        { ubicacionFisica: null },
        { ubicacionFisica: '' },
      ],
      ...(rolUpper === 'ABOGADO' ? { abogadoId: userId } : {}),
    }

    return await prisma.caso.findMany({
      where,
      take: 8,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        titulo: true,
        numero: true,
        juzgado: true,
        ubicacionFisica: true,
        abogado: { select: { nombre: true, apellido: true } }
      }
    })
  }

  // ============================================================================
  // 6. TAREAS URGENTES — Bandeja de Acción del Dashboard
  // ============================================================================
  async getTareasUrgentes(userId: string, rol: string) {
    const rolUpper = rol?.toUpperCase()
    if (rolUpper === 'ADMIN') return []

    const ahora = new Date()
    const manana = new Date(ahora)
    manana.setDate(manana.getDate() + 1)
    manana.setHours(23, 59, 59, 999)

    // Tareas vencidas o que vencen hoy/mañana donde soy responsable
    const tareasUrgentes = await prisma.tarea.findMany({
      where: {
        OR: [
          // Vencidas
          {
            responsableId: userId,
            estado: "VENCIDA",
          },
          // Vencen hoy o mañana
          {
            responsableId: userId,
            estado: { in: ["PENDIENTE", "EN_PROCESO"] },
            fechaVencimiento: { lte: manana },
          },
          // Bloqueadas donde soy supervisor
          {
            supervisorId: userId,
            estado: "BLOQUEADA",
          },
        ],
      },
      select: {
        id: true,
        titulo: true,
        tipo: true,
        prioridad: true,
        estado: true,
        fechaVencimiento: true,
        motivoBloqueo: true,
        creador: { select: { nombre: true, apellido: true } },
        responsable: { select: { nombre: true, apellido: true } },
        caso: { select: { numero: true, titulo: true } },
      },
      orderBy: [{ fechaVencimiento: "asc" }],
      take: 15,
    })

    return tareasUrgentes.map(t => ({
      id: t.id,
      titulo: t.titulo,
      tipo: t.tipo,
      prioridad: t.prioridad,
      estado: t.estado,
      fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null,
      motivoBloqueo: t.motivoBloqueo,
      creador: t.creador,
      responsable: t.responsable,
      caso: t.caso,
    }))
  }
}