// src/app/portal/perfil/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { PerfilView } from "@/app/perfil/components/PerfilView"
import prisma from "src/lib/db/prisma"

export default async function PortalPerfilPage() {
  const session = await getUserSessionServer()

  if (!session) redirect("/auth/signin")
  if (session.rol?.toUpperCase() !== "CLIENTE") redirect("/")

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

  if (!user) redirect("/auth/signin")

  return (
    <div className="max-w-4xl mx-auto">
      <PerfilView user={user} />
    </div>
  )
}