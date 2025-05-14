// app/api/dashboard/route.js
import { NextResponse } from "next/server";
const DashboardService = require('../../../lib/application/services/dashboard.service');

const dashboardService = new DashboardService();

export async function GET() {
  try {
    const stats = await dashboardService.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error en la API de dashboard:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    );
  }
}