"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Sidebar } from "../components/sidebar"
import { Header } from "../components/header"

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

export default function CasosPage() {
  const [casos, setCasos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Función para cargar casos desde la API
  const cargarCasos = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/casos")
      const result = await response.json()

      console.log("Respuesta de casos:", result) // Debug

      if (result.success) {
        setCasos(result.data || [])
      } else {
        setError(result.error || "Error al cargar casos")
      }
    } catch (err) {
      console.error("Error al cargar casos:", err)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // Cargar casos al montar el componente
  useEffect(() => {
    cargarCasos()
  }, [])

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
                <p className="mt-2 text-gray-600">Cargando casos...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="rounded-md border bg-red-50 p-4 text-red-800">
              <h2 className="text-xl font-bold">Error</h2>
              <p>{error}</p>
              <button
                onClick={cargarCasos}
                className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Reintentar
              </button>
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
              <h2 className="text-2xl font-bold">Gestión de Casos</h2>
              <p className="text-gray-500">Administra los casos legales activos</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cargarCasos}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Actualizar
              </button>
              <Link
                href="/casos/nuevo"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Nuevo Caso
              </Link>
            </div>
          </div>

          {casos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay casos registrados</p>
              <Link
                href="/casos/nuevo"
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Crear primer caso
              </Link>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Número
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Título
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Tipo
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Estado
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Fecha Inicio
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Cliente
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Abogado
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Progreso
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {casos.map((caso) => (
                      <tr key={caso.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {caso.numero || "Sin número"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {caso.titulo || "Sin título"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatearTexto(caso.tipo)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <EstadoCaso estado={caso.estado} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatearFecha(caso.fechaInicio)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {caso.cliente
                            ? `${caso.cliente.nombre || ""} ${caso.cliente.apellido || ""}`.trim() || "Sin nombre"
                            : "No asignado"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {caso.abogado
                            ? `${caso.abogado.nombre || ""} ${caso.abogado.apellido || ""}`.trim() || "Sin nombre"
                            : "No asignado"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${caso.porcentajeAvance || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{caso.porcentajeAvance || 0}%</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <Link href={`/casos/${caso.id}`} className="text-blue-600 hover:text-blue-900">
                            Ver
                          </Link>
                          {" | "}
                          <Link href={`/casos/${caso.id}/editar`} className="text-blue-600 hover:text-blue-900">
                            Editar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
