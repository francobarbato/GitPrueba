// src/lib/infrastructure/repositories/prisma/cliente.repository.ts

import prisma from "src/lib/db/prisma"
import { Cliente } from "@prisma/client"

export class PrismaClienteRepository {

  async findByAbogado(abogadoId: string): Promise<Cliente[]> {
    try {
      return await prisma.cliente.findMany({
        where: { abogadoId },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error("Error en findByAbogado:", error)
      return []
    }
  }

  async findAll(): Promise<Cliente[]> {
    return await prisma.cliente.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        abogado: true
      }
    })
  }

  async findById(id: string): Promise<Cliente | null> {
    return await prisma.cliente.findUnique({
      where: { id },
      include: {
        casos: true
      }
    })
  }

  async create(data: any, abogadoId: string): Promise<Cliente> {
    // FIX: se eliminó estado: 'Activo' hardcodeado — el campo de estado real
    // en el schema es `activo: Boolean @default(true)`, no un string 'Activo'.
    // El campo `estado` (String?) existe pero no se usa para esto.
    return await prisma.cliente.create({
      data: {
        ...data,
        abogadoId,
      }
    })
  }

  async update(id: string, data: any): Promise<Cliente> {
    return await prisma.cliente.update({
      where: { id },
      data
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.cliente.delete({ where: { id } })
  }
}