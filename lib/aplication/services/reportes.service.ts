import prisma from "src/lib/db/prisma"
import { subDays, differenceInDays } from "date-fns"

export class ReportesService {
  
  // ===========================================================================
  // 1. REPORTES EXISTENTES (No modificados)
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
  // 2. MÉTODOS PARA REPORTES
  // ===========================================================================

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

  async getTiempoPorEtapa(casoId: string) {
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      include: {
        bitacoras: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!caso) return null

    const hoy = new Date()
    const fechaFin = caso.fechaFin || hoy
    const totalDias = Math.max(1, differenceInDays(fechaFin, caso.fechaInicio))
    const tiempos = []
    const cambiosEstado = caso.bitacoras.filter(b => b.accion === "Cambio de Estado" || b.texto.includes("Cambio a"))

    if (cambiosEstado.length === 0) {
      tiempos.push({ estado: caso.estado, dias: totalDias, porcentaje: 100 })
    } else {
      let fechaAnterior = caso.fechaInicio
      cambiosEstado.forEach((cambio, index) => {
        const diasEnEtapa = differenceInDays(cambio.createdAt, fechaAnterior)
        const nombreEtapa = `Etapa ${index + 1}`
        if (diasEnEtapa > 0) {
          tiempos.push({ estado: nombreEtapa, dias: diasEnEtapa, porcentaje: Math.round((diasEnEtapa / totalDias) * 100) })
        }
        fechaAnterior = cambio.createdAt
      })
      const diasActuales = differenceInDays(fechaFin, fechaAnterior)
      tiempos.push({ estado: caso.estado + " (Actual)", dias: diasActuales, porcentaje: Math.round((diasActuales / totalDias) * 100) })
    }

    return { totalDias, tiempos }
  }

  // ===========================================================================
  // 3. ACTIVIDAD Y RESULTADOS POR ABOGADO
  // ===========================================================================

