// src/app/casos/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { CasoService } from "@/lib/aplication/services/caso.service"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { Star, Flame, FolderOpen, Plus } from "lucide-react"

const casoService = new CasoService()

// Helper para color de estados
const getBadgeColor = (estado: string) => {
  if (["Terminado", "Archivado"].includes(estado)) return "bg-gray-100 text-gray-600 border-gray-200"
  if (["Sentencia / Resolución", "Ejecución de Sentencia"].includes(estado)) return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (["Prueba (Oficios/Pericias)", "Alegatos / Conclusiones"].includes(estado)) return "bg-blue-50 text-blue-700 border-blue-200"
  return "bg-slate-100 text-slate-700 border-slate-200"
}

// Helper para verificar roles
const isAdmin = (rol: string) => rol?.toUpperCase() === 'ADMIN'
const isAbogado = (rol: string) => rol?.toUpperCase() === 'ABOGADO'
const isAsistente = (rol: string) => rol?.toUpperCase() === 'ASISTENTE'

export default async function CasosPage() {
  const user = await getUserSessionServer()

  if (!user) {
    redirect("/auth/signin")
  }

  const userRol = user.rol?.toUpperCase() || ''

  // Lógica de Roles para obtener casos
  let casos;
  if (isAdmin(userRol) || isAsistente(userRol)) {
    // Admin y Asistente ven todos los casos
    casos = await casoService.getAllCasos()
  } else {
    // Abogado ve solo sus casos
    casos = await casoService.getCasosByAbogado(user.id)
  }

  // Textos según rol
  const getTitulo = () => {
    if (isAdmin(userRol)) return 'Gestión Global de Casos'
    if (isAsistente(userRol)) return 'Panel de Casos'
    return 'Mis Casos Activos'
  }

  const getSubtitulo = () => {
    if (isAdmin(userRol)) return 'Supervisión de todos los expedientes del estudio.'
    if (isAsistente(userRol)) return 'Visualización y apoyo en la gestión de expedientes.'
    return 'Administra tus expedientes y consulta sus estados.'
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{getTitulo()}</h1>
              <p className="text-gray-500 text-sm mt-1">{getSubtitulo()}</p>
            </div>
            
            {/* Botón Nuevo Caso - Todos los roles pueden crear */}
            <Link 
              href="/casos/nuevo" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Nuevo Caso
            </Link>
          </div>

          {/* Indicador de rol para Asistente */}
          {isAsistente(userRol) && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              <strong>Modo Asistente:</strong> Puedes ver todos los casos y crear nuevos. 
              Para modificar estados o ver información financiera, contacta al abogado responsable.
            </div>
          )}

          {/* TABLA DE CASOS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 w-[50px] text-center">#</th>
                  <th className="p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Expediente</th>
                  <th className="p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Carátula</th>
                  <th className="p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Cliente</th>
                  
                  {/* Columna Abogado visible para Admin y Asistente */}
                  {(isAdmin(userRol) || isAsistente(userRol)) && (
                    <th className="p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Abogado</th>
                  )}
                  
                  <th className="p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Etapa Procesal</th>
                  <th className="p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {casos.length === 0 ? (
                  <tr>
                    <td colSpan={(isAdmin(userRol) || isAsistente(userRol)) ? 7 : 6} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FolderOpen className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-lg font-medium text-slate-600">No hay casos registrados</p>
                        <p className="text-sm">Comienza creando un nuevo expediente.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  casos.map((caso) => (
                    <tr key={caso.id} className="hover:bg-slate-50 transition duration-150 group">
                      
                      {/* Columna Prioridad/Favorito */}
                      <td className="p-4 text-center align-middle">
                        <div className="flex flex-col items-center gap-1">
                          {caso.isFavorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                          {caso.priority === 'HIGH' && <Flame className="w-4 h-4 text-orange-500 fill-orange-100" />}
                        </div>
                      </td>

                      <td className="p-4 text-sm font-mono text-slate-500 font-medium whitespace-nowrap">
                        {caso.numero || "S/N"}
                      </td>
                      
                      <td className="p-4 text-sm font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="line-clamp-1" title={caso.titulo}>
                            {caso.titulo}
                          </span>
                          {isAbogado(userRol) && caso.abogadoId !== user.id && (
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 font-semibold border border-violet-200">
                              Colaborador
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-normal">{caso.tipo}</span>
                      </td>
                      
                      <td className="p-4 text-sm text-slate-600">
                        {/* @ts-ignore */}
                        {caso.cliente ? `${caso.cliente.nombre} ${caso.cliente.apellido || ''}` : <span className="text-slate-300 italic">Sin Asignar</span>}
                      </td>
                      
                      {/* Columna Abogado - Visible para Admin y Asistente */}
                      {(isAdmin(userRol) || isAsistente(userRol)) && (
                        <td className="p-4 text-sm text-slate-600">
                          {/* @ts-ignore */}
                          {caso.abogado ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                              {/* @ts-ignore */}
                              {caso.abogado.nombre || caso.abogado.email}
                            </span>
                          ) : '-'}
                        </td>
                      )}

                      {/* Estado con Badge */}
                      <td className="p-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(caso.estado)}`}>
                              {caso.estado}
                            </span>
                            {caso.estaCerrado && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                                {caso.motivoCierre || 'Cerrado'}
                              </span>
                            )}
                          </div>
                      </td>
                      
                      <td className="p-4 text-right">
                        <Link 
                          href={`/casos/${caso.id}`} 
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                        >
                          Ver Caso
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}