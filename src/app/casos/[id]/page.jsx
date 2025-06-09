"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sidebar } from "../../components/sidebar"
import { Header } from "../../components/header"

// Componente para mostrar el estado del caso
function EstadoCaso({ estado }) {
  const getColor = () => {
    switch (estado) {
      case "abierto":
        return "bg-green-100 text-green-800"
      case "en_proceso":
        return "bg-blue-100 text-blue-800"
      case "cerrado":
        return "bg-gray-100 text-gray-800"
      case "archivado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const estadoTexto =
    estado === "en_proceso" ? "En proceso" : estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : "Sin estado"

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getColor()}`}>
      {estadoTexto}
    </span>
  )
}

export default function CasoDetailPage({ params }) {
  const router = useRouter()
  const [caso, setCaso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [casoId, setCasoId] = useState(null)

  // Validar ID al cargar el componente
  useEffect(() => {
    // Validar que el ID sea un número válido
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      setError(`ID inválido: ${params.id}`)
      setLoading(false)
      return
    }

    setCasoId(id)
    cargarCaso(id)
  }, [params.id])

  // Función para cargar el caso desde la API
  const cargarCaso = async (id) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Cargando caso ID:", id) // Debug

      const response = await fetch(`/api/casos/${id}`)

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      console.log("Respuesta completa de la API:", result) // Debug

      if (result.success && result.data) {
        console.log("Datos del caso recibidos:", result.data) // Debug
        setCaso(result.data)
      } else {
        setError(result.error || "Caso no encontrado")
      }
    } catch (err) {
      console.error("Error al cargar caso:", err)
      setError(`Error de conexión: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Función para formatear fechas de manera segura
  const formatearFecha = (fecha) => {
    if (!fecha) return "No especificado"
    try {
      return new Date(fecha).toLocaleDateString("es-ES")
    } catch (error) {
      console.error("Error al formatear fecha:", fecha, error)
      return "Fecha inválida"
    }
  }

  // Función para formatear texto de manera segura
  const formatearTexto = (texto) => {
    if (!texto || typeof texto !== "string") return "No especificado"
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando caso...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error || !caso) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="rounded-md border bg-red-50 p-4 text-red-800">
              <h2 className="text-xl font-bold">Error</h2>
              <p>{error || "El caso solicitado no existe."}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => casoId && cargarCaso(casoId)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Reintentar
                </button>
                <Link href="/casos" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Volver a casos
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{caso.titulo || "Sin título"}</h2>
                <EstadoCaso estado={caso.estado} />
              </div>
              <p className="text-gray-500">Caso #{caso.numero || "Sin número"}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => casoId && cargarCaso(casoId)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Actualizar
              </button>
              <Link
                href={`/casos/${casoId}/editar`}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Editar Caso
              </Link>
            </div>
          </div>

          {/* Resto del código igual... */}

          <div className="grid gap-6 md:grid-cols-3">
            {/* Información general */}
            <div className="col-span-2 rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-medium">Información General</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo de caso</p>
                  <p>{formatearTexto(caso.tipo)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <EstadoCaso estado={caso.estado} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de inicio</p>
                  <p>{formatearFecha(caso.fechaInicio)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de cierre</p>
                  <p>{caso.fechaCierre ? formatearFecha(caso.fechaCierre) : "No cerrado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Progreso</p>
                  <div className="flex items-center mt-1">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${caso.porcentajeAvance || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{caso.porcentajeAvance || 0}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Descripción</p>
                <p className="mt-1">{caso.descripcion || "Sin descripción"}</p>
              </div>
            </div>

            {/* Información del cliente */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-medium">Cliente</h3>
              {caso.cliente ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nombre</p>
                    <p>{`${caso.cliente.nombre || ""} ${caso.cliente.apellido || ""}`.trim() || "Sin nombre"}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p>{caso.cliente.email || "Sin email"}</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No hay cliente asignado</p>
              )}
            </div>

            {/* Abogado asignado */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-medium">Abogado Asignado</h3>
              {caso.abogado ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nombre</p>
                    <p>{`${caso.abogado.nombre || ""} ${caso.abogado.apellido || ""}`.trim() || "Sin nombre"}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p>{caso.abogado.email || "Sin email"}</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No hay abogado asignado</p>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="col-span-2 rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-medium">Acciones Rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  href={`/casos/${casoId}/editar`}
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-blue-600 text-sm">✏️</span>
                  </div>
                  <span className="text-sm font-medium">Editar</span>
                </Link>

                <button className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-green-600 text-sm">📄</span>
                  </div>
                  <span className="text-sm font-medium">Documentos</span>
                </button>

                <button className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-yellow-600 text-sm">⚠️</span>
                  </div>
                  <span className="text-sm font-medium">Alertas</span>
                </button>

                <Link href="/casos" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-purple-600 text-sm">📋</span>
                  </div>
                  <span className="text-sm font-medium">Volver</span>
                </Link>
              </div>
            </div>

            {/* Historial de cambios */}
            <div className="col-span-3 rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-medium">Historial de Cambios</h3>
              <div className="space-y-4">
                <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 p-4">
                  <p>Caso creado</p>
                  <p className="mt-1 text-sm text-gray-500">{formatearFecha(caso.createdAt)} - Sistema</p>
                </div>
                {caso.updatedAt && caso.updatedAt !== caso.createdAt && (
                  <div className="rounded-md border-l-4 border-green-500 bg-green-50 p-4">
                    <p>Caso actualizado</p>
                    <p className="mt-1 text-sm text-gray-500">{formatearFecha(caso.updatedAt)} - Sistema</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
