'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import prisma from "src/lib/db/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

// Función para generar contraseña segura
function generarPasswordSeguro(): string {
  const mayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const minusculas = 'abcdefghijklmnopqrstuvwxyz'
  const numeros = '0123456789'
  const especiales = '!@#$%&*'
  
  // Garantizar al menos uno de cada tipo
  let password = ''
  password += mayusculas.charAt(Math.floor(Math.random() * mayusculas.length))
  password += minusculas.charAt(Math.floor(Math.random() * minusculas.length))
  password += numeros.charAt(Math.floor(Math.random() * numeros.length))
  password += especiales.charAt(Math.floor(Math.random() * especiales.length))
  
  // Completar con caracteres aleatorios hasta 10 caracteres
  const todos = mayusculas + minusculas + numeros + especiales
  for (let i = 0; i < 6; i++) {
    password += todos.charAt(Math.floor(Math.random() * todos.length))
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// ============================================================================
// CREAR USUARIO DE PORTAL PARA CLIENTE
// ============================================================================
export async function crearUsuarioPortalAction(clienteId: string): Promise<{
  error?: string
  credenciales?: { email: string; password: string }
}> {
  const user = await getUserSessionServer()

  if (!user || !user.id) {
    return { error: "No autorizado" }
  }

  const userRol = user.rol?.toUpperCase()

  // Solo Admin y Abogado pueden crear usuarios de portal
  if (userRol !== 'ADMIN' && userRol !== 'ABOGADO') {
    return { error: "No tienes permiso para crear usuarios de portal" }
  }

  try {
    // Obtener cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        usuarioPortalId: true,
        abogadoId: true
      }
    })

    if (!cliente) {
      return { error: "Cliente no encontrado" }
    }

    // Verificar que el cliente tenga email
    if (!cliente.email) {
      return { error: "El cliente debe tener un email registrado para crear acceso al portal" }
    }

    // Verificar que no tenga ya un usuario de portal
    if (cliente.usuarioPortalId) {
      return { error: "Este cliente ya tiene un usuario de acceso al portal" }
    }

    // Verificar que el email no esté en uso por otro usuario
    const emailExistente = await prisma.user.findUnique({
      where: { email: cliente.email }
    })

    if (emailExistente) {
      return { error: `El email ${cliente.email} ya está registrado en el sistema. Use otro email para el cliente.` }
    }

    // Si es Abogado, verificar que sea su cliente
    if (userRol === 'ABOGADO' && cliente.abogadoId !== user.id) {
      return { error: "Solo puedes crear acceso para tus propios clientes" }
    }

    // Generar contraseña temporal
    const passwordTemporal = generarPasswordSeguro()
    const hashedPassword = await bcrypt.hash(passwordTemporal, 12)

    // Crear el usuario en una transacción
    const nuevoUsuario = await prisma.$transaction(async (tx) => {
      // 1. Crear el usuario
      const usuario = await tx.user.create({
        data: {
          email: cliente.email!,
          password: hashedPassword,
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          rol: 'CLIENTE',
          isActive: true,
          debeResetearPassword: true,
          creadoPor: user.id
        }
      })

      // 2. Vincular al cliente
      await tx.cliente.update({
        where: { id: clienteId },
        data: {
          usuarioPortalId: usuario.id
        }
      })

      return usuario
    })

    console.log(`✅ Usuario de portal creado para cliente ${cliente.nombre} - Email: ${cliente.email} - Por: ${user.id}`)

    revalidatePath(`/clientes/${clienteId}`)

    return {
      credenciales: {
        email: cliente.email,
        password: passwordTemporal
      }
    }

  } catch (error: any) {
    console.error("Error creando usuario de portal:", error)
    return { error: error.message || "Error al crear usuario de portal" }
  }
}

