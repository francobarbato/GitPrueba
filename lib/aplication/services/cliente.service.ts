import { PrismaClienteRepository } from "@/lib/infrastructure/repositories/prisma/cliente.repository"

export class ClienteService {
  private repository: PrismaClienteRepository

  constructor() {
    this.repository = new PrismaClienteRepository()
  }

  async getClientesByAbogado(abogadoId: string) {
    if (!abogadoId) return []
    return await this.repository.findByAbogado(abogadoId)
  }

  async getAllClientes() {
    return await this.repository.findAll()
  }

  async getClienteById(id: string) {
    return await this.repository.findById(id)
  }

  async createCliente(data: any, usuarioId: string) {
    // Aquí podrías validar reglas de negocio (ej: límite de clientes)
    return await this.repository.create(data, usuarioId)
  }

  async actualizarCliente(id: string, data: any) {
    return await this.repository.update(id, data)
  }

  async deleteCliente(id: string, usuarioId: string, esAdmin: boolean) {
    // 1. Buscamos el cliente
    const cliente = await this.repository.findById(id)
    if (!cliente) throw new Error("Cliente no encontrado")

    // 2. Verificamos permisos
    if (!esAdmin && cliente.abogadoId !== usuarioId) {
      throw new Error("No tienes permiso para eliminar este cliente")
    }

    return await this.repository.delete(id)
  }
}