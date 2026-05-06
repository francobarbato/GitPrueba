// src/app/casos/[id]/editar/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect, notFound } from "next/navigation"
import { CasoService } from "@/lib/aplication/services/caso.service"
import { ClienteService } from "@/lib/aplication/services/cliente.service"
import { EditarCasoForm } from "./editar-caso-form"
import { ArrowLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const casoService = new CasoService()
const clienteService = new ClienteService()

export default async function EditarCasoPage({ params }: { params: { id: string } }) {
  const user = await getUserSessionServer()
  if (!user) redirect("/auth/signin")

  const casoRaw = await casoService.getCasoById(params.id)
  if (!casoRaw) return notFound()

  const userRol = user.rol?.toUpperCase() || ''
  const esAdmin = userRol === 'ADMIN'
  const esAsistente = userRol === 'ASISTENTE'
  const esPropietario = casoRaw.abogadoId === user.id

  // Admin, el abogado dueño y el asistente pueden editar
  if (esAdmin || (!esPropietario && !esAsistente)) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">No tienes permiso</h1>
          <p className="text-slate-600 mb-4">No puedes editar un expediente que no te pertenece.</p>
          <Link href="/casos">
            <Button variant="outline">Volver a mis expedientes</Button>
          </Link>
        </div>
      </div>
    )
  }

  const caso = {
    ...casoRaw,
    montoDisputa: casoRaw.montoDisputa ? Number(casoRaw.montoDisputa) : null,
    montoFinal: casoRaw.montoFinal ? Number(casoRaw.montoFinal) : null,
    createdAt: casoRaw.createdAt?.toISOString() ?? null,
    updatedAt: casoRaw.updatedAt?.toISOString() ?? null,
    fechaInicio: casoRaw.fechaInicio?.toISOString() ?? null,
    fechaFin: casoRaw.fechaFin?.toISOString() ?? null,
    fechaCierre: casoRaw.fechaCierre?.toISOString() ?? null,
  }

  // Clientes a mostrar en el select bloqueado del form:
  // - Abogado: sus propios clientes
  // - Admin/Asistente: todos (el select está disabled de todas formas en edición)
  const clientes = esAdmin || esAsistente
    ? await clienteService.getAllClientes()
    : await clienteService.getClientesByAbogado(user.id)

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER CON BREADCRUMB */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-2">
          <Link href={`/casos/${params.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/casos" className="text-slate-500 hover:text-slate-700 transition-colors">
              Exppediente
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <Link href={`/casos/${params.id}`} className="text-slate-500 hover:text-slate-700 transition-colors max-w-[200px] truncate">
              #{casoRaw.numero} — {casoRaw.titulo}
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-900 font-medium">Editar</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <EditarCasoForm caso={caso} clientes={clientes} />
      </div>
    </div>
  )
}