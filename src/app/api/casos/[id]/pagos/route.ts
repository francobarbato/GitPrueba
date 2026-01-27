import { type NextRequest, NextResponse } from "next/server"
import { CasoService } from "@/lib/aplication/services/caso.service"
import { getUserSessionServer } from "@/auth/actions/auth-actions"

const casoService = new CasoService()

// POST /api/casos/[id]/pagos - Crear nuevo cargo/pago
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    const casoId = params.id
    const body = await request.json()

    // Validaciones
    if (!body.concepto || !body.monto) {
      return NextResponse.json(
        { success: false, error: "Concepto y monto son obligatorios" },
        { status: 400 }
      )
    }

    if (typeof body.monto !== 'number' || body.monto <= 0) {
      return NextResponse.json(
        { success: false, error: "El monto debe ser un número positivo" },
        { status: 400 }
      )
    }

    const nuevoPago = await casoService.agregarPago(casoId, {
      concepto: body.concepto,
      descripcion: body.descripcion || null,
      monto: body.monto
    })

    return NextResponse.json({ success: true, data: nuevoPago })
  } catch (error) {
    console.error("Error al crear pago:", error)
    return NextResponse.json(
      { success: false, error: "Error al crear el pago" },
      { status: 500 }
    )
  }
}