import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { ClienteService } from "@/lib/aplication/services/cliente.service"
import { NuevoCasoForm } from "./nuevo-caso-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const clienteService = new ClienteService()

export default async function NuevoCasoPage() {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  // Obtenemos los clientes para llenar el Select
  const clientes = await clienteService.getClientesByAbogado(user.id)

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Link href="/casos">
                <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Nuevo Caso</h1>
        </div>
        
        {/* Renderizamos el formulario cliente pasándole los datos */}
        {/* @ts-ignore: Si TS se queja por el tipo de cliente, ignorar temporalmente */}
        <NuevoCasoForm clientes={clientes} />
      </div>
    </div>
  )
}