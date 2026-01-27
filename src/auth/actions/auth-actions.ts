// src/auth/actions/auth-actions.ts

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "src/lib/db/prisma"
import bcrypt from 'bcryptjs'

export const getUserSessionServer = async() => {
  const session = await getServerSession(authOptions)
  return session?.user
}

export const signInEmailPassword = async(email: string, password: string) => {
  if (!email || !password) {
    console.log("❌ Email o password vacío")
    return null
  }

  // Buscar usuario en BD
  const user = await prisma.user.findUnique({ 
    where: { email: email.toLowerCase() } 
  })

  // ❌ NO CREAR USUARIOS AUTOMÁTICAMENTE
  // Los usuarios deben ser creados solo por el admin
  if (!user) {
    console.log("❌ Usuario no encontrado:", email)
    return null
  }

  // Verificar si está activo
  if (!user.isActive) {
    console.log("❌ Usuario inactivo:", email)
    return null
  }

  // Verificar si tiene contraseña
  if (!user.password) {
    console.log("❌ Usuario sin contraseña (OAuth):", email)
    return null
  }

  // ✅ USAR bcrypt.compare (async) en lugar de compareSync
  const passwordMatch = await bcrypt.compare(password, user.password)

  if (!passwordMatch) {
    console.log("❌ Contraseña incorrecta para:", email)
    return null
  }

  console.log("✅ Login exitoso:", email)

  // Actualizar último acceso (opcional pero útil)
  await prisma.user.update({
    where: { id: user.id },
    data: { ultimoAcceso: new Date() }
  }).catch(err => console.warn("Error actualizando ultimoAcceso:", err))

  return {
    id: user.id,
    name: user.name || `${user.nombre} ${user.apellido}`,
    email: user.email,
    rol: user.rol,
    isActive: user.isActive
  }
}
