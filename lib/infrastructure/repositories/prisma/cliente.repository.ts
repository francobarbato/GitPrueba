import prisma from "src/lib/db/prisma" // Tu instancia singleton
import { Cliente } from "@prisma/client"

export class PrismaClienteRepository {
  
  // Obtener clientes filtrados por Abogado (Seguridad)
  async findByAbogado(abogadoId: string): Promise<Cliente[]> {
    try {
      const clientes = await prisma.cliente.findMany({
        where: { abogadoId: abogadoId },
        orderBy: { createdAt: 'desc' }
      })
      return clientes
    } catch (error) {
      console.error("Error en findByAbogado:", error)
      return []
    }
  }

  // Obtener todos (Para Admin)
  async findAll(): Promise<Cliente[]> {
    return await prisma.cliente.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        abogado: true // Opcional: para ver quién es el abogado
      }
    })
  }

  async findById(id: string): Promise<Cliente | null> {
    return await prisma.cliente.findUnique({
      where: { id },
      include: {
        casos: true // Traemos los casos asociados al cliente
      }
    })
  }

  // Crear Cliente
async create(data: any, abogadoId: string): Promise<Cliente> {
    return await prisma.cliente.create({
      data: {
        ...data, // nombre, apellido, email, etc.
        abogadoId: abogadoId, // <--- VINCULACIÓN AUTOMÁTICA
        estado: 'Activo' // Por defecto
      }
    })
  }

  // Actualizar Cliente
  async update(id: string, data: any): Promise<Cliente> {
    return await prisma.cliente.update({
      where: { id },
      data
    })
  }

  // Eliminar Cliente
async delete(id: string): Promise<void> {
    await prisma.cliente.delete({ where: { id } })
  }
}