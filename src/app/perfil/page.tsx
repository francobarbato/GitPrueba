// src/app/perfil/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { PerfilView } from "./components/PerfilView"
import prisma from "src/lib/db/prisma"

export default async function PerfilPage() {
  const session = await getUserSessionServer()
  
  if (!session) {
    redirect("/auth/signin")
  }

  // Obtener datos completos del usuario
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      name: true,
      image: true,
      rol: true,
      debeResetearPassword: true,
    }
  })

  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <PerfilView user={user} />
        </main>
      </div>
    </div>
  )
}