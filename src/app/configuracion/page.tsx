import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { AdminConfigView } from "./components/AdminConfigView"

export default async function ConfiguracionPage() {
  const user = await getUserSessionServer()
  
  if (!user) {
    redirect("/auth/signin")
  }

  // Segunda barrera: el middleware ya bloqueó antes de llegar acá.
  // Este guard redirige a "/" que sí existe.
  if (user.rol !== 'ADMIN') {
    redirect("/")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <AdminConfigView />
          </div>
        </main>
      </div>
    </div>
  )
}