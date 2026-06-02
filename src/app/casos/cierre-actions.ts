'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { revalidatePath } from "next/cache"
import prisma from "src/lib/db/prisma"
import { registrarAuditoria } from "../../lib/actions/auditoria"

// ============================================================================
// CERRAR CASO
// ============================================================================
export async function cerrarCasoAction(
  casoId: string,
  data: {
    motivoCierre: string
    montoFinal: number | null
    fechaCierre: string
    observacionCierre: string
  }
) {
  const user = await getUserSessionServer()

  if (!user || !user.id) {
    throw new Error("No autorizado")
  }

  const userRol = user.rol?.toUpperCase()

  // Solo Admin y Abogado pueden cerrar casos
  if (userRol !== 'ADMIN' && userRol !== 'ABOGADO') {
    throw new Error("No tienes permiso para cerrar casos")
  }

  // Validar motivo
  const motivosValidos = ['FAVORABLE', 'DESFAVORABLE', 'ACUERDO', 'DESISTIMIENTO', 'ARCHIVO']
  if (!data.motivoCierre || !motivosValidos.includes(data.motivoCierre)) {
    throw new Error("Motivo de cierre no válido")
  }

  try {
    // Obtener caso actual
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      select: { 
        id: true, 
        numero: true,
        titulo: true,
        estado: true, 
        estaCerrado: true,
        abogadoId: true 
      }
    })

    if (!caso) {
      throw new Error("Caso no encontrado")
    }

    if (caso.estaCerrado) {
      throw new Error("El caso ya está cerrado")
    }

    // Si es Abogado, verificar que sea su caso
    if (userRol === 'ABOGADO' && caso.abogadoId !== user.id) {
      throw new Error("Solo puedes cerrar tus propios casos")
    }

    // Actualizar el caso
    await prisma.caso.update({
      where: { id: casoId },
      data: {
        estaCerrado: true,
        motivoCierre: data.motivoCierre,
        montoFinal: data.montoFinal,
        fechaCierre: new Date(data.fechaCierre),
        fechaFin: new Date(data.fechaCierre), // También actualizar fechaFin
        observacionCierre: data.observacionCierre || null,
        cerradoPorId: user.id,
        estadoAntesCierre: caso.estado, // Guardar estado actual para posible reapertura
        estado: "Cerrado" // Cambiar estado a Cerrado
      }
    })

    // Mapeo de motivos a texto
    const motivosTexto: Record<string, string> = {
      'FAVORABLE': 'Sentencia Favorable (Ganado)',
      'DESFAVORABLE': 'Sentencia Desfavorable (Perdido)',
      'ACUERDO': 'Acuerdo Extrajudicial',
      'DESISTIMIENTO': 'Desistimiento / Abandono',
      'ARCHIVO': 'Archivo Administrativo',
    }

    // Registrar en auditoría
    await registrarAuditoria({
      casoId: casoId,
      usuarioId: user.id,
      accion: "CIERRE",
      texto: `Caso cerrado: ${motivosTexto[data.motivoCierre]}`,
      detalle: data.observacionCierre 
        ? `Monto final: ${data.montoFinal ? '$' + data.montoFinal.toLocaleString() : 'No especificado'}. Observaciones: ${data.observacionCierre}`
        : `Monto final: ${data.montoFinal ? '$' + data.montoFinal.toLocaleString() : 'No especificado'}`,
      estadoAnterior: caso.estado,
      estadoNuevo: "Cerrado"
    })

    // También registrar en bitácora para que aparezca en el historial
    await prisma.bitacora.create({
      data: {
        texto: `📕 CASO CERRADO - ${motivosTexto[data.motivoCierre]}`,
        tipo: "auto",
        accion: "Cierre",
        usuarioId: user.id,
        casoId: casoId,
        detalle: data.observacionCierre || 'Sin observaciones adicionales',
        estadoAnterior: caso.estado,
        estadoNuevo: "Cerrado"
      }
    })

    console.log(`✅ Caso cerrado: ${caso.numero} - Motivo: ${data.motivoCierre} - Por: ${user.id}`)

    revalidatePath("/casos")
    revalidatePath(`/casos/${casoId}`)
    revalidatePath("/reportes")

    return { success: true }

  } catch (error: any) {
    console.error("Error cerrando caso:", error)
    throw new Error(error.message || "Error al cerrar el caso")
  }
}

// ============================================================================
// REABRIR CASO (SOLO ADMIN)
// ============================================================================
export async function reabrirCasoAction(casoId: string, motivoReapertura: string) {
  const user = await getUserSessionServer()

  if (!user || !user.id) {
    throw new Error("No autorizado")
  }

  const userRol = user.rol?.toUpperCase()

  // Solo Admin puede reabrir casos
  if (userRol !== 'ADMIN') {
    throw new Error("Solo el Administrador puede reabrir casos cerrados")
  }

  if (!motivoReapertura || motivoReapertura.trim().length < 10) {
    throw new Error("Debe indicar un motivo de reapertura válido (mínimo 10 caracteres)")
  }

  try {
    // Obtener caso actual
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      select: { 
        id: true, 
        numero: true,
        titulo: true,
        estaCerrado: true,
        motivoCierre: true,
        fechaCierre: true,
        estadoAntesCierre: true
      }
    })

    if (!caso) {
      throw new Error("Caso no encontrado")
    }

    if (!caso.estaCerrado) {
      throw new Error("El caso no está cerrado")
    }

    // Estado al que volver (el que tenía antes de cerrar, o "Inicio / Demanda" por defecto)
    const estadoRestaurado = caso.estadoAntesCierre || "Inicio / Demanda"

    // Actualizar el caso
    await prisma.caso.update({
      where: { id: casoId },
      data: {
        estaCerrado: false,
        estado: estadoRestaurado,
        // NO limpiamos los datos de cierre para mantener el historial
        // motivoCierre, montoFinal, fechaCierre, observacionCierre permanecen
        fechaFin: null // Quitar fecha de fin
      }
    })

    // Mapeo de motivos para el registro
    const motivosTexto: Record<string, string> = {
      'FAVORABLE': 'Sentencia Favorable',
      'DESFAVORABLE': 'Sentencia Desfavorable',
      'ACUERDO': 'Acuerdo Extrajudicial',
      'DESISTIMIENTO': 'Desistimiento / Abandono',
      'ARCHIVO': 'Archivo Administrativo'
    }

    // Registrar en auditoría
    await registrarAuditoria({
      casoId: casoId,
      usuarioId: user.id,
      accion: "REAPERTURA",
      texto: `Caso reabierto por Administrador`,
      detalle: `Motivo de reapertura: ${motivoReapertura}. Cierre anterior: ${motivosTexto[caso.motivoCierre || ''] || caso.motivoCierre}`,
      estadoAnterior: "Cerrado",
      estadoNuevo: estadoRestaurado
    })

    // También registrar en bitácora
    await prisma.bitacora.create({
      data: {
        texto: `🔄 CASO REABIERTO`,
        tipo: "auto",
        accion: "Reapertura",
        usuarioId: user.id,
        casoId: casoId,
        detalle: motivoReapertura,
        estadoAnterior: "Cerrado",
        estadoNuevo: estadoRestaurado
      }
    })

    console.log(`✅ Caso reabierto: ${caso.numero} - Por Admin: ${user.id}`)

    revalidatePath("/casos")
    revalidatePath(`/casos/${casoId}`)
    revalidatePath("/reportes")

    return { success: true }

  } catch (error: any) {
    console.error("Error reabriendo caso:", error)
    throw new Error(error.message || "Error al reabrir el caso")
  }
}