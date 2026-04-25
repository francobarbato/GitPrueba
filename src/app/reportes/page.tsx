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
<<<<<<< Updated upstream
import { ShieldCheck } from "lucide-react"
=======

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
      { titulo: "Distribución geográfica", descripcion: "Organización logística de visitas a tribunales", href: "/reportes/ubicacion-geografica", icono: MapPinned, color: "emerald" },
    ],
  },
  {
    titulo: "Rendimiento y procesos",
    descripcion: "Evaluación del desempeño del estudio",
    reportes: [
      { titulo: "Estado de casos por etapa", descripcion: "Dónde están trabados los expedientes y cuáles requieren atención", href: "/reportes/tiempo-por-etapa", icono: Timer, color: "amber" },
      { titulo: "Análisis de resultados", descripcion: "Tasa de éxito, recupero y resultados por motivo de cierre", href: "/reportes/analisis-resultados", icono: Target, color: "rose" },
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
>>>>>>> Stashed changes

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

  

  const reportesPersonales = [
  {
    href: "/reportes/auditoria",
    color: "slate",
    icon: ShieldCheck,
    titulo: "Auditoría Personal",
    descripcion: "Registro de actividad en tus expedientes: cambios, modificaciones y quién los realizó",
    visible: userRol === "ABOGADO",
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
                    {/* BLOQUE 4: PERSONAL — solo ABOGADO */}
          {reportesPersonales.some(r => r.visible) && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-1 bg-slate-400 rounded-full"></div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Personal</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {reportesPersonales.filter(r => r.visible).map(r => (
                  <ReporteCard key={r.href} {...r} />
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-slate-400 py-8 mt-4 border-t border-slate-100"></p>

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
  slate:   { border: "border-l-slate-500", bg: "bg-slate-100", text: "text-slate-600", hoverBg: "hover:bg-slate-50/30", hoverText: "group-hover:text-slate-700", arrowHover: "group-hover:text-slate-600" },
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