import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import NuevoClienteForm from "./nuevo-cliente-form"
import prisma from "src/lib/db/prisma"

export default async function NuevoClientePageWrapper() {
  const user = await getUserSessionServer()
  if (!user) redirect("/auth/signin")
  
  const userRol = user.rol?.toUpperCase() || ''
  if (userRol === 'ADMIN') redirect('/')

  const abogados = userRol === 'ASISTENTE' 
    ? await prisma.user.findMany({
        where: { isActive: true, rol: 'ABOGADO' },
        select: { id: true, nombre: true, apellido: true, email: true },
        orderBy: { nombre: 'asc' }
      })
    : []

  return <NuevoClienteForm abogados={abogados} userRol={userRol} />
}