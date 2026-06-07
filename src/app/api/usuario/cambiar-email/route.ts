// src/app/api/usuario/cambiar-email/route.ts
//
// POST /api/usuario/cambiar-email
// Cambia el email del usuario logueado. Re-autentica con contraseña actual.
//
// Visión A — Email único sincronizado:
// Si el user que cambia el email tiene un Cliente vinculado (rol CLIENTE), el
// cambio también se aplica a Cliente.email en la misma transacción. Así el
// abogado, cuando entre al perfil del cliente, ve el email actualizado.
//
// Al éxito: elimina sesiones activas y deja la cuenta lista para re-login.

import { NextRequest, NextResponse } from "next/server"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import bcrypt from "bcryptjs"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSessionServer()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { nuevoEmail, confirmacionEmail, contrasenaActual } = body as {
      nuevoEmail?: string
      confirmacionEmail?: string
      contrasenaActual?: string
    }

    if (!nuevoEmail || !confirmacionEmail || !contrasenaActual) {
      return NextResponse.json({ error: "Completá todos los campos" }, { status: 400 })
    }

    const emailNormalizado = nuevoEmail.trim().toLowerCase()
    const confirmNormalizado = confirmacionEmail.trim().toLowerCase()

    if (emailNormalizado !== confirmNormalizado) {
      return NextResponse.json({ error: "Los emails no coinciden" }, { status: 400 })
    }
    if (!EMAIL_REGEX.test(emailNormalizado)) {
      return NextResponse.json({ error: "El email no tiene un formato válido" }, { status: 400 })
    }

    // Cargamos el user con su cliente vinculado (si lo tiene)
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true, email: true, password: true,
        nombre: true, apellido: true, name: true, rol: true,
        clienteVinculado: { select: { id: true, email: true } }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }
    if (!user.password) {
      return NextResponse.json({
        error: "Tu cuenta no tiene contraseña configurada. Contactá al administrador."
      }, { status: 400 })
    }

    if (emailNormalizado === user.email.toLowerCase()) {
      return NextResponse.json({ error: "El email nuevo es igual al actual" }, { status: 400 })
    }

    const passwordOk = await bcrypt.compare(contrasenaActual, user.password)
    if (!passwordOk) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 })
    }

    // El email nuevo no debe estar usado por otro User
    const duplicadoUser = await prisma.user.findUnique({
      where: { email: emailNormalizado },
      select: { id: true }
    })
    if (duplicadoUser && duplicadoUser.id !== user.id) {
      return NextResponse.json({ error: "Ese email ya está registrado en el sistema" }, { status: 400 })
    }

    // El email nuevo no debe estar usado por otro Cliente.
    // Si quien cambia es un cliente del portal, el email puede coincidir con
    // su propia ficha de Cliente, pero no con otra distinta.
    const duplicadoCliente = await prisma.cliente.findUnique({
      where: { email: emailNormalizado },
      select: { id: true }
    })
    if (
      duplicadoCliente &&
      (!user.clienteVinculado || duplicadoCliente.id !== user.clienteVinculado.id)
    ) {
      return NextResponse.json({
        error: "Ese email ya está registrado para otro cliente"
      }, { status: 400 })
    }

    const emailViejo = user.email
    const nombreCompleto = user.nombre && user.apellido
      ? `${user.nombre} ${user.apellido}`.trim()
      : user.name || user.email

    // ─────────────────────────────────────────────────────────────────────
    // Transacción: User + (si aplica) Cliente + invalidar sesiones + bitácora
    // ─────────────────────────────────────────────────────────────────────
    const operaciones: any[] = [
      prisma.user.update({
        where: { id: user.id },
        data: {
          email: emailNormalizado,
          // La persona ya está logueada y validó con su contraseña → seguimos verificados
          emailVerified: new Date(),
        }
      }),
      // Invalidar sesiones activas (relogin forzado con el email nuevo)
      prisma.session.deleteMany({ where: { userId: user.id } }),
      prisma.bitacora.create({
        data: {
          texto: `Cambio de email: ${emailViejo} → ${emailNormalizado}`,
          detalle: user.clienteVinculado
            ? `Sincronizado con la ficha del cliente (autoservicio desde el portal)`
            : null,
          tipo: 'auto',
          accion: 'Cambio de Email',
          usuarioId: user.id,
        }
      })
    ]

    // Si tiene cliente vinculado, sincronizar Cliente.email
    if (user.clienteVinculado) {
      operaciones.push(
        prisma.cliente.update({
          where: { id: user.clienteVinculado.id },
          data: { email: emailNormalizado }
        })
      )
    }

    await prisma.$transaction(operaciones)

    // ── Notificaciones por email (no bloqueantes) ──
    // TODO: Cuando salga de Mailgun sandbox, enchufar el servicio real.
    //   - Al email viejo: aviso de seguridad
    //   - Al email nuevo: confirmación
    try {
      // await enviarEmail({ to: emailViejo, ... })
      // await enviarEmail({ to: emailNormalizado, ... })
    } catch (emailErr) {
      console.error('[cambiar-email] Error enviando notificaciones:', emailErr)
    }

    return NextResponse.json({
      success: true,
      mensaje: "Email cambiado correctamente. Tu sesión se cerrará y deberás volver a entrar con el nuevo email.",
      debeRelogin: true,
    })
  } catch (error: any) {
    console.error('[cambiar-email] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al cambiar el email' },
      { status: 500 }
    )
  }
}