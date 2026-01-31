'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Globe, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Key, 
  Copy, 
  Eye, 
  EyeOff,
  AlertTriangle,
  Loader2,
  Shield,
  Calendar,
  Lock,
  Unlock
} from 'lucide-react'
import { crearUsuarioPortalAction, desactivarUsuarioPortalAction } from 'src/app/clientes/actions/portal-actions'
import { useRouter } from 'next/navigation'

interface PortalAccesoSectionProps {
  cliente: {
    id: string
    nombre: string
    apellido: string | null
    email: string | null
    usuarioPortalId: string | null
    usuarioPortal?: {
      id: string
      email: string
      isActive: boolean
      createdAt: Date
      ultimoAcceso: Date | null
    } | null
  }
  userRol: string
}

export function PortalAccesoSection({ cliente, userRol }: PortalAccesoSectionProps) {
  const router = useRouter()
  const [showCrearModal, setShowCrearModal] = useState(false)
  const [showCredencialesModal, setShowCredencialesModal] = useState(false)
  const [showDesactivarModal, setShowDesactivarModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [credenciales, setCredenciales] = useState<{ email: string; password: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copiado, setCopiado] = useState<'email' | 'password' | null>(null)

  const tieneAccesoPortal = cliente.usuarioPortalId !== null && cliente.usuarioPortal !== null
  const usuarioActivo = cliente.usuarioPortal?.isActive === true
  
  // Solo Admin y Abogado pueden gestionar acceso al portal
  const puedeGestionarPortal = userRol === 'ADMIN' || userRol === 'ABOGADO'

  // Crear usuario de acceso
  const handleCrearUsuario = async () => {
    if (!cliente.email) {
      setError('El cliente debe tener un email registrado para crear acceso al portal')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const result = await crearUsuarioPortalAction(cliente.id)
      
      if (result.error) {
        setError(result.error)
      } else if (result.credenciales) {
        setCredenciales(result.credenciales)
        setShowCrearModal(false)
        setShowCredencialesModal(true)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario')
    } finally {
      setIsLoading(false)
    }
  }

  // Desactivar usuario
  const handleDesactivarUsuario = async () => {
    setError('')
    setIsLoading(true)

    try {
      const result = await desactivarUsuarioPortalAction(cliente.id)
      
      if (result.error) {
        setError(result.error)
      } else {
        setShowDesactivarModal(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Error al desactivar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  // Copiar al portapapeles
  const copiarAlPortapapeles = async (texto: string, tipo: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(tipo)
      setTimeout(() => setCopiado(null), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  // Formatear fecha
  const formatearFecha = (fecha: Date | string | null) => {
    if (!fecha) return 'Nunca'
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-600" />
            Acceso al Portal
          </CardTitle>
          <CardDescription>
            Gestión del acceso web del cliente para consultar sus casos
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          
          {/* Estado del acceso */}
          {tieneAccesoPortal ? (
            // ✅ Cliente CON acceso al portal
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${
                usuarioActivo 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {usuarioActivo ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800">Portal Habilitado</p>
                        <p className="text-sm text-green-600">El cliente puede acceder al sistema</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-600" />
                      <div>
                        <p className="font-semibold text-red-800">Acceso Desactivado</p>
                        <p className="text-sm text-red-600">El usuario fue desactivado</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Info del usuario */}
                <div className="space-y-2 mt-4 pt-4 border-t border-current/10">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-600">Email de acceso:</span>
                    <span className="font-mono font-medium">{cliente.usuarioPortal?.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-600">Creado:</span>
                    <span>{formatearFecha(cliente.usuarioPortal?.createdAt || null)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-600">Último acceso:</span>
                    <span>{formatearFecha(cliente.usuarioPortal?.ultimoAcceso || null)}</span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              {puedeGestionarPortal && usuarioActivo && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDesactivarModal(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Desactivar Acceso
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // ❌ Cliente SIN acceso al portal
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg text-center">
                <Globe className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="font-medium text-slate-700">Sin acceso al portal</p>
                <p className="text-sm text-slate-500 mt-1">
                  Este cliente no tiene usuario para acceder al sistema web
                </p>
              </div>

              {/* Verificar si tiene email */}
              {!cliente.email ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Email requerido</p>
                    <p className="text-xs mt-1">
                      Para crear acceso al portal, primero debe registrar un email para este cliente.
                    </p>
                  </div>
                </div>
              ) : puedeGestionarPortal && (
                <Button 
                  onClick={() => setShowCrearModal(true)}
                  className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  <UserPlus className="h-4 w-4" />
                  Crear Usuario de Acceso
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Confirmar creación de usuario */}
      <Dialog open={showCrearModal} onOpenChange={setShowCrearModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              Crear Usuario de Acceso
            </DialogTitle>
            <DialogDescription>
              Se creará un usuario para que {cliente.nombre} {cliente.apellido} pueda acceder al portal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Email de acceso:</span>
                <span className="font-medium">{cliente.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Contraseña:</span>
                <span className="font-medium text-amber-600">Se generará automáticamente</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              <p className="font-medium mb-1">¿Qué sucederá?</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Se creará un usuario con rol "Cliente"</li>
                <li>El cliente podrá ver sus casos desde el portal</li>
                <li>Deberá cambiar su contraseña en el primer acceso</li>
                <li>Las credenciales se mostrarán una sola vez</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCrearModal(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCrearUsuario}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Mostrar credenciales */}
      <Dialog open={showCredencialesModal} onOpenChange={setShowCredencialesModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              ¡Usuario Creado Exitosamente!
            </DialogTitle>
            <DialogDescription>
              Comparta estas credenciales con el cliente. La contraseña solo se muestra esta vez.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Email de acceso</Label>
                <div className="flex gap-2">
                  <Input 
                    value={credenciales?.email || ''} 
                    readOnly 
                    className="font-mono bg-white"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copiarAlPortapapeles(credenciales?.email || '', 'email')}
                  >
                    {copiado === 'email' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Contraseña temporal</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      value={credenciales?.password || ''} 
                      readOnly 
                      className="font-mono bg-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copiarAlPortapapeles(credenciales?.password || '', 'password')}
                  >
                    {copiado === 'password' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">¡Importante!</p>
                <p className="text-xs mt-1">
                  Esta contraseña solo se muestra una vez. El cliente deberá cambiarla en su primer ingreso.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => {
                setShowCredencialesModal(false)
                setCredenciales(null)
              }}
              className="w-full"
            >
              Entendido, cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar desactivación */}
      <Dialog open={showDesactivarModal} onOpenChange={setShowDesactivarModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Lock className="h-5 w-5" />
              Desactivar Acceso al Portal
            </DialogTitle>
            <DialogDescription>
              El cliente ya no podrá acceder al sistema con sus credenciales
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                ¿Está seguro que desea desactivar el acceso de <strong>{cliente.nombre} {cliente.apellido}</strong> al portal?
              </p>
              <p className="text-red-600 text-xs mt-2">
                El usuario quedará inactivo y no podrá iniciar sesión. Esta acción puede revertirse reactivando el usuario.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDesactivarModal(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDesactivarUsuario}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Desactivando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Desactivar Acceso
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}