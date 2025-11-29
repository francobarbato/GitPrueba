import { PrismaClienteRepository } from "@/lib/infrastructure/repositories/prisma/cliente.repository"
import type { Cliente, CrearClienteDto, ActualizarClienteDto } from "@/lib/types"

export class ClienteService {
  private repository: PrismaClienteRepository

  constructor() {
    this.repository = new PrismaClienteRepository()
  }

  async obtenerTodos(filtros?: any): Promise<Cliente[]> {
    return await this.repository.obtenerTodos(filtros)
  }

  async obtenerPorId(id: number): Promise<Cliente | null> {
    const cliente = await this.repository.obtenerPorId(id)
    if (!cliente) {
      throw new Error(`Cliente con ID ${id} no encontrado`)
    }
    return cliente
  }

  async crearCliente(datos: CrearClienteDto): Promise<Cliente> {
    // Validaciones
    if (!datos.nombre || !datos.apellido) {
      throw new Error("Nombre y apellido son requeridos")
    }

    if (!datos.email) {
      throw new Error("Email es requerido")
    }

    // Verificar email único
    const emailExiste = await this.repository.verificarEmailExistente(datos.email)
    if (emailExiste) {
      throw new Error("El email ya está registrado")
    }

    return await this.repository.crear(datos)
  }

  async actualizarCliente(id: number, datos: ActualizarClienteDto): Promise<Cliente> {
    // Verificar que existe
    const cliente = await this.obtenerPorId(id)
    if (!cliente) {
      throw new Error("Cliente no encontrado")
    }

    // Si cambió el email, verificar que no exista
    if (datos.email && datos.email !== cliente.email) {
      const emailExiste = await this.repository.verificarEmailExistente(datos.email, id)
      if (emailExiste) {
        throw new Error("El email ya está registrado")
      }
    }

    return await this.repository.actualizar(id, datos)
  }

  async eliminarCliente(id: number): Promise<void> {
    await this.obtenerPorId(id) // Verificar que existe
    await this.repository.eliminar(id)
  }

  async contarTotal(): Promise<number> {
    return await this.repository.contarTotal()
  }
}
