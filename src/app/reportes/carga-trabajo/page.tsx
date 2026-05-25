// app/reportes/matriz-trabajo/page.tsx
// REPORTE: Matriz de Trabajo
// VISTA: Todos ven datos globales. Admin tiene botón Reasignar, Abogado no.

import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { differenceInDays, subDays, startOfMonth } from "date-fns"
import { ArrowLeft, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

// Componentes
import { KPICards } from "./components/KPICards"
import { MatrizCargaEquipo } from "./components/MatrizCargaEquipo"
import { CasosProblematicos } from "./components/CasosProblematicos"

// ============================================================================
// TIPOS
// ============================================================================

export type KPIData = {
  cargaTotal: number
  enDemora: number
  eficiencia: number
  altaPrioridad: number
}

export type AbogadoCarga = {
  id: string
  nombre: string
  email: string
  avatar?: string | null
  cargaTotal: number       // Casos activos asignados
  casosDormidos: number    // Sin movimiento en 15 días
  cerradosMes: number      // Cerrados en últimos 30 días
  estado: 'Disponible' | 'Activo' | 'Saturado'
  // Solo visible para Admin
  casosDetalle?: {
    id: string
    numero: string
    titulo: string
    diasInactivo: number
  }[]
}

export type CasoProblematico = {
  id: string
  numero: string
  titulo: string
  abogadoNombre: string
  abogadoId: string
  diasInactivo: number
  ultimaAccion: Date
}

// ============================================================================
// FUNCIONES DE DATOS
// ============================================================================

async function getKPIs(): Promise<KPIData> {
  // KPIs siempre globales para todos los roles
  const hoy = new Date()
  const hace45Dias = subDays(hoy, 45)
  const inicioMes = startOfMonth(hoy)

  const casosActivos = await prisma.caso.count({
    where: {
      estaCerrado: false,
      estado: { notIn: ['Cerrado', 'Archivado', 'CERRADO', 'ARCHIVADO'] }
    }
  })

  const casosEnDemora = await prisma.caso.count({
    where: {
      estaCerrado: false,
      estado: { notIn: ['Cerrado', 'Archivado', 'CERRADO', 'ARCHIVADO'] },
      updatedAt: { lt: hace45Dias }
    }
  })

  const cerradosEsteMes = await prisma.caso.count({
    where: {
      estaCerrado: true,
      fechaCierre: { gte: inicioMes }
    }
  })

  const eficiencia = casosActivos > 0 
    ? Math.round((cerradosEsteMes / casosActivos) * 100) 
    : 0

  const altaPrioridad = await prisma.caso.count({
    where: {
      estaCerrado: false,
      estado: { notIn: ['Cerrado', 'Archivado', 'CERRADO', 'ARCHIVADO'] },
      priority: 'HIGH'
    }
  })

  return {
    cargaTotal: casosActivos,
    enDemora: casosEnDemora,
    eficiencia,
    altaPrioridad
  }
}

async function getMatrizCargaEquipo(esAdmin: boolean): Promise<AbogadoCarga[]> {
  const hoy = new Date()
  const hace15Dias = subDays(hoy, 15)
  const hace30Dias = subDays(hoy, 30)

  const abogados = await prisma.user.findMany({
    where: { 
      rol: 'ABOGADO', 
      isActive: true 
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      image: true,
      casos: {
        select: {
          id: true,
          numero: true,
          titulo: true,
          estado: true,
          estaCerrado: true,
          updatedAt: true,
          fechaCierre: true
        }
      }
    }
  })

  return abogados.map(abogado => {
    const casosActivos = abogado.casos.filter(c => 
      !c.estaCerrado && 
      !['Cerrado', 'Archivado', 'CERRADO', 'ARCHIVADO'].includes(c.estado)
    )

    const casosDormidos = casosActivos.filter(c => 
      c.updatedAt < hace15Dias
    ).length

    const cerradosMes = abogado.casos.filter(c => 
      c.estaCerrado && 
      c.fechaCierre && 
      c.fechaCierre >= hace30Dias
    ).length

    let estado: 'Disponible' | 'Activo' | 'Saturado' = 'Disponible'
    
    if (casosActivos.length > 15 || casosDormidos > 5) {
      estado = 'Saturado'
    } else if (casosActivos.length > 8 || casosDormidos > 2) {
      estado = 'Activo'
    }

    const nombreCompleto = abogado.nombre && abogado.apellido
      ? `${abogado.nombre} ${abogado.apellido}`
      : abogado.nombre || abogado.email.split('@')[0]

    const casosDetalle = esAdmin ? casosActivos.map(c => ({
      id: c.id,
      numero: c.numero,
      titulo: c.titulo,
      diasInactivo: differenceInDays(hoy, c.updatedAt)
    })) : undefined

    return {
      id: abogado.id,
      nombre: nombreCompleto,
      email: abogado.email,
      avatar: abogado.image,
      cargaTotal: casosActivos.length,
      casosDormidos,
      cerradosMes,
      estado,
      casosDetalle
    }
  }).sort((a, b) => b.cargaTotal - a.cargaTotal)
}

async function getCasosProblematicos(): Promise<CasoProblematico[]> {
  const hoy = new Date()
  const hace45Dias = subDays(hoy, 45)

  const casos = await prisma.caso.findMany({
    where: {
      estaCerrado: false,
      estado: { notIn: ['Cerrado', 'Archivado', 'CERRADO', 'ARCHIVADO'] },
      updatedAt: { lt: hace45Dias }
    },
    include: {
      abogado: {
        select: {
          id: true,
          nombre: true,
          apellido: true
        }
      }
    },
    orderBy: {
      updatedAt: 'asc'
    },
    take: 15
  })

  return casos.map(caso => {
    const diasInactivo = differenceInDays(hoy, caso.updatedAt)
    const nombreAbogado = caso.abogado.nombre && caso.abogado.apellido
      ? `${caso.abogado.nombre} ${caso.abogado.apellido}`
      : 'Sin asignar'

    return {
      id: caso.id,
      numero: caso.numero,
      titulo: caso.titulo,
      abogadoNombre: nombreAbogado,
      abogadoId: caso.abogado.id,
      diasInactivo,
      ultimaAccion: caso.updatedAt
    }
  })
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default async function MatrizTrabajoPage() {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const esAdmin = user.rol?.toUpperCase() === 'ADMIN'

  // Todos ven KPIs globales, matriz del equipo y casos problemáticos
  const [kpis, matrizEquipo, casosProblematicos] = await Promise.all([
    getKPIs(),
    getMatrizCargaEquipo(esAdmin),
    getCasosProblematicos()
  ])

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Link href="/reportes">
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-indigo-600" />
                    Matriz de trabajo
                  </h1>
                  <p className="text-sm text-slate-500">
                    Visión general de carga y eficiencia del equipo
                  </p>
                </div>
              </div>

              <span className="text-xs font-medium px-3 py-1.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                Vista General
              </span>
            </div>

            {/* SECCIÓN 1: KPIs (siempre globales) */}
            <KPICards data={kpis} esAdmin={true} />

            {/* SECCIÓN 2: Matriz de Carga del Equipo */}
            {matrizEquipo.length > 0 && (
              <MatrizCargaEquipo data={matrizEquipo} esAdmin={esAdmin} />
            )}

            {/* SECCIÓN 3: Casos Problemáticos (todos ven, pero solo Admin puede Reasignar) */}
            {casosProblematicos.length > 0 && (
              <CasosProblematicos data={casosProblematicos} esAdmin={esAdmin} />
            )}

            {/* Mensaje si no hay casos problemáticos */}
            {casosProblematicos.length === 0 && (
              <div className="mt-6 p-6 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <p className="text-emerald-700 font-medium">
                  ✓ No hay casos problemáticos detectados
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  Todos los casos tienen actividad reciente (menos de 45 días)
                </p>
              </div>
            )}

            {/* Nota informativa */}
            <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-600">
                <strong>Criterios del reporte:</strong>{' '}
                Caso inactivo = sin movimiento en 15+ días | 
                Caso problemático = sin movimiento en 45+ días | 
                Eficiencia = casos cerrados este mes / casos activos | 
                <strong> Estado:</strong> Disponible (&lt;8 casos), Activo (8-15 casos), Saturado (&gt;15 casos o muchos inactivos)
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}