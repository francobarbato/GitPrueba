
import React from "react"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { 
  ArrowLeft, 
  MapPin, 
  Car, 
  Briefcase, 
  ChevronRight, 
  Navigation,
  AlertTriangle,
  Clock,
  FileText
} from "lucide-react"

interface ZonaLogistica {
  nombre: string
  tipo: string
  estado: string
  pendientes: number
  casos: any[]
  color: string
  badge: string
  distanciaAprox: string
  urgentes: number
  proximaAudiencia: Date | null
}

async function obtenerLogisticaCasos(userId: string, esAdmin: boolean) {
  // Obtener casos activos (no cerrados)
  const casos = await prisma.caso.findMany({
    where: esAdmin ? {
      estado: { not: 'CERRADO' }
    } : {
      abogadoId: userId,
      estado: { not: 'CERRADO' }
    },
    include: {
      cliente: true,
      tareas: {
        where: {
          completada: false
        },
        orderBy: {
          fecha: 'asc'
        }
      }
    }
  })

  // Agrupar por fuero (zona geográfica)
  const zonasPorFuero = new Map<string, any[]>()
  
  casos.forEach(caso => {
    const fuero = caso.fuero || 'Sin Especificar'
    if (!zonasPorFuero.has(fuero)) {
      zonasPorFuero.set(fuero, [])
    }
    zonasPorFuero.get(fuero)!.push(caso)
  })

  // Transformar a formato de zonas con lógica de clasificación
  const zonas: ZonaLogistica[] = Array.from(zonasPorFuero.entries()).map(([fuero, casosFuero]) => {
    const cantidadCasos = casosFuero.length
    
    // Contar casos con tareas urgentes (próximas 7 días)
    const hoy = new Date()
    const en7Dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const urgentes = casosFuero.filter(caso => 
      caso.tareas.some((t: any) => {
        if (!t.fecha) return false
        const fechaTarea = new Date(t.fecha)
        return fechaTarea >= hoy && fechaTarea <= en7Dias
      })
    ).length

    // Encontrar próxima audiencia/vencimiento
    let proximaAudiencia: Date | null = null
    casosFuero.forEach(caso => {
      caso.tareas.forEach((tarea: any) => {
        if (tarea.fecha) {
          const fechaTarea = new Date(tarea.fecha)
          if (!proximaAudiencia || fechaTarea < proximaAudiencia) {
            proximaAudiencia = fechaTarea
          }
        }
      })
    })

    // Clasificar estado según cantidad y urgencia
    let estado = 'Sin Actividad'
    let color = 'border-l-slate-300'
    let badge = 'bg-slate-100 text-slate-500'
    
    if (cantidadCasos === 0) {
      estado = 'Sin Actividad'
    } else if (urgentes >= 3 || (urgentes > 0 && cantidadCasos >= 10)) {
      estado = 'Crítico'
      color = 'border-l-red-500'
      badge = 'bg-red-100 text-red-700'
    } else if (cantidadCasos >= 5 || urgentes > 0) {
      estado = 'Activo'
      color = 'border-l-orange-500'
      badge = 'bg-orange-100 text-orange-700'
    } else {
      estado = 'Baja Actividad'
      color = 'border-l-green-500'
      badge = 'bg-green-100 text-green-700'
    }

    // Determinar tipo (Centro o Interior) basado en keywords comunes
    const esCentro = fuero.toLowerCase().includes('capital') || 
                     fuero.toLowerCase().includes('centro') ||
                     fuero.toLowerCase().includes('tribunales i') ||
                     fuero === 'Sin Especificar'
    
    const tipo = esCentro ? 'Centro' : 'Interior (Viaje)'

    // Estimar distancia (mock - en producción usar API de mapas)
    const distanciaAprox = esCentro ? '1-3 km' : '20-80 km'

    return {
      nombre: fuero,
      tipo,
      estado,
      pendientes: cantidadCasos,
      casos: casosFuero,
      color,
      badge,
      distanciaAprox,
      urgentes,
      proximaAudiencia
    }
  })

  // Ordenar por estado (Crítico > Activo > Baja > Sin)
  const ordenEstado: Record<string, number> = {
    'Crítico': 0,
    'Activo': 1,
    'Baja Actividad': 2,
    'Sin Actividad': 3
  }

  return zonas.sort((a, b) => {
    const ordenA = ordenEstado[a.estado] ?? 99
    const ordenB = ordenEstado[b.estado] ?? 99
    if (ordenA !== ordenB) return ordenA - ordenB
    return b.pendientes - a.pendientes
  })
}

