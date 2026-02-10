'use client'

import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { Button } from "@/components/ui/button"
import { ExternalLink, BarChart3, Download, Users, CalendarClock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ReportesPage() {
  const handleOpenDesktop = () => {
    alert("Para editar el reporte original, abre el archivo .pbix local en Power BI Desktop.")
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          
          {/* --- 1. ENCABEZADO DE LA PÁGINA --- */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-800">Reportes & Analytics</h1>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Tablero de control general e indicadores clave de rendimiento.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 text-slate-600">
                <Download className="w-4 h-4" />
                Exportar PDF
              </Button>
              <Button 
                onClick={handleOpenDesktop} 
                size="sm" 
                className="gap-2 bg-slate-800 hover:bg-slate-900 text-white"
              >
                <ExternalLink className="w-4 h-4" />
                Editar en Desktop
              </Button>
            </div>
          </div>

          {/* --- 2. VISUALIZADOR POWER BI (ARRIBA) --- */}
          {/* Nota: Puse h-auto y min-h-[600px] para asegurar que se vea grande */}
          <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white relative mb-10">
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

          {/* --- SEPARADOR VISUAL --- */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Herramientas de Detalle</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* --- 3. TARJETAS DE ACCESO RÁPIDO (ABAJO) --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            
            {/* Tarjeta 1: Balance y Asignación (Nuevo Nombre) */}
            <Link href="/reportes/carga-trabajo" className="group">
                <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-all cursor-pointer h-full bg-white hover:bg-blue-50/30">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-200 transition">
                                <Users className="w-6 h-6" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition" />
                        </div>
                        <CardTitle className="text-lg text-slate-800 mt-4 group-hover:text-blue-700 transition">
                            Balance y Asignación de Casos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-500">
                            Tabla detallada de saturación por abogado, cálculo de eficiencia y estado operativo del equipo.
                        </p>
                    </CardContent>
                </Card>
            </Link>

            {/* Tarjeta 2: Seguimiento */}
            <Link href="/reportes/seguimiento-plazos" className="group">
                <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-all cursor-pointer h-full bg-white hover:bg-amber-50/30">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 group-hover:bg-amber-200 transition">
                                <CalendarClock className="w-6 h-6" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition" />
                        </div>
                        <CardTitle className="text-lg text-slate-800 mt-4 group-hover:text-amber-700 transition">
                            Seguimiento y Plazos Fatales
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-500">
                            Control de vencimientos próximos, calendario de audiencias y alertas críticas de inactividad.
                        </p>
                    </CardContent>
                </Card>
            </Link>
          </div>

          <p className="text-center text-xs text-slate-400 pb-4">
            Datos sincronizados con la base de datos local.
          </p>

        </main>
      </div>
    </div>
  )
}