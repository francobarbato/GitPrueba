// src/app/api/casos/[id]/route.ts

import { type NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { CasoService } from "@/lib/aplication/services/caso.service"

const casoService = new CasoService()

// GET /api/casos/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ===== VERIFICACIÓN DE SESIÓN =====
    const user = await getUserSessionServer()
    if (!user || !user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // ==================================

    const id = params.id
    if (!id) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const caso = await casoService.getCasoById(id)

    if (!caso) {
      return NextResponse.json({ success: false, error: "Caso no encontrado" }, { status: 404 })
    }

    // Verificar que el abogado solo pueda ver sus propios casos o colaboraciones
    const userRol = user.rol?.toUpperCase()
    if (userRol === 'ABOGADO') {
      const esAbogadoTitular = (caso as any).abogadoId === user.id
      const esColaborador = (caso as any).colaboradores?.some((c: any) => c.userId === user.id)
      if (!esAbogadoTitular && !esColaborador) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }

    return NextResponse.json({ success: true, data: caso })

  } catch (error) {
    console.error("Error al obtener caso:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

// PUT /api/casos/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ===== VERIFICACIÓN DE SESIÓN =====
    const user = await getUserSessionServer()
    if (!user || !user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // ==================================

    const id = params.id
    if (!id) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const userRol = user.rol?.toUpperCase()

    // Asistente no puede editar casos
    if (userRol === 'ASISTENTE') {
      return NextResponse.json({ error: "No tenés permiso para editar casos" }, { status: 403 })
    }

    // Verificar ownership para Abogado
    if (userRol === 'ABOGADO') {
      const casoExistente = await casoService.getCasoById(id)
      if (!casoExistente) {
        return NextResponse.json({ success: false, error: "Caso no encontrado" }, { status: 404 })
      }
      if ((casoExistente as any).abogadoId !== user.id) {
        return NextResponse.json({ error: "No tenés permiso para editar este caso" }, { status: 403 })
      }
    }

    const body = await request.json()
    const dataToUpdate = { ...body }

    if (body.fechaInicio) dataToUpdate.fechaInicio = new Date(body.fechaInicio)
    if (body.fechaCierre) dataToUpdate.fechaCierre = new Date(body.fechaCierre)
    if (body.fechaFin) dataToUpdate.fechaFin = new Date(body.fechaFin)

    const casoActualizado = await casoService.updateCaso(id, dataToUpdate)

    return NextResponse.json({ success: true, data: casoActualizado })

  } catch (error: any) {
    console.error("Error al actualizar caso:", error)
    return NextResponse.json({
      success: false,
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    }, { status: 500 })
  }
}

// DELETE /api/casos/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ===== VERIFICACIÓN DE SESIÓN =====
    const user = await getUserSessionServer()
    if (!user || !user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // ==================================

    const id = params.id
    if (!id) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const userRol = user.rol?.toUpperCase()

    // Solo Admin puede eliminar casos por API
    if (userRol !== 'ADMIN') {
      return NextResponse.json({ error: "No tenés permiso para eliminar casos" }, { status: 403 })
    }

    await casoService.deleteCaso(id)

    return NextResponse.json({ success: true, message: "Caso eliminado correctamente" })

  } catch (error) {
    console.error("Error al eliminar caso:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}