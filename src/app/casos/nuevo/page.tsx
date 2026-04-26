// src/app/casos/nuevo/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { NuevoCasoForm } from "./nuevo-caso-form"
import { ArrowLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import prisma from "src/lib/db/prisma"

export default async function NuevoCasoPage() {
  const user = await getUserSessionServer()

  if (!user) {
    redirect("/auth/signin")
  }

  const userRol = user.rol?.toUpperCase() || 'ABOGADO'

  let clientes: { id: string; nombre: string; apellido: string | null; numeroDocumento: string }[] = []

  if (userRol === 'ADMIN') {
    clientes = await prisma.cliente.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, apellido: true, numeroDocumento: true },
      orderBy: { nombre: "asc" },
    })
  } else if (userRol === 'ASISTENTE') {
    // El asistente empieza sin clientes — se cargan dinámicamente
    // cuando selecciona un abogado (ver ClienteSearchCombobox con abogadoId)
    clientes = []
  } else {
    // ABOGADO: ve sus propios clientes
    clientes = await prisma.cliente.findMany({
      where: {
        activo: true,
        OR: [
          { abogadoId: user.id },
          { creadoPorId: user.id }
        ]
      },
      select: { id: true, nombre: true, apellido: true, numeroDocumento: true },
      orderBy: { nombre: "asc" },
    })
  }

  const abogados = await prisma.user.findMany({
    where: { isActive: true, rol: { in: ["ABOGADO"] } },
    select: { id: true, nombre: true, apellido: true, email: true },
    orderBy: { nombre: "asc" },
  })

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ===== HEADER CON BREADCRUMB ===== */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-2">
          <Link href="/casos">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/casos" className="text-slate-500 hover:text-slate-700 transition-colors">
              Expedientes
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-900 font-medium">Nuevo Expediente</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <NuevoCasoForm 
          clientes={clientes} 
          abogados={abogados}
          userRol={userRol}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}