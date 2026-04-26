// src/app/portal/casos/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import prisma from "src/lib/db/prisma"
import { Briefcase, ArrowRight, AlertCircle, Inbox } from 'lucide-react'
import { CasosToggle } from "../components/CasosToggle"

export default async function PortalCasosPage() {
  const user = await getUserSessionServer()
  if (!user || user.rol?.toUpperCase() !== 'CLIENTE') redirect("/auth/signin")

  const cliente = await prisma.cliente.findFirst({
    where: { usuarioPortalId: user.id },
  })
  if (!cliente) redirect("/portal")

  const [casosActivos, casosCerrados] = await Promise.all([
    prisma.caso.findMany({
      where: { clienteId: cliente.id, estaCerrado: false },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, numero: true, titulo: true, tipo: true, estado: true, fechaInicio: true }
    }),
    prisma.caso.findMany({
      where: { clienteId: cliente.id, estaCerrado: true },
      orderBy: { fechaCierre: 'desc' },
      select: { id: true, numero: true, titulo: true, tipo: true, estado: true, fechaCierre: true, motivoCierre: true }
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-slate-600" />
          Mis Casos
        </h1>
        <p className="text-slate-600 mt-1">Historial completo de sus expedientes</p>
      </div>

      <CasosToggle casosActivos={casosActivos} casosCerrados={casosCerrados} />
    </div>
  )
}