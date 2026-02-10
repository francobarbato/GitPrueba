import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, FileText, FolderOpen, CheckCircle2, Search, Activity, User } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge" // Agregamos Badge para los filtros
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { getHistorialGlobal, getProductividadSemanal } from "@/lib/aplication/services/bitacora.service";
// import { BitacoraService } from "../../../../lib/aplication/services/bitacora.service"
// import { getBitacora } from "@/lib/aplication/services/bitacora.service";



export default async function TrazabilidadPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const user = await getUserSessionServer();
  if (!user) redirect("/api/auth/signin");
  
  const esAdmin = user.rol === 'admin';
  const query = searchParams?.q || "";

  // 2. USAMOS LAS FUNCIONES DIRECTAMENTE
  const [historial, productividad] = await Promise.all([
    getHistorialGlobal(user.id, esAdmin, query), // Llamada directa sin 'bitacoraService.'
    getProductividadSemanal()                   // Llamada directa sin 'bitacoraService.'
  ]);

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'caso': return <FolderOpen className="w-4 h-4" />
      case 'doc': return <FileText className="w-4 h-4" />
      case 'estado': return <CheckCircle2 className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-8 space-y-6">
          
          <div className="flex items-center gap-4 mb-4">
            <Link href="/reportes">
                <Button variant="ghost" size="sm" className="text-slate-500 pl-0">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Bitácora de Auditoría</h1>
                <p className="text-slate-500 text-sm">Historial de movimientos y trazabilidad de acciones.</p>
            </div>
          </div>

          {/* KPI PRODUCTIVIDAD (Corregido el error de nombre) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {productividad.length > 0 ? productividad.map((p, i) => (
                <Card key={i} className="shadow-sm border-slate-200">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                            {p.nombre.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">{p.nombre}</p>
                            <p className="text-xs text-slate-500">
                                <span className="text-blue-600 font-semibold">{p.acciones} acciones</span> esta semana
                            </p>
                        </div>
                    </CardContent>
                </Card>
             )) : (
                <div className="col-span-3 p-4 border border-dashed rounded text-center text-slate-400 text-sm">
                    No hay actividad registrada esta semana.
                </div>
             )}
          </div>

          <Card className="shadow-sm border-slate-200 min-h-[500px]">
            <CardHeader className="border-b pb-0">
                <Tabs defaultValue="global" className="w-full">
                    
                    {/* BARRA DE HERRAMIENTAS (Tabs + Buscador) */}
                    <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                        <TabsList>
                            <TabsTrigger value="global">Actividad Global</TabsTrigger>
                            <TabsTrigger value="caso">Por Caso (Línea de Tiempo)</TabsTrigger>
                        </TabsList>
                        
                        <div className="flex flex-col items-end gap-2">
                            {/* Buscador Funcional */}
                            <div className="relative w-64">
                                <form>
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input 
                                        name="q" 
                                        placeholder="Buscar usuario, caso..." 
                                        className="pl-8 h-9" 
                                        defaultValue={query}
                                    />
                                </form>
                            </div>
                            
                            {/* Filtros Rápidos (Chips) */}
                            <div className="flex gap-2">
                                <Link href="/reportes/trazabilidad"><Badge variant="outline" className="cursor-pointer hover:bg-slate-100 font-normal text-xs">Todo</Badge></Link>
                                <Link href="/reportes/trazabilidad?q=CREÓ"><Badge variant="outline" className="cursor-pointer hover:bg-blue-50 text-blue-600 border-blue-200 font-normal text-xs">Creaciones</Badge></Link>
                                <Link href="/reportes/trazabilidad?q=CASO"><Badge variant="outline" className="cursor-pointer hover:bg-purple-50 text-purple-600 border-purple-200 font-normal text-xs">Casos</Badge></Link>
                            </div>
                        </div>
                    </div>

                    <TabsContent value="global" className="mt-0 p-6">
                        <div className="space-y-8 relative before:absolute before:left-9 before:top-8 before:bottom-8 before:w-0.5 before:bg-slate-200">
                            {historial.length === 0 ? (
                                <div className="text-center py-10 pl-8">
                                    <p className="text-slate-500 font-medium">No se encontraron resultados.</p>
                                    <p className="text-slate-400 text-sm">Intenta con otro término de búsqueda.</p>
                                </div>
                            ) : (
                                historial.map((item) => (
                                <div key={item.id} className="relative flex items-start gap-6 group">
                                    
                                    <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm 
                                        ${item.tipo === 'sistema' ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-600'}
                                    `}>
                                        {getIcon(item.tipo)}
                                    </div>

                                    <div className="flex-1 rounded-lg border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
                                                    {item.accion}
                                                </span>
                                                <span className="font-medium text-slate-800">
                                                    {item.detalle}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-400 whitespace-nowrap">{item.fecha}</span>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                            <User className="w-3 h-3" />
                                            Realizado por: <span className="font-medium text-slate-700">{item.usuario}</span>
                                        </div>
                                    </div>
                                </div>
                            )))}
                        </div>
                    </TabsContent>

                    <TabsContent value="caso" className="p-12 text-center">
                        <div className="max-w-md mx-auto border-2 border-dashed border-slate-200 rounded-xl p-8">
                            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-700">Seleccione un Caso</h3>
                            <p className="text-slate-500 text-sm mt-2">
                                Busque un expediente para ver su historia clínica completa.
                            </p>
                            <Button className="mt-4 bg-slate-800 text-white">Buscar Expediente</Button>
                        </div>
                    </TabsContent>

                </Tabs>
            </CardHeader>
          </Card>

        </main>
      </div>
    </div>
  )
}