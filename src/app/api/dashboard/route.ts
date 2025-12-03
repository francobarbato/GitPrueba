import { NextResponse } from "next/server";
import { DashboardService } from "@/lib/aplication/services/dashboard.service";
import { getUserSessionServer } from "@/auth/actions/auth-actions"; // Importar sesión

const dashboardService = new DashboardService();

export async function GET() {
  try {
    // 1. Obtener usuario para saber quién pide los datos
    const user = await getUserSessionServer();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const esAdmin = user.rol === 'admin';

    // 2. Llamar al NUEVO método pasando los parámetros de seguridad
    const resumen = await dashboardService.getStats(user.id, esAdmin);
    
    return NextResponse.json(resumen);

  } catch (error) {
    console.error("Error en API Dashboard:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    );
  }
}