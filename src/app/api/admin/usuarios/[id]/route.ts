// app/api/admin/usuarios/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"

// ===== GET: Obtener usuario por ID =====
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()

    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const usuario = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        ultimoAcceso: true,
        debeResetearPassword: true,
        _count: {
          select: {
            casos: {
              where: { estaCerrado: false }
            },
            clientes: true
          }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(usuario)

  } catch (error: any) {
    console.error("Error al obtener usuario:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// ===== PATCH: Actualizar usuario =====
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()

    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { nombre, apellido, email, rol, isActive } = body

    // Verificar que el usuario existe
    const existente = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existente) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Si se cambia el email, verificar que no exista
    if (email && email !== existente.email) {
      const emailDuplicado = await prisma.user.findUnique({
        where: { email }
      })

      if (emailDuplicado) {
        return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 })
      }
    }

    // Actualizar
    const actualizado = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(apellido !== undefined && { apellido }),
        ...(email !== undefined && { email }),
        ...(rol !== undefined && { rol }),
        ...(isActive !== undefined && { isActive }),
        ...(nombre !== undefined && apellido !== undefined && {
          name: `${nombre} ${apellido}`
        })
      }
    })

    return NextResponse.json({
      id: actualizado.id,
      nombre: actualizado.nombre,
      apellido: actualizado.apellido,
      email: actualizado.email,
      rol: actualizado.rol,
      isActive: actualizado.isActive
    })

  } catch (error: any) {
    console.error("Error al actualizar usuario:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

// ===== DELETE: Eliminar usuario (soft delete con reasignación opcional) =====
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserSessionServer()

    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener body para posible reasignación
    let reasignarA: string | undefined
    try {
      const body = await req.json()
      reasignarA = body.reasignarA
    } catch {
      // No hay body, continuar sin reasignación
    }

    const usuario = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        casos: {
          where: { estaCerrado: false }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Validar que no sea el único admin
    if (usuario.rol === 'ADMIN') {
      const adminsActivos = await prisma.user.count({
        where: {
          rol: 'ADMIN',
          isActive: true
        }
      })

      if (adminsActivos <= 1) {
        return NextResponse.json({ 
          error: "No se puede eliminar al único administrador del sistema" 
        }, { status: 400 })
      }
    }

    // Verificar casos activos
    const casosActivos = usuario.casos.length

    if (casosActivos > 0 && !reasignarA) {
      return NextResponse.json({ 
        error: `El usuario tiene ${casosActivos} caso(s) activo(s). Debe reasignarlos primero.`,
        casosActivos,
        requiereReasignacion: true
      }, { status: 400 })
    }

    // Si hay que reasignar casos
    if (casosActivos > 0 && reasignarA) {
      // Verificar que el abogado destino existe y está activo
      const abogadoDestino = await prisma.user.findUnique({
        where: { id: reasignarA }
      })

      if (!abogadoDestino || !abogadoDestino.isActive) {
        return NextResponse.json({ 
          error: "El abogado seleccionado para reasignación no existe o está inactivo" 
        }, { status: 400 })
      }

      // Reasignar todos los casos activos
      await prisma.caso.updateMany({
        where: {
          abogadoId: params.id,
          estaCerrado: false
        },
        data: {
          abogadoId: reasignarA
        }
      })

      // Registrar reasignación en bitácora para cada caso
      const casosIds = usuario.casos.map(c => c.id)
      for (const casoId of casosIds) {
        await prisma.bitacora.create({
          data: {
            casoId,
            texto: `Caso reasignado de ${usuario.nombre} ${usuario.apellido} a ${abogadoDestino.nombre} ${abogadoDestino.apellido} (por desactivación de usuario)`,
            tipo: 'auto',
            accion: 'Reasignación por Desactivación',
            usuarioId: user.id
          }
        })
      }

      // Registrar reasignación general
      await prisma.bitacora.create({
        data: {
          texto: `${casosActivos} casos reasignados de ${usuario.email} a ${abogadoDestino.email}`,
          tipo: 'auto',
          accion: 'Reasignación Masiva',
          usuarioId: user.id
        }
      })
    }

    // Soft delete (desactivar)
    await prisma.user.update({
      where: { id: params.id },
      data: {
        isActive: false,
        email: `${usuario.email}.deleted.${Date.now()}` // Liberar el email
      }
    })

    await prisma.bitacora.create({
      data: {
        texto: `Usuario desactivado: ${usuario.email}`,
        tipo: 'auto',
        accion: 'Desactivación de Usuario',
        usuarioId: user.id
      }
    })

    return NextResponse.json({ 
      success: true,
      message: casosActivos > 0 
        ? `Usuario desactivado y ${casosActivos} casos reasignados correctamente`
        : "Usuario desactivado correctamente"
    })

  } catch (error: any) {
    console.error("Error al eliminar usuario:", error)
    return NextResponse.json(
      { error: error.message || "Error al eliminar usuario" },
      { status: 500 }
    )
  }
}
