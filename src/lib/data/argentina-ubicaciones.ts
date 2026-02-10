// src/lib/data/argentina-ubicaciones.ts
// Provincias y Departamentos de Argentina con coordenadas
// Para calcular distancias y selects en formularios

export interface Departamento {
  nombre: string
  cabecera?: string // Ciudad cabecera del departamento
  coordenadas: {
    lat: number
    lng: number
  }
}

export interface Provincia {
  id: string
  nombre: string
  coordenadas: {
    lat: number
    lng: number
  }
  departamentos: Departamento[]
}

// Coordenadas de referencia (Tribunales de Córdoba Capital)
export const ORIGEN_CORDOBA_CAPITAL = {
  lat: -31.4201,
  lng: -64.1888
}

// Función para calcular distancia en km (fórmula Haversine)
export function calcularDistanciaKm(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distanciaLineal = R * c
  
  // Multiplicamos por 1.3 para aproximar distancia por ruta
  return Math.round(distanciaLineal * 1.3)
}

// Función helper para obtener distancia desde Córdoba Capital
export function distanciaDesdeCordoba(lat: number, lng: number): number {
  return calcularDistanciaKm(
    ORIGEN_CORDOBA_CAPITAL.lat,
    ORIGEN_CORDOBA_CAPITAL.lng,
    lat,
    lng
  )
}

// Clasificar distancia
export function clasificarDistancia(km: number): {
  tipo: 'local' | 'cercano' | 'medio' | 'lejano'
  label: string
  color: string
} {
  if (km <= 10) return { tipo: 'local', label: 'Local', color: 'bg-green-100 text-green-700' }
  if (km <= 100) return { tipo: 'cercano', label: 'Cercano', color: 'bg-blue-100 text-blue-700' }
  if (km <= 400) return { tipo: 'medio', label: 'Media distancia', color: 'bg-amber-100 text-amber-700' }
  return { tipo: 'lejano', label: 'Larga distancia', color: 'bg-red-100 text-red-700' }
}

