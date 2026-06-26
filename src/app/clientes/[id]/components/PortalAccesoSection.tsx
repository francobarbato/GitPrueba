'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Globe, CheckCircle2, XCircle, Mail, Send,
  AlertTriangle, Loader2, Shield, Calendar, Lock, Unlock, RefreshCw, Clock,
} from 'lucide-react'
import {
  crearUsuarioPortalAction,
  desactivarUsuarioPortalAction,
  reactivarUsuarioPortalAction,
  reenviarInvitacionPortalAction,
} from 'src/app/clientes/actions/portal-actions'
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
  tieneInvitacionPendiente: boolean
  userRol: string
}

export function PortalAccesoSection({
  cliente,
  tieneInvitacionPendiente,
  userRol,
}: PortalAccesoSectionProps) {
  const router = useRouter()
  const [showConfirmarEnvioModal, setShowConfirmarEnvioModal] = useState(false)
  const [showDesactivarModal, setShowDesactivarModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // ASISTENTE ahora también puede gestionar el portal (acceso general,
  // mismo criterio que documentos y plantillas).
  const rol = userRol?.toUpperCase()
  const puedeGestionarPortal = rol === 'ADMIN' || rol === 'ABOGADO' || rol === 'ASISTENTE'

  // === ESTADOS ===
  const sinAcceso = !cliente.usuarioPortalId
  const invitacionPendiente = !sinAcceso && tieneInvitacionPendiente
  const accesoActivo = !sinAcceso && !invitacionPendiente && cliente.usuarioPortal?.isActive === true
  const accesoDesactivado = !sinAcceso && !invitacionPendiente && cliente.usuarioPortal?.isActive === false

  const handleEnviarInvitacion = async () => {
    if (!cliente.email) {
      setError('El cliente debe tener un email registrado')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      const result = await crearUsuarioPortalAction(cliente.id)
      if (result.error) {
        setError(result.error)
      } else {
        setShowConfirmarEnvioModal(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Error al enviar invitación')
    } finally {
      setIsLoading(false)
    }
  }

const handleReenviarInvitacion = async () => {
  setError('')
  setIsLoading(true)
  try {
    const result = await reenviarInvitacionPortalAction(cliente.id)
    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
  } catch (err: any) {
    setError(err.message || 'Error al reenviar')
  } finally {
    setIsLoading(false)
  }
}

const handleDesactivar = async () => {
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
    setError(err.message || 'Error al desactivar')
  } finally {
    setIsLoading(false)
  }
}

const handleReactivar = async () => {
  setError('')
  setIsLoading(true)
  try {
    const result = await reactivarUsuarioPortalAction(cliente.id)
    if (result.error) {
      setError(result.error)
    } else {
        router.refresh()
    }
  } catch (err: any) {
    setError(err.message || 'Error al reactivar')
  } finally {
    setIsLoading(false)
  }
}

  const formatearFecha = (fecha: Date | string | null) => {
    if (!fecha) return 'Nunca'
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
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
            Gestión del acceso del cliente al portal web
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── ESTADO A: SIN ACCESO ──────────────────────────────────────── */}
          {sinAcceso && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg text-center">
                <Globe className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="font-medium text-slate-700">Sin acceso al portal</p>
                <p className="text-sm text-slate-500 mt-1">
                  Este cliente todavía no fue invitado al portal
                </p>
              </div>

              {!cliente.email ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Email requerido</p>
                    <p className="text-xs mt-1">
                      Para invitar al portal, primero registrá un email para este cliente.
                    </p>
                  </div>
                </div>
              ) : puedeGestionarPortal && (
                <Button
                  onClick={() => setShowConfirmarEnvioModal(true)}
                  className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send className="h-4 w-4" />
                  Enviar invitación al portal
                </Button>
              )}
            </div>
          )}

          {/* ── ESTADO B: INVITACIÓN PENDIENTE ────────────────────────────── */}
          {invitacionPendiente && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border-2 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3 mb-3">
                  <Clock className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Invitación pendiente</p>
                    <p className="text-sm text-amber-700 mt-0.5">
                      Le mandamos un email al cliente para que active su cuenta. Cuando lo haga, va a poder ingresar al portal.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-amber-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-amber-700" />
                    <span className="text-amber-800">Email destino:</span>
                    <span className="font-mono font-medium text-amber-900">{cliente.usuarioPortal?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-amber-700" />
                    <span className="text-amber-800">Invitación creada:</span>
                      <span className="text-amber-900" suppressHydrationWarning>
                        {formatearFecha(cliente.usuarioPortal?.createdAt || null)}
                      </span>                  
                    </div>
                </div>
              </div>

              {puedeGestionarPortal && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReenviarInvitacion}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                    ) : (
                      <><RefreshCw className="h-4 w-4 mr-2" /> Reenviar invitación</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDesactivarModal(true)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Cancelar invitación
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── ESTADO C: ACCESO ACTIVO ───────────────────────────────────── */}
          {accesoActivo && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border-2 bg-green-50 border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Portal Habilitado</p>
                    <p className="text-sm text-green-600">El cliente puede acceder al sistema</p>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-green-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-600">Email de acceso:</span>
                    <span className="font-mono font-medium">{cliente.usuarioPortal?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-600">Cuenta creada:</span>
                      <span suppressHydrationWarning>
                        {formatearFecha(cliente.usuarioPortal?.createdAt || null)}
                      </span>                  
                      </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-600">Último acceso:</span>
                    <span suppressHydrationWarning>
                      {formatearFecha(cliente.usuarioPortal?.ultimoAcceso || null)}
                    </span>
                  </div>
                </div>
              </div>

              {puedeGestionarPortal && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDesactivarModal(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Desactivar acceso
                </Button>
              )}
            </div>
          )}

          {/* ── ESTADO D: ACCESO DESACTIVADO ──────────────────────────────── */}
          {accesoDesactivado && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border-2 bg-red-50 border-red-200">
                <div className="flex items-center gap-3 mb-3">
                  <XCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">Acceso desactivado</p>
                    <p className="text-sm text-red-600">El cliente activó su cuenta pero hoy no puede ingresar</p>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-red-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-600">Email de acceso:</span>
                    <span className="font-mono font-medium">{cliente.usuarioPortal?.email}</span>
                  </div>
                </div>
              </div>

              {puedeGestionarPortal && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReactivar}
                  disabled={isLoading}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reactivando...</>
                  ) : (
                    <><Unlock className="h-4 w-4 mr-2" /> Reactivar acceso</>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: confirmar envío de invitación */}
      <Dialog open={showConfirmarEnvioModal} onOpenChange={setShowConfirmarEnvioModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-600" />
              Enviar invitación al portal
            </DialogTitle>
            <DialogDescription>
              Se va a enviar un email a {cliente.nombre}{cliente.apellido ? ` ${cliente.apellido}` : ''} para que active su cuenta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-slate-600">Email destino:</span>
                <span className="font-medium">{cliente.email}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              <p className="font-medium mb-1">¿Qué sucederá?</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Le llega al cliente un email con un link de activación</li>
                <li>El cliente carga su propia contraseña en ese link</li>
                <li>Cuando active, puede ingresar al portal y ver sus expedientes</li>
                <li>El enlace de activación vence en 48 horas</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmarEnvioModal(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEnviarInvitacion}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Enviar invitación</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: confirmar desactivación / cancelación */}
      <Dialog open={showDesactivarModal} onOpenChange={setShowDesactivarModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Lock className="h-5 w-5" />
              {invitacionPendiente ? 'Cancelar invitación' : 'Desactivar acceso al portal'}
            </DialogTitle>
            <DialogDescription>
              {invitacionPendiente
                ? `El link enviado a ${cliente.usuarioPortal?.email} dejará de funcionar.`
                : 'El cliente ya no podrá acceder al portal.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {invitacionPendiente
                ? 'La invitación quedará cancelada. Podés volver a invitar al cliente más adelante.'
                : 'Esta acción puede revertirse después con "Reactivar acceso".'}
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
              onClick={handleDesactivar}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</>
              ) : invitacionPendiente ? (
                <><Lock className="h-4 w-4 mr-2" /> Cancelar invitación</>
              ) : (
                <><Lock className="h-4 w-4 mr-2" /> Desactivar acceso</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}