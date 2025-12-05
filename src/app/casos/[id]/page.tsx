import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect, notFound } from "next/navigation"
import { CasoService } from "@/lib/aplication/services/caso.service"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { Star, Flame } from "lucide-react" // IMPORTANTE: Agregamos estos íconos

const casoService = new CasoService()

export default async function CasoDetailPage({ params }: { params: { id: string } }) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  // Obtener caso directo de la BD
  const caso = await casoService.getCasoById(params.id)

  if (!caso) return notFound()

  // SEGURIDAD: Verificar que el caso pertenezca al abogado (o sea admin)
  const esAdmin = user.rol === 'admin'
  const esPropietario = caso.abogadoId === user.id

  if (!esAdmin && !esPropietario) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div className="text-5xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acceso Restringido</h1>
          <p className="text-slate-600 mb-6">No tienes permisos para visualizar este expediente legal.</p>
          <Link 
            href="/casos" 
            className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            Volver a mis casos
          </Link>
        </div>
      </div>
    )
  }

  // Si pasa, renderizamos la vista de detalle
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header />
            <div className="flex-1 overflow-auto p-6">
                
                {/* Header del Caso */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        {/* TÍTULO Y BADGES */}
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            
                            {/* 1. VISUALIZACIÓN DE FAVORITO */}
                            {caso.isFavorite && (
                                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400 shrink-0" />
                            )}

                            <h2 className="text-2xl font-bold text-slate-900">{caso.titulo}</h2>
                            
                            {/* Badge de Estado */}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border
                                ${caso.estado === 'Abierto' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}
                            `}>
                                {caso.estado}
                            </span>

                            {/* 2. VISUALIZACIÓN DE PRIORIDAD ALTA */}
                            {caso.priority === 'HIGH' && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                                    <Flame className="h-3 w-3" /> URGENTE
                                </span>
                            )}
                        </div>

                        <p className="text-slate-500 flex items-center gap-2 mt-1">
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600">
                                {caso.numero}
                            </span>
                            <span className="text-sm">• {caso.tipo}</span>
                        </p>
                    </div>
                    
                    <div className="flex gap-3">
                        <Link
                            href={`/casos/${params.id}/editar`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            ✏️ Editar
                        </Link>
                        <button className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                            📄 Nuevo Documento
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    
                    {/* Panel Izquierdo - Info Principal */}
                    <div className="col-span-2 space-y-6">
                        
                        {/* Descripción */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Descripción del Caso</h3>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {caso.descripcion || "No se ha proporcionado una descripción detallada para este caso."}
                            </p>
                        </div>

                        {/* Cliente Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Información del Cliente</h3>
                            {/* @ts-ignore: Propiedad del include */}
                            {caso.cliente ? (
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                        {/* @ts-ignore */}
                                        {caso.cliente.nombre?.[0] || 'C'}
                                    </div>
                                    <div>
                                        {/* @ts-ignore */}
                                        <h4 className="text-base font-medium text-slate-900">{caso.cliente.nombre} {caso.cliente.apellido}</h4>
                                        <div className="mt-1 space-y-1">
                                            {/* @ts-ignore */}
                                            <p className="text-sm text-slate-500 flex items-center gap-2">📧 {caso.cliente.email || 'Sin email'}</p>
                                            {/* @ts-ignore */}
                                            <p className="text-sm text-slate-500 flex items-center gap-2">📱 {caso.cliente.telefono || 'Sin teléfono'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">No hay cliente asignado.</p>
                            )}
                        </div>
                    </div>

                    {/* Panel Derecho - Metadatos */}
                    <div className="space-y-6">
                        
                        {/* Fechas */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Fechas Clave</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Fecha de Inicio</p>
                                    <p className="text-sm font-medium text-slate-900">
                                        {new Date(caso.fechaInicio).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">Última Actualización</p>
                                    <p className="text-sm font-medium text-slate-900">
                                        {new Date(caso.updatedAt).toLocaleDateString('es-ES')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Progreso */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-end mb-2">
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Avance</h3>
                                <span className="text-2xl font-bold text-blue-600">{caso.porcentajeAvance}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1">
                                <div 
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${caso.porcentajeAvance}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-slate-400 text-right">Completado</p>
                        </div>

                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  )
}