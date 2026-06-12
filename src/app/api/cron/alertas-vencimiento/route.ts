// src/app/api/cron/alertas-vencimiento/route.ts
//
// Endpoint llamado por Vercel Cron una vez al día a las 11 UTC (8 AM Argentina).
// Configurado en vercel.json.
//
// Lógica:
//   1. Trae todas las tareas activas con fechaVencimiento en ventana ±30 días.
//   2. Para cada una calcula días hábiles restantes (sin sábados/domingos/feriados).
//   3. Determina el umbral cruzado (20/10/5).
//   4. Junta los destinatarios (responsable + supervisor, dedupe).
//   5. Para cada destinatario: si NO se le envió mail de este umbral para esta
//      tarea, lo manda e inserta el registro en TareaAlertaMail.
//
// Seguridad: el endpoint solo responde si recibe el header
// Authorization: Bearer ${CRON_SECRET}. Vercel Cron inyecta este header
// automáticamente cuando está configurado en vercel.json.

import { NextRequest, NextResponse } from "next/server"
import prisma from "src/lib/db/prisma"
import { diasHabilesEntre, umbralPorDiasHabiles } from "src/lib/utils/dias-habiles"
import { sendAlertaVencimientoEmail } from "src/lib/email/send"

// Esta ruta NO debe cachearse — siempre ejecuta lógica live
export const dynamic = "force-dynamic"
// Vercel limit del free tier: 60s. Subir si hace falta.
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // ─── Seguridad: solo Vercel Cron puede llamar a este endpoint ───────────
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error("[cron] CRON_SECRET no está configurado")
    return NextResponse.json({ error: "Cron mal configurado" }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[cron] Intento de acceso no autorizado al cron de alertas")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // ─── URL base de la app (para los links de los mails) ───────────────────
  const appUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL
  if (!appUrl) {
    console.error("[cron] NEXTAUTH_URL no está configurado")
    return NextResponse.json({ error: "App URL no configurada" }, { status: 500 })
  }

  const ahora = new Date()
  // Ventana: tareas con vencimiento desde 30 días atrás hasta 30 días adelante
  // (30 calendario es generoso, más que suficiente para cubrir 20 días hábiles
  // que en el peor caso son ~28 días calendario)
  const limiteFuturo = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000)
  const limitePasado = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)

  // ─── Traer tareas candidatas ────────────────────────────────────────────
  const tareas = await prisma.tarea.findMany({
    where: {
      estado: { notIn: ["COMPLETADA"] },
      NOT: {
        AND: [{ estado: "VENCIDA" }, { vencidaCerradaEn: { not: null } }],
      },
      fechaVencimiento: {
        not: null,
        lte: limiteFuturo,
        gte: limitePasado,
      },
    },
    select: {
      id: true,
      titulo: true,
      prioridad: true,
      fechaVencimiento: true,
      responsableId: true,
      supervisorId: true,
      responsable: {
        select: { id: true, email: true, nombre: true, apellido: true, isActive: true },
      },
      supervisor: {
        select: { id: true, email: true, nombre: true, apellido: true, isActive: true },
      },
      caso: { select: { numero: true, titulo: true } },
    },
  })

  // ─── Métricas para el response ──────────────────────────────────────────
  let mailsEnviados = 0
  let mailsSkipeadosPorDuplicado = 0
  let mailsSkipeadosPorUmbralNoAplica = 0
  let errores: string[] = []

  for (const tarea of tareas) {
    if (!tarea.fechaVencimiento) continue

    // ─── Calcular días hábiles restantes ──────────────────────────────────
    let diasHabiles: number
    try {
      diasHabiles = await diasHabilesEntre(ahora, tarea.fechaVencimiento)
    } catch (err) {
      console.error(`[cron] Error calculando días hábiles para tarea ${tarea.id}:`, err)
      errores.push(`Tarea ${tarea.id}: error días hábiles`)
      continue
    }

    // ─── Determinar umbral ────────────────────────────────────────────────
    const umbral = umbralPorDiasHabiles(diasHabiles)
    if (umbral === null) {
      mailsSkipeadosPorUmbralNoAplica++
      continue
    }

    // ─── Juntar destinatarios (dedupe por userId) ─────────────────────────
    const destinatariosMap = new Map<string, {
      id: string
      email: string
      nombre: string | null
      apellido: string | null
    }>()

    if (tarea.responsable && tarea.responsable.isActive && tarea.responsable.email) {
      destinatariosMap.set(tarea.responsable.id, {
        id: tarea.responsable.id,
        email: tarea.responsable.email,
        nombre: tarea.responsable.nombre,
        apellido: tarea.responsable.apellido,
      })
    }
    if (tarea.supervisor && tarea.supervisor.isActive && tarea.supervisor.email) {
      destinatariosMap.set(tarea.supervisor.id, {
        id: tarea.supervisor.id,
        email: tarea.supervisor.email,
        nombre: tarea.supervisor.nombre,
        apellido: tarea.supervisor.apellido,
      })
    }

    if (destinatariosMap.size === 0) continue

    // ─── Formatear fecha es-AR ────────────────────────────────────────────
    const fechaVencimientoFormateada = tarea.fechaVencimiento.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Argentina/Buenos_Aires",
    })

    // ─── Para cada destinatario, verificar duplicación y mandar ──────────
    for (const destinatario of destinatariosMap.values()) {
      try {
        const yaEnviado = await prisma.tareaAlertaMail.findUnique({
          where: {
            tareaId_userId_umbral: {
              tareaId: tarea.id,
              userId: destinatario.id,
              umbral,
            },
          },
        })

        if (yaEnviado) {
          mailsSkipeadosPorDuplicado++
          continue
        }

        const resultado = await sendAlertaVencimientoEmail({
          to: destinatario.email,
          nombre: destinatario.nombre ?? "",
          apellido: destinatario.apellido ?? "",
          tituloEvento: tarea.titulo,
          diasHabilesRestantes: diasHabiles,
          fechaVencimientoFormateada,
          numeroExpediente: tarea.caso?.numero ?? null,
          tituloExpediente: tarea.caso?.titulo ?? null,
          prioridad: tarea.prioridad as "BAJA" | "MEDIA" | "ALTA" | "FATAL",
          tareaId: tarea.id,
          appUrl,
        })

        if (!resultado.ok) {
          errores.push(`Tarea ${tarea.id} a ${destinatario.email}: ${resultado.error}`)
          continue
        }

        // ─── Registrar para que no se vuelva a enviar ────────────────────
        await prisma.tareaAlertaMail.create({
          data: {
            tareaId: tarea.id,
            userId: destinatario.id,
            umbral,
          },
        })

        mailsEnviados++
      } catch (err: any) {
        console.error(`[cron] Error procesando tarea ${tarea.id} para ${destinatario.email}:`, err)
        errores.push(`Tarea ${tarea.id} a ${destinatario.email}: ${err?.message ?? "Error"}`)
      }
    }
  }

  // ─── Resumen ─────────────────────────────────────────────────────────────
  const resumen = {
    timestamp: ahora.toISOString(),
    tareasRevisadas: tareas.length,
    mailsEnviados,
    mailsSkipeadosPorDuplicado,
    mailsSkipeadosPorUmbralNoAplica,
    cantidadErrores: errores.length,
    errores: errores.slice(0, 20), // primeros 20 nada más, evita response gigante
  }

  console.log("[cron] Resumen:", resumen)
  return NextResponse.json(resumen)
}