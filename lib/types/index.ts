// Tipos principales del sistema
export interface Usuario {
  id: number
  email: string
  nombre: string
  apellido: string
  password: string
  rol: string
  createdAt: Date
  updatedAt: Date
}

export interface Caso {
  id: number
  numero: string
  titulo: string
  descripcion: string
  tipo: string
  estado: string
  porcentajeAvance: number
  fechaInicio: Date
  fechaCierre: Date | null
  abogadoId: number
  clienteId: number
  createdAt: Date
  updatedAt: Date
  abogado?: Usuario
  cliente?: Usuario
}

// Tipos para reportes
export interface CasosPorAbogado {
  abogadoId: number
  nombre: string
  apellido: string
  totalCasos: number
  casosPorTipo: { tipo: string; cantidad: number }[]
}

export interface EstadisticasAvance {
  totalCasos: number
  promedioAvance: number
  casosPorEstado: { estado: string; cantidad: number }[]
}

// Tipos para formularios
export interface CreateCasoData {
  numero: string
  titulo: string
  descripcion: string
  tipo: string
  estado: string
  fechaInicio: Date
  fechaCierre?: Date
  abogadoId: number
  clienteId: number
  porcentajeAvance?: number
}

export interface UpdateCasoData {
  titulo?: string
  descripcion?: string
  tipo?: string
  estado?: string
  fechaCierre?: Date
  porcentajeAvance?: number
}
