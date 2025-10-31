import { NextResponse } from "next/server";
import { DashboardService } from "@/lib/aplication/services/dashboard.service";

const dashboardService = new DashboardService();

export async function GET() {
  try {
    const resumen = await dashboardService.obtenerResumenGeneral();
    return NextResponse.json(resumen);
  } catch (error) {
    console.error("Error en API Dashboard:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    );
  }
}
