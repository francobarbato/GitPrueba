// lib/aplication/services/user.service.ts

import prisma from "src/lib/db/prisma"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"

type CrearUsuarioData = {
  nombre: string
  apellido: string
  email: string
  password: string
  rol: UserRole
  creadoPor: string
}

type ActualizarUsuarioData = {
  nombre?: string
  apellido?: string
  email?: string
  rol?: UserRole
  isActive?: boolean
}

export class UserService {
  
  // ===== CREAR USUARIO (Solo Admin) =====
  async crearUsuario(data: CrearUsuarioData) {
    // Validar que el email no exista
    const existente = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existente) {
      throw new Error("Ya existe un usuario con ese email")
    }

    // Validar rol permitido (no se pueden crear CLIENTES desde aquí)
    if (data.rol === 'CLIENTE') {
      throw new Error("Los clientes se crean automáticamente desde el módulo de clientes")
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Crear usuario
    const usuario = await prisma.user.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        password: hashedPassword,
        rol: data.rol,
        creadoPor: data.creadoPor,
        debeResetearPassword: true, // Forzar cambio en primer login
        isActive: true,
        name: `${data.nombre} ${data.apellido}` // Para compatibilidad con NextAuth
      }
    })

    // Registrar en bitácora (opcional)
    try {
      await prisma.bitacora.create({
        data: {
          texto: `Usuario creado: ${usuario.email} (${usuario.rol})`,
          tipo: 'auto',
          accion: 'Creación de Usuario',
          usuarioId: data.creadoPor
        }
      })
    } catch (error) {
      console.warn("No se pudo crear entrada en bitácora:", error)
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      isActive: usuario.isActive
    }
  }

  // ===== OBTENER TODOS LOS USUARIOS (Solo Admin) =====
  async obtenerTodos() {
    return await prisma.user.findMany({
      where: {
        rol: {
          in: ['ADMIN', 'ABOGADO', 'ASISTENTE']
        }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        isActive: true,
        createdAt: true,
        ultimoAcceso: true,
        _count: {
          select: {
            casos: true,
            clientes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  // ===== OBTENER USUARIO POR ID =====
  async obtenerPorId(id: string) {
    const usuario = await prisma.user.findUnique({
      where: { id },
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
            casos: true,
            clientes: true,
            tareas: true
          }
        }
      }
    })

    if (!usuario) {
      throw new Error("Usuario no encontrado")
    }

    return usuario
  }

  // ===== ACTUALIZAR USUARIO (Solo Admin) =====
  async actualizarUsuario(id: string, data: ActualizarUsuarioData) {
    // Verificar que el usuario existe
    const existente = await prisma.user.findUnique({
      where: { id }
    })

    if (!existente) {
      throw new Error("Usuario no encontrado")
    }

    // Si se cambia el email, verificar que no exista
    if (data.email && data.email !== existente.email) {
      const emailDuplicado = await prisma.user.findUnique({
        where: { email: data.email }
      })

      if (emailDuplicado) {
        throw new Error("El email ya está en uso")
      }
    }

    // Actualizar
    const actualizado = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        name: data.nombre && data.apellido 
          ? `${data.nombre} ${data.apellido}` 
          : existente.name
      }
    })

    return {
      id: actualizado.id,
      nombre: actualizado.nombre,
      apellido: actualizado.apellido,
      email: actualizado.email,
      rol: actualizado.rol,
      isActive: actualizado.isActive
    }
  }

  // ===== CAMBIAR CONTRASEÑA =====
  async cambiarPassword(userId: string, nuevaPassword: string, adminId: string) {
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        debeResetearPassword: true // Forzar cambio en próximo login
      }
    })

    // Registrar acción
    await prisma.bitacora.create({
      data: {
        texto: `Contraseña restablecida para usuario ${userId}`,
        tipo: 'auto',
        accion: 'Cambio de Contraseña',
        usuarioId: adminId
      }
    })

    return { success: true }
  }

  // ===== ACTIVAR/DESACTIVAR USUARIO =====
  async toggleActivacion(id: string, adminId: string) {
    const usuario = await prisma.user.findUnique({
      where: { id }
    })

    if (!usuario) {
      throw new Error("Usuario no encontrado")
    }

    // No permitir desactivar al único admin
    if (usuario.rol === 'ADMIN' && usuario.isActive) {
      const adminsActivos = await prisma.user.count({
        where: {
          rol: 'ADMIN',
          isActive: true
        }
      })

      if (adminsActivos <= 1) {
        throw new Error("No se puede desactivar al único administrador del sistema")
      }
    }

    const actualizado = await prisma.user.update({
      where: { id },
      data: {
        isActive: !usuario.isActive
      }
    })

    // Registrar acción
    await prisma.bitacora.create({
      data: {
        texto: `Usuario ${actualizado.isActive ? 'activado' : 'desactivado'}: ${usuario.email}`,
        tipo: 'auto',
        accion: 'Cambio de Estado',
        usuarioId: adminId
      }
    })

    return actualizado
  }

  // ===== ELIMINAR USUARIO (Soft Delete) =====
  async eliminarUsuario(id: string, adminId: string) {
    const usuario = await prisma.user.findUnique({
      where: { id },
      include: {
        casos: true,
        clientes: true
      }
    })

    if (!usuario) {
      throw new Error("Usuario no encontrado")
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
        throw new Error("No se puede eliminar al único administrador del sistema")
      }
    }

    // Validar que no tenga casos activos
    const casosActivos = usuario.casos.filter(c => c.estado !== 'CERRADO').length
    if (casosActivos > 0) {
      throw new Error(`El usuario tiene ${casosActivos} caso(s) activo(s). Debe cerrarlos o reasignarlos primero.`)
    }

    // Soft delete (desactivar)
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        email: `${usuario.email}.deleted.${Date.now()}` // Liberar el email
      }
    })

    await prisma.bitacora.create({
      data: {
        texto: `Usuario eliminado: ${usuario.email}`,
        tipo: 'auto',
        accion: 'Eliminación de Usuario',
        usuarioId: adminId
      }
    })

    return { success: true }
  }

  // ===== OBTENER ESTADÍSTICAS =====
  async obtenerEstadisticas() {
    const [total, activos, porRol] = await Promise.all([
      prisma.user.count({
        where: {
          rol: { in: ['ADMIN', 'ABOGADO', 'ASISTENTE'] }
        }
      }),
      prisma.user.count({
        where: {
          rol: { in: ['ADMIN', 'ABOGADO', 'ASISTENTE'] },
          isActive: true
        }
      }),
      prisma.user.groupBy({
        by: ['rol'],
        where: {
          isActive: true,
          rol: { in: ['ADMIN', 'ABOGADO', 'ASISTENTE'] }
        },
        _count: true
      })
    ])

    return {
      total,
      activos,
      inactivos: total - activos,
      porRol: {
        admins: porRol.find(r => r.rol === 'ADMIN')?._count || 0,
        abogados: porRol.find(r => r.rol === 'ABOGADO')?._count || 0,
        asistentes: porRol.find(r => r.rol === 'ASISTENTE')?._count || 0
      }
    }
  }
}