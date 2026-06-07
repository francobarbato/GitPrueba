'use client'

// src/app/configuracion/AdminConfigView.tsx

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2, UserPlus, Shield, AlertCircle, CheckCircle2,
  Loader2, X, RotateCcw, Users, Key, Mail
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useConfirmacion } from "@/components/confirmacion/ConfirmacionProvider"

type Usuario = {
  id: string
  nombre: string | null
  apellido: string | null
  email: string
  rol: 'ADMIN' | 'ABOGADO' | 'ASISTENTE'
  isActive: boolean
  estaInvitado: boolean
  createdAt: Date
  ultimoAcceso: Date | null
  _count?: {
    casos: number
    clientes: number
  }
}

type Estadisticas = {
  total: number
  activos: number
  inactivos: number
  porRol: {
    admins: number
    abogados: number
    asistentes: number
  }
}

export function AdminConfigView() {
  const router = useRouter()
  const { confirm: confirmar } = useConfirmacion()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [procesandoAccion, setProcesandoAccion] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    rol: 'ABOGADO' as 'ADMIN' | 'ABOGADO' | 'ASISTENTE',
  })

  const usuariosFiltrados = useMemo(() => {
    if (mostrarInactivos) return usuarios
    return usuarios.filter(u => u.isActive)
  }, [usuarios, mostrarInactivos])

  useEffect(() => { cargarUsuarios() }, [])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const cargarUsuarios = async () => {
    try {
      const response = await fetch('/api/admin/usuarios')
      if (!response.ok) throw new Error('Error al cargar usuarios')
      const data = await response.json()
      setUsuarios(data.usuarios)
      setEstadisticas(data.estadisticas)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ───── Crear usuario por invitación ────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          rol: formData.rol,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al crear usuario')

      setSuccess(data.mensaje || `Invitación enviada a ${formData.email}.`)
      setFormData({ nombre: '', apellido: '', email: '', rol: 'ABOGADO' })
      cargarUsuarios()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ───── Acciones por usuario ────────────────────────────────────────────
  //
  // Caso 1 — Invitación pendiente: cancelación directa por DELETE
  //          (el usuario nunca activó, no hay casos ni eventos ni clientes)
  // Caso 2 — Usuario activo: redirect al panel de offboarding gradual
  //          (ahí se manejan carteras, casos prestados, clientes y eventos)

  const handleDelete = async (usuario: Usuario) => {
    // Caso 1: invitación pendiente → cancelación directa
    if (usuario.estaInvitado) {
      const ok = await confirmar({
        titulo: "Cancelar invitación",
        descripcion: `Se cancelará la invitación enviada a ${usuario.email}. El enlace de activación dejará de funcionar.`,
        variante: "danger",
        textoConfirmar: "Sí, cancelar invitación",
        textoCancelar: "Volver",
      })
      if (!ok) return

      setProcesandoAccion(true)
      try {
        const response = await fetch(`/api/admin/usuarios/${usuario.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Error al cancelar la invitación')

        setSuccess('Invitación cancelada correctamente.')
        cargarUsuarios()
      } catch (err: any) {
        setError(err.message)
      } finally {
        setProcesandoAccion(false)
      }
      return
    }

    // Caso 2: usuario activo → panel de offboarding
    router.push(`/usuarios/${usuario.id}/offboarding`)
  }

  // ───── Reactivar usuario ───────────────────────────────────────────────

  const handleReactivar = async (usuario: Usuario) => {
    const confirmado = await confirmar({
      titulo: "Reactivar usuario",
      descripcion: `¿Reactivar a ${usuario.nombre} ${usuario.apellido}? El usuario podrá volver a acceder al sistema con su contraseña anterior.`,
      variante: "success",
      textoConfirmar: "Sí, reactivar",
      textoCancelar: "Cancelar",
    })
    if (!confirmado) return

    setProcesandoAccion(true)
    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}/reactivar`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al reactivar usuario')

      setSuccess(`Usuario ${usuario.nombre} ${usuario.apellido} reactivado correctamente.`)
      cargarUsuarios()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcesandoAccion(false)
    }
  }

  // ───── Reset de contraseña ────────────────────────────────────────────

  const handleResetPassword = async (usuario: Usuario) => {
    const confirmado = await confirmar({
      titulo: "Enviar email de recuperación",
      descripcion: `Se enviará un email a ${usuario.email} con un enlace para que el usuario elija una nueva contraseña.`,
      variante: "warning",
      textoConfirmar: "Enviar email",
      textoCancelar: "Cancelar",
    })
    if (!confirmado) return

    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}/cambiar-password`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al resetear contraseña')

      setSuccess(data.mensaje || `Email de recuperación enviado a ${usuario.email}.`)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ───── Reenviar invitación ─────────────────────────────────────────────

  const handleReenviarInvitacion = async (usuario: Usuario) => {
    const confirmado = await confirmar({
      titulo: "Reenviar invitación",
      descripcion: `Se reenviará la invitación a ${usuario.email} con un nuevo enlace de activación (48 hs de validez). El enlace anterior dejará de funcionar.`,
      variante: "warning",
      textoConfirmar: "Reenviar invitación",
      textoCancelar: "Cancelar",
    })
    if (!confirmado) return

    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}/reenviar-invitacion`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al reenviar invitación')

      setSuccess(data.mensaje || `Invitación reenviada a ${usuario.email}.`)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ───── Helpers visuales ────────────────────────────────────────────────

  const getRolBadge = (rol: string) => {
    const config = {
      ADMIN:     { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Administrador' },
      ABOGADO:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   label: 'Abogado' },
      ASISTENTE: { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  label: 'Asistente' },
    }
    const c = config[rol as keyof typeof config] || config.ABOGADO
    return <Badge className={`${c.bg} ${c.text} ${c.border} border`}>{c.label}</Badge>
  }

  const getEstadoBadge = (user: Usuario) => {
    if (user.isActive) {
      return <Badge className="bg-green-100 text-green-700 border-green-200">Activo</Badge>
    }
    if (user.estaInvitado) {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Invitación pendiente</Badge>
    }
    return <Badge className="bg-red-100 text-red-700 border-red-200">Inactivo</Badge>
  }

  const formatearFecha = (fecha: Date | null) => {
    if (!fecha) return 'Nunca'
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const limpiarFormulario = () => {
    setFormData({ nombre: '', apellido: '', email: '', rol: 'ABOGADO' })
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 rounded-lg text-purple-700">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel de Administración</h1>
          <p className="text-slate-500">Gestioná los accesos y usuarios del sistema.</p>
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Éxito</p>
            <p className="text-sm">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-slate-600">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase">Total</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{estadisticas.total}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-600">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase">Activos</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{estadisticas.activos}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-600">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase">Admins</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{estadisticas.porRol.admins}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase">Abogados</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{estadisticas.porRol.abogados}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-600">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase">Asistentes</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{estadisticas.porRol.asistentes}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PANEL 1 — INVITAR NUEVO USUARIO */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          Invitar Usuario al Sistema
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Se enviará un email a la dirección indicada con un enlace para que el usuario active su cuenta y elija su contraseña.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="mt-1 w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Carlos"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="mt-1 w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Rodríguez"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="usuario@estudio.com"
              />
              <p className="text-xs text-slate-500 mt-1">
                El usuario recibirá el enlace de activación en esta dirección. Asegurate de tipearlo correctamente.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Rol Inicial <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
                className="mt-1 w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ABOGADO">Abogado</option>
                <option value="ASISTENTE">Asistente</option>
                <option value="ADMIN">Administrador</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {formData.rol === 'ADMIN'     && 'Acceso técnico al sistema (gestión de usuarios). No accede a datos jurídicos.'}
                {formData.rol === 'ABOGADO'   && 'Puede gestionar expedientes, clientes y reportes.'}
                {formData.rol === 'ASISTENTE' && 'Acceso de apoyo limitado, sin permisos de cierre de expediente ni reportes.'}
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={limpiarFormulario}
              className="px-6 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Enviando invitación...' : 'Enviar Invitación'}
            </button>
          </div>
        </form>
      </div>

      {/* PANEL 2 — LISTA DE USUARIOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            Usuarios Registrados ({usuariosFiltrados.length})
          </h2>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Mostrar inactivos</span>
            <Switch
              checked={mostrarInactivos}
              onCheckedChange={setMostrarInactivos}
            />
            {mostrarInactivos && estadisticas && estadisticas.inactivos > 0 && (
              <Badge variant="outline" className="text-slate-500">
                {estadisticas.inactivos} inactivos
              </Badge>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Expedientes Activos</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Último Acceso</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuariosFiltrados.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-slate-50 transition ${!user.isActive ? 'opacity-70 bg-slate-50/50' : ''}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        user.isActive
                          ? 'bg-gradient-to-br from-blue-400 to-purple-500'
                          : user.estaInvitado
                            ? 'bg-gradient-to-br from-amber-400 to-orange-400'
                            : 'bg-slate-400'
                      }`}>
                        {user.nombre?.[0]}{user.apellido?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {user.nombre} {user.apellido}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRolBadge(user.rol)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">
                      {user._count?.casos || 0} casos
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-500">
                      {formatearFecha(user.ultimoAcceso)}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getEstadoBadge(user)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">

                      {/* Usuario activo: cambiar password + iniciar baja */}
                      {user.isActive && (
                        <>
                          <button
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition disabled:opacity-50"
                            onClick={() => handleResetPassword(user)}
                            title="Enviar email de recuperación de contraseña"
                            disabled={procesandoAccion}
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            onClick={() => handleDelete(user)}
                            title="Iniciar baja del usuario"
                            disabled={procesandoAccion}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Invitación pendiente: reenviar + cancelar */}
                      {!user.isActive && user.estaInvitado && (
                        <>
                          <button
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                            onClick={() => handleReenviarInvitacion(user)}
                            title="Reenviar invitación"
                            disabled={procesandoAccion}
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            onClick={() => handleDelete(user)}
                            title="Cancelar invitación"
                            disabled={procesandoAccion}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Inactivo (ex-activo): reactivar */}
                      {!user.isActive && !user.estaInvitado && (
                        <button
                          className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                          onClick={() => handleReactivar(user)}
                          title="Reactivar usuario"
                          disabled={procesandoAccion}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usuariosFiltrados.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No hay usuarios para mostrar</p>
              {!mostrarInactivos && (
                <p className="text-sm mt-1">
                  Activá "Mostrar inactivos" para ver invitaciones pendientes y usuarios desactivados.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}