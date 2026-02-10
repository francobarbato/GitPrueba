import prisma from "../../lib/db/prisma" // Asegúrate que esta ruta sea la correcta en tu proyecto

// Definición de tipos permitidos para la auditoría
type AuditoriaData = {
  casoId: string
  usuarioId: string
  // AQUÍ AGREGAMOS LAS NUEVAS ACCIONES: "CIERRE" | "REAPERTURA"
  accion: "CREATE" | "UPDATE" | "ESTADO_CHANGE" | "PRIORIDAD_CHANGE" | "CLIENTE_CHANGE" | "CIERRE" | "REAPERTURA"
  texto: string
  detalle?: string
  estadoAnterior?: string
  estadoNuevo?: string
}

export async function registrarAuditoria(data: AuditoriaData) {
  try {
    await prisma.bitacora.create({
      data: {
        casoId: data.casoId,
        usuarioId: data.usuarioId,
        tipo: "auto", // Siempre automático para auditoría
        accion: data.accion, // Ahora TypeScript aceptará "CIERRE" sin chistar
        texto: data.texto,
        detalle: data.detalle || null,
        estadoAnterior: data.estadoAnterior || null,
        estadoNuevo: data.estadoNuevo || null,
      }
    })
  } catch (error) {
    console.error("Error registrando auditoría:", error)
    // No bloqueamos la operación principal si falla la auditoría (Fail-safe)
  }
}