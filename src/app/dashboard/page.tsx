"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Users, FileText, TrendingUp, PieChart } from "lucide-react"

interface ResumenData {
  totalCasos: number
  casosAbiertos: number
  casosEnProceso: number
  casosCerrados: number
  promedioAvance: number
}

interface CasosPorAbogado {
  abogadoId: number
  nombre: string
  apellido: string
  totalCasos: number
  casosPorTipo: { tipo: string; cantidad: number }[]
}

export default function DashboardPage() {
  const [resumen, setResumen] = useState<ResumenData | null>(null)
  const [casosPorAbogado, setCasosPorAbogado] = useState<CasosPorAbogado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar resumen general
        const resumenResponse = await fetch("/api/reportes?tipo=resumen")
        const resumenResult = await resumenResponse.json()

        if (resumenResult.success) {
          setResumen(resumenResult.data)
        }

        // Cargar casos por abogado
        const abogadosResponse = await fetch("/api/reportes?tipo=casos-por-abogado")
        const abogadosResult = await abogadosResponse.json()

        if (abogadosResult.success) {
          setCasosPorAbogado(abogadosResult.data)
        }
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard - Reportes</h1>

      {/* Resumen General */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Casos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumen.totalCasos}</div>
              <p className="text-xs text-muted-foreground">Casos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Casos Abiertos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resumen.casosAbiertos}</div>
              <p className="text-xs text-muted-foreground">Casos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
              <BarChart3 className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{resumen.casosEnProceso}</div>
              <p className="text-xs text-muted-foreground">En desarrollo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio Avance</CardTitle>
              <PieChart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{resumen.promedioAvance}%</div>
              <p className="text-xs text-muted-foreground">Progreso general</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Casos por Abogado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Casos por Abogado
            </CardTitle>
            <CardDescription>Distribución de casos por abogado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {casosPorAbogado.map((abogado) => (
                <div key={abogado.abogadoId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {abogado.nombre} {abogado.apellido}
                    </div>
                    <div className="text-sm text-gray-500">{abogado.totalCasos} casos asignados</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{abogado.totalCasos}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribución por Estado
            </CardTitle>
            <CardDescription>Estado actual de los casos</CardDescription>
          </CardHeader>
          <CardContent>
            {resumen && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Abiertos</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(resumen.casosAbiertos / resumen.totalCasos) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{resumen.casosAbiertos}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>En Proceso</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${(resumen.casosEnProceso / resumen.totalCasos) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{resumen.casosEnProceso}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cerrados</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(resumen.casosCerrados / resumen.totalCasos) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{resumen.casosCerrados}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
