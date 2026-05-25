// src/lib/infrastructure/repositories/prisma/caso.repository.ts

import prisma from "src/lib/db/prisma"
import { Caso, Pago } from "@prisma/client"

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
    return await prisma.caso.findMany({
      include: {
        abogado: true,
        cliente: true,
      },
      orderBy: { createdAt: "desc" },
    })
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

  async findByAbogado(abogadoId: string): Promise<Caso[]> {
    try {
      return await prisma.caso.findMany({
        where: { abogadoId },
        include: {
          cliente: true,
          abogado: true,
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error("Error en findByAbogado:", error)
      return []
    }
  }

  async findByCliente(clienteId: string): Promise<Caso[]> {
    return await prisma.caso.findMany({
      where: { clienteId },
      include: {
        abogado: true,
        cliente: true,
      },
    })
  }

  // ---------------------------------------------------------
  // MÉTODOS DE MUTACIÓN
  // ---------------------------------------------------------

  async create(data: any): Promise<Caso> {
    // FIX: antes hardcodeaba estado y fechaInicio, e ignoraba todos los campos
    // opcionales. Ahora pasa todo lo que viene en data.
    return await prisma.caso.create({
      data: {
        numero: data.numero,
        titulo: data.titulo,
        descripcion: data.descripcion || "",
        tipo: data.tipo,
        // Respeta el estado que viene del servicio, con fallback
        estado: data.estado || 'Inicio / Demanda',
        // Respeta la fecha que viene del servicio, con fallback
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
        porcentajeAvance: data.porcentajeAvance || 0,
        abogadoId: data.abogadoId,
        clienteId: data.clienteId,
        // Campos opcionales — se pasan si vienen, si no Prisma usa el default
        priority: data.priority || 'NORMAL',
        isFavorite: data.isFavorite || false,
        juzgado: data.juzgado || null,
        fuero: data.fuero || null,
        contraparteNombre: data.contraparteNombre || null,
        contraparteDni: data.contraparteDni || null,
        montoDisputa: data.montoDisputa || null,
        ubicacionFisica: data.ubicacionFisica || null,
        // Requirements se crean como hijos si vienen en el formato correcto
        ...(data.requirements && { requirements: data.requirements }),
      },
      include: {
        abogado: true,
        cliente: true,
      }
    })
  }

  async update(id: string, data: any): Promise<Caso> {
    return await prisma.caso.update({
      where: { id },
      data,
      include: {
        abogado: true,
        cliente: true,
      },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.caso.delete({ where: { id } })
  }

  async updatePorcentajeAvance(id: string, porcentaje: number): Promise<Caso> {
    return await prisma.caso.update({
      where: { id },
      data: { porcentajeAvance: porcentaje },
      include: {
        abogado: true,
        cliente: true,
      },
    })
  }

  // ---------------------------------------------------------
  // MÉTODOS DE PAGOS
  // ---------------------------------------------------------

  async crearPago(data: {
    casoId: string
    concepto: string
    descripcion?: string
    monto: number
  }): Promise<Pago> {
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

  async validarPago(pagoId: string): Promise<Pago> {
    const pago = await prisma.pago.findUnique({ where: { id: pagoId } })

    if (!pago) throw new Error("Pago no encontrado")
    if (pago.estado === "validado") throw new Error("El pago ya fue validado")

    return await prisma.pago.update({
      where: { id: pagoId },
      data: {
        estado: 'validado',
        fechaValidacion: new Date()
      }
    })
  }

  async eliminarPago(pagoId: string): Promise<void> {
    await prisma.pago.delete({ where: { id: pagoId } })
  }

  // ---------------------------------------------------------
  // MÉTODOS DE DASHBOARD Y REPORTES
  // ---------------------------------------------------------

  async getCasosPorAbogado() {
    const abogados = await prisma.user.findMany({
      where: { rol: "ABOGADO" },
      include: { casos: true },
    })

    return abogados.map((abogado) => {
      const casosPorTipo = abogado.casos.reduce((acc: any[], caso: any) => {
        const existing = acc.find((item) => item.tipo === caso.tipo)
        if (existing) {
          existing.cantidad++
        } else {
          acc.push({ tipo: caso.tipo, cantidad: 1 })
        }
        return acc
      }, [])

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
    const casos = await prisma.caso.findMany({
      select: {
        porcentajeAvance: true,
        estado: true,
      },
    })

    const totalCasos = casos.length
    const promedioAvance = totalCasos > 0
      ? casos.reduce((sum, caso) => sum + caso.porcentajeAvance, 0) / totalCasos
      : 0

    const casosPorEstado = casos.reduce((acc: any[], caso: any) => {
      const existing = acc.find((item) => item.estado === caso.estado)
      if (existing) {
        existing.cantidad++
      } else {
        acc.push({ estado: caso.estado, cantidad: 1 })
      }
      return acc
    }, [])

    return {
      totalCasos,
      promedioAvance: Math.round(promedioAvance * 100) / 100,
      casosPorEstado,
    }
  }
}