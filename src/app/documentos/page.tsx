// app/documentos/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { ExploradorDocumentos } from "./components/ExploradorDocumentos"
import prisma from "src/lib/db/prisma"
import Link from "next/link"
import { LayoutDashboard, ChevronRight } from "lucide-react"

// Solo traemos la lista de expedientes (liviano).
// El contenido de cada expediente/carpeta se pide on-demand al navegar.
async function obtenerCasos(userId: string, esAdmin: boolean) {
  return await prisma.caso.findMany({
    where: esAdmin ? {} : { abogadoId: userId },
    select: {
      id: true,
      numero: true,
      titulo: true,
      tipo: true,
      estaCerrado: true,
      cliente: { select: { nombre: true, apellido: true } },
      _count: { select: { documentos: true } }
    },
    orderBy: { updatedAt: 'desc' }
  })
}

export default async function DocumentosPage() {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const esAdmin = user.rol?.toUpperCase() === 'ADMIN'
  const casos = await obtenerCasos(user.id, esAdmin)

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 min-h-0 flex flex-col px-6 pb-6">
          {/* Breadcrumb */}
          <div className="pt-4 flex-shrink-0">
            <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-4">
              <Link href="/" className="hover:text-slate-700 transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-3.5 h-3.5" />
                Inicio
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-600 font-medium">Documentos</span>
            </nav>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white flex flex-col">
            <ExploradorDocumentos
              casos={casos}
              userId={user.id}
              userRol={user.rol || 'ABOGADO'}
            />
          </div>
        </main>
      </div>
    </div>
  )
}