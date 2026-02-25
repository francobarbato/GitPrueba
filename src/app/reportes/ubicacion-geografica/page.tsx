// app/reportes/ubicacion-geografica/page.tsx
// Distribución de casos por ubicación geográfica

import React from "react"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { ArrowLeft, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

// Componentes
import { KPIsUbicacion } from "./components/KPIsUbicacion"
import { AcordeonZonas } from "./components/AcordeonZonas"
import { ToggleVista } from "./components/ToggleVista"
import { FiltrosGeografia } from "./components/FiltrosGeografia"
import { AlertaUrgentes } from "./components/Alertasurgentes"

import { 
  distanciaDesdeCordoba, 
  clasificarDistancia,
  PROVINCIAS_ARGENTINA 
} from "src/lib/data/argentina-ubicaciones"

// ============================================================================
// TIPOS
// ============================================================================

export type CasoUbicacion = {
  id: string
  numero: string
  titulo: string
  tipo: string
  estado: string
  juzgado: string | null
  clienteNombre: string
  abogadoNombre: string
  abogadoId: string
  ultimoMovimiento: Date
  priority: string
  esUrgente: boolean
}

export type JuzgadoAgrupado = {
  nombre: string
  casos: CasoUbicacion[]
  cantidadCasos: number
  urgentes: number
}

export type ZonaGeografica = {
  id: string
  ciudad: string
  provincia: string
  coordenadas: { lat: number; lng: number } | null
  distanciaKm: number
  clasificacionDistancia: {
    tipo: 'local' | 'cercano' | 'medio' | 'lejano'
    label: string
    color: string
  }
  juzgados: JuzgadoAgrupado[]
  totalCasos: number
  casosUrgentes: number
  casos: CasoUbicacion[]
}

export type KPIsData = {
  totalCasos: number
  ciudadesActivas: number
  casosUrgentes: number
  requierenViaje: number
  distanciaPromedio: number
}

// ============================================================================
// FUNCIONES DE DATOS
// ============================================================================

function extraerCiudadProvincia(fuero: string | null): { ciudad: string; provincia: string } {
  if (!fuero) return { ciudad: 'Sin Especificar', provincia: 'Sin Especificar' }
  
  const partes = fuero.split(',').map(p => p.trim())
  
  if (partes.length >= 2) {
    return { ciudad: partes[0], provincia: partes[1] }
  }
  
  return { ciudad: partes[0], provincia: 'Sin Especificar' }
}

const ALIAS_UBICACIONES: Record<string, { lat: number; lng: number }> = {
  'capital federal': { lat: -34.6037, lng: -58.3816 },
  'caba': { lat: -34.6037, lng: -58.3816 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 },
  'ciudad de buenos aires': { lat: -34.6037, lng: -58.3816 },
  'ciudad autonoma de buenos aires': { lat: -34.6037, lng: -58.3816 },
  'cordoba': { lat: -31.4201, lng: -64.1888 },
  'córdoba': { lat: -31.4201, lng: -64.1888 },
  'cordoba capital': { lat: -31.4201, lng: -64.1888 },
  'córdoba capital': { lat: -31.4201, lng: -64.1888 },
  'rosario': { lat: -32.9468, lng: -60.6393 },
  'mendoza': { lat: -32.8908, lng: -68.8272 },
  'tucuman': { lat: -26.8083, lng: -65.2176 },
  'tucumán': { lat: -26.8083, lng: -65.2176 },
  'san miguel de tucuman': { lat: -26.8083, lng: -65.2176 },
  'san miguel de tucumán': { lat: -26.8083, lng: -65.2176 },
  'santa fe': { lat: -31.6333, lng: -60.7000 },
  'la plata': { lat: -34.9205, lng: -57.9536 },
  'mar del plata': { lat: -38.0055, lng: -57.5426 },
  'salta': { lat: -24.7821, lng: -65.4232 },
  'neuquen': { lat: -38.9516, lng: -68.0591 },
  'neuquén': { lat: -38.9516, lng: -68.0591 },
  'rio cuarto': { lat: -33.1307, lng: -64.3499 },
  'río cuarto': { lat: -33.1307, lng: -64.3499 },
  'villa maria': { lat: -32.4103, lng: -63.2306 },
  'villa maría': { lat: -32.4103, lng: -63.2306 },
  'san francisco': { lat: -31.4297, lng: -62.0828 },
}

function buscarCoordenadasCiudad(ciudad: string, provincia: string): { lat: number; lng: number } | null {
  const ciudadNorm = ciudad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const provinciaNorm = provincia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const combinado = `${ciudadNorm} ${provinciaNorm}`.trim()
  
  if (ALIAS_UBICACIONES[ciudadNorm]) {
    return ALIAS_UBICACIONES[ciudadNorm]
  }
  
  if (ALIAS_UBICACIONES[combinado]) {
    return ALIAS_UBICACIONES[combinado]
  }
  
  for (const prov of PROVINCIAS_ARGENTINA) {
    const provNombre = prov.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    
    if (provNombre.includes(provinciaNorm) || provinciaNorm.includes(provNombre)) {
      for (const depto of prov.departamentos) {
        const deptoNombre = depto.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        const cabeceraName = depto.cabecera?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ''
        
        if (deptoNombre.includes(ciudadNorm) || 
            ciudadNorm.includes(deptoNombre) ||
            cabeceraName.includes(ciudadNorm) ||
            ciudadNorm.includes(cabeceraName)) {
          return depto.coordenadas
        }
      }
      return prov.coordenadas
    }
  }
  
  for (const prov of PROVINCIAS_ARGENTINA) {
    for (const depto of prov.departamentos) {
      const deptoNombre = depto.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      const cabeceraName = depto.cabecera?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ''
      
      if (deptoNombre === ciudadNorm || cabeceraName === ciudadNorm) {
        return depto.coordenadas
      }
    }
  }
  
  for (const prov of PROVINCIAS_ARGENTINA) {
    const provNombre = prov.nombre.toLowerCase()
    
    if (ciudadNorm.includes(provNombre) || provNombre.includes(ciudadNorm)) {
      return prov.coordenadas
    }
  }
  
  return null
}

async function obtenerCasosPorUbicacion(
  userId: string,
  userRol: string,
  filtroFuero: string,
  filtroEtapa: string,
  filtroAbogado: string
): Promise<{
  zonas: ZonaGeografica[]
  kpis: KPIsData
  casosUrgentesDetalle: {
    id: string
    titulo: string
    numero: string
    tipo: string
    ciudad: string
    distanciaKm: number
    clasificacion: string
  }[]
}> {
  // Determinar filtro según vista
  const whereClause: any = {
    estaCerrado: false,
    estado: { notIn: ['Cerrado', 'Archivado', 'CERRADO', 'ARCHIVADO'] }
  }

  // Admin y Asistente ven todos los casos; Abogado ve solo los suyos
  const esAdmin = userRol === 'ADMIN'
  const esAsistente = userRol === 'ASISTENTE'
  
  if (!esAdmin && !esAsistente) {
    whereClause.abogadoId = userId
  }

  // Filtro por abogado específico (cuando Admin o Asistente filtra)
  if (filtroAbogado !== 'todos') {
    whereClause.abogadoId = filtroAbogado
  }

  // Aplicar filtro de fuero a nivel de query
  if (filtroFuero !== 'todos') {
    whereClause.tipo = filtroFuero
  }

  // Aplicar filtro de etapa a nivel de query
  if (filtroEtapa !== 'todas') {
    whereClause.estado = filtroEtapa
  }

  // Obtener casos
  const casos = await prisma.caso.findMany({
    where: whereClause,
    include: {
      cliente: {
        select: { nombre: true, apellido: true }
      },
      abogado: {
        select: { id: true, nombre: true, apellido: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  // Agrupar por ciudad
  const zonasPorCiudad = new Map<string, {
    casos: CasoUbicacion[]
    provincia: string
  }>()

  const hoy = new Date()

  casos.forEach(caso => {
    const { ciudad, provincia } = extraerCiudadProvincia(caso.fuero)
    const key = `${ciudad}|${provincia}`

    if (!zonasPorCiudad.has(key)) {
      zonasPorCiudad.set(key, { casos: [], provincia })
    }

    const diasSinMovimiento = Math.floor((hoy.getTime() - caso.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
    const esUrgente = caso.priority === 'HIGH'

    const clienteNombre = caso.cliente 
      ? `${caso.cliente.nombre} ${caso.cliente.apellido || ''}`.trim()
      : 'Sin cliente'

    const abogadoNombre = caso.abogado
      ? `${caso.abogado.nombre || ''} ${caso.abogado.apellido || ''}`.trim()
      : 'Sin asignar'

    zonasPorCiudad.get(key)!.casos.push({
      id: caso.id,
      numero: caso.numero,
      titulo: caso.titulo,
      tipo: caso.tipo,
      estado: caso.estado,
      juzgado: caso.juzgado,
      clienteNombre,
      abogadoNombre,
      abogadoId: caso.abogado?.id || '',
      ultimoMovimiento: caso.updatedAt,
      priority: caso.priority,
      esUrgente
    })
  })

  // Construir zonas con datos completos
  const zonas: ZonaGeografica[] = []
  let totalDistancia = 0
  let zonasConDistancia = 0

  // Para el banner de urgentes
  const casosUrgentesDetalle: {
    id: string
    titulo: string
    numero: string
    tipo: string
    ciudad: string
    distanciaKm: number
    clasificacion: string
  }[] = []

  zonasPorCiudad.forEach((data, key) => {
    const [ciudad, provincia] = key.split('|')
    const coordenadas = buscarCoordenadasCiudad(ciudad, provincia)
    
    let distanciaKm = 0
    if (coordenadas) {
      distanciaKm = distanciaDesdeCordoba(coordenadas.lat, coordenadas.lng)
      totalDistancia += distanciaKm
      zonasConDistancia++
    }

    const clasificacion = clasificarDistancia(distanciaKm)

    // Recopilar urgentes para el banner
    data.casos
      .filter(c => c.esUrgente)
      .forEach(c => {
        casosUrgentesDetalle.push({
          id: c.id,
          titulo: c.titulo,
          numero: c.numero,
          tipo: c.tipo,
          ciudad,
          distanciaKm,
          clasificacion: clasificacion.label,
        })
      })

    // Agrupar casos por juzgado
    const juzgadosMap = new Map<string, CasoUbicacion[]>()
    data.casos.forEach(caso => {
      const juzgado = caso.juzgado || 'Sin Juzgado Especificado'
      if (!juzgadosMap.has(juzgado)) {
        juzgadosMap.set(juzgado, [])
      }
      juzgadosMap.get(juzgado)!.push(caso)
    })

    const juzgados: JuzgadoAgrupado[] = Array.from(juzgadosMap.entries())
      .map(([nombre, casos]) => ({
        nombre,
        casos,
        cantidadCasos: casos.length,
        urgentes: casos.filter(c => c.esUrgente).length
      }))
      .sort((a, b) => b.cantidadCasos - a.cantidadCasos)

    const casosUrgentes = data.casos.filter(c => c.esUrgente).length

    zonas.push({
      id: key,
      ciudad,
      provincia,
      coordenadas,
      distanciaKm,
      clasificacionDistancia: clasificacion,
      juzgados,
      totalCasos: data.casos.length,
      casosUrgentes,
      casos: data.casos
    })
  })

  // Ordenar zonas por prioridad logística:
  // 1. Zonas lejanas con urgentes primero (requieren planificar viaje)
  // 2. Zonas lejanas sin urgentes
  // 3. Zonas cercanas con urgentes
  // 4. Zonas cercanas sin urgentes
  // 5. Locales
  zonas.sort((a, b) => {
    const pesoA = getPesoLogistico(a)
    const pesoB = getPesoLogistico(b)
    if (pesoA !== pesoB) return pesoB - pesoA
    return b.totalCasos - a.totalCasos
  })

  // Ordenar urgentes: los más lejanos primero
  casosUrgentesDetalle.sort((a, b) => b.distanciaKm - a.distanciaKm)

  // Calcular KPIs
  const kpis: KPIsData = {
    totalCasos: casos.length,
    ciudadesActivas: zonas.length,
    casosUrgentes: casosUrgentesDetalle.length,
    requierenViaje: zonas.filter(z => z.clasificacionDistancia.tipo !== 'local').length,
    distanciaPromedio: zonasConDistancia > 0 ? Math.round(totalDistancia / zonasConDistancia) : 0
  }

  return { zonas, kpis, casosUrgentesDetalle }
}

function getPesoLogistico(zona: ZonaGeografica): number {
  let peso = 0
  // Distancia: más lejos = más peso (necesita más planificación)
  if (zona.clasificacionDistancia.tipo === 'lejano') peso += 100
  else if (zona.clasificacionDistancia.tipo === 'medio') peso += 60
  else if (zona.clasificacionDistancia.tipo === 'cercano') peso += 30

  // Urgentes suman peso
  peso += zona.casosUrgentes * 50

  // Más casos = más peso (justifica más el viaje)
  peso += zona.totalCasos * 5

  return peso
}

// Helper para verificar roles
const isAdmin = (rol: string) => rol?.toUpperCase() === 'ADMIN'
const isAbogado = (rol: string) => rol?.toUpperCase() === 'ABOGADO'
const isAsistente = (rol: string) => rol?.toUpperCase() === 'ASISTENTE'

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default async function UbicacionGeograficaPage({
  searchParams
}: {
  searchParams: { vista?: string; fuero?: string; etapa?: string; abogado?: string }
}) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const userRol = user.rol?.toUpperCase() || ''
  const esAdmin = isAdmin(userRol)
  const vistaGeneral = searchParams.vista === 'general' && esAdmin

  const filtroFuero = searchParams?.fuero || 'todos'
  const filtroEtapa = searchParams?.etapa || 'todas'
  const filtroAbogado = searchParams?.abogado || 'todos'

  // Obtener lista de abogados para el filtro (solo Admin y Asistente)
  let abogadosLista: { id: string; nombre: string }[] = []
  if (isAdmin(userRol) || isAsistente(userRol)) {
    const abogados = await prisma.user.findMany({
      where: { rol: 'ABOGADO', isActive: true },
      select: { id: true, nombre: true, apellido: true },
      orderBy: { nombre: 'asc' }
    })
    abogadosLista = abogados.map(a => ({
      id: a.id,
      nombre: `${a.nombre || ''} ${a.apellido || ''}`.trim()
    }))
  }

  const { zonas, kpis, casosUrgentesDetalle } = await obtenerCasosPorUbicacion(
    user.id, 
    userRol,
    filtroFuero,
    filtroEtapa,
    filtroAbogado
  )

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Link href="/reportes">
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-orange-500" />
                    Distribución de casos por ubicación geográfica
                  </h1>
                  <p className="text-sm text-slate-500">
                    Casos agrupados por ciudad y juzgado para organizar traslados y recorridas
                  </p>
                </div>
              </div>

              {/* Toggle Vista (solo Admin) */}
              {esAdmin && (
                <ToggleVista vistaActual={vistaGeneral ? 'general' : 'personal'} />
              )}
            </div>

            {/* Filtros */}
            <div className="mb-6">
              <FiltrosGeografia 
                abogados={abogadosLista}
                mostrarFiltroAbogado={isAdmin(userRol) || isAsistente(userRol)}
              />
            </div>

            {/* Banner de Urgentes — visible para todos, con iconos accesibles */}
            <AlertaUrgentes
              casosUrgentes={casosUrgentesDetalle}
              totalCasos={kpis.totalCasos}
            />

            {/* KPIs — solo Admin y Abogado (no Asistente) */}
            {(isAdmin(userRol) || isAbogado(userRol)) && (
              <KPIsUbicacion data={kpis} />
            )}

            {/* Acordeón de Zonas */}
            {zonas.length > 0 ? (
              <AcordeonZonas 
                zonas={zonas} 
                vistaGeneral={vistaGeneral}
              />
            ) : (
              <div className="mt-8 p-12 bg-white border border-slate-200 rounded-lg text-center">
                <MapPin className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">
                  No hay casos activos con ubicación
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {filtroFuero !== 'todos' || filtroEtapa !== 'todas'
                    ? 'Probá cambiando los filtros para ver más resultados.'
                    : 'Los casos se agruparán automáticamente por ciudad cuando tengan el campo "Fuero" completado.'
                  }
                </p>
              </div>
            )}

            {/* Nota informativa */}
            <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-600">
                <strong>Nota:</strong> Las distancias se calculan desde Tribunales de Córdoba Capital. 
                Clasificación: Local (0-10km), Cercano (10-100km), Media distancia (100-400km), Larga distancia (+400km).
                Las zonas se ordenan por prioridad logística: primero las más lejanas con casos urgentes.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}