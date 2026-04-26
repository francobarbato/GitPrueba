// src/app/api/casos/route.ts

import { type NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { CasoService } from "@/lib/aplication/services/caso.service"

const casoService = new CasoService()

// GET /api/casos
// Devuelve la lista de casos filtrada por rol.
// ADMIN y ASISTENTE: todos los casos.
// ABOGADO: solo sus casos y colaboraciones.
export async function GET(request: NextRequest) {
  try {
    const user = await getUserSessionServer()
    if (!user || !user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userRol = user.rol?.toUpperCase()

    let casos
    if (userRol === 'ADMIN' || userRol === 'ASISTENTE') {
      casos = await casoService.getAllCasos()
    } else if (userRol === 'ABOGADO') {
      casos = await casoService.getCasosByAbogado(user.id)
    } else {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: casos })

  } catch (error) {
    console.error("Error al obtener casos:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}