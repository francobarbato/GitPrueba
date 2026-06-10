'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"

// ============================================================================
// TIPOS
// ============================================================================

export type ClienteEsfuerzoResultado = {
  id: string
  nombre: string
  apellido: string | null
  tipoPersona: string
  tipoSociedad: string | null

  // Esfuerzo (variables contables)
  totalCasos: number
  casosActivos: number
  casosCerrados: number
  totalEventos: number
  totalDocumentos: number
  esfuerzoTotal: number              // suma simple: casos + eventos + documentos

  // Resultado (variables económicas)
  montoDisputaTotal: number
  montoRecuperadoTotal: number
  ratioRecuperacion: number          // 0–100 (%); 0 si no hay monto en disputa
  tieneMontoDisputa: boolean         // útil para el scatter (filtrar los que no aportan al cruce)
}

export type ReporteEsfuerzoVsResultado = {
  clientes: ClienteEsfuerzoResultado[]
  resumen: {
    totalClientes: number
    montoDisputaCartera: number
    montoRecuperadoCartera: number
    ratioCarteraGlobal: number
    totalCasos: number
    totalEventos: number
    totalDocumentos: number
  }
  parametros: {
    fechaDesde: string | null
    fechaHasta: string | null
    soloCerrados: boolean
  }
}

// ============================================================================
// ACTION
// ============================================================================

export async function getReporteEsfuerzoVsResultadoAction(params: {
  fechaDesde?: string                // formato 'YYYY-MM-DD'
  fechaHasta?: string                // formato 'YYYY-MM-DD'
  soloCerrados?: boolean             // si true, solo cuenta casos cerrados
}): Promise<ReporteEsfuerzoVsResultado | { error: string }> {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }
  if (user.rol !== "ABOGADO") return { error: "Solo los abogados pueden ver este reporte" }

  try {
    // ── Construir filtros para los casos ────────────────────────────────
    const casoWhere: any = {
      abogadoId: user.id,
      esTraspasado: false,
    }

    if (params.soloCerrados) {
      casoWhere.estaCerrado = true
    }

    // Filtro de fechas sobre createdAt del caso
    if (params.fechaDesde || params.fechaHasta) {
      casoWhere.createdAt = {}
      if (params.fechaDesde) {
        casoWhere.createdAt.gte = new Date(params.fechaDesde + "T00:00:00")
      }
      if (params.fechaHasta) {
        casoWhere.createdAt.lte = new Date(params.fechaHasta + "T23:59:59")
      }
    }

    // ── Traer clientes activos del abogado con sus casos filtrados ──────
    const clientesRaw = await prisma.cliente.findMany({
      where: {
        abogadoId: user.id,
        activo: true,
      },
      include: {
        casos: {
          where: casoWhere,
          include: {
            _count: {
              select: {
                tareas: true,
                documentos: true,
              },
            },
          },
        },
      },
      orderBy: { nombre: "asc" },
    })

    // ── Procesar cliente por cliente ────────────────────────────────────
    const clientes: ClienteEsfuerzoResultado[] = []

    for (const cli of clientesRaw) {
      // Si el cliente no tiene casos en el rango/filtro, no entra al reporte
      if (cli.casos.length === 0) continue

      const totalCasos = cli.casos.length
      const casosCerrados = cli.casos.filter(c => c.estaCerrado).length
      const casosActivos = totalCasos - casosCerrados

      const totalEventos = cli.casos.reduce((sum, c) => sum + c._count.tareas, 0)
      const totalDocumentos = cli.casos.reduce((sum, c) => sum + c._count.documentos, 0)

      // Esfuerzo = suma simple, sin pesos, sin normalización
      const esfuerzoTotal = totalCasos + totalEventos + totalDocumentos

      // Resultado económico
      const montoDisputaTotal = cli.casos.reduce(
        (sum, c) => sum + (c.montoDisputa ? Number(c.montoDisputa) : 0),
        0
      )

      const montoRecuperadoTotal = cli.casos
        .filter(c => c.estaCerrado)
        .reduce((sum, c) => sum + (c.montoFinal ? Number(c.montoFinal) : 0), 0)

      const tieneMontoDisputa = montoDisputaTotal > 0
      const ratioRecuperacion = tieneMontoDisputa
        ? (montoRecuperadoTotal / montoDisputaTotal) * 100
        : 0

      clientes.push({
        id: cli.id,
        nombre: cli.nombre,
        apellido: cli.apellido,
        tipoPersona: cli.tipoPersona,
        tipoSociedad: cli.tipoSociedad,
        totalCasos,
        casosActivos,
        casosCerrados,
        totalEventos,
        totalDocumentos,
        esfuerzoTotal,
        montoDisputaTotal,
        montoRecuperadoTotal,
        ratioRecuperacion,
        tieneMontoDisputa,
      })
    }

    // Orden por defecto: mayor esfuerzo primero
    clientes.sort((a, b) => b.esfuerzoTotal - a.esfuerzoTotal)

    // ── Resumen de la cartera ───────────────────────────────────────────
    const montoDisputaCartera = clientes.reduce((s, c) => s + c.montoDisputaTotal, 0)
    const montoRecuperadoCartera = clientes.reduce((s, c) => s + c.montoRecuperadoTotal, 0)
    const ratioCarteraGlobal = montoDisputaCartera > 0
      ? (montoRecuperadoCartera / montoDisputaCartera) * 100
      : 0

    const resumen = {
      totalClientes: clientes.length,
      montoDisputaCartera,
      montoRecuperadoCartera,
      ratioCarteraGlobal,
      totalCasos: clientes.reduce((s, c) => s + c.totalCasos, 0),
      totalEventos: clientes.reduce((s, c) => s + c.totalEventos, 0),
      totalDocumentos: clientes.reduce((s, c) => s + c.totalDocumentos, 0),
    }

    return {
      clientes,
      resumen,
      parametros: {
        fechaDesde: params.fechaDesde ?? null,
        fechaHasta: params.fechaHasta ?? null,
        soloCerrados: params.soloCerrados ?? true,
      },
    }
  } catch (error) {
    console.error("Error generando reporte esfuerzo vs resultado:", error)
    return { error: "Error al generar el reporte" }
  }
}