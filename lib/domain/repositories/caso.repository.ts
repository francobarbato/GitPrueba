// src/lib/domain/repositories/caso.repository.ts
// FIX: IDs eran number, ahora son string para coincidir con UUID del schema

import type { Caso } from "../../types"

export interface CasoRepository {
  [x: string]: any

  findAll(): Promise<Caso[]>
  findById(id: string): Promise<Caso | null>       // FIX: era number
  create(data: any): Promise<Caso>
  update(id: string, data: any): Promise<Caso>     // FIX: era number
  delete(id: string): Promise<void>                // FIX: era number

  findByAbogado(abogadoId: string): Promise<Caso[]>  // FIX: era number
  findByCliente(clienteId: string): Promise<Caso[]>  // FIX: era number

  updatePorcentajeAvance(id: string, porcentaje: number): Promise<Caso>  // FIX: era number

  getCasosPorAbogado(): Promise<
    {
      abogadoId: string    // FIX: era number
      nombre: string
      apellido: string
      totalCasos: number
      casosPorTipo: { tipo: string; cantidad: number }[]
    }[]
  >

  getEstadisticasAvance(): Promise<{
    totalCasos: number
    promedioAvance: number
    casosPorEstado: { estado: string; cantidad: number }[]
  }>
}