import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { AdminConfigView } from "./components/AdminConfigView"
import { AbogadoConfigView } from "./components/AbogadoConfigView"

export default async function ConfiguracionPage() {
  const user = await getUserSessionServer()

  if (!user) {
    redirect("/api/auth/signin")
  }

  const esAdmin = user.rol === 'admin'

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          {esAdmin ? (
            // Si es Admin, ve el panel de gestión de usuarios
            <AdminConfigView />
          ) : (
            // Si es Abogado, ve solo su perfil personal
            <AbogadoConfigView user={user} />
          )}
        </main>
      </div>
    </div>
  )
}