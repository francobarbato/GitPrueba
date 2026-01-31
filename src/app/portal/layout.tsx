// src/app/portal/layout.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { PortalHeader } from "./components/PortalHeader"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUserSessionServer()

  if (!user) {
    redirect("/auth/signin")
  }

  // Solo rol CLIENTE puede acceder al portal
  if (user.rol?.toUpperCase() !== 'CLIENTE') {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader user={{ 
        nombre: user.nombre ?? null,
        apellido: user.apellido ?? null,
        email: user.email ?? ""
      }} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
