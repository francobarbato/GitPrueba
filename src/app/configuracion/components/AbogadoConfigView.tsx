'use client'

import { User, Mail, Lock, Phone, Save } from "lucide-react"

export function AbogadoConfigView({ user }: { user: any }) {
  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Mi Perfil</h1>
        <p className="text-slate-500">Administra tu información personal y credenciales de acceso.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        
        {/* Columna Izquierda: Avatar y Resumen */}
        <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-sm">
                    {user?.image ? (
                        <img src={user.image} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span className="text-3xl text-slate-400 font-bold">
                            {user?.name?.[0] || "A"}
                        </span>
                    )}
                </div>
                <h2 className="font-bold text-slate-800">{user?.name || "Abogado"}</h2>
                <p className="text-sm text-slate-500 mb-4">{user?.email}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                    Rol: Abogado Asociado
                </div>
            </div>
        </div>

        {/* Columna Derecha: Formularios */}
        <div className="md:col-span-2 space-y-6">
            
            {/* Datos Personales */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2">Información Básica</h3>
                <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Nombre</label>
                            <div className="relative">
                                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input type="text" defaultValue={user?.name?.split(' ')[0]} className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Apellido</label>
                            <input type="text" defaultValue={user?.name?.split(' ')[1]} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Email</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input type="email" defaultValue={user?.email} disabled className="w-full pl-9 p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Teléfono / Celular</label>
                        <div className="relative">
                            <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input type="tel" placeholder="+54 9 ..." className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                        </div>
                    </div>
                </div>
                <div className="mt-4 text-right">
                    <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 ml-auto">
                        <Save className="w-4 h-4" /> Guardar Cambios
                    </button>
                </div>
            </div>

            {/* Seguridad */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2">Seguridad</h3>
                <div className="grid gap-4">
                    <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Nueva Contraseña</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input type="password" placeholder="••••••••" className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  )
}