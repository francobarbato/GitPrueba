// src/app/tareas/page.tsx

import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect, notFound } from "next/navigation"
import { ShieldAlert, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
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

export default async function TareasPage() {
  
  const session = await getServerSession(authOptions)
  const user = await getUserSessionServer()

  if (!user) redirect("/api/auth/signin")

  const userRol = user.rol?.toUpperCase()
  // Defensa en profundidad — bloquear roles no operativos
  if (userRol === 'CLIENTE' || userRol === 'ADMIN') notFound()
  if (userRol === "CLIENTE") redirect("/portal")
  if (userRol === "ADMIN") redirect("/")

    await marcarTareasVencidasAction()
  const [tareas, usuarios, casos, clientes, ultimoAcceso] = await Promise.all([
    getTareasDelUsuario(),
    getUsuariosAsignables(),
    getCasosDisponibles(),
    getClientesDisponibles(),
    getUltimoAccesoTareas(),
  ])

  const pendientes = tareas.filter(t => t.estado === "PENDIENTE").length
  const enProceso  = tareas.filter(t => t.estado === "EN_PROCESO").length
  const vencidas   = tareas.filter(t => t.estado === "VENCIDA").length
  const fatales    = tareas.filter(t => t.prioridad === "FATAL" && t.estado !== "COMPLETADA").length

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="w-full">

            <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-400">
              <Link href="/" className="hover:text-slate-700 transition-colors">Inicio</Link>
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

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="text-xs text-slate-500 font-medium">Pendientes</p>
                </div>
                <p className="text-3xl font-bold text-slate-800">{pendientes}</p>
              </div>
              <div className="bg-white border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-blue-600 font-medium">En Proceso</p>
                </div>
                <p className="text-3xl font-bold text-blue-700">{enProceso}</p>
              </div>
              {fatales > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-600 font-medium">Prioridad Fatal</p>
                  </div>
                  <p className="text-3xl font-bold text-red-700">{fatales}</p>
                </div>
              )}
              {vencidas > 0 && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-600 font-medium">Vencidas</p>
                  </div>
                  <p className="text-3xl font-bold text-red-700">{vencidas}</p>
                </div>
              )}
            </div>

            {tareas.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium text-slate-600">No tenés tareas asignadas</p>
                <p className="text-sm text-slate-400 mt-1">Creá una nueva tarea o esperá que te asignen una</p>
              </div>
            ) : (

              <TareasBoard 
                tareas={tareas} 
                currentUserId={session?.user?.id || ""}
                ultimoAccesoTareas={ultimoAcceso}
                usuarios={usuarios}
              />
            )}

          </div>
        </main>
      </div>
    </div>
  )
}