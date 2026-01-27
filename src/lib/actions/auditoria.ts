import prisma from "../../lib/db/prisma"

type AuditoriaData = {
  casoId: string
  usuarioId: string
  accion: "CREATE" | "UPDATE" | "ESTADO_CHANGE" | "PRIORIDAD_CHANGE" | "CLIENTE_CHANGE"
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
        tipo: "auto", // Siempre automático
        accion: data.accion,
        texto: data.texto,
        detalle: data.detalle || null,
        estadoAnterior: data.estadoAnterior || null,
        estadoNuevo: data.estadoNuevo || null,
      }
    })
  } catch (error) {
    console.error("Error registrando auditoría:", error)
    // No bloqueamos la operación principal si falla la auditoría
  }
}