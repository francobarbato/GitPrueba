'use client'

import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { FileUp, File, Trash2, Eye, Download } from 'lucide-react'
import { useState } from 'react'

export default function DocumentosPage() {
  const [activeTab, setActiveTab] = useState('clientes')

  const documentosClientes = [
    { id: 1, nombre: 'Cédula - Carlos Lopez', tipo: 'PDF', fecha: '2024-11-15', cliente: 'Carlos Lopez' },
    { id: 2, nombre: 'Comprobante Domicilio - Carlos Lopez', tipo: 'PDF', fecha: '2024-11-14', cliente: 'Carlos Lopez' },
  ]

  const documentosCasos = [
    { id: 1, nombre: 'Contrato - CASO-001', tipo: 'PDF', fecha: '2024-11-15', caso: 'CASO-001-2024' },
    { id: 2, nombre: 'Demanda - CASO-001', tipo: 'DOCX', fecha: '2024-11-14', caso: 'CASO-001-2024' },
  ]

  const documentosAbogados = [
    { id: 1, nombre: 'Pruebas Confidenciales - CASO-001', tipo: 'PDF', fecha: '2024-11-15', caso: 'CASO-001-2024', nivel: 'Confidencial' },
    { id: 2, nombre: 'Notas Estrategia - CASO-001', tipo: 'DOCX', fecha: '2024-11-14', caso: 'CASO-001-2024', nivel: 'Restringido' },
  ]

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header/>
        <main className="flex-1 overflow-auto p-6 bg-slate-50">
          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'clientes'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Documentos de Clientes
            </button>
            <button
              onClick={() => setActiveTab('casos')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'casos'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Documentos de Casos
            </button>
            <button
              onClick={() => setActiveTab('abogados')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'abogados'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Evidencias y Restricciones
            </button>
          </div>

          {/* Contenido por tab */}
          {activeTab === 'clientes' && (
            <div className="space-y-6">
              {/* Upload area */}
              <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-blue-500 transition-colors">
                <FileUp className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Subir Documento de Cliente</h3>
                <p className="text-slate-600 mb-4">Arrastra archivos aquí o haz clic para seleccionar</p>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Seleccionar Archivo
                </button>
              </div>

              {/* Documentos listados */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800">Documentos Cargados</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Nombre</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Cliente</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Tipo</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Fecha</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentosClientes.map((doc) => (
                        <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <File className="h-5 w-5 text-slate-400" />
                            <span className="text-slate-700">{doc.nombre}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{doc.cliente}</td>
                          <td className="px-6 py-4">
                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium">
                              {doc.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{doc.fecha}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Ver">
                                <Eye className="h-4 w-4 text-slate-600" />
                              </button>
                              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Descargar">
                                <Download className="h-4 w-4 text-slate-600" />
                              </button>
                              <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'casos' && (
            <div className="space-y-6">
              {/* Upload area */}
              <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-blue-500 transition-colors">
                <FileUp className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Subir Documento de Caso</h3>
                <p className="text-slate-600 mb-4">Contratos, demandas, sentencias y documentación asociada</p>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Seleccionar Archivo
                </button>
              </div>

              {/* Documentos listados */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800">Documentos del Caso</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Nombre</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Caso</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Tipo</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Fecha</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentosCasos.map((doc) => (
                        <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <File className="h-5 w-5 text-slate-400" />
                            <span className="text-slate-700">{doc.nombre}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{doc.caso}</td>
                          <td className="px-6 py-4">
                            <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                              {doc.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{doc.fecha}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Ver">
                                <Eye className="h-4 w-4 text-slate-600" />
                              </button>
                              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Descargar">
                                <Download className="h-4 w-4 text-slate-600" />
                              </button>
                              <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'abogados' && (
            <div className="space-y-6">
              {/* Upload area */}
              <div className="bg-white rounded-lg border-2 border-dashed border-red-300 p-8 text-center hover:border-red-500 transition-colors">
                <FileUp className="h-12 w-12 mx-auto text-red-400 mb-3" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Subir Evidencia/Documento Confidencial</h3>
                <p className="text-slate-600 mb-4">Información sensible - Solo acceso para abogados asignados</p>
                <button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  Seleccionar Archivo
                </button>
              </div>

              {/* Nota de seguridad */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  <span className="font-semibold">Nivel de Seguridad Alto:</span> Estos documentos contienen información confidencial y restringida. El acceso está limitado solo a abogados asignados en el caso.
                </p>
              </div>

              {/* Documentos listados */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800">Evidencias y Documentos Restricciones</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Nombre</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Caso</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Nivel</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Tipo</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Fecha</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentosAbogados.map((doc) => (
                        <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <File className="h-5 w-5 text-red-600" />
                            <span className="text-slate-700">{doc.nombre}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{doc.caso}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                              doc.nivel === 'Confidencial' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {doc.nivel}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block bg-slate-100 text-slate-800 px-3 py-1 rounded text-sm font-medium">
                              {doc.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{doc.fecha}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Ver">
                                <Eye className="h-4 w-4 text-slate-600" />
                              </button>
                              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Descargar">
                                <Download className="h-4 w-4 text-slate-600" />
                              </button>
                              <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
