// src/lib/types/index.ts
// FIX: todos los IDs eran `number` pero el schema usa String UUID (@default(uuid()))

// Tipos base
export interface Usuario {
  id: string          // FIX: era number
  email: string
  nombre: string
  apellido: string
  rol: string
  createdAt: Date
  updatedAt: Date
}

export interface Caso {
  id: string          // FIX: era number
  numero: string
  titulo: string
  descripcion: string
  tipo: string
  estado: string
  porcentajeAvance: number
  fechaInicio: Date
  fechaCierre?: Date | null
  abogadoId: string   // FIX: era number
  clienteId: string   // FIX: era number
  createdAt: Date
  updatedAt: Date
  abogado?: Usuario
  cliente?: Cliente
}

export interface CrearCasoDto {
  numero: string
  titulo: string
  descripcion: string
  tipo: string
  estado: string
  porcentajeAvance: number
  fechaInicio: Date
  fechaCierre?: Date
  abogadoId: string   // FIX: era number
  clienteId: string   // FIX: era number
}

export interface ActualizarCasoDto {
  numero?: string
  titulo?: string
  descripcion?: string
  tipo?: string
  estado?: string
  porcentajeAvance?: number
  fechaInicio?: Date
  fechaCierre?: Date
  abogadoId?: string  // FIX: era number
  clienteId?: string  // FIX: era number
}

export interface ResumenDashboard {
  totalCasos: number
  casosAbiertos: number
  casosEnProceso: number
  casosCerrados: number
  promedioAvance: number
}

export interface EstadisticaAbogado {
  abogadoId: string   // FIX: era number
  nombre: string
  apellido: string
  totalCasos: number
  promedioAvance: number
}

export interface Cliente {
  id: string          // FIX: era number
  nombre: string
  apellido: string
  email: string
  numeroDocumento: string | null
  tipoDocumento: string | null
  direccion: string | null
  telefono: string | null
  estado: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CrearClienteDto {
  nombre: string
  apellido: string
  email: string
  numeroDocumento: string
  tipoDocumento: string
  direccion: string
  telefono: string
  estado: string
}

export interface ActualizarClienteDto {
  nombre?: string
  apellido?: string
  email?: string
  numeroDocumento?: string
  tipoDocumento?: string
  direccion?: string
  telefono?: string
  estado?: string
}

export interface Bitacora {
  id: string          // FIX: era number, el schema usa uuid
  texto: string
  tipo: string
  usuarioId: string
  casoId?: string | null
  createdAt: Date
}

// Constantes — actualizadas para coincidir con los enums reales del schema
export const TIPOS_CASO = [
  "LABORAL",
  "CIVIL_COMERCIAL",
  "FAMILIA",
  "PENAL",
  "SUCESIONES",
  "CONTENCIOSO_ADMINISTRATIVO",
  "OTRO"
] as const

export const ESTADOS_CASO = [
  "Inicio / Demanda",
  "Mediación",
  "Prueba (Oficios/Pericias)",
  "Alegatos / Conclusiones",
  "Sentencia / Resolución",
  "Ejecución de Sentencia",
  "Terminado",
  "Archivado",
  "Cerrado"
] as const

// FIX: roles en mayúscula para coincidir con el enum UserRole del schema
export const ROLES_USUARIO = ["ADMIN", "ABOGADO", "ASISTENTE", "CLIENTE"] as const

export type TipoCaso = (typeof TIPOS_CASO)[number]
export type EstadoCaso = (typeof ESTADOS_CASO)[number]
export type RolUsuario = (typeof ROLES_USUARIO)[number]