export const PROVINCIAS_ARGENTINA: Provincia[] = [
  {
    id: "caba",
    nombre: "Ciudad Autónoma de Buenos Aires",
    coordenadas: { lat: -34.6037, lng: -58.3816 },
    departamentos: [
      { nombre: "CABA", cabecera: "Ciudad de Buenos Aires", coordenadas: { lat: -34.6037, lng: -58.3816 } }
    ]
  },
  {
    id: "buenos_aires",
    nombre: "Buenos Aires",
    coordenadas: { lat: -34.9205, lng: -57.9536 },
    departamentos: [
      { nombre: "La Plata", cabecera: "La Plata", coordenadas: { lat: -34.9205, lng: -57.9536 } },
      { nombre: "Lomas de Zamora", cabecera: "Lomas de Zamora", coordenadas: { lat: -34.7592, lng: -58.4097 } },
      { nombre: "Quilmes", cabecera: "Quilmes", coordenadas: { lat: -34.7203, lng: -58.2635 } },
      { nombre: "Morón", cabecera: "Morón", coordenadas: { lat: -34.6534, lng: -58.6198 } },
      { nombre: "San Isidro", cabecera: "San Isidro", coordenadas: { lat: -34.4708, lng: -58.5299 } },
      { nombre: "San Martín", cabecera: "San Martín", coordenadas: { lat: -34.5756, lng: -58.5253 } },
      { nombre: "La Matanza", cabecera: "San Justo", coordenadas: { lat: -34.6788, lng: -58.5597 } },
      { nombre: "Mar del Plata", cabecera: "Mar del Plata", coordenadas: { lat: -38.0055, lng: -57.5426 } },
      { nombre: "Bahía Blanca", cabecera: "Bahía Blanca", coordenadas: { lat: -38.7196, lng: -62.2724 } },
      { nombre: "San Nicolás", cabecera: "San Nicolás de los Arroyos", coordenadas: { lat: -33.3378, lng: -60.2111 } },
      { nombre: "Pergamino", cabecera: "Pergamino", coordenadas: { lat: -33.8899, lng: -60.5705 } },
      { nombre: "Junín", cabecera: "Junín", coordenadas: { lat: -34.5883, lng: -60.9467 } },
      { nombre: "Tandil", cabecera: "Tandil", coordenadas: { lat: -37.3217, lng: -59.1332 } },
      { nombre: "Olavarría", cabecera: "Olavarría", coordenadas: { lat: -36.8927, lng: -60.3108 } },
      { nombre: "Azul", cabecera: "Azul", coordenadas: { lat: -36.7839, lng: -59.8511 } },
      { nombre: "Dolores", cabecera: "Dolores", coordenadas: { lat: -36.3132, lng: -57.6792 } },
      { nombre: "Mercedes", cabecera: "Mercedes", coordenadas: { lat: -34.6512, lng: -59.4307 } },
      { nombre: "San Pedro", cabecera: "San Pedro", coordenadas: { lat: -33.6799, lng: -59.6594 } },
      { nombre: "Zárate", cabecera: "Zárate", coordenadas: { lat: -34.0983, lng: -59.0286 } },
      { nombre: "Campana", cabecera: "Campana", coordenadas: { lat: -34.1686, lng: -58.9597 } }
    ]
  },
  {
    id: "catamarca",
    nombre: "Catamarca",
    coordenadas: { lat: -28.4696, lng: -65.7795 },
    departamentos: [
      { nombre: "Capital", cabecera: "San Fernando del Valle de Catamarca", coordenadas: { lat: -28.4696, lng: -65.7795 } },
      { nombre: "Andalgalá", cabecera: "Andalgalá", coordenadas: { lat: -27.6039, lng: -66.3178 } },
      { nombre: "Belén", cabecera: "Belén", coordenadas: { lat: -27.6492, lng: -67.0308 } },
      { nombre: "Tinogasta", cabecera: "Tinogasta", coordenadas: { lat: -28.0631, lng: -67.5636 } },
      { nombre: "Santa María", cabecera: "Santa María", coordenadas: { lat: -26.6836, lng: -66.0478 } }
    ]
  },
  {
    id: "chaco",
    nombre: "Chaco",
    coordenadas: { lat: -27.4514, lng: -58.9867 },
    departamentos: [
      { nombre: "San Fernando", cabecera: "Resistencia", coordenadas: { lat: -27.4514, lng: -58.9867 } },
      { nombre: "Comandante Fernández", cabecera: "Presidencia Roque Sáenz Peña", coordenadas: { lat: -26.7853, lng: -60.4389 } },
      { nombre: "General Güemes", cabecera: "Juan José Castelli", coordenadas: { lat: -25.9481, lng: -60.6228 } },
      { nombre: "Libertador General San Martín", cabecera: "General José de San Martín", coordenadas: { lat: -26.5378, lng: -59.3419 } },
      { nombre: "Chacabuco", cabecera: "Charata", coordenadas: { lat: -27.2167, lng: -61.1833 } }
    ]
  },
  {
    id: "chubut",
    nombre: "Chubut",
    coordenadas: { lat: -43.3002, lng: -65.1023 },
    departamentos: [
      { nombre: "Rawson", cabecera: "Rawson", coordenadas: { lat: -43.3002, lng: -65.1023 } },
      { nombre: "Biedma", cabecera: "Puerto Madryn", coordenadas: { lat: -42.7692, lng: -65.0385 } },
      { nombre: "Escalante", cabecera: "Comodoro Rivadavia", coordenadas: { lat: -45.8656, lng: -67.4997 } },
      { nombre: "Futaleufú", cabecera: "Esquel", coordenadas: { lat: -42.9117, lng: -71.3150 } },
      { nombre: "Cushamen", cabecera: "El Maitén", coordenadas: { lat: -42.0500, lng: -71.1667 } }
    ]
  },
  {
    id: "cordoba",
    nombre: "Córdoba",
    coordenadas: { lat: -31.4201, lng: -64.1888 },
    departamentos: [
      { nombre: "Capital", cabecera: "Córdoba", coordenadas: { lat: -31.4201, lng: -64.1888 } },
      { nombre: "Río Cuarto", cabecera: "Río Cuarto", coordenadas: { lat: -33.1307, lng: -64.3499 } },
      { nombre: "San Francisco", cabecera: "San Francisco", coordenadas: { lat: -31.4297, lng: -62.0828 } },
      { nombre: "Villa María", cabecera: "Villa María", coordenadas: { lat: -32.4103, lng: -63.2306 } },
      { nombre: "Río Tercero", cabecera: "Río Tercero", coordenadas: { lat: -32.1731, lng: -64.1142 } },
      { nombre: "Alta Gracia", cabecera: "Alta Gracia", coordenadas: { lat: -31.6600, lng: -64.4297 } },
      { nombre: "Carlos Paz", cabecera: "Villa Carlos Paz", coordenadas: { lat: -31.4241, lng: -64.4978 } },
      { nombre: "Bell Ville", cabecera: "Bell Ville", coordenadas: { lat: -32.6261, lng: -62.6847 } },
      { nombre: "Jesús María", cabecera: "Jesús María", coordenadas: { lat: -30.9833, lng: -64.0939 } },
      { nombre: "La Calera", cabecera: "La Calera", coordenadas: { lat: -31.3447, lng: -64.3350 } },
      { nombre: "Cruz del Eje", cabecera: "Cruz del Eje", coordenadas: { lat: -30.7264, lng: -64.8064 } },
      { nombre: "Deán Funes", cabecera: "Deán Funes", coordenadas: { lat: -30.4231, lng: -64.3497 } },
      { nombre: "Villa Dolores", cabecera: "Villa Dolores", coordenadas: { lat: -31.9456, lng: -65.1892 } },
      { nombre: "Laboulaye", cabecera: "Laboulaye", coordenadas: { lat: -34.1267, lng: -63.3917 } },
      { nombre: "Marcos Juárez", cabecera: "Marcos Juárez", coordenadas: { lat: -32.7000, lng: -62.1000 } },
      { nombre: "Cosquín", cabecera: "Cosquín", coordenadas: { lat: -31.2453, lng: -64.4664 } },
      { nombre: "Unquillo", cabecera: "Unquillo", coordenadas: { lat: -31.2319, lng: -64.3178 } },
      { nombre: "Río Segundo", cabecera: "Río Segundo", coordenadas: { lat: -31.6500, lng: -63.9167 } },
      { nombre: "Arroyito", cabecera: "Arroyito", coordenadas: { lat: -31.4167, lng: -63.0500 } },
      { nombre: "Morteros", cabecera: "Morteros", coordenadas: { lat: -30.7119, lng: -62.0047 } }
    ]
  },
  {
    id: "corrientes",
    nombre: "Corrientes",
    coordenadas: { lat: -27.4692, lng: -58.8306 },
    departamentos: [
      { nombre: "Capital", cabecera: "Corrientes", coordenadas: { lat: -27.4692, lng: -58.8306 } },
      { nombre: "Goya", cabecera: "Goya", coordenadas: { lat: -29.1400, lng: -59.2650 } },
      { nombre: "Paso de los Libres", cabecera: "Paso de los Libres", coordenadas: { lat: -29.7125, lng: -57.0875 } },
      { nombre: "Curuzú Cuatiá", cabecera: "Curuzú Cuatiá", coordenadas: { lat: -29.7917, lng: -58.0500 } },
      { nombre: "Mercedes", cabecera: "Mercedes", coordenadas: { lat: -29.1833, lng: -58.0833 } },
      { nombre: "Santo Tomé", cabecera: "Santo Tomé", coordenadas: { lat: -28.5500, lng: -56.0333 } }
    ]
  },
  {
    id: "entre_rios",
    nombre: "Entre Ríos",
    coordenadas: { lat: -31.7413, lng: -60.5115 },
    departamentos: [
      { nombre: "Paraná", cabecera: "Paraná", coordenadas: { lat: -31.7413, lng: -60.5115 } },
      { nombre: "Concordia", cabecera: "Concordia", coordenadas: { lat: -31.3928, lng: -58.0208 } },
      { nombre: "Gualeguaychú", cabecera: "Gualeguaychú", coordenadas: { lat: -33.0094, lng: -58.5172 } },
      { nombre: "Concepción del Uruguay", cabecera: "Concepción del Uruguay", coordenadas: { lat: -32.4825, lng: -58.2372 } },
      { nombre: "Gualeguay", cabecera: "Gualeguay", coordenadas: { lat: -33.1417, lng: -59.3097 } },
      { nombre: "Victoria", cabecera: "Victoria", coordenadas: { lat: -32.6183, lng: -60.1547 } },
      { nombre: "Villaguay", cabecera: "Villaguay", coordenadas: { lat: -31.8667, lng: -59.0167 } },
      { nombre: "La Paz", cabecera: "La Paz", coordenadas: { lat: -30.7500, lng: -59.6500 } }
    ]
  },
  {
    id: "formosa",
    nombre: "Formosa",
    coordenadas: { lat: -26.1849, lng: -58.1731 },
    departamentos: [
      { nombre: "Formosa", cabecera: "Formosa", coordenadas: { lat: -26.1849, lng: -58.1731 } },
      { nombre: "Pilcomayo", cabecera: "Clorinda", coordenadas: { lat: -25.2833, lng: -57.7167 } },
      { nombre: "Pirané", cabecera: "Pirané", coordenadas: { lat: -25.7333, lng: -59.1000 } },
      { nombre: "Patiño", cabecera: "Comandante Fontana", coordenadas: { lat: -25.3333, lng: -59.6833 } }
    ]
  },
  {
    id: "jujuy",
    nombre: "Jujuy",
    coordenadas: { lat: -24.1858, lng: -65.2995 },
    departamentos: [
      { nombre: "Dr. Manuel Belgrano", cabecera: "San Salvador de Jujuy", coordenadas: { lat: -24.1858, lng: -65.2995 } },
      { nombre: "Palpalá", cabecera: "Palpalá", coordenadas: { lat: -24.2564, lng: -65.2108 } },
      { nombre: "Ledesma", cabecera: "Libertador General San Martín", coordenadas: { lat: -23.8000, lng: -64.7833 } },
      { nombre: "San Pedro", cabecera: "San Pedro de Jujuy", coordenadas: { lat: -24.2333, lng: -64.8667 } },
      { nombre: "Humahuaca", cabecera: "Humahuaca", coordenadas: { lat: -23.2000, lng: -65.3500 } },
      { nombre: "Tilcara", cabecera: "Tilcara", coordenadas: { lat: -23.5833, lng: -65.3833 } }
    ]
  },
  {
    id: "la_pampa",
    nombre: "La Pampa",
    coordenadas: { lat: -36.6177, lng: -64.2856 },
    departamentos: [
      { nombre: "Capital", cabecera: "Santa Rosa", coordenadas: { lat: -36.6177, lng: -64.2856 } },
      { nombre: "Maracó", cabecera: "General Pico", coordenadas: { lat: -35.6667, lng: -63.7500 } },
      { nombre: "Realicó", cabecera: "Realicó", coordenadas: { lat: -35.0333, lng: -64.2500 } },
      { nombre: "Chapaleufú", cabecera: "Intendente Alvear", coordenadas: { lat: -35.2333, lng: -63.6000 } }
    ]
  },
  {
    id: "la_rioja",
    nombre: "La Rioja",
    coordenadas: { lat: -29.4131, lng: -66.8558 },
    departamentos: [
      { nombre: "Capital", cabecera: "La Rioja", coordenadas: { lat: -29.4131, lng: -66.8558 } },
      { nombre: "Chilecito", cabecera: "Chilecito", coordenadas: { lat: -29.1631, lng: -67.4947 } },
      { nombre: "Arauco", cabecera: "Aimogasta", coordenadas: { lat: -28.5500, lng: -66.8000 } },
      { nombre: "Chamical", cabecera: "Chamical", coordenadas: { lat: -30.3500, lng: -66.3167 } }
    ]
  },
  {
    id: "mendoza",
    nombre: "Mendoza",
    coordenadas: { lat: -32.8908, lng: -68.8272 },
    departamentos: [
      { nombre: "Capital", cabecera: "Mendoza", coordenadas: { lat: -32.8908, lng: -68.8272 } },
      { nombre: "Godoy Cruz", cabecera: "Godoy Cruz", coordenadas: { lat: -32.9167, lng: -68.8333 } },
      { nombre: "Guaymallén", cabecera: "Guaymallén", coordenadas: { lat: -32.9000, lng: -68.8167 } },
      { nombre: "Las Heras", cabecera: "Las Heras", coordenadas: { lat: -32.8500, lng: -68.8167 } },
      { nombre: "Luján de Cuyo", cabecera: "Luján de Cuyo", coordenadas: { lat: -33.0333, lng: -68.8667 } },
      { nombre: "Maipú", cabecera: "Maipú", coordenadas: { lat: -32.9833, lng: -68.7833 } },
      { nombre: "San Rafael", cabecera: "San Rafael", coordenadas: { lat: -34.6175, lng: -68.3353 } },
      { nombre: "San Martín", cabecera: "San Martín", coordenadas: { lat: -33.0833, lng: -68.4667 } },
      { nombre: "Tunuyán", cabecera: "Tunuyán", coordenadas: { lat: -33.5833, lng: -69.0167 } },
      { nombre: "Malargüe", cabecera: "Malargüe", coordenadas: { lat: -35.4667, lng: -69.5833 } }
    ]
  },
  {
    id: "misiones",
    nombre: "Misiones",
    coordenadas: { lat: -27.3671, lng: -55.8961 },
    departamentos: [
      { nombre: "Capital", cabecera: "Posadas", coordenadas: { lat: -27.3671, lng: -55.8961 } },
      { nombre: "Oberá", cabecera: "Oberá", coordenadas: { lat: -27.4833, lng: -55.1333 } },
      { nombre: "Eldorado", cabecera: "Eldorado", coordenadas: { lat: -26.4000, lng: -54.6333 } },
      { nombre: "Iguazú", cabecera: "Puerto Iguazú", coordenadas: { lat: -25.5994, lng: -54.5733 } },
      { nombre: "Apóstoles", cabecera: "Apóstoles", coordenadas: { lat: -27.9167, lng: -55.7500 } },
      { nombre: "Leandro N. Alem", cabecera: "Leandro N. Alem", coordenadas: { lat: -27.6000, lng: -55.3167 } }
    ]
  },
  {
    id: "neuquen",
    nombre: "Neuquén",
    coordenadas: { lat: -38.9516, lng: -68.0591 },
    departamentos: [
      { nombre: "Confluencia", cabecera: "Neuquén", coordenadas: { lat: -38.9516, lng: -68.0591 } },
      { nombre: "Zapala", cabecera: "Zapala", coordenadas: { lat: -38.9000, lng: -70.0667 } },
      { nombre: "Lácar", cabecera: "San Martín de los Andes", coordenadas: { lat: -40.1575, lng: -71.3522 } },
      { nombre: "Los Lagos", cabecera: "Villa La Angostura", coordenadas: { lat: -40.7619, lng: -71.6469 } },
      { nombre: "Cutral Có", cabecera: "Cutral Có", coordenadas: { lat: -38.9333, lng: -69.2333 } }
    ]
  },
  {
    id: "rio_negro",
    nombre: "Río Negro",
    coordenadas: { lat: -40.8135, lng: -63.0000 },
    departamentos: [
      { nombre: "Adolfo Alsina", cabecera: "Viedma", coordenadas: { lat: -40.8135, lng: -63.0000 } },
      { nombre: "General Roca", cabecera: "General Roca", coordenadas: { lat: -39.0333, lng: -67.5833 } },
      { nombre: "Bariloche", cabecera: "San Carlos de Bariloche", coordenadas: { lat: -41.1335, lng: -71.3103 } },
      { nombre: "Cipolletti", cabecera: "Cipolletti", coordenadas: { lat: -38.9333, lng: -67.9833 } },
      { nombre: "Allen", cabecera: "Allen", coordenadas: { lat: -38.9833, lng: -67.8333 } }
    ]
  },
  {
    id: "salta",
    nombre: "Salta",
    coordenadas: { lat: -24.7821, lng: -65.4232 },
    departamentos: [
      { nombre: "Capital", cabecera: "Salta", coordenadas: { lat: -24.7821, lng: -65.4232 } },
      { nombre: "Orán", cabecera: "San Ramón de la Nueva Orán", coordenadas: { lat: -23.1333, lng: -64.3333 } },
      { nombre: "General Güemes", cabecera: "General Güemes", coordenadas: { lat: -24.6667, lng: -65.0500 } },
      { nombre: "Metán", cabecera: "Metán", coordenadas: { lat: -25.5000, lng: -64.9667 } },
      { nombre: "Tartagal", cabecera: "Tartagal", coordenadas: { lat: -22.5167, lng: -63.8000 } },
      { nombre: "Cafayate", cabecera: "Cafayate", coordenadas: { lat: -26.0833, lng: -65.9833 } }
    ]
  },
  {
    id: "san_juan",
    nombre: "San Juan",
    coordenadas: { lat: -31.5375, lng: -68.5364 },
    departamentos: [
      { nombre: "Capital", cabecera: "San Juan", coordenadas: { lat: -31.5375, lng: -68.5364 } },
      { nombre: "Rawson", cabecera: "Villa Krause", coordenadas: { lat: -31.5333, lng: -68.5500 } },
      { nombre: "Rivadavia", cabecera: "Rivadavia", coordenadas: { lat: -31.5333, lng: -68.5833 } },
      { nombre: "Chimbas", cabecera: "Chimbas", coordenadas: { lat: -31.4833, lng: -68.5333 } },
      { nombre: "Santa Lucía", cabecera: "Santa Lucía", coordenadas: { lat: -31.5333, lng: -68.4833 } },
      { nombre: "Caucete", cabecera: "Caucete", coordenadas: { lat: -31.6500, lng: -68.2833 } }
    ]
  },
  {
    id: "san_luis",
    nombre: "San Luis",
    coordenadas: { lat: -33.3017, lng: -66.3378 },
    departamentos: [
      { nombre: "La Capital", cabecera: "San Luis", coordenadas: { lat: -33.3017, lng: -66.3378 } },
      { nombre: "General Pedernera", cabecera: "Villa Mercedes", coordenadas: { lat: -33.6833, lng: -65.4667 } },
      { nombre: "Junín", cabecera: "Merlo", coordenadas: { lat: -32.3500, lng: -65.0167 } },
      { nombre: "Chacabuco", cabecera: "Concarán", coordenadas: { lat: -32.5667, lng: -65.2500 } }
    ]
  },
  {
    id: "santa_cruz",
    nombre: "Santa Cruz",
    coordenadas: { lat: -51.6226, lng: -69.2181 },
    departamentos: [
      { nombre: "Güer Aike", cabecera: "Río Gallegos", coordenadas: { lat: -51.6226, lng: -69.2181 } },
      { nombre: "Deseado", cabecera: "Puerto Deseado", coordenadas: { lat: -47.7500, lng: -65.9000 } },
      { nombre: "Lago Argentino", cabecera: "El Calafate", coordenadas: { lat: -50.3403, lng: -72.2647 } },
      { nombre: "Corpen Aike", cabecera: "Puerto San Julián", coordenadas: { lat: -49.3000, lng: -67.7333 } }
    ]
  },
  {
    id: "santa_fe",
    nombre: "Santa Fe",
    coordenadas: { lat: -31.6333, lng: -60.7000 },
    departamentos: [
      { nombre: "La Capital", cabecera: "Santa Fe", coordenadas: { lat: -31.6333, lng: -60.7000 } },
      { nombre: "Rosario", cabecera: "Rosario", coordenadas: { lat: -32.9468, lng: -60.6393 } },
      { nombre: "General López", cabecera: "Venado Tuerto", coordenadas: { lat: -33.7500, lng: -61.9667 } },
      { nombre: "Castellanos", cabecera: "Rafaela", coordenadas: { lat: -31.2500, lng: -61.4833 } },
      { nombre: "Las Colonias", cabecera: "Esperanza", coordenadas: { lat: -31.4500, lng: -60.9333 } },
      { nombre: "San Lorenzo", cabecera: "San Lorenzo", coordenadas: { lat: -32.7500, lng: -60.7333 } },
      { nombre: "Constitución", cabecera: "Villa Constitución", coordenadas: { lat: -33.2333, lng: -60.3333 } },
      { nombre: "General Obligado", cabecera: "Reconquista", coordenadas: { lat: -29.1500, lng: -59.6500 } },
      { nombre: "San Cristóbal", cabecera: "San Cristóbal", coordenadas: { lat: -30.3167, lng: -61.2333 } },
      { nombre: "San Jerónimo", cabecera: "Coronda", coordenadas: { lat: -31.9667, lng: -60.9167 } }
    ]
  },
  {
    id: "santiago_del_estero",
    nombre: "Santiago del Estero",
    coordenadas: { lat: -27.7951, lng: -64.2615 },
    departamentos: [
      { nombre: "Capital", cabecera: "Santiago del Estero", coordenadas: { lat: -27.7951, lng: -64.2615 } },
      { nombre: "Banda", cabecera: "La Banda", coordenadas: { lat: -27.7333, lng: -64.2500 } },
      { nombre: "Robles", cabecera: "Fernández", coordenadas: { lat: -27.9167, lng: -63.9000 } },
      { nombre: "Río Hondo", cabecera: "Termas de Río Hondo", coordenadas: { lat: -27.4833, lng: -64.8500 } },
      { nombre: "General Taboada", cabecera: "Añatuya", coordenadas: { lat: -28.4667, lng: -62.8333 } },
      { nombre: "Moreno", cabecera: "Quimilí", coordenadas: { lat: -27.6333, lng: -62.4167 } }
    ]
  },
  {
    id: "tierra_del_fuego",
    nombre: "Tierra del Fuego",
    coordenadas: { lat: -54.8019, lng: -68.3030 },
    departamentos: [
      { nombre: "Ushuaia", cabecera: "Ushuaia", coordenadas: { lat: -54.8019, lng: -68.3030 } },
      { nombre: "Río Grande", cabecera: "Río Grande", coordenadas: { lat: -53.7878, lng: -67.7094 } },
      { nombre: "Tolhuin", cabecera: "Tolhuin", coordenadas: { lat: -54.5167, lng: -67.2000 } }
    ]
  },
  {
    id: "tucuman",
    nombre: "Tucumán",
    coordenadas: { lat: -26.8083, lng: -65.2176 },
    departamentos: [
      { nombre: "Capital", cabecera: "San Miguel de Tucumán", coordenadas: { lat: -26.8083, lng: -65.2176 } },
      { nombre: "Yerba Buena", cabecera: "Yerba Buena", coordenadas: { lat: -26.8167, lng: -65.3167 } },
      { nombre: "Tafí Viejo", cabecera: "Tafí Viejo", coordenadas: { lat: -26.7333, lng: -65.2667 } },
      { nombre: "Cruz Alta", cabecera: "Banda del Río Salí", coordenadas: { lat: -26.8500, lng: -65.1667 } },
      { nombre: "Monteros", cabecera: "Monteros", coordenadas: { lat: -27.1667, lng: -65.5000 } },
      { nombre: "Concepción", cabecera: "Concepción", coordenadas: { lat: -27.3333, lng: -65.5833 } },
      { nombre: "Lules", cabecera: "Lules", coordenadas: { lat: -26.9333, lng: -65.3500 } },
      { nombre: "Famaillá", cabecera: "Famaillá", coordenadas: { lat: -27.0500, lng: -65.4000 } }
    ]
  }
]