function generarAccionSugerida(zona: ZonaLogistica): string {
  if (zona.pendientes === 0) {
    return 'Ninguna acción requerida'
  }

  if (zona.estado === 'Crítico') {
    if (zona.tipo.includes('Viaje')) {
      return `Coordinar visita urgente (${zona.urgentes} caso${zona.urgentes > 1 ? 's' : ''} con vencimiento próximo)`
    }
    return `Procurar masivamente (${zona.urgentes} urgente${zona.urgentes > 1 ? 's' : ''})`
  }

  if (zona.estado === 'Activo') {
    if (zona.proximaAudiencia) {
      const dias = Math.ceil((zona.proximaAudiencia.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return `Preparar audiencia en ${dias} día${dias > 1 ? 's' : ''}`
    }
    if (zona.tipo.includes('Viaje')) {
      return `Agendar visita (${zona.pendientes} expediente${zona.pendientes > 1 ? 's' : ''})`
    }
    return `Revisar estado de ${zona.pendientes} caso${zona.pendientes > 1 ? 's' : ''}`
  }

  if (zona.tipo.includes('Viaje')) {
    return 'Enviar escritos digitalmente (Evitar viaje)'
  }

  return `Monitorear ${zona.pendientes} caso${zona.pendientes > 1 ? 's' : ''}`
}

export default async function LogisticaPage() {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const zonas = await obtenerLogisticaCasos(user.id, user.rol === 'admin')

  // Calcular totales
  const totalCasos = zonas.reduce((sum, z) => sum + z.pendientes, 0)
  const zonasActivas = zonas.filter(z => z.pendientes > 0).length
  const casosUrgentes = zonas.reduce((sum, z) => sum + z.urgentes, 0)

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/reportes" className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="text-orange-500" /> Logística Judicial
                </h1>
                <p className="text-sm text-slate-500">Planificación inteligente de traslados y procuración.</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                <span className="text-slate-500">Total: </span>
                <span className="font-bold text-slate-900">{totalCasos} casos</span>
              </div>
              <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm">
                <span className="text-red-600 font-bold">{casosUrgentes} urgentes</span>
              </div>
            </div>
          </div>

          {zonas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <MapPin className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-600">No hay casos activos por zona</p>
              <p className="text-sm text-slate-400 mt-2">Los casos se agruparán automáticamente por fuero</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {zonas.map((zona, idx) => (
                <div 
                  key={idx} 
                  className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 ${zona.color} flex flex-col justify-between h-full transition-transform hover:-translate-y-1 hover:shadow-md`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                        {zona.tipo.includes("Viaje") ? <Car size={20} /> : <Briefcase size={20} />}
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${zona.badge}`}>
                        {zona.estado}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{zona.nombre}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
                      <span>{zona.tipo}</span>
                      <span>•</span>
                      <span>{zona.distanciaAprox}</span>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Pendientes en zona</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-bold text-slate-800">{zona.pendientes}</p>
                        <span className="text-sm font-medium text-slate-500">expedientes</span>
                      </div>
                      {zona.urgentes > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-red-600">
                          <AlertTriangle size={12} />
                          <span className="text-xs font-semibold">{zona.urgentes} urgente{zona.urgentes > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {zona.proximaAudiencia && (
                      <div className="mb-3 flex items-center gap-2 text-xs text-slate-600 bg-blue-50 p-2 rounded border border-blue-100">
                        <Clock size={14} className="text-blue-600" />
                        <span>
                          Próximo vencimiento: {new Date(zona.proximaAudiencia).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    )}

                    <div className="mb-2">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Acción Sugerida</p>
                      <p className="text-sm text-slate-700 font-medium bg-yellow-50 p-2 rounded border border-yellow-100 inline-block w-full">
                        {generarAccionSugerida(zona)}
                      </p>
                    </div>
                  </div>

                  <Link 
                    href={`/reportes/logistica/${encodeURIComponent(zona.nombre)}`}
                    className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 font-medium text-sm group hover:text-blue-700 cursor-pointer"
                  >
                    <span>Ver {zona.pendientes} caso{zona.pendientes !== 1 ? 's' : ''}</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Resumen Operativo */}
          {zonas.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <MapPin size={16} />
                  <span className="text-xs font-semibold uppercase">Zonas Activas</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{zonasActivas}</p>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Car size={16} />
                  <span className="text-xs font-semibold uppercase">Requieren Viaje</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {zonas.filter(z => z.tipo.includes('Viaje') && z.pendientes > 0).length}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <FileText size={16} />
                  <span className="text-xs font-semibold uppercase">Total Casos</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{totalCasos}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}