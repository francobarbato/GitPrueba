import type { Cliente, CrearClienteDto, ActualizarClienteDto } from "@/lib/types"

export interface IClienteRepository {
  obtenerTodos(filtros?: any): Promise<Cliente[]>
  obtenerPorId(id: number): Promise<Cliente | null>
  crear(datos: CrearClienteDto): Promise<Cliente>
  actualizar(id: number, datos: ActualizarClienteDto): Promise<Cliente>
  eliminar(id: number): Promise<void>
  verificarEmailExistente(email: string, idExcluir?: number): Promise<boolean>
  contarTotal(): Promise<number>
}
