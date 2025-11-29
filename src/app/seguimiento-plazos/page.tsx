"use client"

import { useState } from "react"
import { Sidebar } from "../components/sidebar"
import { Header } from "../components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Clock, CheckCircle, ChevronRight, Calendar } from 'lucide-react'
import Link from "next/link"

// Datos de ejemplo para presentación
const PLAZOS_PROXIMOS = [
  {
    id: 1,
    casoNumero: "CASO-001-2024",
    titulo: "Demanda Laboral García López",
    plazo: "2025-01-15",
    diasRestantes: 3,
    prioridad: "alta",
    abogado: "Juan Martínez",
  },
  {
    id: 2,
    casoNumero: "CASO-002-2024",
    titulo: "Contrato Comercial Empresa ABC",
    plazo: "2025-01-20",
    diasRestantes: 8,
    prioridad: "media",
    abogado: "María Rodríguez",
  },
  {
    id: 3,
    casoNumero: "CASO-003-2024",
    titulo: "Resolución de Conflicto Civil",
    plazo: "2025-01-25",
    diasRestantes: 13,
    prioridad: "media",
    abogado: "Juan Martínez",
  },
]

const HITOS_IMPORTANTES = [
  {
    id: 1,
    tipo: "Audiencia",
    descripcion: "Primera audiencia - CASO-001-2024",
    fecha: "2025-01-15",
    estado: "pendiente",
  },
  {
    id: 2,
    tipo: "Presentación de Pruebas",
    descripcion: "Presentación de pruebas - CASO-002-2024",
    fecha: "2025-01-18",
    estado: "pendiente",
  },
  {
    id: 3,
    tipo: "Sentencia",
    descripcion: "Sentencia esperada - CASO-003-2024",
    fecha: "2025-01-25",
    estado: "pendiente",
  },
]

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export default function SeguimientoPlazosPage() {
  const [mesSeleccionado, setMesSeleccionado] = useState(0)

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return "border-l-4 border-red-500 bg-red-50"
      case "media":
        return "border-l-4 border-yellow-500 bg-yellow-50"
      case "baja":
        return "border-l-4 border-green-500 bg-green-50"
      default:
        return "border-l-4 border-gray-500 bg-gray-50"
    }
  }

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return "bg-red-100 text-red-800"
      case "media":
        return "bg-yellow-100 text-yellow-800"
      case "baja":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seguimiento y Plazos</h1>
              <p className="text-gray-600 mt-1">Gestiona los plazos y fechas importantes de tus casos</p>
            </div>

            {/* Alertas de Plazos Críticos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Plazos Críticos</p>
                      <p className="text-2xl font-bold text-red-700 mt-1">3</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">En Seguimiento</p>
                      <p className="text-2xl font-bold text-yellow-700 mt-1">7</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Completados</p>
                      <p className="text-2xl font-bold text-green-700 mt-1">12</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calendario y Plazos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendario Pequeño */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Calendario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <button className="p-1 hover:bg-gray-100 rounded">←</button>
                      <h3 className="font-semibold">{MESES[mesSeleccionado]} 2025</h3>
                      <button className="p-1 hover:bg-gray-100 rounded">→</button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {["L", "M", "M", "J", "V", "S", "D"].map((dia) => (
                        <div key={dia} className="py-2 font-semibold text-gray-600">
                          {dia}
                        </div>
                      ))}
                      {Array.from({ length: 31 }).map((_, i) => (
                        <button
                          key={i}
                          className={`py-2 rounded text-xs ${
                            i === 14 ? "bg-blue-500 text-white font-bold" : "hover:bg-gray-100"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium text-gray-600 mb-2">Eventos este mes:</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span>3 eventos críticos</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span>5 en seguimiento</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plazos Próximos */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Plazos Próximos</CardTitle>
                    <CardDescription>Los siguientes 30 días</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {PLAZOS_PROXIMOS.map((plazo) => (
                      <div key={plazo.id} className={`p-4 rounded-lg ${getPrioridadColor(plazo.prioridad)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-gray-600">{plazo.casoNumero}</span>
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPrioridadBadge(plazo.prioridad)}`}>
                                {plazo.prioridad.toUpperCase()}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mt-2">{plazo.titulo}</h3>
                            <p className="text-sm text-gray-600 mt-1">Abogado: {plazo.abogado}</p>
                            <div className="flex items-center gap-2 mt-2 text-sm">
                              <Calendar className="h-4 w-4" />
                              <span className="text-gray-700">
                                Vence: {new Date(plazo.plazo).toLocaleDateString("es-ES")}
                              </span>
                              <span className="text-gray-500">({plazo.diasRestantes} días)</span>
                            </div>
                          </div>
                          <Link href={`/casos/1`}>
                            <Button variant="outline" size="sm" className="mt-2">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabla de Hitos Importantes */}
            <Card>
              <CardHeader>
                <CardTitle>Hitos Importantes</CardTitle>
                <CardDescription>Eventos y fechas críticas de tus casos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Tipo</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Descripción</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Fecha</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Estado</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-900">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {HITOS_IMPORTANTES.map((hito) => (
                        <tr key={hito.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                              {hito.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{hito.descripcion}</td>
                          <td className="px-4 py-3 text-gray-700">{new Date(hito.fecha).toLocaleDateString("es-ES")}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                              {hito.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button variant="ghost" size="sm">
                              Ver más
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
