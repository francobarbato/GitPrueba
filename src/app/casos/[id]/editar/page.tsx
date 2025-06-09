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
  const [error, setError] = useState<string | null>(null)
  const [casoId, setCasoId] = useState<number | null>(null)
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

  // Función para formatear fecha para input date
  const formatearFechaParaInput = (fecha: string | null | undefined): string => {
    if (!fecha) return ""
    try {
      const date = new Date(fecha)
      return date.toISOString().split("T")[0]
    } catch (error) {
      console.error("Error al formatear fecha:", fecha, error)
      return ""
    }
  }

  // Validar ID al cargar el componente
  useEffect(() => {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      setError(`ID inválido: ${params.id}`)
      setLoadingData(false)
      return
    }

    setCasoId(id)
    cargarCaso(id)
  }, [params.id])

  // Función para cargar el caso
  const cargarCaso = async (id: number) => {
    try {
      setLoadingData(true)
      setError(null)

      const response = await fetch(`/api/casos/${id}`)

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        const caso = result.data

        setFormData({
          numero: caso.numero || "",
          titulo: caso.titulo || "",
          descripcion: caso.descripcion || "",
          tipo: caso.tipo || "",
          estado: caso.estado || "",
          porcentajeAvance: caso.porcentajeAvance || 0,
          fechaInicio: formatearFechaParaInput(caso.fechaInicio),
          fechaCierre: formatearFechaParaInput(caso.fechaCierre),
          abogadoId: caso.abogadoId ? caso.abogadoId.toString() : "",
          clienteId: caso.clienteId ? caso.clienteId.toString() : "",
        })
      } else {
        setError(result.error || "Caso no encontrado")
      }
    } catch (error) {
      console.error("Error al cargar caso:", error)
      setError(`Error de conexión al cargar el caso: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!casoId) {
      setError("ID de caso no válido")
      return
    }

    // Validaciones mejoradas
    const errores: string[] = []

    if (!formData.titulo.trim()) {
      errores.push("El título es obligatorio")
    } else if (formData.titulo.trim().length < 3) {
      errores.push("El título debe tener al menos 3 caracteres")
    }

    if (!formData.descripcion.trim()) {
      errores.push("La descripción es obligatoria")
    } else if (formData.descripcion.trim().length < 10) {
      errores.push("La descripción debe tener al menos 10 caracteres")
    }

    if (!formData.tipo) {
      errores.push("Debe seleccionar un tipo de caso")
    }

    if (!formData.estado) {
      errores.push("Debe seleccionar un estado")
    }

    if (!formData.fechaInicio) {
      errores.push("La fecha de inicio es obligatoria")
    } else {
      const fechaInicio = new Date(formData.fechaInicio)
      const hoy = new Date()
      if (fechaInicio > hoy) {
        errores.push("La fecha de inicio no puede ser futura")
      }
    }

    if (formData.fechaCierre) {
      const fechaInicio = new Date(formData.fechaInicio)
      const fechaCierre = new Date(formData.fechaCierre)
      if (fechaCierre < fechaInicio) {
        errores.push("La fecha de cierre no puede ser anterior a la fecha de inicio")
      }
    }

    if (formData.porcentajeAvance < 0 || formData.porcentajeAvance > 100) {
      errores.push("El porcentaje de avance debe estar entre 0 y 100")
    }

    if (errores.length > 0) {
      setError(errores.join(". "))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const dataToSend = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        tipo: formData.tipo,
        estado: formData.estado,
        porcentajeAvance: Number(formData.porcentajeAvance),
        fechaInicio: formData.fechaInicio,
        fechaCierre: formData.fechaCierre || null,
        ...(formData.abogadoId && { abogadoId: Number(formData.abogadoId) }),
        ...(formData.clienteId && { clienteId: Number(formData.clienteId) }),
      }

      const response = await fetch(`/api/casos/${casoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        alert("Caso actualizado exitosamente")
        router.push(`/casos/${casoId}`)
      } else {
        setError(result.error || "Error al actualizar el caso")
      }
    } catch (error) {
      console.error("Error al actualizar caso:", error)
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Limpiar error cuando el usuario empiece a corregir
    if (error) {
      setError(null)
    }
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

  if (error && !casoId) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-md border bg-red-50 p-4 text-red-800">
          <h2 className="text-xl font-bold">Error</h2>
          <p>{error}</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => window.location.reload()} variant="outline">
              Reintentar
            </Button>
            <Button onClick={() => router.push("/casos")} variant="outline">
              Volver a casos
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push(`/casos/${casoId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al caso
        </Button>
        <h1 className="text-2xl font-bold">Editar Caso #{formData.numero || casoId}</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Caso</CardTitle>
          <CardDescription>Modifique los datos del caso</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Número de Caso</Label>
                <Input id="numero" value={formData.numero} disabled className="bg-gray-50" />
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
              <Label htmlFor="titulo">Título del Caso *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleChange("titulo", e.target.value)}
                required
                placeholder="Ingrese el título del caso (mínimo 3 caracteres)"
                className={
                  formData.titulo.trim().length > 0 && formData.titulo.trim().length < 3 ? "border-red-300" : ""
                }
              />
              {formData.titulo.trim().length > 0 && formData.titulo.trim().length < 3 && (
                <p className="text-red-500 text-xs mt-1">Mínimo 3 caracteres</p>
              )}
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleChange("descripcion", e.target.value)}
                rows={4}
                required
                placeholder="Ingrese la descripción del caso (mínimo 10 caracteres)"
                className={
                  formData.descripcion.trim().length > 0 && formData.descripcion.trim().length < 10
                    ? "border-red-300"
                    : ""
                }
              />
              {formData.descripcion.trim().length > 0 && formData.descripcion.trim().length < 10 && (
                <p className="text-red-500 text-xs mt-1">Mínimo 10 caracteres</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo de Caso *</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleChange("tipo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un tipo" />
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
                <Label htmlFor="estado">Estado *</Label>
                <Select value={formData.estado} onValueChange={(value) => handleChange("estado", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un estado" />
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
                <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => handleChange("fechaInicio", e.target.value)}
                  required
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label htmlFor="fechaCierre">Fecha de Cierre</Label>
                <Input
                  id="fechaCierre"
                  type="date"
                  value={formData.fechaCierre}
                  onChange={(e) => handleChange("fechaCierre", e.target.value)}
                  min={formData.fechaInicio}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Guardando..." : "Actualizar Caso"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/casos/${casoId}`)}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
