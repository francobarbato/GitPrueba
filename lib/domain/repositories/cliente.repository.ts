// src/lib/domain/repositories/cliente.repository.ts
// FIX: IDs eran number, métodos alineados con PrismaClienteRepository

import type { Cliente, CrearClienteDto, ActualizarClienteDto } from "@/lib/types"

export interface IClienteRepository {
  findAll(): Promise<Cliente[]>
  findById(id: string): Promise<Cliente | null>           // FIX: era number, nombre alineado
  findByAbogado(abogadoId: string): Promise<Cliente[]>
  create(data: CrearClienteDto, abogadoId: string): Promise<Cliente>   // FIX: era number + nombre alineado
  update(id: string, data: ActualizarClienteDto): Promise<Cliente>     // FIX: era number + nombre alineado
  delete(id: string): Promise<void>                       // FIX: era number + nombre alineado
}