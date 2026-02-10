'use client'

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ExternalLink, BarChart3, Download, Activity, 
  CalendarClock, History, FileText, Calculator, 
  Filter, Flag, MapPin, ArrowRight, Scale,
  TrendingUp, Trophy
} from "lucide-react"

export default function ReportesPage() {
  const handleOpenDesktop = () => {
    alert("Para editar el reporte original, abre el archivo .pbix local en Power BI Desktop.")
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* 1. SIDEBAR REAL */}
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* 2. HEADER REAL */}
        <Header />

        <main className="flex-1 overflow-auto p-6">
          
          {/* --- ENCABEZADO SUPERIOR --- */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-800">Reportes & Analytics</h1>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Tablero de control integral: Operativo, Estratégico y Logístico.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 text-slate-600 border-slate-300">
                <Download className="w-4 h-4" />
                Exportar PDF
              </Button>
              <Button 
                onClick={handleOpenDesktop} 
                size="sm" 
                className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
              >
                <ExternalLink className="w-4 h-4" />
                Editar en Desktop
              </Button>
            </div>
          </div>

          {/* --- 1. POWER BI (IFRAME) --- */}
          <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white relative mb-8">
            <iframe 
                title="reportes_estudio_juridico" 
                width="100%" 
                height="100%" 
                src="https://app.powerbi.com/reportEmbed?reportId=26709efe-4a3d-4473-b6c4-fdcb3a0c9378&autoAuth=true&ctid=85430b7f-f12c-48f1-b10e-f34a99e68727" 
                frameBorder="0" 
                allowFullScreen={true}
                className="absolute inset-0 w-full h-full"
            ></iframe>
          </div>

          {/* --- SEPARADOR: GESTIÓN OPERATIVA --- */}
          <div className="flex items-center gap-4 mb-4 mt-8">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider"></span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-2">
            
            <Link href="/reportes/carga-trabajo" className="group">
                <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-blue-50/30 bg-white">
                    <CardHeader className="pb-2 px-4 pt-4">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-white transition">
                                <Activity className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition" />
                        </div>
                        <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-blue-700 transition">
                            Carga de Trabajo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-xs text-slate-500 line-clamp-2">
                            Saturación y eficiencia del equipo.
                        </p>
                    </CardContent>
                </Card>
            </Link>

            {/* <Link href="/reportes/seguimiento-plazos" className="group">
                <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-amber-50/30 bg-white">
                    <CardHeader className="pb-2 px-4 pt-4">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 group-hover:bg-white transition">
                                <CalendarClock className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition" />
                        </div>
                        <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-amber-700 transition">
                            Seguimiento y Plazos(futuro de tareas)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-xs text-slate-500 line-clamp-2">
                            Vencimientos y agenda crítica.
                        </p>
                    </CardContent>
                </Card>
            </Link> */}

            <Link href="/reportes/trazabilidad" className="group">
                <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-purple-50/30 bg-white">
                    <CardHeader className="pb-2 px-4 pt-4">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600 group-hover:bg-white transition">
                                <History className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition" />
                        </div>
                        <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-purple-700 transition">
                            Bitácora de Auditoría
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-xs text-slate-500 line-clamp-2">
                            Historial de movimientos.
                        </p>
                    </CardContent>
                </Card>
            </Link>
          </div>

          {/* --- SEPARADOR: INTELIGENCIA DE NEGOCIO (NUEVO) --- */}
          <div className="flex items-center gap-4 mb-4 mt-8">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider"></span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-2">
            
            {/* 1. productividad  */}
            <Link href="/reportes/rendimiento" className="group">
                <Card className="border-l-4 border-l-cyan-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-cyan-50/30 bg-white">
                    <CardHeader className="pb-2 px-4 pt-4">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-cyan-100 rounded-lg text-cyan-600 group-hover:bg-white transition">
                                <TrendingUp size={24} className="text-blue-600" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 transition" />
                        </div>
                        <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-cyan-700 transition">
                            Desempeño y productividad de los abogados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-xs text-slate-500 line-clamp-2">
                            Análisis de eficiencia, volumen de casos y puntos de retraso por abogado.
                        </p>
                    </CardContent>
                </Card>
            </Link>

            {/* 2. HITOS CRÍTICOS */}
            {/* <Link href="/reportes/hitos" className="group">
                <Card className="border-l-4 border-l-rose-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-rose-50/30 bg-white">
                    <CardHeader className="pb-2 px-4 pt-4">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-rose-100 rounded-lg text-rose-600 group-hover:bg-white transition">
                                <Flag className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-rose-600 transition" />
                        </div>
                        <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-rose-700 transition">
                            Linea de tiempo de los expedientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-xs text-slate-500 line-clamp-2">
                            Historial y proximos ventos fatales/audiencias clave.
                        </p>
                    </CardContent>
                </Card>
            </Link> */}

            {/* 3. LOGÍSTICA JUDICIAL */}
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
                            Logística Judicial
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-xs text-slate-500 line-clamp-2">
                            Organización de traslados y procuración por zonas.
                        </p>
                    </CardContent>
                </Card>
            </Link>

            {/* 4. CARTERA POR FUERO (NUEVO) */}
            <Link href="/reportes/cartera-fuero" className="group">
                <Card className="border-l-4 border-l-indigo-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-indigo-50/30 bg-white">
                    <CardHeader className="pb-2 px-4 pt-4">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 group-hover:bg-white transition">
                                <Scale className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition" />
                        </div>
                        <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-indigo-700 transition">
                            Composición de Cartera
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-xs text-slate-500 line-clamp-2">
                            Volumen vs. valor económico por fuero. Análisis estratégico del estudio.
                        </p>
                    </CardContent>
                </Card>
            </Link>

            {/* 5. ANÁLISIS DE RESULTADOS (NUEVO) */}
            <Link href="/reportes/analisis-resultados" className="group">
                <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-amber-50/30 bg-white">
                    <CardHeader className="pb-2 px-4 pt-4">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 group-hover:bg-white transition">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition" />
                        </div>
                        <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-amber-700 transition">
                            Análisis de Resultados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-xs text-slate-500 line-clamp-2">
                            Tasa de éxito, recupero económico y duración de casos cerrados.
                        </p>
                    </CardContent>
                </Card>
            </Link>

          </div>

          {/* --- SEPARADOR: CALCULADORAS --- */}
          <div className="flex items-center gap-4 mb-4 mt-8">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider"></span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* TARJETAS FILA 3: CALCULADORAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {/* TIEMPO POR ETAPA */}
            <Link href="/reportes/tiempo-por-etapa" className="group">
                <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-all cursor-pointer h-full hover:bg-orange-50/30 bg-white">
                    <CardHeader className="pb-2 px-4 pt-4">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:bg-white transition">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 transition" />
                        </div>
                        <CardTitle className="text-base text-slate-800 mt-3 group-hover:text-orange-700 transition">
                            Tiempo por etapa procesal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-xs text-slate-500 line-clamp-2">
                            Organización de traslados y procuración por zonas.
                        </p>
                    </CardContent>
                </Card>
            </Link>
          </div>

          
          <p className="text-center text-xs text-slate-400 pb-4 mt-8">
            Los datos se actualizan automáticamente cada 24hs.
          </p>

        </main>
      </div>
    </div>
  )
}