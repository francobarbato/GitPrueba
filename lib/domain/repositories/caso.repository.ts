import type { Caso } from "../../types"

// Interfaz del repositorio de casos
export interface CasoRepository {
  [x: string]: any
  // Métodos básicos CRUD
  findAll(): Promise<Caso[]>
  findById(id: number): Promise<Caso | null>
  create(data: any): Promise<Caso>
  update(id: number, data: any): Promise<Caso>
  delete(id: number): Promise<void>

  // Métodos específicos existentes
  findByAbogado(abogadoId: number): Promise<Caso[]>
  findByCliente(clienteId: number): Promise<Caso[]>

  // Nuevo método para actualizar el porcentaje de avance
  updatePorcentajeAvance(id: number, porcentaje: number): Promise<Caso>

  // Método para obtener casos por abogado con estadísticas
  getCasosPorAbogado(): Promise<
    {
      abogadoId: number
      nombre: string
      apellido: string
      totalCasos: number
      casosPorTipo: { tipo: string; cantidad: number }[]
    }[]
  >

  // Método para obtener estadísticas de avance
  getEstadisticasAvance(): Promise<{
    totalCasos: number
    promedioAvance: number
    casosPorEstado: { estado: string; cantidad: number }[]
  }>
}
