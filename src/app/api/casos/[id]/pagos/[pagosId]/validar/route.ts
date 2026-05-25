import { NextRequest, NextResponse } from "next/server"
import { CasoService } from "@/lib/aplication/services/caso.service"
import { getUserSessionServer } from "@/auth/actions/auth-actions"

const casoService = new CasoService()

// PUT - Validar un pago
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; pagoId: string } }
) {
  try {
    const user = await getUserSessionServer()
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    const { pagoId } = params

    const pagoActualizado = await casoService.validarPago(pagoId)

    return NextResponse.json({ success: true, data: pagoActualizado })
  } catch (error: any) {
    console.error("Error al validar pago:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Error al validar pago" },
      { status: 500 }
    )
  }
}