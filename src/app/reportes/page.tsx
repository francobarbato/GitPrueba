// app/reportes/page.tsx
// Página principal de reportes con visibilidad condicional por rol
// Asistente: Geográfica, Etapa procesal, Cartera de clientes
// Admin/Abogado: Todos los reportes

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart3, Download,
  MapPin, ArrowRight,
  TrendingUp, Trophy, Clock, Users,
  PieChart
} from "lucide-react"

export default async function ReportesPage() {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const userRol = user.rol as string
  const esGerencial = userRol === "ADMIN" || userRol === "ABOGADO"

  // Definición de reportes con visibilidad por rol
  const reportesOperativos = [
    {
      href: "/reportes/ubicacion-geografica",
      color: "orange",
      icon: MapPin,
      titulo: "Distribución de casos por ubicación geográfica",
      descripcion: "Casos agrupados por ciudad y juzgado para organizar traslados y recorridas",
      visible: true,
    },
    {
      href: "/reportes/tiempo-por-etapa",
      color: "purple",
      icon: Clock,
      titulo: "Estado de casos activos por etapa procesal",
      descripcion: "Dónde están trabados tus casos: volumen y concentración por etapa procesal",
      visible: true,
    },
  ]

  const reportesRendimiento = [
    {
      href: "/reportes/analisis-resultados",
      color: "emerald",
      icon: Trophy,
      titulo: "Resultados de casos cerrados",
      descripcion: "Cómo terminaron los casos: motivos de cierre, tasa de éxito y montos recuperados",
      visible: esGerencial,
    },
  ]

  const reportesEstrategia = [
    {
      href: "/reportes/cartera-fuero",
      color: "indigo",
      icon: PieChart,
      titulo: "Cartera activa por fuero",
      descripcion: "Qué tenemos hoy: volumen de casos y capital en litigio por tipo de causa",
      visible: esGerencial,
    },
    {
      href: "/reportes/cartera-clientes",
      color: "violet",
      icon: Users,
      titulo: "Análisis de cartera de clientes",
      descripcion: "Perfil de la base de clientes: recurrencia, capital en litigio y clientes inactivos",
      visible: true,
    },
    {
      href: "/reportes/evolucion-cartera",
      color: "teal",
      icon: TrendingUp,
      titulo: "Evolución y tendencia de la cartera",
      descripcion: "Cómo venimos: ingresos vs cierres por período y cambio en el perfil del estudio",
      visible: esGerencial,
    },
  ]

  // Filtrar por visibilidad
  const operativosVisibles = reportesOperativos.filter((r) => r.visible)
  const rendimientoVisibles = reportesRendimiento.filter((r) => r.visible)
  const estrategiaVisibles = reportesEstrategia.filter((r) => r.visible)

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-800">Reportes & Analytics</h1>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Tablero de control integral para la toma de decisiones.
              </p>
            </div>

            {esGerencial && (
              <Button variant="outline" size="sm" className="gap-2 text-slate-600 border-slate-300">
                <Download className="w-4 h-4" />
                Exportar Resumen PDF
              </Button>
            )}
          </div>

          {/* BLOQUE 1: GESTIÓN OPERATIVA */}
          {operativosVisibles.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Gestión operativa</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {operativosVisibles.map((r) => (
                  <ReporteCard key={r.href} {...r} />
                ))}
              </div>
            </div>
          )}

          {/* BLOQUE 2: RENDIMIENTO Y PROCESOS */}
          {rendimientoVisibles.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-1 bg-cyan-500 rounded-full"></div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Rendimiento y procesos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {rendimientoVisibles.map((r) => (
                  <ReporteCard key={r.href} {...r} />
                ))}
              </div>
            </div>
          )}

          {/* BLOQUE 3: ESTRATEGIA DE NEGOCIO */}
          {estrategiaVisibles.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-1 bg-indigo-500 rounded-full"></div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Estrategia de Negocio</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {estrategiaVisibles.map((r) => (
                  <ReporteCard key={r.href} {...r} />
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-slate-400 py-8 mt-4 border-t border-slate-100">
            Los datos se actualizan en tiempo real basándose en la actividad del sistema.
          </p>
        </main>
      </div>
    </div>
  )
}

// ============================================================================
// Componente reutilizable de card
// ============================================================================

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; hoverBg: string; hoverText: string; arrowHover: string }> = {
  orange:  { border: "border-l-orange-500",  bg: "bg-orange-100",  text: "text-orange-600",  hoverBg: "hover:bg-orange-50/30",  hoverText: "group-hover:text-orange-700",  arrowHover: "group-hover:text-orange-600" },
  purple:  { border: "border-l-purple-500",  bg: "bg-purple-100",  text: "text-purple-600",  hoverBg: "hover:bg-purple-50/30",  hoverText: "group-hover:text-purple-700",  arrowHover: "group-hover:text-purple-600" },
  cyan:    { border: "border-l-cyan-500",    bg: "bg-cyan-100",    text: "text-cyan-600",    hoverBg: "hover:bg-cyan-50/30",    hoverText: "group-hover:text-cyan-700",    arrowHover: "group-hover:text-cyan-600" },
  emerald: { border: "border-l-emerald-500", bg: "bg-emerald-100", text: "text-emerald-600", hoverBg: "hover:bg-emerald-50/30", hoverText: "group-hover:text-emerald-700", arrowHover: "group-hover:text-emerald-600" },
  indigo:  { border: "border-l-indigo-500",  bg: "bg-indigo-100",  text: "text-indigo-600",  hoverBg: "hover:bg-indigo-50/30",  hoverText: "group-hover:text-indigo-700",  arrowHover: "group-hover:text-indigo-600" },
  violet:  { border: "border-l-violet-500",  bg: "bg-violet-100",  text: "text-violet-600",  hoverBg: "hover:bg-violet-50/30",  hoverText: "group-hover:text-violet-700",  arrowHover: "group-hover:text-violet-600" },
  teal:    { border: "border-l-teal-500",    bg: "bg-teal-100",    text: "text-teal-600",    hoverBg: "hover:bg-teal-50/30",    hoverText: "group-hover:text-teal-700",    arrowHover: "group-hover:text-teal-600" },
}

function ReporteCard({
  href,
  color,
  icon: Icon,
  titulo,
  descripcion,
}: {
  href: string
  color: string
  icon: React.ComponentType<{ className?: string }>
  titulo: string
  descripcion: string
  visible?: boolean
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.indigo

  return (
    <Link href={href} className="group">
      <Card className={`border-l-4 ${c.border} hover:shadow-md transition-all cursor-pointer h-full ${c.hoverBg} bg-white`}>
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex justify-between items-start">
            <div className={`p-2 ${c.bg} rounded-lg ${c.text} group-hover:bg-white transition`}>
              <Icon className="w-5 h-5" />
            </div>
            <ArrowRight className={`w-4 h-4 text-slate-300 ${c.arrowHover} transition`} />
          </div>
          <CardTitle className={`text-base text-slate-800 mt-3 ${c.hoverText} transition`}>
            {titulo}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-slate-500 line-clamp-2">{descripcion}</p>
        </CardContent>
      </Card>
    </Link>
  )
}