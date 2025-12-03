import prisma from 'src/lib/db/prisma'

export class DashboardService {
  
  // Modificamos este método para recibir userId y esAdmin
  async getStats(userId: string, esAdmin: boolean) {
    try {
      // 1. Construir el filtro (WHERE) dinámico
      const whereUser = esAdmin ? {} : { abogadoId: userId }

      // 2. Obtener conteos filtrados
      const totalCasos = await prisma.caso.count({ where: whereUser })
      
      const casosAbiertos = await prisma.caso.count({ 
        where: { ...whereUser, estado: 'Abierto' } 
      })
      
      const casosEnProceso = await prisma.caso.count({ 
        where: { ...whereUser, estado: 'En proceso' } 
      })
      
      const casosCerrados = await prisma.caso.count({ 
        where: { ...whereUser, estado: 'Cerrado' } 
      })

      // Total de clientes (Si es admin ve todos, si es abogado solo los suyos)
      const whereCliente = esAdmin ? {} : { abogadoId: userId }
      const totalClientes = await prisma.cliente.count({ where: whereCliente })

      return {
        totalCasos,
        casosAbiertos,
        casosEnProceso,
        casosCerrados,
        totalClientes
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      return {
        totalCasos: 0, casosAbiertos: 0, casosEnProceso: 0, casosCerrados: 0, totalClientes: 0
      }
    }
  }

  // Método para "Actividad Reciente" (Los últimos 5 casos del abogado)
  async getActividadReciente(userId: string, esAdmin: boolean) {
    const whereUser = esAdmin ? {} : { abogadoId: userId }
    
    return await prisma.caso.findMany({
        where: whereUser,
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
            cliente: true
        }
    })
  }
}