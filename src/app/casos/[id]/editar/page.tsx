import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect, notFound } from "next/navigation"
// Recuerda: 'aplication' por tu estructura actual
import { CasoService } from "@/lib/aplication/services/caso.service"
import { ClienteService } from "@/lib/aplication/services/cliente.service"
import { EditarCasoForm } from "./editar-caso-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const casoService = new CasoService()
const clienteService = new ClienteService()

export default async function EditarCasoPage({ params }: { params: { id: string } }) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  // 1. Obtener el caso
  const caso = await casoService.getCasoById(params.id)
  if (!caso) return notFound()

  // 2. SEGURIDAD: Verificar permisos (Igual que en detalle)
  const esAdmin = user.rol === 'admin'
  const esPropietario = caso.abogadoId === user.id

  if (!esAdmin && !esPropietario) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">No tienes permiso</h1>
          <p className="text-slate-600 mb-4">No puedes editar un caso que no te pertenece.</p>
          <Link href="/casos">
            <Button variant="outline">Volver a mis casos</Button>
          </Link>
        </div>
      </div>
    )
  }

  // 3. Obtener clientes del abogado (para poder cambiar el cliente si quiere)
  // Si es admin, quizás quieras traer todos, pero por ahora traemos los del dueño del caso
  const clientes = await clienteService.getClientesByAbogado(user.id)

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Link href={`/casos/${params.id}`}>
                <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Detalle
                </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Modificar Caso</h1>
        </div>
        
        <EditarCasoForm caso={caso} clientes={clientes} />
      </div>
    </div>
  )
}