// src/app/usuarios/[id]/offboarding/page.tsx
//
// Página del panel de offboarding (baja gradual de usuarios).
// Solo accesible para ADMIN. No se permite auto-offboarding.

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect, notFound } from "next/navigation"
import { getEstadoCuentaUsuario } from "./actions"
import { PanelOffboarding } from "./components/PanelOffboarding"

type Props = {
  params: { id: string }
}

export default async function OffboardingPage({ params }: Props) {
  const user = await getUserSessionServer()
  if (!user) redirect('/api/auth/signin')
  if (user.rol !== 'ADMIN') notFound()

  // El admin no puede iniciar su propio offboarding desde acá
  if (user.id === params.id) {
    redirect('/configuracion')
  }

  const estado = await getEstadoCuentaUsuario(params.id)

  return <PanelOffboarding estado={estado} />
}