'use client'

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { User, Mail, Lock, Phone, Save, AlertTriangle, Check, X, Eye, EyeOff, Loader2, Shield } from "lucide-react"

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
    { key: 'hasSpecial', label: 'Al menos un carácter especial', met: validation.hasSpecial },
  ]

  if (!password) return null

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">Fortaleza:</span>
          <span className={`font-medium ${
            strength.label === 'Fuerte' ? 'text-green-600' :
            strength.label === 'Buena' ? 'text-yellow-600' :
            strength.label === 'Regular' ? 'text-orange-600' : 'text-red-600'
          }`}>
            {strength.label}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
              <X className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span className={req.met ? 'text-green-700' : 'text-gray-500'}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type UserData = {
  id: string
  name?: string | null
  nombre?: string | null
  apellido?: string | null
  email: string
  telefono?: string | null
  rol: string
  image?: string | null
  debeResetearPassword?: boolean
}

export function PerfilView({ user }: { user: UserData }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const resetPasswordRequired = searchParams.get('resetPassword') === 'true' || user.debeResetearPassword

  // Estado del formulario de datos personales
  const [formData, setFormData] = useState({
    nombre: user.nombre || user.name?.split(' ')[0] || '',
    apellido: user.apellido || user.name?.split(' ').slice(1).join(' ') || '',
    telefono: user.telefono || ''
  })

  // Estado del formulario de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Validaciones de contraseña
  const passwordValidation = useMemo(() => validatePassword(passwordData.newPassword), [passwordData.newPassword])
  const isPasswordValid = useMemo(() => Object.values(passwordValidation).every(Boolean), [passwordValidation])
  const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword !== ''

  // Auto-limpiar mensajes
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Guardar datos personales
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setError(null)

    try {
      const response = await fetch('/api/usuario/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar')
      }

      setSuccess('Datos actualizados correctamente')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

// Cambiar contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid) {
      setError('La nueva contraseña no cumple con los requisitos de seguridad')
      return
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSavingPassword(true)

    try {
      const response = await fetch('/api/usuario/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(resetPasswordRequired ? {} : { currentPassword: passwordData.currentPassword }),
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar la contraseña')
      }

      setSuccess('Contraseña actualizada correctamente. Redirigiendo...')

      // ═══ BARRERA DE SEGURIDAD ═══
      // Usamos window.location.href para forzar la recarga de la sesión
      // y que el Middleware reconozca el nuevo estado del usuario
      setTimeout(() => {
        window.location.href = data.redirectUrl || '/'
      }, 1500)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const getRolLabel = (rol: string) => {
    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      ABOGADO: 'Abogado',
      ASISTENTE: 'Asistente',
      CLIENTE: 'Cliente'
    }
    return roles[rol] || rol
  }

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
        <p className="text-gray-500">Administra tu información personal y credenciales de acceso.</p>
      </div>

      {/* Alerta de cambio de contraseña obligatorio */}
      {resetPasswordRequired && (
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Acción requerida</p>
            <p className="text-sm">
              Por seguridad, debes cambiar tu contraseña temporal antes de continuar usando el sistema.
            </p>
          </div>
        </div>
      )}

      {/* Mensajes de estado */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-start gap-3">
          <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded flex items-start gap-3">
          <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Éxito</p>
            <p className="text-sm">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">×</button>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        
        {/* Columna Izquierda: Avatar y Resumen */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-sm">
              {user.image ? (
                <img src={user.image} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-3xl text-gray-400 font-bold">
                  {(user.nombre || user.name)?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <h2 className="font-bold text-gray-800">
              {user.nombre && user.apellido 
                ? `${user.nombre} ${user.apellido}` 
                : user.name || "Usuario"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{user.email}</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
              <Shield className="w-3 h-3 mr-1" />
              {getRolLabel(user.rol)}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formularios */}
        <div className="md:col-span-2 space-y-6">
          
          {/* ===== SECCIÓN: CAMBIAR CONTRASEÑA (Prioritaria si es obligatorio) ===== */}
          <div className={`bg-white p-6 rounded-2xl shadow-sm border ${
            resetPasswordRequired ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-200'
          }`}>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {resetPasswordRequired ? 'Cambiar Contraseña (Obligatorio)' : 'Seguridad'}
            </h3>
            
            <form onSubmit={handleChangePassword} className="grid gap-4">
              {/* ===== ESTO ES LO QUE OCULTA EL CAMPO SI ES OBLIGATORIO ===== */}
              {!resetPasswordRequired && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Contraseña Actual</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input 
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full pl-9 pr-10 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                      required={!resetPasswordRequired} // Si es obligatorio el reset, el input no es required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Nueva contraseña */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nueva Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className={`w-full pl-9 pr-10 p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      passwordData.newPassword && !isPasswordValid 
                        ? 'border-orange-300 bg-orange-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    placeholder="Ingrese nueva contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordRequirements password={passwordData.newPassword} />
              </div>

              {/* Confirmar nueva contraseña */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Confirmar Nueva Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className={`w-full pl-9 pr-10 p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      passwordData.confirmPassword && !passwordsMatch 
                        ? 'border-red-300 bg-red-50' 
                        : passwordData.confirmPassword && passwordsMatch
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    placeholder="Repita la nueva contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordData.confirmPassword && (
                  <p className={`text-xs mt-2 flex items-center gap-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordsMatch ? (
                      <><Check className="w-3.5 h-3.5" /> Las contraseñas coinciden</>
                    ) : (
                      <><X className="w-3.5 h-3.5" /> Las contraseñas no coinciden</>
                    )}
                  </p>
                )}
              </div>

              <div className="mt-2 text-right">
                <button 
                  type="submit"
                  disabled={savingPassword || !isPasswordValid || !passwordsMatch}
                  className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingPassword ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>

          {/* ===== SECCIÓN: DATOS PERSONALES (Solo si no es cambio obligatorio) ===== */}
          {!resetPasswordRequired && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Información Básica
              </h3>
              
              <form onSubmit={handleSaveProfile} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Nombre</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input 
                        type="text" 
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        className="w-full pl-9 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Apellido</label>
                    <input 
                      type="text" 
                      value={formData.apellido}
                      onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="email" 
                      value={user.email}
                      disabled 
                      className="w-full pl-9 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" 
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">El email no se puede modificar</p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Teléfono / Celular</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="tel" 
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      placeholder="+54 9 ..." 
                      className="w-full pl-9 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>

                <div className="mt-2 text-right">
                  <button 
                    type="submit"
                    disabled={savingProfile}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 ml-auto disabled:opacity-50"
                  >
                    {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Save className="w-4 h-4" /> 
                    {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}