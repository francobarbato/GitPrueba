// app/page.tsx

import React from "react"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { DashboardService } from "@/lib/aplication/services/dashboard.service"

const dashboardService = new DashboardService()

function DashboardCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className="block">
      <div className="rounded-lg border p-6 bg-white shadow-sm transition-all hover:shadow-md hover:border-blue-300 h-full">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  )
}

function StatCard({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg border bg-white shadow-sm">
      <p className="text-3xl font-bold text-blue-600">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  )
}

function RecentActivity({ actividad }: { actividad: any[] }) {
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b p-4 bg-slate-50">
        <h3 className="font-semibold text-slate-800">Actividad Reciente</h3>
        <p className="text-sm text-gray-500">Últimas actualizaciones en tus casos</p>
      </div>
      <div className="p-4 space-y-4">
        {actividad.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-8">No hay actividad reciente.</p>
        ) : (
          actividad.map((caso) => (
            <Link key={caso.id} href={`/casos/${caso.id}`}>
              <div className="border-b pb-3 last:border-0 hover:bg-slate-50 p-2 rounded transition cursor-pointer">
                <p className="font-medium text-slate-900">{caso.titulo}</p>
                <p className="text-sm text-slate-600">
                  {caso.cliente ? `Cliente: ${caso.cliente.nombre} ${caso.cliente.apellido}` : 'Sin cliente'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Actualizado: {new Date(caso.updatedAt).toLocaleDateString('es-AR')}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const esAdmin = user.rol === 'admin'

  const stats = await dashboardService.getStats(user.id, esAdmin)
  const actividad = await dashboardService.getActividadReciente(user.id, esAdmin)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Panel Principal</h1>
              <p className="text-slate-600 mt-2">
                Bienvenido, {user.nombre || user.email}
                {esAdmin && <span className="ml-2 text-purple-600 font-semibold">(Administrador)</span>}
              </p>
            </div>

            {/* ESTADÍSTICAS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Total Casos" value={stats.totalCasos} />
              <StatCard label="Abiertos" value={stats.casosAbiertos} />
              <StatCard label="En Proceso" value={stats.casosEnProceso} />
              <StatCard label="Cerrados" value={stats.casosCerrados} />
              <StatCard label="Clientes" value={stats.totalClientes} />
            </div>

            {/* ACCESOS RÁPIDOS */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Accesos Rápidos</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <DashboardCard
                  title="Gestión de Casos"
                  description="Registro detallado de casos y actualizaciones."
                  href="/casos"
                />
                <DashboardCard
                  title="Gestión de Clientes"
                  description="Listado completo de clientes con historial."
                  href="/clientes"
                />
                <DashboardCard
                  title="Nuevo Caso"
                  description="Registro rápido para nuevos casos."
                  href="/casos/nuevo"
                />
                <DashboardCard
                  title="Reportes"
                  description="Análisis avanzado de datos."
                  href="/reportes"
                />
                {esAdmin && (
                  <DashboardCard
                    title="Configuración"
                    description="Gestión de usuarios del sistema."
                    href="/configuracion"
                  />
                )}
              </div>
            </div>

            {/* ACTIVIDAD RECIENTE */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border bg-white shadow-sm p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Próximos Vencimientos</h3>
                <p className="text-gray-400 italic text-center py-8">Módulo en desarrollo</p>
              </div>
              
              <RecentActivity actividad={actividad} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}