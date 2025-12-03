// Tipos base
export interface Usuario {
  id: number
  email: string
  nombre: string
  apellido: string
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
  fechaCierre?: Date | null
  abogadoId: number
  clienteId: number
  createdAt: Date
  updatedAt: Date
  abogado?: Usuario
  cliente?: Cliente //
}

// DTOs para operaciones
export interface CrearCasoDto {
  numero: string
  titulo: string
  descripcion: string
  tipo: string
  estado: string
  numeroDocumento?: string | number
  porcentajeAvance: number
  fechaInicio: Date
  fechaCierre?: Date
  abogadoId: number
  clienteId: number
}

export interface ActualizarCasoDto {
  numero?: string
  titulo?: string
  descripcion?: string
  tipo?: string
  estado?: string
  numeroDocumento?: string | number
  porcentajeAvance?: number
  fechaInicio?: Date
  fechaCierre?: Date
  abogadoId?: number
  clienteId?: number
}

// Tipos para reportes
export interface ResumenDashboard {
  totalCasos: number
  casosAbiertos: number
  casosEnProceso: number
  casosCerrados: number
  promedioAvance: number
}

export interface EstadisticaAbogado {
  abogadoId: number
  nombre: string
  apellido: string
  totalCasos: number
  promedioAvance: number
}

// Tipos para Cliente
export interface Cliente {
  id: number
  nombre: string
  apellido: string
  email: string
  numeroDocumento: string | null // El DTO lo maneja como string | number, el tipo final es string
  tipoDocumento: string | null
  direccion: string | null
  telefono: string | null
  estado: string | null // El estado del cliente (activo/inactivo)
  createdAt: Date
  updatedAt: Date
}
export interface CrearClienteDto {
  // abogadoId: string
  nombre: string
  apellido: string
  email: string
  numeroDocumento: string | number
  tipoDocumento: string
  direccion: string
  telefono: string
  estado: string
}

export interface ActualizarClienteDto {
  nombre?: string
  apellido?: string
  email?: string
  numeroDocumento?: string | number
  tipoDocumento?: string
  direccion?: string
  telefono?: string
  estado?: string
}

// Constantes
export const TIPOS_CASO = ["laboral", "civil", "comercial", "familia", "penal"] as const

export const ESTADOS_CASO = ["abierto", "en_proceso", "cerrado", "archivado"] as const

export const ROLES_USUARIO = ["admin", "abogado", "cliente"] as const

export type TipoCaso = (typeof TIPOS_CASO)[number]
export type EstadoCaso = (typeof ESTADOS_CASO)[number]
export type RolUsuario = (typeof ROLES_USUARIO)[number]
