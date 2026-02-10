'use client'

import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, FileWarning, UserX, ArrowLeft, ArrowRight, Calendar, Gavel, FileText, AlertOctagon, CheckCircle2 } from "lucide-react"
import Link from "next/link"

// --- DATOS MOCK (FUSIÓN DE AMBOS) ---

// 1. Semáforo (NUEVO)
const resumenVencimientos = { hoy: 3, semana: 5, quincena: 12 }

// 2. Heatmap (NUEVO)
const heatmapDays = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1
  let intensity = 0
  if ([5, 12, 15, 28].includes(day)) intensity = 3 // Rojo
  else if ([2, 3, 10, 20].includes(day)) intensity = 2 // Amarillo
  else if ([1, 8, 18].includes(day)) intensity = 1 // Azul
  return { day, intensity }
})

// 3. Timeline (NUEVO)
const hitosTimeline = [
  { id: 1, fecha: "10 Dic", titulo: "Audiencia", caso: "Pérez c/ Coca Cola", tipo: "Audiencia", icon: Gavel, color: "text-purple-600 bg-purple-100" },
  { id: 2, fecha: "15 Dic", titulo: "Vencimiento", caso: "Sucesión Gómez", tipo: "Plazo Fatal", icon: AlertOctagon, color: "text-red-600 bg-red-100" },
  { id: 3, fecha: "05 Ene", titulo: "Sentencia", caso: "Constructora Norte", tipo: "Hito", icon: CheckCircle2, color: "text-green-600 bg-green-100" },
]

// 4. Tus Datos Originales (EXISTENTES)
const casosRiesgo = [
  { id: 1, carátula: "Despido Pérez c/ Coca Cola", motivo: "Falta respuesta oficio correo", nivel: "Alto", diasTrabado: 45 },
  { id: 2, carátula: "Sucesión Gómez", motivo: "Cliente no presenta partida nacimiento", nivel: "Medio", diasTrabado: 20 },
]
const alertasDatos = [
  { tipo: "Clientes", mensaje: "3 Clientes registrados sin casos asignados", icon: UserX },
  { tipo: "Casos", mensaje: "5 Casos sin fecha de inicio o descripción", icon: FileWarning },
]
const seguimientoCasos = [
  { id: "CS-001", titulo: "Daños y Perjuicios Torres", cliente: "Miguel Torres", avance: 80, proxVencimiento: "2025-12-15", tarea: "Presentar Alegatos", estado: "En término" },
  { id: "CS-004", titulo: "Reclamo ART Pérez", cliente: "Juan Pérez", avance: 15, proxVencimiento: "2025-12-05", tarea: "Audiencia Médica", estado: "Urgente" },
  { id: "CS-012", titulo: "Defensa Penal Ruiz", cliente: "Sofia Ruiz", avance: 30, proxVencimiento: "2025-12-20", tarea: "Presentación Pruebas", estado: "En término" },
]

