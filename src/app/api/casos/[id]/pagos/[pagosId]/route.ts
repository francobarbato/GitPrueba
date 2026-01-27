import { NextRequest, NextResponse } from "next/server"
import { CasoService } from "@/lib/aplication/services/caso.service"
import { getUserSessionServer } from "@/auth/actions/auth-actions"

const casoService = new CasoService()

// DELETE - Eliminar un pago
export async function DELETE(
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

    await casoService.eliminarPago(pagoId)

    return NextResponse.json({ success: true, message: "Pago eliminado" })
  } catch (error: any) {
    console.error("Error al eliminar pago:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Error al eliminar pago" },
      { status: 500 }
    )
  }
}