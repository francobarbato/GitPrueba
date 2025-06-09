import { prisma } from '../../../lib/db/prisma' // Usa import en lugar de require

export class DashboardService {
  async getStats() {
    try {
      // Contar casos por tipo
      const casosPorTipo = await prisma.caso.groupBy({
        by: ['tipo'],
        _count: {
          id: true
        }
      });

      // Contar casos por estado
      const casosPorEstado = await prisma.caso.groupBy({
        by: ['estado'],
        _count: {
          id: true
        }
      });

      // Obtener casos recientes
      const casosRecientes = await prisma.caso.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          abogado: {
            select: {
              nombre: true,
              apellido: true
            }
          },
          cliente: {
            select: {
              nombre: true,
              apellido: true
            }
          }
        }
      });

      return {
        casosPorTipo,
        casosPorEstado,
        casosRecientes,
        totalCasos: await prisma.caso.count(),
        totalClientes: await prisma.usuario.count({
          where: {
            rol: 'cliente'
          }
        }),
        totalAbogados: await prisma.usuario.count({
          where: {
            rol: 'abogado'
          }
        })
      };
    } catch (error) {
      console.error("Error al obtener estadísticas del dashboard:", error);
      throw error;
    }
  }

  // Nuevos métodos para reportes específicos
  async obtenerCasosPorAbogado() {
    const casoRepository = new (await import('../../infrastructure/repositories/prisma/caso.repository')).PrismaCasoRepository()
    return casoRepository.getCasosPorAbogado()
  }

  async obtenerAvanceCasos() {
    const casoRepository = new (await import('../../infrastructure/repositories/prisma/caso.repository')).PrismaCasoRepository()
    return casoRepository.getEstadisticasAvance()
  }

  async obtenerResumenGeneral() {
    const stats = await this.getStats()
    const estadisticas = await this.obtenerAvanceCasos()
    
    return {
      totalCasos: stats.totalCasos,
      casosAbiertos: stats.casosPorEstado.find(e => e.estado === 'abierto')?._count?.id || 0,
      casosEnProceso: stats.casosPorEstado.find(e => e.estado === 'en_proceso')?._count?.id || 0,
      casosCerrados: stats.casosPorEstado.find(e => e.estado === 'cerrado')?._count?.id || 0,
      promedioAvance: Math.round(estadisticas.promedioAvance),
    }
  }
}