// ============================================================================
// DESACTIVAR USUARIO DE PORTAL
// ============================================================================
export async function desactivarUsuarioPortalAction(clienteId: string): Promise<{
  error?: string
  success?: boolean
}> {
  const user = await getUserSessionServer()

  if (!user || !user.id) {
    return { error: "No autorizado" }
  }

  const userRol = user.rol?.toUpperCase()

  // Solo Admin y Abogado pueden desactivar usuarios
  if (userRol !== 'ADMIN' && userRol !== 'ABOGADO') {
    return { error: "No tienes permiso para desactivar usuarios de portal" }
  }

  try {
    // Obtener cliente con su usuario de portal
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nombre: true,
        usuarioPortalId: true,
        abogadoId: true,
        usuarioPortal: {
          select: { id: true, isActive: true }
        }
      }
    })

    if (!cliente) {
      return { error: "Cliente no encontrado" }
    }

    if (!cliente.usuarioPortalId || !cliente.usuarioPortal) {
      return { error: "Este cliente no tiene usuario de portal" }
    }

    // Si es Abogado, verificar que sea su cliente
    if (userRol === 'ABOGADO' && cliente.abogadoId !== user.id) {
      return { error: "Solo puedes gestionar usuarios de tus propios clientes" }
    }

    // Desactivar el usuario
    await prisma.user.update({
      where: { id: cliente.usuarioPortalId },
      data: { isActive: false }
    })

    console.log(`🔒 Usuario de portal desactivado para cliente ${cliente.nombre} - Por: ${user.id}`)

    revalidatePath(`/clientes/${clienteId}`)

    return { success: true }

  } catch (error: any) {
    console.error("Error desactivando usuario de portal:", error)
    return { error: error.message || "Error al desactivar usuario" }
  }
}

// ============================================================================
// REACTIVAR USUARIO DE PORTAL
// ============================================================================
export async function reactivarUsuarioPortalAction(clienteId: string) {
  const user = await getUserSessionServer()
  if (!user?.id) return { error: "No autorizado" }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { usuarioPortalId: true, nombre: true }
    })
    if (!cliente?.usuarioPortalId) return { error: "No hay usuario de portal asociado" }

    await prisma.user.update({
      where: { id: cliente.usuarioPortalId },
      data: { isActive: true }
    })

    console.log(`✅ Usuario de portal reactivado para cliente ${cliente.nombre} - Por: ${user.id}`)
    revalidatePath(`/clientes/${clienteId}`)
    return { success: true }
  } catch (error) {
    console.error("Error reactivando usuario portal:", error)
    return { error: "Error al reactivar el usuario" }
  }
}

// ============================================================================
// RESETEAR CONTRASEÑA DE USUARIO DE PORTAL
// ============================================================================
export async function resetearPasswordPortalAction(clienteId: string): Promise<{
  error?: string
  credenciales?: { email: string; password: string }
}> {
  const user = await getUserSessionServer()

  if (!user || !user.id) {
    return { error: "No autorizado" }
  }

  const userRol = user.rol?.toUpperCase()

  // Solo Admin y Abogado pueden resetear
  if (userRol !== 'ADMIN' && userRol !== 'ABOGADO') {
    return { error: "No tienes permiso para resetear contraseñas" }
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nombre: true,
        usuarioPortalId: true,
        abogadoId: true,
        usuarioPortal: {
          select: { id: true, email: true }
        }
      }
    })

    if (!cliente || !cliente.usuarioPortalId || !cliente.usuarioPortal) {
      return { error: "Cliente o usuario de portal no encontrado" }
    }

    // Si es Abogado, verificar que sea su cliente
    if (userRol === 'ABOGADO' && cliente.abogadoId !== user.id) {
      return { error: "Solo puedes gestionar usuarios de tus propios clientes" }
    }

    // Generar nueva contraseña
    const nuevaPassword = generarPasswordSeguro()
    const hashedPassword = await bcrypt.hash(nuevaPassword, 12)

    await prisma.user.update({
      where: { id: cliente.usuarioPortalId },
      data: {
        password: hashedPassword,
        debeResetearPassword: true
      }
    })

    console.log(`🔑 Contraseña reseteada para usuario de portal de ${cliente.nombre} - Por: ${user.id}`)

    revalidatePath(`/clientes/${clienteId}`)

    return {
      credenciales: {
        email: cliente.usuarioPortal.email,
        password: nuevaPassword
      }
    }

  } catch (error: any) {
    console.error("Error reseteando contraseña:", error)
    return { error: error.message || "Error al resetear contraseña" }
  }
}