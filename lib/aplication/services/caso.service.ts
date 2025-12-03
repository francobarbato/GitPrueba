import { PrismaCasoRepository } from "@/lib/infrastructure/repositories/prisma/caso.repository"

export class CasoService {
  private casoRepository: PrismaCasoRepository

  constructor() {
    this.casoRepository = new PrismaCasoRepository()
  }

  // --- MÉTODOS DE LECTURA ---

  async getAllCasos() {
    return await this.casoRepository.findAll()
  }

  async getCasoById(id: string) {
    return await this.casoRepository.findById(id)
  }

  async getCasosByAbogado(abogadoId: string) {
    if (!abogadoId) return []
    return await this.casoRepository.findByAbogado(abogadoId)
  }

  async getCasosByCliente(clienteId: string) {
    return await this.casoRepository.findByCliente(clienteId)
  }

  // --- MÉTODOS DE ESCRITURA ---

async createCaso(data: any, abogadoId: string) {
    // Aquí podrías validar que el clienteId pertenezca al abogado si quisieras ser muy estricto
    return await this.casoRepository.create({
      ...data,
      abogadoId // Inyectamos el ID del abogado logueado
    })
  }

  async updateCaso(id: string, data: any) {
    return await this.casoRepository.update(id, data)
  }

  async deleteCaso(id: string) {
    return await this.casoRepository.delete(id)
  }

  async updatePorcentajeAvance(id: string, porcentaje: number) {
    if (porcentaje < 0 || porcentaje > 100) {
      throw new Error("El porcentaje debe estar entre 0 y 100")
    }
    return await this.casoRepository.updatePorcentajeAvance(id, porcentaje)
  }

  // --- MÉTODOS DE DASHBOARD ---

  async getCasosPorAbogado() {
    return await this.casoRepository.getCasosPorAbogado()
  }

  async getEstadisticasAvance() {
    return await this.casoRepository.getEstadisticasAvance()
  }
}