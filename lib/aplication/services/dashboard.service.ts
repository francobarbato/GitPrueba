const prisma = require('../../../lib/db/prisma');

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

      // Obtener próximas alertas
      const proximasAlertas = await prisma.alerta.findMany({
        where: {
          fecha: {
            gte: new Date()
          },
          estado: 'pendiente'
        },
        take: 5,
        orderBy: {
          fecha: 'asc'
        },
        include: {
          caso: {
            select: {
              numero: true,
              titulo: true
            }
          }
        }
      });

      return {
        casosPorTipo,
        casosPorEstado,
        casosRecientes,
        proximasAlertas,
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
}