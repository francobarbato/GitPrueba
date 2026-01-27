// src/app/casos/nuevo/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { NuevoCasoForm } from "./nuevo-caso-form"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import prisma from "src/lib/db/prisma"

export default async function NuevoCasoPage() {
  const user = await getUserSessionServer()

  if (!user) {
    redirect("/auth/signin")
  }

  const userRol = user.rol?.toUpperCase() || 'ABOGADO'

  // ===== OBTENER CLIENTES SEGÚN ROL =====
  let clientes = []

  if (userRol === 'ADMIN') {
    // Admin ve TODOS los clientes activos
    clientes = await prisma.cliente.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        numeroDocumento: true,
      },
      orderBy: { nombre: "asc" },
    })
  } else if (userRol === 'ASISTENTE') {
    // Asistente ve SOLO clientes que:
    // 1. Fueron creados por él mismo (creadoPorId = su ID)
    // 2. Y que NO tienen casos activos asignados
    
    // Primero obtenemos los IDs de clientes que YA tienen casos
    const clientesConCasos = await prisma.caso.findMany({
      where: {
        estado: {
          notIn: ['Terminado', 'Archivado'] // Solo casos activos
        }
      },
      select: {
        clienteId: true
      },
      distinct: ['clienteId']
    })
    
    const idsClientesConCasos = clientesConCasos.map(c => c.clienteId)

    // Ahora obtenemos clientes creados por el Asistente y sin casos activos
    clientes = await prisma.cliente.findMany({
      where: {
        activo: true,
        creadoPorId: user.id, // Solo los que creó este Asistente
        id: {
          notIn: idsClientesConCasos.length > 0 ? idsClientesConCasos : ['none'] // Excluir los que ya tienen casos
        }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        numeroDocumento: true,
      },
      orderBy: { nombre: "asc" },
    })
  } else {
    // ABOGADO ve:
    // 1. Clientes asignados a él (abogadoId = su ID)
    // 2. O clientes que él creó (creadoPorId = su ID)
    clientes = await prisma.cliente.findMany({
      where: {
        activo: true,
        OR: [
          { abogadoId: user.id },      // Clientes asignados a él
          { creadoPorId: user.id }     // Clientes que él creó
        ]
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        numeroDocumento: true,
      },
      orderBy: { nombre: "asc" },
    })
  }

  // ===== OBTENER ABOGADOS (para selector del Asistente/Admin) =====
  const abogados = await prisma.user.findMany({
    where: {
      isActive: true,
      rol: {
        in: ["ABOGADO", "ADMIN"]
      }
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
    },
    orderBy: { nombre: "asc" },
  })

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">
            <NuevoCasoForm 
              clientes={clientes} 
              abogados={abogados}
              userRol={userRol}
              currentUserId={user.id}
            />
          </div>
        </main>
      </div>
    </div>
  )
}