  async getActividadResultados(options: {
    periodo?: string        // '90', '180', '365' — para vista general
    desde?: string          // 'YYYY-MM-DD' — para vista personal
    hasta?: string          // 'YYYY-MM-DD' — para vista personal
    filtroTipo?: string
    abogadoId?: string
  }): Promise<{
    kpis: {
      casosCerrados: number
      tasaExitoGlobal: number
      valorRecuperadoTotal: number
    }
    abogados: Array<{
      id: string
      nombre: string
      email: string
      casosActivos: number
      casosCerrados: number
      tasaExito: number
      valorRecuperado: number
      porcentajeRecuperacion: number
      distribucionActivos: Array<{ tipo: string; cantidad: number }>
      fuerosActivos: Array<{ fuero: string; cantidad: number }>
      perfilCasos: {
        distribucion: Array<{ tipo: string; cantidad: number }>
        porcentajeAcuerdos: number
      }
      detalleCierres: Array<{
        id: string
        numero: string
        titulo: string
        tipo: string
        motivoCierre: string
        montoDisputa: number
        montoFinal: number
        fechaCierre: Date
      }>
    }>
  }> {
    const { periodo, desde, hasta: hastaStr, filtroTipo, abogadoId } = options

    // Determinar rango de fechas
    let fechaHasta = new Date()
    let fechaDesde: Date

    if (desde && hastaStr) {
      // Vista personal: rango personalizado
      fechaDesde = new Date(desde + 'T00:00:00')
      fechaHasta = new Date(hastaStr + 'T23:59:59')
    } else {
      // Vista general: período predefinido
      switch (periodo) {
        case '90':  fechaDesde = subDays(fechaHasta, 90); break
        case '180': fechaDesde = subDays(fechaHasta, 180); break
        case '365': fechaDesde = subDays(fechaHasta, 365); break
        default:    fechaDesde = subDays(fechaHasta, 90)
      }
    }

    // Filtro para cerrados en el rango
    const whereCerrados: any = {
      estaCerrado: true,
      fechaCierre: { gte: fechaDesde, lte: fechaHasta }
    }
    if (filtroTipo && filtroTipo !== 'TODOS') {
      whereCerrados.tipo = filtroTipo
    }
    if (abogadoId) {
      whereCerrados.abogadoId = abogadoId
    }

    // Casos cerrados en el rango
    const casosCerrados = await prisma.caso.findMany({
      where: whereCerrados,
      include: {
        abogado: {
          select: { id: true, nombre: true, apellido: true, email: true }
        }
      },
      orderBy: { fechaCierre: 'desc' }
    })

    // Casos activos con detalle (tipo, fuero)
    const whereActivos: any = { estaCerrado: false }
    if (filtroTipo && filtroTipo !== 'TODOS') {
      whereActivos.tipo = filtroTipo
    }
    if (abogadoId) {
      whereActivos.abogadoId = abogadoId
    }

    const casosActivosDetalle = await prisma.caso.findMany({
      where: whereActivos,
      select: {
        abogadoId: true,
        tipo: true,
        fuero: true,
      }
    })

    // Agrupar activos por abogado
    const activosDetallePorAbogado = new Map<string, typeof casosActivosDetalle>()
    casosActivosDetalle.forEach(c => {
      if (!activosDetallePorAbogado.has(c.abogadoId)) {
        activosDetallePorAbogado.set(c.abogadoId, [])
      }
      activosDetallePorAbogado.get(c.abogadoId)!.push(c)
    })

    // ========== KPIs GLOBALES ==========

    const casosExitosos = casosCerrados.filter(c =>
      c.motivoCierre === 'Sentencia favorable' ||
      c.motivoCierre === 'Acuerdo/Conciliación'
    ).length

    const tasaExitoGlobal = casosCerrados.length > 0
      ? Math.round((casosExitosos / casosCerrados.length) * 100)
      : 0

    const valorRecuperadoTotal = casosCerrados
      .filter(c => c.montoFinal)
      .reduce((sum, c) => sum + Number(c.montoFinal), 0)

    // ========== DATOS POR ABOGADO ==========

    const abogadosMap = new Map<string, typeof casosCerrados>()
    casosCerrados.forEach(caso => {
      if (!abogadosMap.has(caso.abogadoId)) {
        abogadosMap.set(caso.abogadoId, [])
      }
      abogadosMap.get(caso.abogadoId)!.push(caso)
    })

    // En vista general incluir abogados sin cierres
    if (!abogadoId) {
      const todosAbogados = await prisma.user.findMany({
        where: { rol: 'ABOGADO', isActive: true },
        select: { id: true, nombre: true, apellido: true, email: true }
      })
      todosAbogados.forEach(ab => {
        if (!abogadosMap.has(ab.id)) {
          abogadosMap.set(ab.id, [])
        }
      })
    }

    // Info de todos los abogados (para los que no tienen cierres)
    const infoAbogados = await prisma.user.findMany({
      where: { rol: 'ABOGADO', isActive: true },
      select: { id: true, nombre: true, apellido: true, email: true }
    })
    const infoMap = new Map(infoAbogados.map(a => [a.id, a]))

    const abogados = Array.from(abogadosMap.entries()).map(([abId, casos]) => {
      const abogadoDeCaso = casos.length > 0 ? casos[0].abogado : null
      const abogadoInfo = abogadoDeCaso || infoMap.get(abId)

      let nombre = 'Sin nombre'
      let email = ''
      if (abogadoInfo) {
        nombre = abogadoInfo.nombre && abogadoInfo.apellido
          ? `${abogadoInfo.nombre} ${abogadoInfo.apellido}`
          : abogadoInfo.email.split('@')[0]
        email = abogadoInfo.email
      }

      // Activos con detalle
      const casosActivosAb = activosDetallePorAbogado.get(abId) || []
      const cantidadActivos = casosActivosAb.length

      // Distribución de activos por tipo
      const tiposActivosMap = new Map<string, number>()
      casosActivosAb.forEach(c => {
        const tipo = c.tipo || 'OTRO'
        tiposActivosMap.set(tipo, (tiposActivosMap.get(tipo) || 0) + 1)
      })
      const distribucionActivos = Array.from(tiposActivosMap.entries())
        .map(([tipo, cantidad]) => ({ tipo, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)

      // Fueros donde opera
      const fuerosMap = new Map<string, number>()
      casosActivosAb.forEach(c => {
        const fuero = c.fuero || 'Sin fuero'
        fuerosMap.set(fuero, (fuerosMap.get(fuero) || 0) + 1)
      })
      const fuerosActivos = Array.from(fuerosMap.entries())
        .map(([fuero, cantidad]) => ({ fuero, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)

      // Tasa de éxito
      const exitosos = casos.filter(c =>
        c.motivoCierre === 'Sentencia favorable' ||
        c.motivoCierre === 'Acuerdo/Conciliación'
      ).length
      const tasaExito = casos.length > 0
        ? Math.round((exitosos / casos.length) * 100)
        : 0

      // Valor económico
      const casosConMonto = casos.filter(c => c.montoFinal && c.montoDisputa)
      const valorRecuperado = casosConMonto.reduce((sum, c) => sum + Number(c.montoFinal), 0)
      const valorDisputado = casosConMonto.reduce((sum, c) => sum + Number(c.montoDisputa), 0)
      const porcentajeRecuperacion = valorDisputado > 0
        ? Math.round((valorRecuperado / valorDisputado) * 100)
        : 0

      // Perfil de casos cerrados
      const distribucionTipos = new Map<string, number>()
      let casosConAcuerdo = 0
      casos.forEach(caso => {
        const tipo = caso.tipo || 'OTRO'
        distribucionTipos.set(tipo, (distribucionTipos.get(tipo) || 0) + 1)
        if (caso.motivoCierre === 'Acuerdo/Conciliación') casosConAcuerdo++
      })

      const perfilCasos = {
        distribucion: Array.from(distribucionTipos.entries())
          .map(([tipo, cantidad]) => ({ tipo, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad),
        porcentajeAcuerdos: casos.length > 0
          ? Math.round((casosConAcuerdo / casos.length) * 100)
          : 0
      }

      // Detalle de cierres
      const detalleCierres = casos.map(c => ({
        id: c.id,
        numero: c.numero,
        titulo: c.titulo,
        tipo: c.tipo || 'OTRO',
        motivoCierre: c.motivoCierre || 'Sin motivo',
        montoDisputa: Number(c.montoDisputa) || 0,
        montoFinal: Number(c.montoFinal) || 0,
        fechaCierre: c.fechaCierre!
      }))

      return {
        id: abId,
        nombre,
        email,
        casosActivos: cantidadActivos,
        casosCerrados: casos.length,
        tasaExito,
        valorRecuperado: Math.round(valorRecuperado),
        porcentajeRecuperacion,
        distribucionActivos,
        fuerosActivos,
        perfilCasos,
        detalleCierres
      }
    })

    abogados.sort((a, b) => b.casosCerrados - a.casosCerrados || b.casosActivos - a.casosActivos)

    return {
      kpis: {
        casosCerrados: casosCerrados.length,
        tasaExitoGlobal,
        valorRecuperadoTotal: Math.round(valorRecuperadoTotal)
      },
      abogados
    }
  }
}