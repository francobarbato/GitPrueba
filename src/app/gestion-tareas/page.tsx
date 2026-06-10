import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect, notFound } from "next/navigation"
import { CheckCircle2, ChevronRight, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import {
  getTareasDelUsuario,
  getUsuariosAsignables,
  getCasosDisponibles,
  getClientesDisponibles,
  getUltimoAccesoTareas,
} from "src/lib/actions/tarea-actions"
import { TareasBoard } from "./components/TareasBoard"
import { NuevaTareaModal } from "./components/NuevaTareaModal"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { marcarTareasVencidasAction } from "src/lib/actions/tarea-actions"
import prisma from "src/lib/db/prisma"  // ⬅ NUEVO IMPORT

export default async function TareasPage() {

  const session = await getServerSession(authOptions)
  const user = await getUserSessionServer()

  if (!user) redirect("/api/auth/signin")

  // Defensa en profundidad — CLIENTE y ADMIN no tienen acceso a este módulo.
  // Usamos notFound() (404) para no revelar la existencia de la ruta.
  const userRol = user.rol?.toUpperCase()
  if (userRol === 'CLIENTE' || userRol === 'ADMIN') notFound()

  await marcarTareasVencidasAction()

  // ⬇ AGREGADO: lecturasRaw al Promise.all
  const [tareas, usuarios, casos, clientes, ultimoAcceso, lecturasRaw] = await Promise.all([
    getTareasDelUsuario(),
    getUsuariosAsignables(),
    getCasosDisponibles(),
    getClientesDisponibles(),
    getUltimoAccesoTareas(),
    prisma.tareaLectura.findMany({
      where: { userId: user.id },
      select: { tareaId: true, ultimaLectura: true },
    }),
  ])

  // ⬇ NUEVO: convertimos las lecturas a un map { tareaId: ultimaLecturaISO }
  // para pasarlo al cliente. El cliente lo usa en getTipoNovedad para no
  // mostrar como novedad las tareas que el usuario ya abrió.
  const lecturasPorTarea: Record<string, string> = Object.fromEntries(
    lecturasRaw.map(l => [l.tareaId, l.ultimaLectura.toISOString()])
  )

  // Smart Sorting (Ordenamiento Inteligente Base)
  const tareasOrdenadas = [...tareas].sort((a, b) => {
    const getPeso = (t: any) => {
      if (t.estado === "VENCIDA") return 100
      if (t.prioridad === "FATAL" && t.estado !== "COMPLETADA") return 90
      if (t.prioridad === "ALTA" && t.estado !== "COMPLETADA") return 80
      if (t.estado === "EN_PROCESO") return 70
      if (t.estado === "PENDIENTE") return 60
      return 0
    }

    const pesoA = getPeso(a)
    const pesoB = getPeso(b)

    if (pesoA !== pesoB) return pesoB - pesoA

    if (a.fechaVencimiento && b.fechaVencimiento) {
      return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
    }
    return 0
  })

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="w-full">

            <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-400">
              <Link href="/" className="hover:text-slate-700 transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-3.5 h-3.5" />
                Inicio
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-600 font-medium">Agenda y Seguimientos</span>
            </nav>

            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Agenda y Seguimientos</h1>
                <p className="text-sm text-slate-500 mt-1">Panel de control procesal y operativo del estudio</p>
              </div>
              <NuevaTareaModal
                usuarios={usuarios}
                casos={casos}
                clientes={clientes}
                currentUserId={user.id}
              />
            </div>

            {tareas.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium text-slate-600">No tenés eventos asignados</p>
                <p className="text-sm text-slate-400 mt-1">Creá un nuevo evento o esperá que te asignen uno</p>
              </div>
            ) : (
              <TareasBoard
                tareas={tareasOrdenadas}
                currentUserId={session?.user?.id || ""}
                ultimoAccesoTareas={ultimoAcceso}
                usuarios={usuarios}
                lecturasPorTarea={lecturasPorTarea}  // ⬅ NUEVO PROP
              />
            )}

          </div>
        </main>
      </div>
    </div>
  )
}