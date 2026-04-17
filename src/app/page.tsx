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
  ArrowRight, Clock, AlertCircle,
  AlertTriangle, Lock, ShieldAlert,
  CheckCircle2
} from "lucide-react"

const dashboardService = new DashboardService()

// ============================================================================
// COMPONENTES REUTILIZABLES
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
  'Mis casos activos': Briefcase,
  'Casos Activos': Briefcase,
  'Mis Cerrados': Scale,
  'Casos Cerrados': Scale,
  'Mis clientes': Users,
  'Clientes': Users,
  'Casos activos en el Estudio': TrendingUp,
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

// ============================================================================
// BANDEJA DE ACCIÓN — Tareas urgentes
// ============================================================================

function BandejaAccion({ tareas }: { tareas: any[] }) {
  if (tareas.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b px-5 py-4 bg-slate-50/50 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Tu Bandeja de Acción</h3>
            <p className="text-xs text-slate-500">Tareas que requieren tu atención inmediata</p>
          </div>
        </div>
        <div className="px-5 py-12 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-300" />
          <p className="text-sm font-medium text-slate-600">Todo al día</p>
          <p className="text-xs text-slate-400 mt-1">No tenés tareas urgentes por ahora</p>
        </div>
      </div>
    )
  }

  // Agrupar por tipo de urgencia
  const vencidas = tareas.filter(t => t.estado === "VENCIDA")
  const porVencer = tareas.filter(t => t.estado !== "VENCIDA" && t.estado !== "BLOQUEADA" && t.fechaVencimiento)
  const bloqueadas = tareas.filter(t => t.estado === "BLOQUEADA")

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b px-5 py-4 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-slate-500" />
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Tu Bandeja de Acción</h3>
            <p className="text-xs text-slate-500">
              {tareas.length} tarea{tareas.length !== 1 ? "s" : ""} requiere{tareas.length !== 1 ? "n" : ""} tu atención
            </p>
          </div>
        </div>
        <Link href="/gestion-tareas" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {/* Vencidas primero */}
        {vencidas.map(t => (
          <Link key={t.id} href="/gestion-tareas" className="block">
            <div className="px-5 py-3.5 hover:bg-red-50/50 transition-colors group flex items-start gap-3">
              <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">VENCIDA</span>
                  {t.tipo === "PROCESAL" && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-200 font-medium">Procesal</span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-800 mt-1 truncate group-hover:text-red-700 transition-colors">
                  {t.titulo}
                </p>
                {t.caso && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    <span className="font-mono text-blue-600">{t.caso.numero}</span> — {t.caso.titulo?.slice(0, 40)}
                  </p>
                )}
              </div>
              {t.fechaVencimiento && (
                <span className="text-[10px] text-red-600 font-bold shrink-0 mt-1">
                  {new Date(t.fechaVencimiento).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          </Link>
        ))}

        {/* Por vencer (hoy/mañana) */}
        {porVencer.map(t => {
          const fecha = t.fechaVencimiento ? new Date(t.fechaVencimiento) : null
          const esHoy = fecha && fecha.toDateString() === new Date().toDateString()
          const dotColor = esHoy ? "bg-orange-500" : "bg-amber-400"
          const labelColor = esHoy ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"
          const labelText = esHoy ? "VENCE HOY" : "VENCE MAÑANA"

          return (
            <Link key={t.id} href="/gestion-tareas" className="block">
              <div className="px-5 py-3.5 hover:bg-amber-50/50 transition-colors group flex items-start gap-3">
                <div className={`mt-1 w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 ${labelColor} rounded font-bold`}>{labelText}</span>
                    {t.prioridad === "FATAL" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold flex items-center gap-0.5">
                        <ShieldAlert className="w-3 h-3" /> FATAL
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 mt-1 truncate group-hover:text-amber-700 transition-colors">
                    {t.titulo}
                  </p>
                  {t.caso && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono text-blue-600">{t.caso.numero}</span> — {t.caso.titulo?.slice(0, 40)}
                    </p>
                  )}
                </div>
                {fecha && (
                  <span className={`text-[10px] font-bold shrink-0 mt-1 ${esHoy ? "text-orange-600" : "text-amber-600"}`}>
                    {fecha.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
            </Link>
          )
        })}

        {/* Bloqueadas donde soy supervisor */}
        {bloqueadas.map(t => (
          <Link key={t.id} href="/gestion-tareas" className="block">
            <div className="px-5 py-3.5 hover:bg-slate-50 transition-colors group flex items-start gap-3">
              <Lock className="w-3.5 h-3.5 text-red-400 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-medium border border-red-200">Bloqueada</span>
                </div>
                <p className="text-sm font-medium text-slate-800 mt-1 truncate group-hover:text-blue-700 transition-colors">
                  {t.titulo}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Responsable: {t.responsable?.nombre} {t.responsable?.apellido}
                  {t.motivoBloqueo && <span className="text-red-500"> — {t.motivoBloqueo.slice(0, 60)}{t.motivoBloqueo.length > 60 ? "..." : ""}</span>}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// PANEL DE EXPEDIENTES INCOMPLETOS
// ============================================================================

function ExpedientesIncompletos({ casosIncompletos }: { casosIncompletos: any[] }) {
  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 shadow-md overflow-hidden">
      <div className="bg-amber-400 px-4 py-3 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-900" />
        <div>
          <p className="font-bold text-amber-900 text-sm">Expedientes Incompletos</p>
          <p className="text-amber-800 text-xs">
            {casosIncompletos.length === 0
              ? 'Todo al día'
              : `${casosIncompletos.length} caso${casosIncompletos.length !== 1 ? 's' : ''} requieren atención`
            }
          </p>
        </div>
      </div>

      {casosIncompletos.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-amber-700 font-medium">✅ Todos los expedientes están completos</p>
        </div>
      ) : (
        <div className="divide-y divide-amber-200">
          {casosIncompletos.map((caso) => (
            <Link key={caso.id} href={`/casos/${caso.id}`} className="block">
              <div className="px-4 py-3 hover:bg-amber-100 transition-colors group">
                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-amber-900">
                  {caso.titulo}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">#{caso.numero}</p>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {!caso.juzgado && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-medium">
                      Sin juzgado
                    </span>
                  )}
                  {!caso.ubicacionFisica && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-medium">
                      Sin ubicación
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {casosIncompletos.length > 0 && (
        <div className="border-t border-amber-300 px-4 py-2.5 bg-amber-100">
          <Link href="/casos" className="text-xs text-amber-800 hover:text-amber-900 font-medium flex items-center gap-1">
            Ver todos los casos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  )
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
  const esAsistente = rol.toUpperCase() === 'ASISTENTE'
  const esAbogado = rol.toUpperCase() === 'ABOGADO'
  const mostrarAlertas = esAbogado || esAsistente

  const [stats, casosIncompletos, tareasUrgentes] = await Promise.all([
    dashboardService.getStats(user.id, rol),
    mostrarAlertas
      ? dashboardService.getCasosIncompletos(user.id, rol)
      : Promise.resolve([]),
    mostrarAlertas
      ? dashboardService.getTareasUrgentes(user.id, rol)
      : Promise.resolve([]),
  ])

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
                <p className="text-sm text-slate-500 mt-1">Panel principal del sistema</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${saludo.badgeColor}`}>
                {saludo.badge}
              </span>
            </div>

            {/* KPIs — ocultos para ASISTENTE */}
            {!esAsistente && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.cards.map((card: any, i: number) => (
                  <StatCard key={i} label={card.label} value={card.value} color={card.color} />
                ))}
              </div>
            )}

            {/* Layout principal: Bandeja de Acción + Alertas de Casos */}
            {mostrarAlertas && (
              <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                {/* Columna izquierda (70%) — Bandeja de Acción */}
                <BandejaAccion tareas={tareasUrgentes} />

                {/* Columna derecha (30%) — Expedientes Incompletos */}
                <div className="space-y-6">
                  <ExpedientesIncompletos casosIncompletos={casosIncompletos} />
                </div>
              </div>
            )}

            {/* Admin solo ve KPIs por ahora */}
            {esAdmin && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center">
                <Settings className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">Panel administrativo</p>
                <p className="text-xs text-slate-400 mt-1">Gestión de usuarios y configuración del sistema</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}