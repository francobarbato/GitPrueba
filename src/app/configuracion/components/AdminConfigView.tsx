'use client'

import { useState, useEffect, useMemo } from "react"
import { 
  Trash2, UserPlus, Shield, AlertCircle, CheckCircle2, Eye, EyeOff, 
  Loader2, Check, X, RotateCcw, AlertTriangle, Users, Key
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Usuario = {
  id: string
  nombre: string | null
  apellido: string | null
  email: string
  rol: 'ADMIN' | 'ABOGADO' | 'ASISTENTE'
  isActive: boolean
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

// ===== VALIDACIÓN DE CONTRASEÑA =====
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
}

function validatePassword(password: string) {
  return {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasUppercase: PASSWORD_REQUIREMENTS.hasUppercase.test(password),
    hasLowercase: PASSWORD_REQUIREMENTS.hasLowercase.test(password),
    hasNumber: PASSWORD_REQUIREMENTS.hasNumber.test(password),
    hasSpecial: PASSWORD_REQUIREMENTS.hasSpecial.test(password),
  }
}

function getPasswordStrength(validation: ReturnType<typeof validatePassword>) {
  const passed = Object.values(validation).filter(Boolean).length
  if (passed <= 2) return { label: 'Débil', color: 'bg-red-500', width: '20%' }
  if (passed <= 3) return { label: 'Regular', color: 'bg-orange-500', width: '40%' }
  if (passed <= 4) return { label: 'Buena', color: 'bg-yellow-500', width: '70%' }
  return { label: 'Fuerte', color: 'bg-green-500', width: '100%' }
}

function PasswordRequirements({ password }: { password: string }) {
  const validation = validatePassword(password)
  const strength = getPasswordStrength(validation)

  const requirements = [
    { key: 'minLength', label: 'Mínimo 8 caracteres', met: validation.minLength },
    { key: 'hasUppercase', label: 'Al menos una mayúscula', met: validation.hasUppercase },
    { key: 'hasLowercase', label: 'Al menos una minúscula', met: validation.hasLowercase },
    { key: 'hasNumber', label: 'Al menos un número', met: validation.hasNumber },
    { key: 'hasSpecial', label: 'Al menos un carácter especial (!@#$%...)', met: validation.hasSpecial },
  ]

  if (!password) return null

  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-600">Fortaleza:</span>
          <span className={`font-medium ${
            strength.label === 'Fuerte' ? 'text-green-600' :
            strength.label === 'Buena' ? 'text-yellow-600' :
            strength.label === 'Regular' ? 'text-orange-600' : 'text-red-600'
          }`}>
            {strength.label}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${strength.color} transition-all duration-300`}
            style={{ width: strength.width }}
          />
        </div>
      </div>

      <ul className="space-y-1">
        {requirements.map(req => (
          <li key={req.key} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className={req.met ? 'text-green-700' : 'text-slate-500'}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AdminConfigView() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ===== NUEVO: Toggle para mostrar inactivos =====
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  // ===== NUEVO: Modal de reasignación =====
  const [modalReasignar, setModalReasignar] = useState<Usuario | null>(null)
  const [abogadoDestino, setAbogadoDestino] = useState<string>("")
  const [procesandoEliminacion, setProcesandoEliminacion] = useState(false)

  // ===== NUEVO: Modal de confirmación de reactivación =====
  const [modalReactivar, setModalReactivar] = useState<Usuario | null>(null)

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'ABOGADO' as 'ADMIN' | 'ABOGADO' | 'ASISTENTE'
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordValidation = useMemo(() => validatePassword(formData.password), [formData.password])
  const isPasswordValid = useMemo(() => Object.values(passwordValidation).every(Boolean), [passwordValidation])
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== ''

  // Filtrar usuarios según toggle
  const usuariosFiltrados = useMemo(() => {
    if (mostrarInactivos) {
      return usuarios
    }
    return usuarios.filter(u => u.isActive)
  }, [usuarios, mostrarInactivos])

  // Obtener abogados activos para reasignación (excluyendo al que se va a eliminar)
  const abogadosParaReasignar = useMemo(() => {
    return usuarios.filter(u => 
      u.rol === 'ABOGADO' && 
      u.isActive && 
      u.id !== modalReasignar?.id
    )
  }, [usuarios, modalReasignar])

  useEffect(() => {
    cargarUsuarios()
  }, [])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!isPasswordValid) {
      setError('La contraseña no cumple con todos los requisitos de seguridad')
      return
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          password: formData.password,
          rol: formData.rol
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear usuario')
      }

      setSuccess(`Usuario ${data.nombre} ${data.apellido} creado correctamente. Deberá cambiar su contraseña en el primer inicio de sesión.`)
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        confirmPassword: '',
        rol: 'ABOGADO'
      })
      cargarUsuarios()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ===== MEJORADO: Eliminar usuario con verificación de casos =====
  const handleDelete = async (usuario: Usuario) => {
    // Verificar si tiene casos activos
    const casosActivos = usuario._count?.casos || 0
    
    if (casosActivos > 0) {
      // Mostrar modal de reasignación
      setModalReasignar(usuario)
      setAbogadoDestino("")
      return
    }

    // Si no tiene casos, confirmar eliminación simple
    if (!confirm(`¿Estás seguro de desactivar a ${usuario.nombre} ${usuario.apellido}? El usuario no podrá acceder al sistema.`)) {
      return
    }

    await ejecutarEliminacion(usuario.id)
  }

  // ===== NUEVO: Ejecutar eliminación (con o sin reasignación) =====
  const ejecutarEliminacion = async (usuarioId: string, reasignarA?: string) => {
    setProcesandoEliminacion(true)
    try {
      const response = await fetch(`/api/admin/usuarios/${usuarioId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reasignarA })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar usuario')
      }

      setSuccess(reasignarA 
        ? 'Usuario desactivado y casos reasignados correctamente' 
        : 'Usuario desactivado correctamente'
      )
      setModalReasignar(null)
      cargarUsuarios()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcesandoEliminacion(false)
    }
  }

  // ===== NUEVO: Reactivar usuario =====
  const handleReactivar = async (usuario: Usuario) => {
    setModalReactivar(usuario)
  }

  const confirmarReactivacion = async () => {
    if (!modalReactivar) return

    setProcesandoEliminacion(true)
    try {
      const response = await fetch(`/api/admin/usuarios/${modalReactivar.id}/reactivar`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al reactivar usuario')
      }

      setSuccess(`Usuario ${modalReactivar.nombre} ${modalReactivar.apellido} reactivado correctamente`)
      setModalReactivar(null)
      cargarUsuarios()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcesandoEliminacion(false)
    }
  }

  // ===== NUEVO: Resetear contraseña =====
  const handleResetPassword = async (usuario: Usuario) => {
    if (!confirm(`¿Generar nueva contraseña temporal para ${usuario.nombre} ${usuario.apellido}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}/reset-password`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al resetear contraseña')
      }

      setSuccess(`Nueva contraseña temporal: ${data.tempPassword} - El usuario deberá cambiarla al iniciar sesión`)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getRolBadge = (rol: string) => {
    const config = {
      ADMIN: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Administrador' },
      ABOGADO: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Abogado' },
      ASISTENTE: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Asistente' }
    }
    const c = config[rol as keyof typeof config] || config.ABOGADO
    return (
      <Badge className={`${c.bg} ${c.text} ${c.border} border`}>
        {c.label}
      </Badge>
    )
  }

  const limpiarFormulario = () => {
    setFormData({ 
      nombre: '', 
      apellido: '', 
      email: '', 
      password: '', 
      confirmPassword: '',
      rol: 'ABOGADO' 
    })
    setError(null)
  }

  const formatearFecha = (fecha: Date | null) => {
    if (!fecha) return 'Nunca'
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
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

      {/* PANEL 1 — CREAR NUEVO USUARIO */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          Dar de Alta Usuario
        </h2>

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
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
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
                onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                className="mt-1 w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Ej: Rodríguez" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Email Corporativo <span className="text-red-500">*</span>
              </label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="mt-1 w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="usuario@estudio.com" 
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Rol Inicial <span className="text-red-500">*</span>
              </label>
              <select 
                value={formData.rol} 
                onChange={(e) => setFormData({...formData, rol: e.target.value as any})}
                className="mt-1 w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ABOGADO">Abogado</option>
                <option value="ASISTENTE">Asistente</option>
                <option value="ADMIN">Administrador</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {formData.rol === 'ADMIN' && '⚠️ Tendrá acceso completo al sistema'}
                {formData.rol === 'ABOGADO' && 'Puede gestionar casos y clientes'}
                {formData.rol === 'ASISTENTE' && 'Acceso limitado, solo apoyo'}
              </p>
            </div>

            <div className="hidden md:block" />

            <div>
              <label className="text-sm font-medium text-slate-700">
                Contraseña Temporal <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`mt-1 w-full p-2.5 pr-10 border rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.password && !isPasswordValid ? 'border-orange-300' : 'border-slate-300'
                  }`}
                  placeholder="Ingrese contraseña segura" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordRequirements password={formData.password} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Confirmar Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className={`mt-1 w-full p-2.5 pr-10 border rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.confirmPassword && !passwordsMatch ? 'border-red-300 bg-red-50' : 
                    formData.confirmPassword && passwordsMatch ? 'border-green-300 bg-green-50' : 'border-slate-300'
                  }`}
                  placeholder="Repita la contraseña" 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {formData.confirmPassword && (
                <p className={`text-xs mt-2 flex items-center gap-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordsMatch ? (
                    <><Check className="w-3.5 h-3.5" /> Las contraseñas coinciden</>
                  ) : (
                    <><X className="w-3.5 h-3.5" /> Las contraseñas no coinciden</>
                  )}
                </p>
              )}
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
              disabled={submitting || !isPasswordValid || !passwordsMatch}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Creando...' : 'Crear Usuario'}
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
          
          {/* Toggle mostrar inactivos */}
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
                  className={`hover:bg-slate-50 transition ${!user.isActive ? 'opacity-60 bg-slate-50' : ''}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        user.isActive 
                          ? 'bg-gradient-to-br from-blue-400 to-purple-500' 
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
                  <td className="px-6 py-4">
                    {getRolBadge(user.rol)}
                  </td>
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
                  <td className="px-6 py-4">
                    <Badge className={user.isActive 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-red-100 text-red-700 border-red-200'
                    }>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {user.isActive ? (
                        <>
                          {/* Reset Password */}
                          <button 
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            onClick={() => handleResetPassword(user)}
                            title="Resetear contraseña"
                          >
                            <Key className="w-4 h-4"/>
                          </button>
                          {/* Eliminar/Desactivar */}
                          <button 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            onClick={() => handleDelete(user)}
                            title="Desactivar usuario"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </>
                      ) : (
                        /* Reactivar */
                        <button 
                          className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                          onClick={() => handleReactivar(user)}
                          title="Reactivar usuario"
                        >
                          <RotateCcw className="w-4 h-4"/>
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
                  Activá "Mostrar inactivos" para ver usuarios desactivados
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL: REASIGNAR CASOS ===== */}
      <Dialog open={!!modalReasignar} onOpenChange={() => setModalReasignar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Reasignar Casos
            </DialogTitle>
            <DialogDescription>
              {modalReasignar?.nombre} {modalReasignar?.apellido} tiene{' '}
              <strong>{modalReasignar?._count?.casos || 0} expedientes activos</strong>.
              Debés reasignarlos antes de desactivar el usuario.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Reasignar todos los casos a:
            </label>
            <Select value={abogadoDestino} onValueChange={setAbogadoDestino}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar abogado..." />
              </SelectTrigger>
              <SelectContent>
                {abogadosParaReasignar.map((abogado) => (
                  <SelectItem key={abogado.id} value={abogado.id}>
                    {abogado.nombre} {abogado.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {abogadosParaReasignar.length === 0 && (
              <p className="text-sm text-red-600 mt-2">
                No hay otros abogados activos disponibles para reasignar los casos.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalReasignar(null)}
              disabled={procesandoEliminacion}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => modalReasignar && ejecutarEliminacion(modalReasignar.id, abogadoDestino)}
              disabled={!abogadoDestino || procesandoEliminacion}
            >
              {procesandoEliminacion ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Procesando...</>
              ) : (
                'Reasignar y Desactivar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== MODAL: REACTIVAR USUARIO ===== */}
      <Dialog open={!!modalReactivar} onOpenChange={() => setModalReactivar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <RotateCcw className="w-5 h-5" />
              Reactivar Usuario
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de reactivar a{' '}
              <strong>{modalReactivar?.nombre} {modalReactivar?.apellido}</strong>?
              <br />
              El usuario podrá volver a acceder al sistema.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalReactivar(null)}
              disabled={procesandoEliminacion}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmarReactivacion}
              disabled={procesandoEliminacion}
              className="bg-green-600 hover:bg-green-700"
            >
              {procesandoEliminacion ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Procesando...</>
              ) : (
                'Reactivar Usuario'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
