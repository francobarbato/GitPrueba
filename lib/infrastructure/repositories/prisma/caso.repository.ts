import { PrismaClient } from "@prisma/client"
import type { CasoRepository } from "@/lib/domain/repositories/caso.repository"
import type { Caso } from "@/lib/types"

export class PrismaCasoRepository implements CasoRepository {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()

    
  }

  // Métodos básicos CRUD
  async findAll(): Promise<Caso[]> {
    const casos = await this.prisma.caso.findMany({
      include: {
        abogado: true,
        cliente: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    return casos as Caso[]
  }

  async findById(id: number): Promise<Caso | null> {
    const caso = await this.prisma.caso.findUnique({
      where: { id },
      include: {
        abogado: true,
        cliente: true,
      },
    })
    return caso as Caso | null
  }

  async create(data: any): Promise<Caso> {
    const caso = await this.prisma.caso.create({
      data,
      include: {
        abogado: true,
        cliente: true,
      },
    })
    return caso as Caso
  }

  async update(id: number, data: any): Promise<Caso> {
    const caso = await this.prisma.caso.update({
      where: { id },
      data,
      include: {
        abogado: true,
        cliente: true,
      },
    })
    return caso as Caso
  }

  async delete(id: number): Promise<void> {
    await this.prisma.caso.delete({
      where: { id },
    })
  }

  async findByAbogado(abogadoId: number): Promise<Caso[]> {
    const casos = await this.prisma.caso.findMany({
      where: { abogadoId },
      include: {
        abogado: true,
        cliente: true,
      },
    })
    return casos as Caso[]
  }

  async findByCliente(clienteId: number): Promise<Caso[]> {
    const casos = await this.prisma.caso.findMany({
      where: { clienteId },
      include: {
        abogado: true,
        cliente: true,
      },
    })
    return casos as Caso[]
  }

  // Nuevos métodos implementados
  async updatePorcentajeAvance(id: number, porcentaje: number): Promise<Caso> {
    const caso = await this.prisma.caso.update({
      where: { id },
      data: { porcentajeAvance: porcentaje },
      include: {
        abogado: true,
        cliente: true,
      },
    })
    return caso as Caso
  }

  async getCasosPorAbogado(): Promise<
    {
      abogadoId: number
      nombre: string
      apellido: string
      totalCasos: number
      casosPorTipo: { tipo: string; cantidad: number }[]
    }[]
  > {
    // Obtener todos los abogados con sus casos
    const abogados = await this.prisma.usuario.findMany({
      where: { rol: "abogado" },
      include: {
        casosComoAbogado: true, // Usar la relación correcta del esquema
      },
    })

    // Procesar los datos para el formato requerido
    return abogados.map((abogado) => {
      // Agrupar casos por tipo usando JavaScript (más confiable que queryRaw)
      const casosPorTipo = abogado.casosComoAbogado.reduce(
        (acc, caso) => {
          const existing = acc.find((item) => item.tipo === caso.tipo)
          if (existing) {
            existing.cantidad++
          } else {
            acc.push({ tipo: caso.tipo, cantidad: 1 })
          }
          return acc
        },
        [] as { tipo: string; cantidad: number }[],
      )

      return {
        abogadoId: abogado.id,
        nombre: abogado.nombre,
        apellido: abogado.apellido,
        totalCasos: abogado.casosComoAbogado.length,
        casosPorTipo,
      }
    })
  }

  async getEstadisticasAvance(): Promise<{
    totalCasos: number
    promedioAvance: number
    casosPorEstado: { estado: string; cantidad: number }[]
  }> {
    // Obtener todos los casos
    const casos = await this.prisma.caso.findMany({
      select: {
        porcentajeAvance: true,
        estado: true,
      },
    })

    // Calcular estadísticas usando JavaScript
    const totalCasos = casos.length
    const promedioAvance = totalCasos > 0 ? casos.reduce((sum, caso) => sum + caso.porcentajeAvance, 0) / totalCasos : 0

    // Agrupar casos por estado
    const casosPorEstado = casos.reduce(
      (acc, caso) => {
        const existing = acc.find((item) => item.estado === caso.estado)
        if (existing) {
          existing.cantidad++
        } else {
          acc.push({ estado: caso.estado, cantidad: 1 })
        }
        return acc
      },
      [] as { estado: string; cantidad: number }[],
    )

    return {
      totalCasos,
      promedioAvance: Math.round(promedioAvance * 100) / 100, // Redondear a 2 decimales
      casosPorEstado,
    }
  }
}
