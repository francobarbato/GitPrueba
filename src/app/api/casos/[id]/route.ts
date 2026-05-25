import { type NextRequest, NextResponse } from "next/server"
import { CasoService } from "@/lib/aplication/services/caso.service"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

// Instanciamos el servicio una vez (sin argumentos)
const casoService = new CasoService()

// GET /api/casos/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id // Es un String (UUID)

    if (!id) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const caso = await casoService.getCasoById(id)

    if (!caso) {
      return NextResponse.json({ success: false, error: "Caso no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: caso,
    })
  } catch (error) {
    console.error("Error al obtener caso:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

// PUT /api/casos/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id // String (UUID)

    if (!id) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()

    // Formatear fechas correctamente si vienen en el body
    const dataToUpdate = { ...body }
    
    if (body.fechaInicio) {
      dataToUpdate.fechaInicio = new Date(body.fechaInicio)
    }

    if (body.fechaCierre) {
      dataToUpdate.fechaCierre = new Date(body.fechaCierre)
    }
    
    // Si viene fechaFin (nuestra nueva lógica), también la convertimos
    if (body.fechaFin) {
        dataToUpdate.fechaFin = new Date(body.fechaFin)
    }

    const casoActualizado = await casoService.updateCaso(id, dataToUpdate)

    return NextResponse.json({
      success: true,
      data: casoActualizado,
    })
  } catch (error: any) {
    console.error("Error al actualizar caso:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

// DELETE /api/casos/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Pasar request y response explícitamente
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = session.user
    const userRol = user.rol?.toUpperCase()

        if (userRol !== 'ADMIN') {
          return NextResponse.json({ error: "No tenés permiso para eliminar casos" }, { status: 403 })
        }
    
        const id = params.id
    
        if (!id) {
          return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
        }
    
        await casoService.deleteCaso(id)
    
        return NextResponse.json({ success: true, message: "Caso eliminado correctamente" })
      } catch (error: any) {
        console.error("Error al eliminar caso:", error)
        return NextResponse.json(
          {
            success: false,
            error: "Error interno del servidor",
            details: error instanceof Error ? error.message : "Error desconocido",
          },
          { status: 500 },
        )
      }
    }