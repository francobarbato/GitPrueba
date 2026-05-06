// app/reportes/page.tsx

import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import {
  ClipboardCheck, Briefcase, BarChart3, MapPinned, Timer,
  TrendingUp, Target, PieChart, LineChart, FileText,
} from "lucide-react"

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-200" },
  cyan:    { bg: "bg-cyan-50",    text: "text-cyan-600",    border: "border-cyan-200" },
  purple:  { bg: "bg-purple-50",  text: "text-purple-600",  border: "border-purple-200" },
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-600",  border: "border-indigo-200" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200" },
  rose:    { bg: "bg-rose-50",    text: "text-rose-600",    border: "border-rose-200" },
  slate:   { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200" },
}

type Reporte = {
  titulo: string
  descripcion: string
  href: string
  icono: any
  color: keyof typeof COLOR_MAP
}

const BLOQUES: { titulo: string; descripcion: string; reportes: Reporte[] }[] = [
  {
    titulo: "Personal",
    descripcion: "Auditoría de actividad propia",
    reportes: [
      { titulo: "Auditoría personal", descripcion: "Registro de cambios en mis expedientes", href: "/reportes/auditoria", icono: FileText, color: "slate" },
    ],
  },
  {
    titulo: "Gestión operativa",
    descripcion: "Herramientas para el día a día del estudio",
    reportes: [
      { titulo: "Cumplimiento de Plazos", descripcion: "Cómo se trabajó: eventos cumplidos en plazo, con demora y vencidas", href: "/reportes/cumplimiento-tareas", icono: ClipboardCheck, color: "blue" },
      { titulo: "Carga de trabajo", descripcion: "Qué tenés encima hoy: expedientes, agenda, eventos activos y próximos a vencer", href: "/reportes/matriz-carga", icono: Briefcase, color: "cyan" },
      { titulo: "Composición de la Agenda", descripcion: "Qué tipo de trabajo hace el estudio: procesal vs interna, categorías, contexto", href: "/reportes/composicion-tareas", icono: BarChart3, color: "purple" },
      { titulo: "Distribución de expedientes por ubicación geográfica", descripcion: "Organización logística de visitas a tribunales", href: "/reportes/ubicacion-geografica", icono: MapPinned, color: "emerald" },
    ],
  },
  {
    titulo: "Rendimiento y procesos",
    descripcion: "Evaluación del desempeño del estudio",
    reportes: [
      { titulo: "Estado de expedientes por etapa", descripcion: "Dónde están trabados los expedientes y cuáles requieren atención", href: "/reportes/tiempo-por-etapa", icono: Timer, color: "amber" },
      { titulo: "Resultados de expedientes cerrados", descripcion: "Tasa de éxito, recupero y resultados por motivo de cierre", href: "/reportes/analisis-resultados", icono: Target, color: "rose" },
    ],
  },
  {
    titulo: "Estrategia de negocio",
    descripcion: "Análisis para decisiones estratégicas",
    reportes: [
      { titulo: "Composición de cartera por fuero", descripcion: "Dónde está el volumen y el valor económico del estudio", href: "/reportes/cartera-fuero", icono: PieChart, color: "indigo" },
      { titulo: "Análisis de cartera de clientes", descripcion: "Perfil de la base de clientes: activos, recurrentes, antigüedad", href: "/reportes/cartera-clientes", icono: TrendingUp, color: "emerald" },
      { titulo: "Evolución y tendencia de cartera", descripcion: "Flujo de entrada y salida de expedientes a lo largo del tiempo", href: "/reportes/evolucion-cartera", icono: LineChart, color: "blue" },
    ],
  },
]

export default async function ReportesPage() {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const userRol = user.rol?.toUpperCase()
  if (userRol === "CLIENTE" || userRol === "ADMIN") notFound()

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
              <p className="text-sm text-slate-500">Herramientas de análisis para la toma de decisiones del estudio.</p>
            </div>

            <div className="space-y-8">
              {BLOQUES.map(bloque => (
                <section key={bloque.titulo}>
                  <div className="mb-3">
                    <h2 className="text-lg font-semibold text-slate-800">{bloque.titulo}</h2>
                    <p className="text-xs text-slate-500">{bloque.descripcion}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {bloque.reportes.map(r => {
                      const cfg = COLOR_MAP[r.color]
                      const Icon = r.icono
                      return (
                        <Link
                          key={r.href}
                          href={r.href}
                          className={`flex items-start gap-3 p-4 bg-white border ${cfg.border} rounded-lg hover:shadow-md hover:border-opacity-100 transition-all`}
                        >
                          <div className={`p-2 rounded-lg ${cfg.bg} shrink-0`}>
                            <Icon className={`w-5 h-5 ${cfg.text}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm">{r.titulo}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{r.descripcion}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}