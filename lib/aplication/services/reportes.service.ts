import prisma from "src/lib/db/prisma"
import { subDays, differenceInDays } from "date-fns"

export class ReportesService {
  
  // ===========================================================================
  // 1. REPORTES EXISTENTES (No modificados, mantienen tu lógica original)
  // ===========================================================================

  async getCargaTrabajo() {
    const abogados = await prisma.user.findMany({
      where: { rol: "ABOGADO", isActive: true },
      include: {
        casos: {
          select: { estado: true, priority: true, updatedAt: true },
        },
      },
    })

    return abogados.map((abogado) => {
      const total = abogado.casos.length
      const casosActivos = abogado.casos.filter((c) => c.estado !== "Cerrado" && c.estado !== "Archivado")
      const cantidadActivos = casosActivos.length
      const cerrados = total - cantidadActivos
      const casosUrgentes = casosActivos.filter((c) => c.priority === "HIGH").length

      let estadoCarga = "Disponible"
      if (cantidadActivos >= 8) estadoCarga = "Ocupado"
      if (cantidadActivos >= 15) estadoCarga = "Saturado"
      if (casosUrgentes >= 3) estadoCarga = "Sobrecargado"

      const eficiencia = total > 0 ? Math.round((cerrados / total) * 100) : 0

      return {
        id: abogado.id,
        nombre: abogado.nombre ? `${abogado.nombre} ${abogado.apellido}` : abogado.name || "Sin Nombre",
        email: abogado.email,
        activos: cantidadActivos,
        enProceso: casosUrgentes,
        eficiencia,
        estadoCarga,
      }
    })
  }

  async getMatrizRiesgos(userId?: string, esAdmin = true) {
    const whereUser = esAdmin ? {} : { abogadoId: userId }

    const casos = await prisma.caso.findMany({
      where: {
        ...whereUser,
        NOT: { estado: { in: ["Cerrado", "Archivado"] } },
      },
      select: {
        id: true,
        numero: true,
        titulo: true,
        priority: true,
        updatedAt: true,
        cliente: { select: { nombre: true, apellido: true } },
        requirements: {
          where: { isCompleted: false },
          orderBy: { dueDate: "asc" },
        },
      },
    })

    const resultados = casos.map((c) => {
      const diasInactivo = differenceInDays(new Date(), c.updatedAt)
      const proximoVencimiento = c.requirements.find((r) => r.dueDate !== null)
      let hayBombaInminente = false

      if (proximoVencimiento && proximoVencimiento.dueDate) {
        const hoy = new Date()
        const fechaVenc = new Date(proximoVencimiento.dueDate)
        const diasParaVencer = differenceInDays(fechaVenc, hoy)
        if (diasParaVencer <= 3) hayBombaInminente = true
      }

      let estadoRiesgo = "Al día"
      if (hayBombaInminente) estadoRiesgo = "Crítico"
      else if (diasInactivo > 45) estadoRiesgo = "Crítico"
      else if (c.priority === "HIGH" && diasInactivo > 20) estadoRiesgo = "Crítico"
      else if (diasInactivo > 15) estadoRiesgo = "Atención"

      return {
        id: c.id,
        expediente: c.numero,
        caratula: c.titulo,
        cliente: c.cliente ? `${c.cliente.nombre} ${c.cliente.apellido}` : "S/C",
        complejidad: c.priority === "HIGH" ? "Alta" : c.priority === "LOW" ? "Baja" : "Media",
        ultimoMovimiento: c.updatedAt.toLocaleDateString("es-ES"),
        diasInactivo,
        estado: estadoRiesgo,
        pesoOrden: estadoRiesgo === "Crítico" ? 3 : estadoRiesgo === "Atención" ? 2 : 1,
      }
    })

    return resultados.sort((a, b) => b.pesoOrden - a.pesoOrden || b.diasInactivo - a.diasInactivo).slice(0, 10)
  }

