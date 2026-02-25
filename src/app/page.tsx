// app/page.tsx
// Dashboard Principal — Adaptado por rol (Admin, Abogado, Asistente)

import React from "react"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { DashboardService } from "@/lib/aplication/services/dashboard.service"
import {
  Briefcase, Users, Scale, FileText,
  TrendingUp, UserPlus, Settings,
  ArrowRight, Clock, AlertCircle
} from "lucide-react"

const dashboardService = new DashboardService()

// ============================================================================
// COMPONENTES
// ============================================================================

const CARD_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  blue:    { bg: 'bg-blue-50 border-blue-200',    text: 'text-blue-600',    icon: 'bg-blue-100' },
  emerald: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600', icon: 'bg-emerald-100' },
  purple:  { bg: 'bg-purple-50 border-purple-200',  text: 'text-purple-600',  icon: 'bg-purple-100' },
  indigo:  { bg: 'bg-indigo-50 border-indigo-200',  text: 'text-indigo-600',  icon: 'bg-indigo-100' },
  slate:   { bg: 'bg-slate-50 border-slate-200',   text: 'text-slate-600',   icon: 'bg-slate-100' },
  amber:   { bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-600',   icon: 'bg-amber-100' },
}

const CARD_ICONS: Record<string, React.ElementType> = {
  'Mis Casos Activos': Briefcase,
  'Casos Activos': Briefcase,
  'Mis Cerrados': Scale,
  'Casos Cerrados': Scale,
  'Mis Clientes': Users,
  'Clientes': Users,
  'Activos en el Estudio': TrendingUp,
  'Abogados Activos': Users,
  'Abogados': Users,
  'Sin Movimiento (30d)': AlertCircle,
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = CARD_COLORS[color] || CARD_COLORS.slate
  const Icon = CARD_ICONS[label] || Briefcase

  return (
    <div className={`flex items-center gap-4 p-5 rounded-xl border ${colors.bg} transition-all hover:shadow-md`}>
      <div className={`p-3 rounded-lg ${colors.icon}`}>
        <Icon className={`h-5 w-5 ${colors.text}`} />
      </div>
      <div>
        <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
        <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function DashboardCard({ title, description, href, icon: Icon }: {
  title: string; description: string; href: string; icon: React.ElementType
}) {
  return (
    <Link href={href} className="block group">
      <div className="rounded-xl border border-slate-200 p-5 bg-white shadow-sm transition-all hover:shadow-md hover:border-blue-300 h-full flex items-start gap-4">
        <div className="p-2.5 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
          <Icon className="h-5 w-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
    </Link>
  )
}

function RecentActivity({ actividad, esAdmin }: { actividad: any[]; esAdmin: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b px-5 py-4 bg-slate-50/50 flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-500" />
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Actividad Reciente</h3>
          <p className="text-xs text-slate-500">
            {esAdmin ? 'Últimas actualizaciones del estudio' : 'Últimas actualizaciones en tus casos'}
          </p>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {actividad.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-10">
            No hay actividad reciente.
          </p>
        ) : (
          actividad.map((caso) => (
            <Link key={caso.id} href={`/casos/${caso.id}`} className="block">
              <div className="px-5 py-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 text-sm truncate group-hover:text-blue-700 transition-colors">
                    {caso.titulo}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">
                      {caso.cliente ? `${caso.cliente.nombre} ${caso.cliente.apellido || ''}`.trim() : 'Sin cliente'}
                    </span>
                    {esAdmin && caso.abogado && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-400">
                          {caso.abogado.nombre} {caso.abogado.apellido || ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className="text-[10px] text-slate-400">
                    {new Date(caso.updatedAt).toLocaleDateString('es-AR')}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

function ClientesSinActivos({ clientes }: { clientes: any[] }) {
  if (clientes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b px-5 py-4 bg-slate-50/50 flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Clientes sin Casos Activos</h3>
            <p className="text-xs text-slate-500">Clientes que podrían necesitar seguimiento</p>
          </div>
        </div>
        <div className="px-5 py-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
            <Scale className="h-4 w-4" />
            Todos tus clientes tienen casos activos
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b px-5 py-4 bg-slate-50/50 flex items-center gap-2">
        <Users className="h-4 w-4 text-slate-500" />
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Clientes sin Casos Activos</h3>
          <p className="text-xs text-slate-500">Clientes que podrían necesitar seguimiento</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {clientes.map((cliente) => (
          <Link key={cliente.id} href={`/clientes/${cliente.id}`} className="block">
            <div className="px-5 py-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
              <div>
                <p className="font-medium text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                  {cliente.nombre} {cliente.apellido || ''}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {cliente.todosCerrados
                    ? `${cliente.totalCasos} caso${cliente.totalCasos !== 1 ? 's' : ''} cerrado${cliente.totalCasos !== 1 ? 's' : ''}`
                    : 'Sin casos registrados'
                  }
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// ACCESOS RÁPIDOS POR ROL
// ============================================================================

function getAccesosRapidos(rol: string) {
  const rolUpper = rol?.toUpperCase()

  const base = [
    { title: 'Gestión de Casos', description: 'Ver y administrar expedientes.', href: '/casos', icon: Briefcase },
    { title: 'Gestión de Clientes', description: 'Listado de clientes con historial.', href: '/clientes', icon: Users },
  ]

  if (rolUpper === 'ADMIN') {
    return [
      ...base,
      { title: 'Nuevo Caso', description: 'Registro rápido de expediente.', href: '/casos/nuevo', icon: FileText },
      { title: 'Reportes', description: 'Análisis avanzado de datos.', href: '/reportes', icon: TrendingUp },
      { title: 'Configuración', description: 'Gestión de usuarios del sistema.', href: '/configuracion', icon: Settings },
    ]
  }

  if (rolUpper === 'ASISTENTE') {
    return [
      ...base,
      { title: 'Nuevo Caso', description: 'Registrar caso para un abogado.', href: '/casos/nuevo', icon: FileText },
      { title: 'Nuevo Cliente', description: 'Registrar cliente nuevo.', href: '/clientes/nuevo', icon: UserPlus },
    ]
  }

  // Abogado
  return [
    ...base,
    { title: 'Nuevo Caso', description: 'Registro rápido de expediente.', href: '/casos/nuevo', icon: FileText },
    { title: 'Reportes', description: 'Análisis avanzado de datos.', href: '/reportes', icon: TrendingUp },
  ]
}

// ============================================================================
// SALUDO POR ROL
// ============================================================================

function getSaludo(rol: string) {
  const rolUpper = rol?.toUpperCase()
  if (rolUpper === 'ADMIN') return { badge: 'Administrador', badgeColor: 'bg-purple-100 text-purple-700' }
  if (rolUpper === 'ASISTENTE') return { badge: 'Asistente', badgeColor: 'bg-blue-100 text-blue-700' }
  return { badge: 'Abogado', badgeColor: 'bg-emerald-100 text-emerald-700' }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default async function DashboardPage() {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const rol = user.rol || 'ABOGADO'
  const esAdmin = rol.toUpperCase() === 'ADMIN'

  const [stats, actividad, clientesSinActivos] = await Promise.all([
    dashboardService.getStats(user.id, rol),
    dashboardService.getActividadReciente(user.id, rol),
    dashboardService.getClientesSinCasosActivos(user.id, rol),
  ])

  const accesos = getAccesosRapidos(rol)
  const saludo = getSaludo(rol)

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Bienvenido, {user.nombre || user.email?.split('@')[0]}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Panel principal del sistema
                </p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${saludo.badgeColor}`}>
                {saludo.badge}
              </span>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.cards.map((card: any, i: number) => (
                <StatCard
                  key={i}
                  label={card.label}
                  value={card.value}
                  color={card.color}
                />
              ))}
            </div>

            {/* Accesos Rápidos */}
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                Accesos Rápidos
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {accesos.map((acceso, i) => (
                  <DashboardCard key={i} {...acceso} />
                ))}
              </div>
            </div>

            {/* Sección inferior: Actividad + Clientes */}
            <div className="grid gap-6 lg:grid-cols-2">
              <RecentActivity actividad={actividad} esAdmin={esAdmin} />
              <ClientesSinActivos clientes={clientesSinActivos} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}