import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect, notFound } from "next/navigation"
import { ClienteService } from "@/lib/aplication/services/cliente.service"
import { EditarClienteForm } from "./editar-cliente-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const clienteService = new ClienteService()

export default async function EditarClientePage({ params }: { params: { id: string } }) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  // 1. Obtener el cliente
  const cliente = await clienteService.getClienteById(params.id)
  if (!cliente) return notFound()

  // 2. SEGURIDAD: Verificar permisos
  const esAdmin = user.rol === 'admin'
  const esPropietario = cliente.abogadoId === user.id

  if (!esAdmin && !esPropietario) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">No tienes permiso</h1>
          <p className="text-slate-600 mb-4">No puedes editar un cliente que no te pertenece.</p>
          <Link href="/clientes">
            <Button variant="outline">Volver a mis clientes</Button>
          </Link>
        </div>
      </div>
    )
  }

  // 3. Renderizar formulario
  return (
    <div className="min-h-screen bg-gray-50 p-6">
       {/* Pasamos el cliente cargado al formulario cliente */}
       <EditarClienteForm cliente={cliente} />
    </div>
  )
}