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

   // --- NUEVOS MÉTODOS DE PAGOS ---
  
  async agregarPago(casoId: string, data: any) {
    return await this.casoRepository.crearPago({
        casoId,
        concepto: data.concepto,
        descripcion: data.descripcion,
        monto: data.monto
    })
  }

  async validarPago(pagoId: string) {
    return await this.casoRepository.validarPago(pagoId)
  }

  async eliminarPago(pagoId: string) {
    return await this.casoRepository.eliminarPago(pagoId)
  }

  // --- MÉTODOS DE ESCRITURA ---

  async createCaso(data: any, abogadoId: string) {
    // 1. Procesamiento de Fecha de Inicio
    // Aseguramos que sea un objeto Date real, o usamos la fecha actual
    const fechaInicio = data.fechaInicio ? new Date(data.fechaInicio) : new Date()

    // 2. Procesamiento del Checklist (Requirements)
    // El Action nos manda un array simple, pero Prisma necesita el formato { create: [...] }
    let requirementsFormat = undefined

    if (data.requirements && Array.isArray(data.requirements) && data.requirements.length > 0) {
      requirementsFormat = {
        create: data.requirements.map((req: any) => ({
          description: req.description,
          // Convertimos el string de fecha a objeto Date, o null si está vacío
          dueDate: req.dueDate ? new Date(req.dueDate) : null,
          isCompleted: false,
        })),
      }
    }

    // 3. Armamos el objeto final limpio para el Repositorio
    const datosParaGuardar = {
      numero: data.numero,
      titulo: data.titulo,
      descripcion: data.descripcion,
      tipo: data.tipo,
      estado: data.estado || "Abierto", // Forzamos el estado inicial
      fechaInicio: fechaInicio,
      clienteId: data.clienteId,
      abogadoId: abogadoId, // Inyectamos el ID del abogado logueado

      // Nuevos campos de Prioridad y Favorito
      priority: data.priority,
      isFavorite: data.isFavorite,

      // Aquí pasamos la estructura mágica para que Prisma cree los hijos
      requirements: requirementsFormat,
    }

    return await this.casoRepository.create(datosParaGuardar)
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
