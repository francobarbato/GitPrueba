// src/app/api/dashboard/route.ts

import { NextResponse } from "next/server"
import { DashboardService } from "@/lib/aplication/services/dashboard.service"
import { getUserSessionServer } from "@/auth/actions/auth-actions"

const dashboardService = new DashboardService()

export async function GET() {
  try {
    const user = await getUserSessionServer()

    if (!user || !user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Pasar el rol en mayúsculas — getStats espera string, no boolean
    const rol = user.rol?.toUpperCase() || ''

    const resumen = await dashboardService.getStats(user.id, rol)

    return NextResponse.json(resumen)

  } catch (error) {
    console.error("Error en API Dashboard:", error)
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    )
  }
}