// Helper para obtener una provincia por ID
export function getProvinciaById(id: string): Provincia | undefined {
  return PROVINCIAS_ARGENTINA.find(p => p.id === id)
}

// Helper para obtener todos los departamentos de una provincia
export function getDepartamentosByProvincia(provinciaId: string): Departamento[] {
  const provincia = getProvinciaById(provinciaId)
  return provincia?.departamentos || []
}

// Helper para buscar ubicación y calcular distancia
export function buscarUbicacionConDistancia(
  provinciaId: string, 
  departamentoNombre: string
): { provincia: string; departamento: string; distanciaKm: number; clasificacion: ReturnType<typeof clasificarDistancia> } | null {
  const provincia = getProvinciaById(provinciaId)
  if (!provincia) return null
  
  const departamento = provincia.departamentos.find(
    d => d.nombre.toLowerCase() === departamentoNombre.toLowerCase()
  )
  if (!departamento) return null
  
  const distanciaKm = distanciaDesdeCordoba(
    departamento.coordenadas.lat, 
    departamento.coordenadas.lng
  )
  
  return {
    provincia: provincia.nombre,
    departamento: departamento.nombre,
    distanciaKm,
    clasificacion: clasificarDistancia(distanciaKm)
  }
}

// Obtener lista simple para selects
export function getProvinciasParaSelect(): { value: string; label: string }[] {
  return PROVINCIAS_ARGENTINA.map(p => ({
    value: p.id,
    label: p.nombre
  })).sort((a, b) => a.label.localeCompare(b.label))
}

export function getDepartamentosParaSelect(provinciaId: string): { value: string; label: string }[] {
  const departamentos = getDepartamentosByProvincia(provinciaId)
  return departamentos.map(d => ({
    value: d.nombre,
    label: d.cabecera ? `${d.nombre} (${d.cabecera})` : d.nombre
  })).sort((a, b) => a.label.localeCompare(b.label))
}