import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect, notFound } from "next/navigation"
import { ClienteService } from "@/lib/aplication/services/cliente.service"
import { EditarClienteForm } from "./editar-cliente-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronRight } from "lucide-react"

const clienteService = new ClienteService()

export default async function EditarClientePage({ params }: { params: { id: string } }) {
  const user = await getUserSessionServer()
  if (!user) redirect("/auth/signin")

  const cliente = await clienteService.getClienteById(params.id)
  if (!cliente) return notFound()

  const userRol = user.rol?.toUpperCase() || ''
  const esAdmin = userRol === 'ADMIN'         // bug corregido: era 'admin' en minúscula
  const esAsistente = userRol === 'ASISTENTE'
  const esPropietario = cliente.abogadoId === user.id

  // Admin, el abogado dueño y el asistente pueden editar
  if (esAdmin || (!esPropietario && !esAsistente)) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">No tienes permiso</h1>
          <p className="text-slate-600 mb-4">No puedes editar un cliente que no te pertenece.</p>
          <Link href="/clientes">
            <Button variant="outline">Volver a clientes</Button>
          </Link>
        </div>
      </div>
    )
  }

  const nombreCompleto = `${cliente.nombre}${cliente.apellido ? ` ${cliente.apellido}` : ''}`

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER CON BREADCRUMB */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-2">
          <Link href={`/clientes/${params.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/clientes" className="text-slate-500 hover:text-slate-700 transition-colors">
              Clientes
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <Link href={`/clientes/${params.id}`} className="text-slate-500 hover:text-slate-700 transition-colors max-w-[160px] truncate">
              {nombreCompleto}
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-900 font-medium">Editar</span>
          </nav>
        </div>
      </div>

      <div className="p-6">
        <EditarClienteForm cliente={cliente} />
      </div>
    </div>
  )
}