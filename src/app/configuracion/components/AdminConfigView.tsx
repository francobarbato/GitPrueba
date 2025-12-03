'use client'

import { useState } from "react"
import { Pencil, Trash2, UserPlus, Shield } from "lucide-react"

export function AdminConfigView() {
  const [selectedRole, setSelectedRole] = useState("ninguno")

  // Datos mock para diseño
  const usuarios = [
    { id: 1, nombre: "Juan Pérez", email: "juan@estudio.com", rol: "abogado" },
    { id: 2, nombre: "Carla Gómez", email: "carla@estudio.com", rol: "admin" },
  ]

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      
      {/* Header Admin */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 rounded-lg text-purple-700">
            <Shield className="w-6 h-6" />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Panel de Administración</h1>
            <p className="text-slate-500">Gestiona los accesos y usuarios del sistema.</p>
        </div>
      </div>

      {/* PANEL 1 — CREAR NUEVO USUARIO */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Dar de Alta Usuario
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-slate-700">Nombre</label>
            <input type="text" className="mt-1 w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50" placeholder="Ej: Carlos" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Apellido</label>
            <input type="text" className="mt-1 w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50" placeholder="Ej: Rodríguez" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Email Corporativo</label>
            <input type="email" className="mt-1 w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50" placeholder="usuario@estudio.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Rol Inicial</label>
            <select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)}
                className="mt-1 w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50"
            >
              <option value="abogado">Abogado</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Contraseña Temporal</label>
            <input type="password" className="mt-1 w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50" placeholder="••••••••" />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button className="bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 transition font-medium">
            Crear Usuario
          </button>
        </div>
      </div>

      {/* PANEL 2 — LISTA DE USUARIOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Usuarios Activos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                            {user.nombre[0]}{user.nombre[1]}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">{user.nombre}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      user.rol === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" :
                      "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {user.rol === 'admin' ? 'Administrador' : 'Abogado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 transition"><Pencil className="w-4 h-4"/></button>
                        <button className="p-1.5 text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}