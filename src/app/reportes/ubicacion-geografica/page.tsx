// app/reportes/ubicacion-geografica/page.tsx
// TAC-07: Casos por Ubicación Geográfica

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
  
  // Intentar parsear formatos comunes: "Ciudad, Provincia" o "Ciudad"
  const partes = fuero.split(',').map(p => p.trim())
  
  if (partes.length >= 2) {
    return { ciudad: partes[0], provincia: partes[1] }
  }
  
  return { ciudad: partes[0], provincia: 'Sin Especificar' }
}

// Alias comunes para ciudades/provincias
const ALIAS_UBICACIONES: Record<string, { lat: number; lng: number }> = {
  // Capital Federal / CABA
  'capital federal': { lat: -34.6037, lng: -58.3816 },
  'caba': { lat: -34.6037, lng: -58.3816 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 },
  'ciudad de buenos aires': { lat: -34.6037, lng: -58.3816 },
  'ciudad autonoma de buenos aires': { lat: -34.6037, lng: -58.3816 },
  
  // Córdoba
  'cordoba': { lat: -31.4201, lng: -64.1888 },
  'córdoba': { lat: -31.4201, lng: -64.1888 },
  'cordoba capital': { lat: -31.4201, lng: -64.1888 },
  'córdoba capital': { lat: -31.4201, lng: -64.1888 },
  
  // Rosario
  'rosario': { lat: -32.9468, lng: -60.6393 },
  
  // Mendoza
  'mendoza': { lat: -32.8908, lng: -68.8272 },
  
  // Tucumán
  'tucuman': { lat: -26.8083, lng: -65.2176 },
  'tucumán': { lat: -26.8083, lng: -65.2176 },
  'san miguel de tucuman': { lat: -26.8083, lng: -65.2176 },
  'san miguel de tucumán': { lat: -26.8083, lng: -65.2176 },
  
  // Santa Fe
  'santa fe': { lat: -31.6333, lng: -60.7000 },
  
  // La Plata
  'la plata': { lat: -34.9205, lng: -57.9536 },
  
  // Mar del Plata
  'mar del plata': { lat: -38.0055, lng: -57.5426 },
  
  // Salta
  'salta': { lat: -24.7821, lng: -65.4232 },
  
  // Neuquén
  'neuquen': { lat: -38.9516, lng: -68.0591 },
  'neuquén': { lat: -38.9516, lng: -68.0591 },
  
  // Río Cuarto
  'rio cuarto': { lat: -33.1307, lng: -64.3499 },
  'río cuarto': { lat: -33.1307, lng: -64.3499 },
  
  // Villa María
  'villa maria': { lat: -32.4103, lng: -63.2306 },
  'villa maría': { lat: -32.4103, lng: -63.2306 },
  
  // San Francisco (Córdoba)
  'san francisco': { lat: -31.4297, lng: -62.0828 },
}

function buscarCoordenadasCiudad(ciudad: string, provincia: string): { lat: number; lng: number } | null {
  // Normalizar texto para búsqueda
  const ciudadNorm = ciudad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const provinciaNorm = provincia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const combinado = `${ciudadNorm} ${provinciaNorm}`.trim()
  
  // 1. Primero buscar en alias comunes
  if (ALIAS_UBICACIONES[ciudadNorm]) {
    return ALIAS_UBICACIONES[ciudadNorm]
  }
  
  // Buscar combinaciones
  if (ALIAS_UBICACIONES[combinado]) {
    return ALIAS_UBICACIONES[combinado]
  }
  
  // 2. Buscar en el JSON de provincias
  for (const prov of PROVINCIAS_ARGENTINA) {
    const provNombre = prov.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    
    // Verificar si coincide la provincia
    if (provNombre.includes(provinciaNorm) || provinciaNorm.includes(provNombre)) {
      // Buscar el departamento/ciudad
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
      // Si no encontramos el departamento, usar coordenadas de la provincia
      return prov.coordenadas
    }
  }
  
  // 3. Búsqueda por ciudad sin provincia (en todos los departamentos)
  for (const prov of PROVINCIAS_ARGENTINA) {
    for (const depto of prov.departamentos) {
      const deptoNombre = depto.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      const cabeceraName = depto.cabecera?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ''
      
      if (deptoNombre === ciudadNorm || cabeceraName === ciudadNorm) {
        return depto.coordenadas
      }
    }
  }
  
  // 4. Búsqueda parcial más flexible
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
  esAdmin: boolean,
  vistaGeneral: boolean
): Promise<{
  zonas: ZonaGeografica[]
  kpis: KPIsData
}> {
  // Determinar filtro según vista
  const whereClause: any = {
    estaCerrado: false,
    estado: { notIn: ['Cerrado', 'Archivado', 'CERRADO', 'ARCHIVADO'] }
  }

  if (!esAdmin || !vistaGeneral) {
    whereClause.abogadoId = userId
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

    // Determinar si es urgente (caso HIGH priority o sin movimiento hace tiempo)
    const diasSinMovimiento = Math.floor((hoy.getTime() - caso.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
    const esUrgente = caso.priority === 'HIGH' || diasSinMovimiento > 30

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

  // Ordenar zonas: primero por urgentes, luego por cantidad de casos
  zonas.sort((a, b) => {
    if (b.casosUrgentes !== a.casosUrgentes) {
      return b.casosUrgentes - a.casosUrgentes
    }
    return b.totalCasos - a.totalCasos
  })

  // Calcular KPIs
  const kpis: KPIsData = {
    totalCasos: casos.length,
    ciudadesActivas: zonas.length,
    casosUrgentes: zonas.reduce((sum, z) => sum + z.casosUrgentes, 0),
    requierenViaje: zonas.filter(z => z.clasificacionDistancia.tipo !== 'local').length,
    distanciaPromedio: zonasConDistancia > 0 ? Math.round(totalDistancia / zonasConDistancia) : 0
  }

  return { zonas, kpis }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default async function UbicacionGeograficaPage({
  searchParams
}: {
  searchParams: { vista?: string }
}) {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  const esAdmin = user.rol?.toUpperCase() === 'ADMIN'
  const vistaGeneral = searchParams.vista === 'general' && esAdmin

  const { zonas, kpis } = await obtenerCasosPorUbicacion(user.id, esAdmin, vistaGeneral)

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
                    <MapPin className="h-6 w-6 text-orange-500" />
                    Casos por Ubicación Geográfica
                  </h1>
                  <p className="text-sm text-slate-500">
                    Distribución de expedientes por ciudad y juzgado
                  </p>
                </div>
              </div>

              {/* Toggle Vista (solo Admin) */}
              {esAdmin && (
                <ToggleVista vistaActual={vistaGeneral ? 'general' : 'personal'} />
              )}
            </div>

            {/* KPIs */}
            <KPIsUbicacion data={kpis} />

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
                  Los casos se agruparán automáticamente por ciudad cuando tengan el campo "Fuero" completado
                </p>
              </div>
            )}

            {/* Nota informativa */}
            <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-600">
                <strong>Nota:</strong> Las distancias se calculan desde Tribunales de Córdoba Capital. 
                Clasificación: Local (0-10km), Cercano (10-100km), Media distancia (100-400km), Larga distancia (+400km).
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
