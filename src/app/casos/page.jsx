import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { CasoService } from "@/lib/aplication/services/caso.service"
import Link from "next/link"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"

// Instanciamos el servicio
const casoService = new CasoService()

export default async function CasosPage() {
  // 1. Obtener sesión
  const user = await getUserSessionServer()

  // 2. Protección
  if (!user) {
    redirect("/api/auth/signin")
  }

  // 3. LÓGICA DE ROLES (Aquí está el cambio clave)
  let casos;
  
  // Asumiendo que tu usuario tiene la propiedad 'rol'. 
  // Si en tu BD dice 'admin', usaremos getAllCasos.
  if (user.rol === 'admin') {
    casos = await casoService.getAllCasos()
  } else {
    casos = await casoService.getCasosByAbogado(user.id)
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {/* Título dinámico según rol */}
                {user.rol === 'admin' ? 'Gestión Global de Casos' : 'Mis Casos'}
              </h1>
              <p className="text-gray-500 text-sm">
                {user.rol === 'admin' 
                  ? 'Supervisión de todos los casos del estudio' 
                  : 'Administra tus casos legales activos'}
              </p>
            </div>
            <Link 
              href="/casos/nuevo" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
            >
              + Nuevo Caso
            </Link>
          </div>

          {/* TABLA DE CASOS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Expediente</th>
                  <th className="p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Título</th>
                  <th className="p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Cliente</th>
                  {/* Si es admin, mostramos columna de Abogado */}
                  {user.rol === 'admin' && (
                    <th className="p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Abogado</th>
                  )}
                  <th className="p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Tipo</th>
                  <th className="p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Estado</th>
                  <th className="p-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {casos.length === 0 ? (
                  <tr>
                    <td colSpan={user.rol === 'admin' ? 7 : 6} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <span className="text-4xl mb-2">📂</span>
                        <p className="text-lg font-medium">No hay casos registrados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  casos.map((caso) => (
                    <tr key={caso.id} className="hover:bg-slate-50 transition duration-150">
                      <td className="p-4 text-sm font-mono text-slate-500 font-medium">
                        {caso.numero || "—"}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-800">
                        {caso.titulo}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {/* @ts-ignore */}
                        {caso.cliente ? `${caso.cliente.nombre} ${caso.cliente.apellido}` : <span className="text-slate-400 italic">Sin Asignar</span>}
                      </td>
                      
                      {/* Columna extra para el Admin: ver quién lleva el caso */}
                      {user.rol === 'admin' && (
                        <td className="p-4 text-sm text-slate-600">
                           {/* @ts-ignore */}
                          {caso.abogado ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                               {/* @ts-ignore */}
                              {caso.abogado.nombre}
                            </span>
                          ) : '—'}
                        </td>
                      )}

                      <td className="p-4 text-sm text-slate-600">
                        {caso.tipo || "General"}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${caso.estado === 'Abierto' ? 'bg-green-100 text-green-800' : 
                            caso.estado === 'En proceso' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-700'}
                        `}>
                          {caso.estado}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Link 
                            href={`/casos/${caso.id}`} 
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Ver
                          </Link>
                        </div>
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