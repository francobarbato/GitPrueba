'use client'

import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { Checkbox } from "@/components/ui/checkbox" // Usaremos input nativo si no tienes el componente
import { Label } from "@/components/ui/label"
import { ArrowLeft, Search, FileText, Download, User, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function FichaDigitalPage() {
  const [busqueda, setBusqueda] = useState("")
  const [seleccionado, setSeleccionado] = useState<any>(null)
  
  // Estado de los checkboxes
  const [config, setConfig] = useState({
    datosContacto: true,
    historialMovimientos: true,
    honorarios: false, // Sensible por defecto false
    documentosAdjuntos: false
  })

  // Mock de búsqueda
  const handleBuscar = () => {
    if (busqueda) {
      setSeleccionado({
        nombre: "Juan Pérez",
        expediente: "EXP-2023-001",
        tipo: "Laboral",
        estado: "En Proceso",
        abogado: "Hernán Azar"
      })
    }
  }

  const handleExportar = () => {
    alert("Generando PDF con la configuración seleccionada...")
    // Aquí iría la llamada a la librería de PDF
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full space-y-8">
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/reportes">
                <Button variant="ghost" size="sm" className="text-slate-500 pl-0">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button>
            </Link>
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Generador de Legajo Digital</h1>
                <p className="text-slate-500">Crea resúmenes en PDF limpios para presentar a socios o juzgados.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMNA 1: BÚSQUEDA Y CONFIGURACIÓN */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Paso 1: Buscar */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">1. Buscar Expediente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Apellido o Nro Caso..." 
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                            <Button size="icon" onClick={handleBuscar} className="bg-slate-800"><Search className="w-4 h-4" /></Button>
                        </div>
                        {seleccionado && (
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                                <p className="font-bold text-blue-900">{seleccionado.nombre}</p>
                                <p className="text-blue-700">{seleccionado.expediente}</p>
                                <p className="text-xs text-blue-500 mt-1">{seleccionado.tipo} • {seleccionado.estado}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Paso 2: Configurar (Checkboxes) */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">2. Configurar Reporte</CardTitle>
                        <CardDescription>Selecciona qué información incluir.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        
                        <div className="flex items-center space-x-2">
                            <input 
                                type="checkbox" id="c1" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                checked={config.datosContacto}
                                onChange={(e) => setConfig({...config, datosContacto: e.target.checked})} 
                            />
                            <Label htmlFor="c1">Datos de Contacto</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input 
                                type="checkbox" id="c2" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                checked={config.historialMovimientos}
                                onChange={(e) => setConfig({...config, historialMovimientos: e.target.checked})} 
                            />
                            <Label htmlFor="c2">Historial de Movimientos</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input 
                                type="checkbox" id="c4" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                checked={config.documentosAdjuntos}
                                onChange={(e) => setConfig({...config, documentosAdjuntos: e.target.checked})} 
                            />
                            <Label htmlFor="c4">Listado de Documentos</Label>
                        </div>

                        <div className="pt-2 border-t">
                            <div className="flex items-center space-x-2 p-2 bg-red-50 rounded border border-red-100">
                                <input 
                                    type="checkbox" id="c3" className="rounded border-red-300 text-red-600 focus:ring-red-500"
                                    checked={config.honorarios}
                                    onChange={(e) => setConfig({...config, honorarios: e.target.checked})} 
                                />
                                <Label htmlFor="c3" className="text-red-700 font-medium flex items-center gap-2">
                                    <ShieldAlert className="w-3 h-3" /> Incluir Honorarios
                                </Label>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" 
                    disabled={!seleccionado}
                    onClick={handleExportar}
                >
                    <Download className="w-4 h-4 mr-2" /> Generar PDF
                </Button>

            </div>

            {/* COLUMNA 2: PREVISUALIZACIÓN */}
            <div className="lg:col-span-2">
                <Card className="h-full border-slate-200 shadow-sm bg-slate-100/50 flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-500" /> Previsualización del Documento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-8 flex items-center justify-center">
                        
                        {/* Hoja A4 Simulada */}
                        <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl border border-slate-200 p-12 relative scale-75 origin-top">
                            
                            {seleccionado ? (
                                <div className="space-y-8">
                                    {/* Encabezado PDF */}
                                    <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-end">
                                        <div>
                                            <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-widest">Ficha de Caso</h2>
                                            <p className="text-slate-500 text-sm mt-1">Estudio Jurídico Azar & Asociados</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">EXP: {seleccionado.expediente}</p>
                                            <p className="text-xs text-slate-400">{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {/* Cuerpo Dinámico */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Información General</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <p><span className="font-semibold">Cliente:</span> {seleccionado.nombre}</p>
                                                <p><span className="font-semibold">Abogado:</span> {seleccionado.abogado}</p>
                                                <p><span className="font-semibold">Fuero:</span> {seleccionado.tipo}</p>
                                                <p><span className="font-semibold">Estado:</span> {seleccionado.estado}</p>
                                            </div>
                                        </div>

                                        {config.datosContacto && (
                                            <div className="p-4 bg-slate-50 rounded border border-slate-100">
                                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Contacto</h3>
                                                <p className="text-sm">Email: cliente@email.com | Tel: +54 9 351...</p>
                                            </div>
                                        )}

                                        {config.historialMovimientos && (
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Últimos Movimientos</h3>
                                                <ul className="text-sm space-y-2 border-l-2 border-slate-200 pl-4">
                                                    <li className="text-slate-600"><span className="font-bold text-slate-800">01/12/2025</span> - Cambio de estado a En Proceso</li>
                                                    <li className="text-slate-600"><span className="font-bold text-slate-800">28/11/2025</span> - Documento cargado por Hernán Azar</li>
                                                </ul>
                                            </div>
                                        )}

                                        {config.honorarios && (
                                            <div className="p-4 bg-red-50 border border-red-100 rounded text-red-900 text-sm">
                                                <h3 className="font-bold uppercase mb-1">Información Confidencial</h3>
                                                <p>Honorarios Pactados: $ 500.000</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer PDF */}
                                    <div className="absolute bottom-12 left-12 right-12 border-t pt-4 text-center text-xs text-slate-300">
                                        Documento generado automáticamente por el sistema de gestión interna.
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                    <Search className="w-16 h-16 mb-4 opacity-20" />
                                    <p>Seleccione un caso para previsualizar</p>
                                </div>
                            )}

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