  async getAlertasUnificadas(userId?: string, esAdmin = true) {
    const whereUser = esAdmin ? {} : { abogadoId: userId }
    const whereUserCaso = esAdmin ? {} : { caso: { abogadoId: userId } }
    const hoy = new Date()

    const fechaLimite = new Date()
    fechaLimite.setDate(hoy.getDate() + 7)

    const checklistItems = await prisma.requirement.findMany({
      where: {
        ...whereUserCaso,
        isCompleted: false,
        dueDate: { lte: fechaLimite },
      },
      include: {
        caso: {
          include: { abogado: true },
        },
      },
    })

    const casosZombies = await prisma.caso.findMany({
      where: {
        ...whereUser,
        updatedAt: { lt: subDays(hoy, 120) },
        estado: { notIn: ["Cerrado", "Archivado"] },
      },
      include: { abogado: true },
      take: 3,
    })

    const listaCombinada = [
      ...checklistItems.map((r) => {
        const diasDiferencia = differenceInDays(r.dueDate!, hoy)
        const esVencido = diasDiferencia < 0
        const esCasoUrgente = r.caso.priority === "HIGH"

        let score = 0
        let gravedad = "Baja"
        let tipo = "Pendiente"

        if (esVencido) {
          score = 100 + Math.abs(diasDiferencia)
          gravedad = "Critico"
          tipo = "Vencido"
        } else if (diasDiferencia <= 1) {
          score = 80 + (esCasoUrgente ? 10 : 0)
          gravedad = "Critico"
          tipo = "Urgente"
        } else {
          score = 50 + (esCasoUrgente ? 10 : 0) - diasDiferencia
          gravedad = "Preventivo"
          tipo = "Próximo"
        }

        return {
          id: `req-${r.id}`,
          abogado: r.caso.abogado.nombre || "S/A",
          mensaje: r.description,
          subtitulo: `Caso: ${r.caso.titulo} (${r.caso.priority})`,
          tiempo: esVencido ? `Venció hace ${Math.abs(diasDiferencia)} días` : `Vence en ${diasDiferencia} días`,
          gravedad,
          tipo,
          score,
          link: `/casos/${r.caso.id}`,
        }
      }),
      ...casosZombies.map((c) => ({
        id: `zombie-${c.id}`,
        abogado: c.abogado.nombre || "S/A",
        mensaje: `Revisar Expediente Abandonado`,
        subtitulo: `Caso: ${c.titulo}`,
        tiempo: "+4 meses inactivo",
        gravedad: "Preventivo",
        tipo: "Abandono",
        score: 20 + (c.priority === "HIGH" ? 5 : 0),
        link: `/casos/${c.id}`,
      })),
    ]

    return listaCombinada.sort((a, b) => b.score - a.score).slice(0, 6)
  }

  // ===========================================================================
  // 2. NUEVOS MÉTODOS (Para el Reporte de Tiempos por Etapa)
  // ===========================================================================

  // Para llenar el selector del buscador
  async getTodosLosCasos() {
    return await prisma.caso.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        numero: true,
        titulo: true,
        estado: true,
        cliente: {
          select: { nombre: true, apellido: true }
        }
      }
    })
  }

  // Para generar el gráfico de Timeline
  async getTiempoPorEtapa(casoId: string) {
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      include: {
        bitacoras: {
          orderBy: { createdAt: 'asc' } // Orden cronológico para ver evolución
        }
      }
    })

    if (!caso) return null

    const hoy = new Date()
    // Calculamos tiempo total desde inicio hasta hoy (o hasta fin si estuviera cerrado)
    const fechaFin = caso.fechaFin || hoy
    const totalDias = Math.max(1, differenceInDays(fechaFin, caso.fechaInicio))

    // Intentamos reconstruir historia desde la bitácora
    // Si no hay bitácoras de cambio de estado, asumimos que todo el tiempo estuvo en el estado actual
    const tiempos = []

    // Filtramos bitácoras que hablen de cambios (asumiendo que guardaste "Cambio de Estado" en accion)
    const cambiosEstado = caso.bitacoras.filter(b => b.accion === "Cambio de Estado" || b.texto.includes("Cambio a"))

    if (cambiosEstado.length === 0) {
        // Caso simple: Sin historial, todo el tiempo es el estado actual
        tiempos.push({
            estado: caso.estado,
            dias: totalDias,
            porcentaje: 100
        })
    } else {
        // Caso complejo: Reconstruir cronología
        // Esto es una simplificación visual: tomamos los hitos de la bitácora
        let fechaAnterior = caso.fechaInicio
        
        cambiosEstado.forEach((cambio, index) => {
             const diasEnEtapa = differenceInDays(cambio.createdAt, fechaAnterior)
             // Intentamos extraer el estado anterior del texto o usamos "Etapa previa"
             const nombreEtapa = `Etapa ${index + 1}` // Idealmente parsear el texto del log
             
             if (diasEnEtapa > 0) {
                 tiempos.push({
                     estado: nombreEtapa,
                     dias: diasEnEtapa,
                     porcentaje: Math.round((diasEnEtapa / totalDias) * 100)
                 })
             }
             fechaAnterior = cambio.createdAt
        })

        // El tiempo desde el último cambio hasta hoy es el estado actual
        const diasActuales = differenceInDays(fechaFin, fechaAnterior)
        tiempos.push({
            estado: caso.estado + " (Actual)",
            dias: diasActuales,
            porcentaje: Math.round((diasActuales / totalDias) * 100)
        })
    }

    return {
        totalDias,
        tiempos
    }
  }
}