// src/app/casos/[id]/colaborador.actions.ts
'use server'

import prisma from "src/lib/db/prisma"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { revalidatePath } from "next/cache"

// Agregar colaborador a un caso
export async function agregarColaborador(casoId: string, abogadoId: string) {
  const user = await getUserSessionServer()
  if (!user) throw new Error("No autenticado")

  // Verificar que el caso existe y el usuario tiene permiso
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    select: { abogadoId: true }
  })

  if (!caso) throw new Error("Caso no encontrado")

  // Solo el abogado titular, admin o asistente pueden agregar colaboradores
  const esAdmin = user.rol?.toUpperCase() === 'ADMIN'
  const esAsistente = user.rol?.toUpperCase() === 'ASISTENTE'
  const esTitular = caso.abogadoId === user.id

  if (!esAdmin && !esAsistente && !esTitular) {
    throw new Error("No tenés permiso para agregar colaboradores a este caso")
  }

  // No puede agregarse a sí mismo ni al titular
  if (abogadoId === caso.abogadoId) {
    throw new Error("El abogado titular no necesita ser agregado como colaborador")
  }

  // Verificar que el abogado existe y es ABOGADO
  const abogado = await prisma.user.findUnique({
    where: { id: abogadoId },
    select: { rol: true, isActive: true }
  })

  if (!abogado || abogado.rol !== 'ABOGADO' || !abogado.isActive) {
    throw new Error("El usuario seleccionado no es un abogado activo")
  }

  // Crear colaboración (si ya existe, falla por @@unique)
  try {
    await prisma.casoColaborador.create({
      data: {
        casoId,
        userId: abogadoId,
        asignadoPorId: user.id,
        permiso: 'LECTURA',
      }
    })
  } catch (e: any) {
    if (e.code === 'P2002') {
      throw new Error("Este abogado ya es colaborador en este caso")
    }
    throw e
  }

  revalidatePath(`/casos/${casoId}`)
  return { success: true }
}

// Eliminar colaborador de un caso
export async function eliminarColaborador(casoId: string, abogadoId: string) {
  const user = await getUserSessionServer()
  if (!user) throw new Error("No autenticado")

  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    select: { abogadoId: true }
  })

  if (!caso) throw new Error("Caso no encontrado")

  const esAdmin = user.rol?.toUpperCase() === 'ADMIN'
  const esAsistente = user.rol?.toUpperCase() === 'ASISTENTE'
  const esTitular = caso.abogadoId === user.id

  if (!esAdmin && !esAsistente && !esTitular) {
    throw new Error("No tenés permiso para eliminar colaboradores")
  }

  await prisma.casoColaborador.deleteMany({
    where: { casoId, userId: abogadoId }
  })

  revalidatePath(`/casos/${casoId}`)
  return { success: true }
}

// Obtener colaboradores de un caso
export async function obtenerColaboradores(casoId: string) {
  const colaboradores = await prisma.casoColaborador.findMany({
    where: { casoId },
    include: {
      usuario: {
        select: { id: true, nombre: true, apellido: true, email: true }
      },
      asignadoPor: {
        select: { nombre: true, apellido: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return colaboradores
}

// Obtener abogados disponibles para agregar (que no son titular ni ya colaboradores)
export async function obtenerAbogadosDisponibles(casoId: string) {
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    select: { abogadoId: true }
  })

  if (!caso) return []

  const colaboradoresExistentes = await prisma.casoColaborador.findMany({
    where: { casoId },
    select: { userId: true }
  })

  const idsExcluidos = [caso.abogadoId, ...colaboradoresExistentes.map(c => c.userId)]

  const abogados = await prisma.user.findMany({
    where: {
      rol: 'ABOGADO',
      isActive: true,
      id: { notIn: idsExcluidos }
    },
    select: { id: true, nombre: true, apellido: true, email: true },
    orderBy: { nombre: 'asc' }
  })

  return abogados
}