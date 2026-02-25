import prisma from "src/lib/db/prisma"
import { Caso, Pago  } from "@prisma/client"

type PagoType = Caso & {
  pagos: Array<{
    id: string
    concepto: string
    descripcion: string | null
    monto: number
    estado: string
    comprobanteUrl: string | null
    montoPagado: number | null
    fechaPago: Date | null
    fechaValidacion: Date | null
    createdAt: Date
  }>
}


type CasoConPagos = Caso & {
  abogado?: any
  cliente?: any
  pagos: Pago[]
}

export class PrismaCasoRepository {
  
  // ---------------------------------------------------------
  // MÉTODOS DE CONSULTA BÁSICA
  // ---------------------------------------------------------

  async findAll(): Promise<Caso[]> {
    const casos = await prisma.caso.findMany({
      include: {
        abogado: true,
        cliente: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return casos
  }

  async findById(id: string): Promise<CasoConPagos | null> {
    return await prisma.caso.findUnique({
      where: { id },
      include: {
        abogado: true,
        cliente: true,
        pagos: {
          orderBy: { createdAt: 'desc' }
        }
      },
    }) as CasoConPagos | null
  }

  // ESTE ES EL NUEVO IMPORTANTE: Filtrar por abogado logueado
  async findByAbogado(abogadoId: string): Promise<Caso[]> {
    try {
      const casos = await prisma.caso.findMany({
        where: { abogadoId: abogadoId },
        include: {
          cliente: true,
          abogado: true
        },
        orderBy: { createdAt: 'desc' }
      })
      return casos
    } catch (error) {
      console.error("Error en findByAbogado:", error)
      return []
    }
  }

  async findByCliente(clienteId: string): Promise<Caso[]> {
    const casos = await prisma.caso.findMany({
      where: { clienteId },
      include: {
        abogado: true,
        cliente: true,
      },
    })
    return casos
  }

  // ---------------------------------------------------------
  // MÉTODOS DE MUTACIÓN (Crear, Editar, Eliminar)
  // ---------------------------------------------------------

async create(data: any): Promise<Caso> {
    return await prisma.caso.create({
      data: {
        numero: data.numero,
        titulo: data.titulo,
        descripcion: data.descripcion,
        tipo: data.tipo,
        estado: 'Inicio / Demanda', // Estado inicial por defecto
        fechaInicio: new Date(), // Fecha actual por defecto
        porcentajeAvance: 0,
        abogadoId: data.abogadoId, // VINCULACIÓN AUTOMÁTICA
        clienteId: data.clienteId, // VINCULACIÓN CON CLIENTE
      },
      include: {
        abogado: true,
        cliente: true,
      }
    })
  }

  async update(id: string, data: any): Promise<Caso> {
    const caso = await prisma.caso.update({
      where: { id },
      data,
      include: {
        abogado: true,
        cliente: true,
      },
    })
    return caso
  }

  async delete(id: string): Promise<void> {
    await prisma.caso.delete({
      where: { id },
    })
  }

  async updatePorcentajeAvance(id: string, porcentaje: number): Promise<Caso> {
    const caso = await prisma.caso.update({
      where: { id },
      data: { porcentajeAvance: porcentaje },
      include: {
        abogado: true,
        cliente: true,
      },
    })
    return caso
  }

  // ---------------------------------------------------------
  // NUEVOS MÉTODOS PARA PAGOS (Gestión Financiera)
  // ---------------------------------------------------------

  async crearPago(data: { 
    casoId: string
    concepto: string
    descripcion?: string
    monto: number 
  }): Promise<Pago> {  // ← USAR TIPO PRISMA
    return await prisma.pago.create({
      data: {
        casoId: data.casoId,
        concepto: data.concepto,
        descripcion: data.descripcion || null,
        monto: data.monto,
        estado: 'pendiente'
      }
    })
  }

  async validarPago(pagoId: string): Promise<Pago> {  // ← USAR TIPO PRISMA
    const pago = await prisma.pago.findUnique({ where: { id: pagoId } })
    
    if (!pago) {
      throw new Error("Pago no encontrado")
    }

    if (pago.estado === "validado") {
      throw new Error("El pago ya fue validado")
    }

    return await prisma.pago.update({
      where: { id: pagoId },
      data: {
        estado: 'validado',
        fechaValidacion: new Date()
      }
    })
  }

  async eliminarPago(pagoId: string): Promise<void> {
    await prisma.pago.delete({
      where: { id: pagoId }
    })
  }
  // ---------------------------------------------------------
  // MÉTODOS PARA DASHBOARD Y REPORTES (Los que daban error)
  // ---------------------------------------------------------

  async getCasosPorAbogado() {
    // Obtener todos los abogados con sus casos
    // Nota: Asegúrate de que en tu schema.prisma la relación inversa se llame "casos" o "casosComoAbogado"
    // Aquí asumo que es "casos" por defecto si no le pusiste nombre. Si falla, revisa el schema.
    const abogados = await prisma.user.findMany({
      where: { rol: "ABOGADO" },
      include: {
        casos: true, 
      },
    })

    return abogados.map((abogado) => {
      // Agrupar casos por tipo usando JavaScript
      const casosPorTipo = abogado.casos.reduce(
        (acc: any[], caso: any) => {
          const existing = acc.find((item) => item.tipo === caso.tipo)
          if (existing) {
            existing.cantidad++
          } else {
            acc.push({ tipo: caso.tipo, cantidad: 1 })
          }
          return acc
        },
        [] 
      )

      return {
        abogadoId: abogado.id,
        nombre: abogado.nombre ?? "",
        apellido: abogado.apellido ?? "",
        totalCasos: abogado.casos.length,
        casosPorTipo,
      }
    })
  }

  async getEstadisticasAvance() {
    // Obtener todos los casos
    const casos = await prisma.caso.findMany({
      select: {
        porcentajeAvance: true,
        estado: true,
      },
    })

    // Calcular estadísticas
    const totalCasos = casos.length
    const promedioAvance = totalCasos > 0 ? casos.reduce((sum, caso) => sum + caso.porcentajeAvance, 0) / totalCasos : 0

    // Agrupar casos por estado
    const casosPorEstado = casos.reduce(
      (acc: any[], caso: any) => {
        const existing = acc.find((item) => item.estado === caso.estado)
        if (existing) {
          existing.cantidad++
        } else {
          acc.push({ estado: caso.estado, cantidad: 1 })
        }
        return acc
      },
      [] 
    )

    return {
      totalCasos,
      promedioAvance: Math.round(promedioAvance * 100) / 100,
      casosPorEstado,
    }
  }
}