// src/lib/utils/labels.ts
//
// Labels centralizados para mostrar enums de Prisma como texto legible.
// Se usan tanto en bitácoras (detalle) como en reportes y badges de UI.
// Centralizamos acá para que un cambio se propague a todos los lugares.

import {
  TipoCaso,
  Priority,
  TipoTarea,
  PrioridadTarea,
  EstadoTarea,
  CategoriaTarea,
  TipoLiquidacion,
} from "@prisma/client"

// ============================================================================
// CASO
// ============================================================================

export const TIPO_CASO_LABELS: Record<TipoCaso | string, string> = {
  LABORAL: "Laboral",
  CIVIL_COMERCIAL: "Civil y Comercial",
  FAMILIA: "Familia",
  PENAL: "Penal",
  SUCESIONES: "Sucesiones",
  CONTENCIOSO_ADMINISTRATIVO: "Contencioso Administrativo",
  OTRO: "Otro",
}

export const PRIORIDAD_CASO_LABELS: Record<Priority | string, string> = {
  HIGH: "Alta",
  NORMAL: "Normal",
  LOW: "Baja",
}

// ============================================================================
// TAREA / EVENTO
// ============================================================================

export const TIPO_TAREA_LABELS: Record<TipoTarea | string, string> = {
  PROCESAL: "Procesal",
  INTERNA: "Interna",
}

export const PRIORIDAD_TAREA_LABELS: Record<PrioridadTarea | string, string> = {
  FATAL: "Fatal",
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
}

export const ESTADO_TAREA_LABELS: Record<EstadoTarea | string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  BLOQUEADA: "Bloqueada",
  COMPLETADA: "Completada",
  VENCIDA: "Vencida",
}

export const CATEGORIA_TAREA_LABELS: Record<CategoriaTarea | string, string> = {
  PRESENTACION_ESCRITO: "Presentación / Escrito",
  AUDIENCIA: "Audiencia",
  NOTIFICACION_CEDULA: "Notificación / Cédula",
  CONTROL_EXPEDIENTE: "Control de Expediente",
  APELACION_RECURSO: "Apelación / Recurso",
  PERICIA_PRUEBA: "Pericia / Prueba",
  REUNION_CLIENTE: "Reunión con Cliente",
  REDACCION_DOCUMENTACION: "Redacción / Documentación",
  TRAMITE_ADMINISTRATIVO: "Trámite Administrativo",
  REQUERIMIENTO_CLIENTE: "Req. al Cliente",
  GESTION_FINANCIERA: "Gestión Financiera",
  REUNION_EQUIPO: "Reunión de Equipo",
  VENCIMIENTO_PLAZO: "Vencimiento / Plazo",
}

// ============================================================================
// USUARIO
// ============================================================================

export const ROL_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  ABOGADO: "Abogado",
  ASISTENTE: "Asistente",
  CLIENTE: "Cliente",
}

// ============================================================================
// LIQUIDACIÓN
// ============================================================================
// Si tu enum TipoLiquidacion tiene otros valores, sumalos acá.
// El helper labelOrFallback() abajo se cae a un valor capitalizado si no
// encuentra el key, así que estos labels son aditivos, no obligatorios.

export const TIPO_LIQUIDACION_LABELS: Record<TipoLiquidacion | string, string> = {
  SALARIOS_CAIDOS: "Salarios caídos",
  DESPIDO: "Indemnización por despido",
  DANOS_PERJUICIOS: "Daños y perjuicios",
  ALIMENTOS: "Alimentos",
  HONORARIOS: "Honorarios",
}

// ============================================================================
// HELPER GENÉRICO
// ============================================================================
// Si el valor existe en el diccionario, devuelve el label.
// Si no, hace un fallback prolijo: "DANOS_PERJUICIOS" → "Daños Perjuicios"
// (reemplaza guiones bajos, lowercasea, capitaliza cada palabra).
// Útil para no romper si aparece un valor de enum nuevo que no agregamos acá.

export function labelOrFallback(
  value: string | null | undefined,
  dictionary: Record<string, string>,
): string {
  if (!value) return "—"
  if (dictionary[value]) return dictionary[value]
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}