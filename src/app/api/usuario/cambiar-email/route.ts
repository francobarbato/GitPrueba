// src/app/api/usuario/cambiar-email/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from 'src/lib/db/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { newEmail, currentPassword } = await req.json()

    // Validaciones básicas
    if (!newEmail || typeof newEmail !== 'string') {
      return NextResponse.json({ error: 'El nuevo email es requerido' }, { status: 400 })
    }

    const emailTrimmed = newEmail.trim().toLowerCase()

    // Validar formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailTrimmed)) {
      return NextResponse.json({ error: 'El formato del email no es válido' }, { status: 400 })
    }

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'La contraseña actual es requerida' }, { status: 400 })
    }

    // Obtener usuario actual con su password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, password: true, isActive: true }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // No permitir OAuth-only (sin contraseña local)
    if (!user.password) {
      return NextResponse.json(
        { error: 'Tu cuenta usa inicio de sesión con Google/GitHub. El email no se puede cambiar desde aquí.' },
        { status: 400 }
      )
    }

    // Verificar contraseña actual
    const passwordValid = await bcrypt.compare(currentPassword, user.password)
    if (!passwordValid) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })
    }

    // Verificar que no sea el mismo email
    if (emailTrimmed === user.email.toLowerCase()) {
      return NextResponse.json({ error: 'El nuevo email es igual al actual' }, { status: 400 })
    }

    // Verificar que el nuevo email no esté en uso por otro usuario
    const existingUser = await prisma.user.findUnique({
      where: { email: emailTrimmed }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ingresado ya está registrado en el sistema' },
        { status: 409 }
      )
    }

    // Actualizar email en BD — también actualiza el campo `name` si viene del email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: emailTrimmed,
        // Si el campo `name` era igual al email anterior (cuentas OAuth migradas), lo actualizamos
        ...(user.email === session.user.name ? { name: emailTrimmed } : {})
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al cambiar email:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