export default function SeguimientoPage() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-8 space-y-10"> {/* Aumenté espacio vertical */}
          
          {/* HEADER + VOLVER */}
          <div>
            <div className="mb-2">
                <Link href="/reportes">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 pl-0 gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Volver al Tablero Principal
                    </Button>
                </Link>
            </div>
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-3xl font-bold text-slate-800">Seguimiento y Control</h1>
                <p className="text-slate-500">Monitor de vencimientos, riesgos y calidad de datos.</p>
                </div>
                <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border">
                📅 Hoy: {new Date().toLocaleDateString()}
                </div>
            </div>
          </div>

          {/* 1. KPI SEMÁFORO (NUEVO) - Visión rápida de urgencia */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-red-500 shadow-sm">
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-red-600 uppercase">Vencen Hoy</p>
                  <p className="text-2xl font-bold text-slate-800">{resumenVencimientos.hoy}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-100" />
              </div>
            </Card>
            <Card className="border-l-4 border-l-orange-500 shadow-sm">
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-orange-600 uppercase">Esta Semana</p>
                  <p className="text-2xl font-bold text-slate-800">{resumenVencimientos.semana}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-100" />
              </div>
            </Card>
            <Card className="border-l-4 border-l-yellow-400 shadow-sm">
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-yellow-600 uppercase">Próximos 15 días</p>
                  <p className="text-2xl font-bold text-slate-800">{resumenVencimientos.quincena}</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-100" />
              </div>
            </Card>
          </div>

          {/* 2. ALERTAS DE DATOS (TUYO) - Calidad de información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alertasDatos.map((alerta, i) => (
              <Card key={i} className="bg-slate-50 border border-slate-200">
                <div className="p-3 flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg border text-slate-500">
                    <alerta.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{alerta.mensaje}</p>
                  </div>
                  <Link href={alerta.tipo === "Clientes" ? "/clientes" : "/casos"}>
                     <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 h-8 text-xs">Corregir</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* SEPARADOR VISUAL */}
          <hr className="border-slate-200" />

          {/* 3. PLANIFICACIÓN VISUAL (NUEVO) - Heatmap y Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Heatmap */}
            <div className="lg:col-span-1">
              <Card className="h-full shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Mapa de Calor (Mes)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1.5">
                    {['L','M','M','J','V','S','D'].map((d) => <div key={d} className="text-center text-[10px] text-slate-400">{d}</div>)}
                    {heatmapDays.map((d) => (
                      <div key={d.day} className={`aspect-square rounded text-[10px] flex items-center justify-center font-medium
                        ${d.intensity === 3 ? 'bg-red-500 text-white' : 
                          d.intensity === 2 ? 'bg-orange-300 text-orange-900' : 
                          d.intensity === 1 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-300'}`}>
                        {d.day}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline Horizontal (Simplificado para que entre bien) */}
            <div className="lg:col-span-2">
               <Card className="h-full shadow-sm">
                <CardHeader className="pb-3">
                   <CardTitle className="text-base">Próximos Hitos Clave</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                      {hitosTimeline.map((hito) => (
                         <div key={hito.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className={`p-2 rounded-full ${hito.color}`}>
                               <hito.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                               <p className="text-sm font-bold text-slate-800">{hito.titulo}</p>
                               <p className="text-xs text-slate-500">{hito.caso}</p>
                            </div>
                            <div className="text-right">
                               <span className="text-sm font-bold text-slate-600">{hito.fecha}</span>
                            </div>
                         </div>
                      ))}
                   </div>
                </CardContent>
               </Card>
            </div>
          </div>

          {/* SEPARADOR VISUAL */}
          <hr className="border-slate-200" />

          {/* 4. OPERATIVO DETALLADO (TUYO) - Trabas y Tabla */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Card Trabas */}
            <div className="lg:col-span-1">
              <Card className="h-full border-red-100 shadow-sm bg-red-50/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    <CardTitle className="text-lg">Casos Trabados</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {casosRiesgo.map((caso) => (
                    <div key={caso.id} className="p-3 bg-white rounded-lg border border-red-100 shadow-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-xs text-slate-700 truncate w-3/4">{caso.carátula}</span>
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded">{caso.diasTrabado}d</span>
                      </div>
                      <p className="text-xs text-slate-500">{caso.motivo}</p>
                    </div>
                  ))}
                   <Link href="/casos" className="block mt-2">
                    <Button variant="ghost" className="w-full text-slate-500 text-xs h-8">Ver todo</Button>
                   </Link>
                </CardContent>
              </Card>
            </div>

            {/* Tabla Detalle */}
            <div className="lg:col-span-2">
              <Card className="h-full shadow-sm">
                <CardHeader className="pb-2">
                   <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Agenda Detallada</CardTitle>
                      <div className="flex gap-2">
                         <Badge variant="danger">Urgente (1)</Badge>
                         <Badge variant="secondary">Esta semana (3)</Badge>
                      </div>
                   </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                          <th className="p-3 rounded-tl-lg">Caso</th>
                          <th className="p-3">Próximo Hito</th>
                          <th className="p-3">Vencimiento</th>
                          <th className="p-3">Avance</th>
                          <th className="p-3 rounded-tr-lg text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {seguimientoCasos.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <div className="font-medium text-slate-900">{row.titulo}</div>
                            </td>
                            <td className="p-3 text-slate-600 text-xs">{row.tarea}</td>
                            <td className="p-3 text-slate-600 text-xs">{row.proxVencimiento}</td>
                            <td className="p-3 w-24">
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${row.avance > 50 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${row.avance}%` }}></div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant={row.estado === 'Urgente' ? 'danger' : 'success'}>{row.estado}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}