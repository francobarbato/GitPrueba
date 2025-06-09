"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

const TIPOS_CASO = ["laboral", "civil", "comercial", "familia", "penal"]
const ESTADOS_CASO = ["abierto", "en_proceso", "cerrado", "archivado"]

// Agregar interfaces de tipos
interface Abogado {
  id: number
  nombre: string
  apellido: string
}

interface Cliente {
  id: number
  nombre: string
  apellido: string
}

export default function NuevoCasoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [abogados, setAbogados] = useState<Abogado[]>([]) // Tipado correcto
  const [clientes, setClientes] = useState<Cliente[]>([]) // Tipado correcto
  const [formData, setFormData] = useState({
    numero: "",
    titulo: "",
    descripcion: "",
    tipo: "",
    estado: "abierto",
    fechaInicio: new Date().toISOString().split("T")[0],
    abogadoId: "",
    clienteId: "",
  })

  // Cargar abogados y clientes
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Datos de prueba con tipado correcto
        setAbogados([
          { id: 2, nombre: "Maria", apellido: "Gonzalez" },
          { id: 3, nombre: "Juan", apellido: "Martinez" },
          { id: 4, nombre: "Carlos", apellido: "Lopez" }
        ])
        
        setClientes([
          { id: 5, nombre: "Pedro", apellido: "Garcia" },
          { id: 6, nombre: "Ana", apellido: "Lopez" },
          { id: 7, nombre: "Maria", apellido: "Rodriguez" },
          { id: 8, nombre: "Luis", apellido: "Fernandez" }
        ])
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setLoadingData(false)
      }
    }

    cargarDatos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Formatear fechas correctamente
      const dataToSend = {
        ...formData,
        fechaInicio: new Date(formData.fechaInicio).toISOString(),
        abogadoId: Number(formData.abogadoId),
        clienteId: Number(formData.clienteId)
      }

      const response = await fetch("/api/casos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })

      const result = await response.json()

      if (result.success) {
        alert("Caso creado exitosamente")
        router.push("/casos")
      } else {
        alert(`Error: ${result.error || result.details || "Error desconocido"}`)
      }
    } catch (error) {
      console.error("Error al crear caso:", error)
      alert("Error al crear el caso")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (loadingData) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando datos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Caso</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Caso</CardTitle>
          <CardDescription>Complete los datos para crear un nuevo caso</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Número de Caso *</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleChange("numero", e.target.value)}
                  placeholder="Ej: CASO-2024-001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => handleChange("fechaInicio", e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="titulo">Título del Caso *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleChange("titulo", e.target.value)}
                placeholder="Título descriptivo del caso"
                required
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleChange("descripcion", e.target.value)}
                placeholder="Descripción detallada del caso"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo de Caso *</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleChange("tipo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CASO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select value={formData.estado} onValueChange={(value) => handleChange("estado", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CASO.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado.replace("_", " ").charAt(0).toUpperCase() + estado.replace("_", " ").slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="abogadoId">Abogado Asignado *</Label>
                <Select value={formData.abogadoId} onValueChange={(value) => handleChange("abogadoId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar abogado" />
                  </SelectTrigger>
                  <SelectContent>
                    {abogados.map((abogado) => (
                      <SelectItem key={abogado.id} value={abogado.id.toString()}>
                        {abogado.nombre} {abogado.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="clienteId">Cliente *</Label>
                <Select value={formData.clienteId} onValueChange={(value) => handleChange("clienteId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id.toString()}>
                        {cliente.nombre} {cliente.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Guardando..." : "Crear Caso"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}