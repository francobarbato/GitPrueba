"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button" 
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

const TIPOS_CASO = ["laboral", "civil", "comercial", "familia", "penal"]
const ESTADOS_CASO = ["abierto", "en_proceso", "cerrado", "archivado"]

interface EditarCasoPageProps {
  params: {
    id: string
  }
}

export default function EditarCasoPage({ params }: EditarCasoPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    numero: "",
    titulo: "",
    descripcion: "",
    tipo: "",
    estado: "",
    porcentajeAvance: 0,
    fechaInicio: "",
    fechaCierre: "",
    abogadoId: "",
    clienteId: "",
  })

useEffect(() => {
  const cargarCaso = async () => {
    try {
      console.log("Cargando caso con ID:", params.id) // Debug
      
      const response = await fetch(`/api/casos/${params.id}`)
      const result = await response.json()

      console.log("Respuesta de la API:", result) // Debug

      if (result.success) {
        const caso = result.data
        console.log("Datos del caso:", caso) // Debug
        
        setFormData({
          numero: caso.numero || "",
          titulo: caso.titulo || "",
          descripcion: caso.descripcion || "",
          tipo: caso.tipo || "",
          estado: caso.estado || "",
          porcentajeAvance: caso.porcentajeAvance || 0,
          fechaInicio: caso.fechaInicio ? new Date(caso.fechaInicio).toISOString().split("T")[0] : "",
          fechaCierre: caso.fechaCierre ? new Date(caso.fechaCierre).toISOString().split("T")[0] : "",
          abogadoId: caso.abogadoId ? caso.abogadoId.toString() : "",
          clienteId: caso.clienteId ? caso.clienteId.toString() : "",
        })
      } else {
        console.error("Error en la respuesta:", result.error)
        alert("Error al cargar el caso")
      }
    } catch (error) {
      console.error("Error al cargar caso:", error)
      alert("Error al cargar el caso")
    } finally {
      setLoadingData(false)
    }
  }

  cargarCaso()
}, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/casos/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          porcentajeAvance: Number(formData.porcentajeAvance),
          abogadoId: Number(formData.abogadoId),
          clienteId: Number(formData.clienteId),
          fechaCierre: formData.fechaCierre || null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert("Caso actualizado exitosamente")
        router.push("/casos")
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error al actualizar caso:", error)
      alert("Error al actualizar el caso")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
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
          <span className="ml-2">Cargando caso...</span>
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
        <h1 className="text-2xl font-bold">Editar Caso #{formData.numero}</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Caso</CardTitle>
          <CardDescription>Modifique los datos del caso</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Número de Caso</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleChange("numero", e.target.value)}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="porcentajeAvance">Porcentaje de Avance (%)</Label>
                <Input
                  id="porcentajeAvance"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.porcentajeAvance}
                  onChange={(e) => handleChange("porcentajeAvance", Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="titulo">Título del Caso</Label>
              <Input id="titulo" value={formData.titulo} onChange={(e) => handleChange("titulo", e.target.value)} />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleChange("descripcion", e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo de Caso</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleChange("tipo", value)}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => handleChange("fechaInicio", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fechaCierre">Fecha de Cierre</Label>
                <Input
                  id="fechaCierre"
                  type="date"
                  value={formData.fechaCierre}
                  onChange={(e) => handleChange("fechaCierre", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Guardando..." : "Actualizar Caso"}
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
