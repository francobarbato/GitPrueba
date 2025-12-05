import prisma from 'src/lib/db/prisma'

export class DashboardService {
  
  // 1. Estadísticas Generales para el Dashboard Principal
  async getStats(userId: string, esAdmin: boolean) {
    try {
      const whereUser = esAdmin ? {} : { abogadoId: userId }

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

  // 2. Actividad Reciente (Últimos 5 casos)
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

  // 3. Carga de Trabajo (Para la Tabla de Reportes)
  async getCargaTrabajo() {
    const abogados = await prisma.user.findMany({
      where: { rol: 'abogado' },
      include: {
        casos: {
          select: { estado: true }
        }
      }
    })

    return abogados.map(abogado => {
      const total = abogado.casos.length
      
      // Casos cerrados
      const cerrados = abogado.casos.filter(c => ['Cerrado', 'Archivado'].includes(c.estado || '')).length
      
      // Casos activos (Abierto + En proceso)
      const activos = abogado.casos.filter(c => ['Abierto', 'En proceso'].includes(c.estado || '')).length
      
      // Casos específicamente "En proceso"
      const enProceso = abogado.casos.filter(c => c.estado === 'En proceso').length

      const eficiencia = total > 0 ? Math.round((cerrados / total) * 100) : 0

      let estadoCarga = 'Libre'
      if (activos > 10) estadoCarga = 'Saturado'
      else if (activos > 4) estadoCarga = 'Ocupado'

      return {
        id: abogado.id,
        nombre: `${abogado.nombre || ''} ${abogado.apellido || ''}`.trim(),
        email: abogado.email,
        total,
        activos,     // Total activos
        enProceso,   // Detalle en proceso (Esto faltaba en el tipo anterior)
        cerrados,
        eficiencia,
        estadoCarga 
      }
    })
  }
}