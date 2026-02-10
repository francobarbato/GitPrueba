'use client'

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart3, Download, Activity, 
  MapPin, ArrowRight, Scale,
  TrendingUp, Trophy, Clock, Users,
  PieChart
} from "lucide-react"

export default function ReportesPage() {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* 1. SIDEBAR */}
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* 2. HEADER */}
        <Header />

        <main className="flex-1 overflow-auto p-6">
          
          {/* --- ENCABEZADO SUPERIOR --- */}
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

            <Button variant="outline" size="sm" className="gap-2 text-slate-600 border-slate-300">
                <Download className="w-4 h-4" />
                Exportar Resumen PDF
            </Button>
          </div>

          {/* ================================================================================== */}
          {/* BLOQUE 1: GESTIÓN OPERATIVA ("¿Cómo estamos hoy?")                                  */}
          {/* ================================================================================== */}
          
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Gestión operativa</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                
                {/* 1. Matriz de Trabajo */}
                <Link href="/reportes/carga-trabajo" className="group">
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-blue-50/30 bg-white">
                        <CardHeader className="pb-2 px-4 pt-4">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-white transition">
                                    <Users className="w-5 h-5" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition" />
                            </div>
                            <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-blue-700 transition">
                                Matriz de trabajo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <p className="text-xs text-slate-500 line-clamp-2">
                                Carga de equipo, casos activos y asignación de responsables.
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* 2. Logística Judicial */}
                <Link href="/reportes/ubicacion-geografica" className="group">
                    <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-orange-50/30 bg-white">
                        <CardHeader className="pb-2 px-4 pt-4">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:bg-white transition">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 transition" />
                            </div>
                            <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-orange-700 transition">
                                Logística judicial
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <p className="text-xs text-slate-500 line-clamp-2">
                                Mapa de calor por Fuero y Juzgado para optimizar la procuración.
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                                {/* 2. Tiempo por Etapa (Cuellos de Botella) */}
                <Link href="/reportes/tiempo-por-etapa" className="group">
                    <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-purple-50/30 bg-white">
                        <CardHeader className="pb-2 px-4 pt-4">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600 group-hover:bg-white transition">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition" />
                            </div>
                            <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-purple-700 transition">
                                Tiempo por etapa procesal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <p className="text-xs text-slate-500 line-clamp-2">
                                Análisis de tiempos de permanencia en cada etapa procesal.
                            </p>
                        </CardContent>
                    </Card>
                </Link>

            </div>
          </div>

          {/* ================================================================================== */}
          {/* BLOQUE 2: RENDIMIENTO Y PROCESOS ("¿Cómo nos fue?")                                 */}
          {/* ================================================================================== */}

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-1 bg-cyan-500 rounded-full"></div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Rendimiento y procesos</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                
                {/* 1. Desempeño y Productividad */}
                <Link href="/reportes/rendimiento" className="group">
                    <Card className="border-l-4 border-l-cyan-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-cyan-50/30 bg-white">
                        <CardHeader className="pb-2 px-4 pt-4">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-cyan-100 rounded-lg text-cyan-600 group-hover:bg-white transition">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 transition" />
                            </div>
                            <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-cyan-700 transition">
                                Velocidad de resolución
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <p className="text-xs text-slate-500 line-clamp-2">
                                Ranking de eficiencia y tiempos promedio de cierre por abogado.
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                 {/* 3. Análisis de Resultados */}
                 <Link href="/reportes/analisis-resultados" className="group">
                    <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-emerald-50/30 bg-white">
                        <CardHeader className="pb-2 px-4 pt-4">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:bg-white transition">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition" />
                            </div>
                            <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-emerald-700 transition">
                                Análisis de Resultados
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <p className="text-xs text-slate-500 line-clamp-2">
                                Ganados vs Perdidos y montos recuperados en casos cerrados.
                            </p>
                        </CardContent>
                    </Card>
                </Link>

            </div>
          </div>

          {/* ================================================================================== */}
          {/* BLOQUE 3: ESTRATEGIA ("¿Hacia dónde vamos?")                                       */}
          {/* ================================================================================== */}

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-1 bg-indigo-500 rounded-full"></div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Estrategia de Negocio</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                
                {/* 1. Composición de Cartera */}
                <Link href="/reportes/cartera-fuero" className="group">
                    <Card className="border-l-4 border-l-indigo-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-indigo-50/30 bg-white">
                        <CardHeader className="pb-2 px-4 pt-4">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 group-hover:bg-white transition">
                                    <PieChart className="w-5 h-5" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition" />
                            </div>
                            <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-indigo-700 transition">
                                Composición de cartera
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <p className="text-xs text-slate-500 line-clamp-2">
                                Volumen vs. Capital en litigio por fuero (Laboral, Civil, etc).
                            </p>
                        </CardContent>
                    </Card>
                </Link>

            </div>
          </div>

          <p className="text-center text-xs text-slate-400 py-8 mt-4 border-t border-slate-100">
            Los datos se actualizan en tiempo real basándose en la actividad del sistema.
          </p>

        </main>
      </div>
    </div>
  )
}