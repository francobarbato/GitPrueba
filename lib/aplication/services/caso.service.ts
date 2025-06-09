import { CasoRepository } from "@/lib/domain/repositories/caso.repository"
import { Caso, CreateCasoData, UpdateCasoData } from "../../types"

export class CasoService {
  constructor(private casoRepository: CasoRepository) {}

  // Métodos existentes actualizados
  async getAllCasos(filtros?: any): Promise<Caso[]> {
    if (filtros) {
      // Si hay filtros, usar un método específico
      return this.casoRepository.findWithFilters(filtros)
    }
    return this.casoRepository.findAll()
  }

  async getCasoById(id: number): Promise<Caso | null> {
    return this.casoRepository.findById(id)
  }

  async createCaso(data: CreateCasoData): Promise<Caso> {
    return this.casoRepository.create(data)
  }

  async updateCaso(id: number, data: UpdateCasoData): Promise<Caso> {
    return this.casoRepository.update(id, data)
  }

  async deleteCaso(id: number): Promise<void> {
    return this.casoRepository.delete(id)
  }

  async getCasosByAbogado(abogadoId: number): Promise<Caso[]> {
    return this.casoRepository.findByAbogado(abogadoId)
  }

  async getCasosByCliente(clienteId: number): Promise<Caso[]> {
    return this.casoRepository.findByCliente(clienteId)
  }

  async updatePorcentajeAvance(id: number, porcentaje: number): Promise<Caso> {
    if (porcentaje < 0 || porcentaje > 100) {
      throw new Error("El porcentaje debe estar entre 0 y 100")
    }
    return this.casoRepository.updatePorcentajeAvance(id, porcentaje)
  }

  async getCasosPorAbogado() {
    return this.casoRepository.getCasosPorAbogado()
  }

  async getEstadisticasAvance() {
    return this.casoRepository.getEstadisticasAvance()
  }
}
export default CasoService;