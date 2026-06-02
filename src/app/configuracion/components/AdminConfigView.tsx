'use client'

import { useState, useEffect, useMemo } from "react"
import {
  Trash2, UserPlus, Shield, AlertCircle, CheckCircle2,
  Loader2, X, RotateCcw, AlertTriangle, Users, Key, Mail
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
  estaInvitado: boolean       
  createdAt: Date
  ultimoAcceso: Date | null
  _count?: {
    casos: number
    clientes: number
  }
}

type CasoMini = {
  id:       string
  numero:   string
  titulo:   string
  tipo:     string
  priority: string
  cliente?: { nombre: string | null; apellido: string | null } | null
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
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Toggle para mostrar inactivos
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  // Modal de reasignación de casos
  const [modalReasignar, setModalReasignar] = useState<Usuario | null>(null)
  const [abogadoDestino, setAbogadoDestino] = useState<string>("")
  const [procesandoEliminacion, setProcesandoEliminacion] = useState(false)

  const [casosUsuario, setCasosUsuario] = useState<CasoMini[]>([])
  const [loadingCasos, setLoadingCasos] = useState(false)

  const [tareasInfo, setTareasInfo] = useState<{ total: number; comoResponsable: number; comoSupervisor: number } | null>(null)

  // Decisiones por caso. Formato del value:
  //   - "reasignar:<abogadoId>"
  //   - "traspasar"
  const [decisionesPorCaso, setDecisionesPorCaso] = useState<Record<string, string>>({})


  const [modoGestion, setModoGestion] = useState<'reasignar' | 'traspasar'>('reasignar')
  const [estudioDestino, setEstudioDestino] = useState<string>("")
  const [motivoTraspaso, setMotivoTraspaso] = useState<string>("")

  // Modal de confirmación de reactivación
  const [modalReactivar, setModalReactivar] = useState<Usuario | null>(null)

  // Estado del formulario (sin password — el usuario la elige al activar)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    rol: 'ABOGADO' as 'ADMIN' | 'ABOGADO' | 'ASISTENTE',
  })

  // Filtrar usuarios según toggle. "Mostrar inactivos" muestra
  // tanto invitaciones pendientes como desactivados reales.
  const usuariosFiltrados = useMemo(() => {
    if (mostrarInactivos) return usuarios
    return usuarios.filter(u => u.isActive)
  }, [usuarios, mostrarInactivos])

  // Abogados activos disponibles para reasignar casos
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
      const timer = setTimeout(() => setSuccess(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Cuando se abre el modal de gestión, cargamos los casos del usuario.
// Al cerrarlo, limpiamos.
useEffect(() => {
  if (!modalReasignar) {
    setCasosUsuario([])
    setDecisionesPorCaso({})
    setEstudioDestino("")
    setMotivoTraspaso("")
    setTareasInfo(null)
    return
  }

  let cancelled = false
  setLoadingCasos(true)

  Promise.all([
    fetch(`/api/admin/usuarios/${modalReasignar.id}/casos-activos`).then(r => r.json()),
    fetch(`/api/admin/usuarios/${modalReasignar.id}/tareas-activas`).then(r => r.json()),
  ])
    .then(([casosData, tareasData]) => {
      if (cancelled) return
      setCasosUsuario(casosData.casos || [])
      const inicial: Record<string, string> = {}
      ;(casosData.casos || []).forEach((c: CasoMini) => { inicial[c.id] = "" })
      setDecisionesPorCaso(inicial)
      setTareasInfo({
        total:           tareasData.total           || 0,
        comoResponsable: tareasData.comoResponsable || 0,
        comoSupervisor:  tareasData.comoSupervisor  || 0,
      })
    })
    .catch(err => {
      if (cancelled) return
      setError(`No se pudo cargar la información del usuario: ${err.message}`)
    })
    .finally(() => {
      if (!cancelled) setLoadingCasos(false)
    })

  return () => { cancelled = true }
}, [modalReasignar])

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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:   formData.nombre,
          apellido: formData.apellido,
          email:    formData.email,
          rol:      formData.rol,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear usuario')
      }

      setSuccess(data.mensaje || `Invitación enviada a ${formData.email}.`)
      setFormData({ nombre: '', apellido: '', email: '', rol: 'ABOGADO' })
      cargarUsuarios()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ───── Desactivar usuario (con o sin reasignación de casos) ────────────

const handleDelete = async (usuario: Usuario) => {
  const casosActivos = usuario._count?.casos || 0

  // Si tiene casos activos, abre el modal pesado (igual que antes)
  if (casosActivos > 0) {
    setModalReasignar(usuario)
    return
  }

  // Sin casos: consultar primero las tareas activas para informarle al admin
  let advertenciaTareas = ""
  try {
    const r = await fetch(`/api/admin/usuarios/${usuario.id}/tareas-activas`)
    if (r.ok) {
      const data = await r.json()
      const total = data.total || 0
      if (total > 0) {
        advertenciaTareas = `\n\nAtención: el usuario tiene ${total} tarea(s) activa(s) (${data.comoResponsable || 0} como responsable, ${data.comoSupervisor || 0} como supervisor). Se reasignarán automáticamente al titular del caso correspondiente o al administrador si no tienen caso.`
      }
    }
  } catch { /* si falla el fetch, seguimos con la confirmación sin info de tareas */ }

  const mensaje = usuario.estaInvitado
    ? `¿Cancelar la invitación enviada a ${usuario.email}?`
    : `¿Estás seguro de desactivar a ${usuario.nombre} ${usuario.apellido}?${advertenciaTareas}\n\nEl usuario no podrá acceder al sistema.`

  if (!confirm(mensaje)) return

  setProcesandoEliminacion(true)
  try {
    const response = await fetch(`/api/admin/usuarios/${usuario.id}`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ decisiones: [] }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Error al desactivar usuario')

    setSuccess(usuario.estaInvitado
      ? 'Invitación cancelada correctamente.'
      : 'Usuario desactivado correctamente.')
    cargarUsuarios()
  } catch (err: any) {
    setError(err.message)
  } finally {
    setProcesandoEliminacion(false)
  }
}

const aplicarGestionCasos = async () => {
  if (!modalReasignar) return

  // Construir el array de decisiones a partir del state
  const decisiones = Object.entries(decisionesPorCaso).map(([casoId, valor]) => {
    if (valor === 'traspasar') {
      return { casoId, accion: 'traspasar' as const }
    }
    if (valor.startsWith('reasignar:')) {
      return { casoId, accion: 'reasignar' as const, abogadoDestino: valor.split(':')[1] }
    }
    return null
  }).filter(Boolean) as Array<{ casoId: string; accion: 'reasignar' | 'traspasar'; abogadoDestino?: string }>

  if (decisiones.length !== casosUsuario.length) {
    setError("Tenés que indicar qué hacer con cada caso.")
    return
  }

  setProcesandoEliminacion(true)
  try {
    const response = await fetch(`/api/admin/usuarios/${modalReasignar.id}`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        decisiones,
        estudioDestino,
        motivoTraspaso,
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Error al procesar')

    setSuccess(data.message || 'Usuario desactivado correctamente.')
    setModalReasignar(null)
    cargarUsuarios()
  } catch (err: any) {
    setError(err.message)
  } finally {
    setProcesandoEliminacion(false)
  }
}

const ejecutarEliminacion = async (
  usuarioId: string,
  opciones?: {
    accion?:         'reasignar' | 'traspasar',
    reasignarA?:     string,
    estudioDestino?: string,
    motivoTraspaso?: string,
    eraInvitacion?:  boolean,
  },
) => {
  setProcesandoEliminacion(true)
  try {
    const response = await fetch(`/api/admin/usuarios/${usuarioId}`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        accion:         opciones?.accion,
        reasignarA:     opciones?.reasignarA,
        estudioDestino: opciones?.estudioDestino,
        motivoTraspaso: opciones?.motivoTraspaso,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Error al eliminar usuario')
    }

    setSuccess(data.message || 'Usuario desactivado correctamente.')
    setModalReasignar(null)
    // Reset estados del modal
    setAbogadoDestino("")
    setModoGestion('reasignar')
    setEstudioDestino("")
    setMotivoTraspaso("")
    cargarUsuarios()
  } catch (err: any) {
    setError(err.message)
  } finally {
    setProcesandoEliminacion(false)
  }
}

  // ───── Reactivar usuario ───────────────────────────────────────────────

  const handleReactivar = (usuario: Usuario) => {
    setModalReactivar(usuario)
  }

  const confirmarReactivacion = async () => {
    if (!modalReactivar) return
    setProcesandoEliminacion(true)
    try {
      const response = await fetch(`/api/admin/usuarios/${modalReactivar.id}/reactivar`, {
        method: 'POST',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Error al reactivar usuario')
      }

      setSuccess(`Usuario ${modalReactivar.nombre} ${modalReactivar.apellido} reactivado correctamente.`)
      setModalReactivar(null)
      cargarUsuarios()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcesandoEliminacion(false)
    }
  }

  // ───── Disparar reset de contraseña (manda email) ──────────────────────

  const handleResetPassword = async (usuario: Usuario) => {
    const ok = confirm(
      `Se enviará un email a ${usuario.email} con un enlace para que el usuario elija una nueva contraseña.\n\n¿Continuar?`
    )
    if (!ok) return

    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}/cambiar-password`, {
        method: 'POST',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Error al resetear contraseña')
      }

      setSuccess(data.mensaje || `Email de recuperación enviado a ${usuario.email}.`)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ───── Reenviar invitación ─────────────────────────────────────────────

  const handleReenviarInvitacion = async (usuario: Usuario) => {
    const ok = confirm(
      `Se reenviará la invitación a ${usuario.email} con un nuevo enlace de activación (48 hs de validez).\n\n¿Continuar?`
    )
    if (!ok) return

    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}/reenviar-invitacion`, {
        method: 'POST',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Error al reenviar invitación')
      }

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
      day:   '2-digit',
      month: 'short',
      year:  'numeric',
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

                      {/* Usuario activo: cambiar password + desactivar */}
                      {user.isActive && (
                        <>
                          <button
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            onClick={() => handleResetPassword(user)}
                            title="Enviar email de recuperación de contraseña"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            onClick={() => handleDelete(user)}
                            title="Desactivar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Invitación pendiente: reenviar + cancelar */}
                      {!user.isActive && user.estaInvitado && (
                        <>
                          <button
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            onClick={() => handleReenviarInvitacion(user)}
                            title="Reenviar invitación"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            onClick={() => handleDelete(user)}
                            title="Cancelar invitación"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Inactivo (ex-activo): reactivar */}
                      {!user.isActive && !user.estaInvitado && (
                        <button
                          className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                          onClick={() => handleReactivar(user)}
                          title="Reactivar usuario"
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

{/* MODAL: GESTIONAR CASOS AL DESACTIVAR */}
<Dialog open={!!modalReasignar} onOpenChange={() => setModalReasignar(null)}>
  <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-amber-600">
        <AlertTriangle className="w-5 h-5" />
        Gestionar Casos Activos
      </DialogTitle>
      <DialogDescription>
        <strong>{modalReasignar?.nombre} {modalReasignar?.apellido}</strong> tiene{' '}
        <strong>{modalReasignar?._count?.casos || 0} expediente(s) activo(s)</strong>.
        Para cada uno, indicá qué corresponde hacer antes de desactivar el usuario.
      </DialogDescription>
    </DialogHeader>
    {/* Aviso de tareas activas */}
    {tareasInfo && tareasInfo.total > 0 && (
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Atención: tareas activas pendientes</p>
            <p className="mt-1">
              Este usuario tiene <strong>{tareasInfo.total} tarea(s) activa(s)</strong>
              {tareasInfo.comoResponsable > 0 && ` — ${tareasInfo.comoResponsable} como responsable`}
              {tareasInfo.comoSupervisor  > 0 && `${tareasInfo.comoResponsable > 0 ? ' y ' : ' — '}${tareasInfo.comoSupervisor} como supervisor`}.
              Lo ideal es que las complete o reasigne antes de la desactivación.
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Si proceds igual, se aplica una política automática: responsables y supervisores pasan al
              titular del caso correspondiente. Las tareas sin caso pasan al administrador que ejecuta.
            </p>
          </div>
        </div>
      </div>
    )}

    <div className="py-4">
      {loadingCasos ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Cargando casos...
        </div>
      ) : casosUsuario.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          No se encontraron casos activos.
        </p>
      ) : (
        <>
          {/* Tabla de casos con select por fila */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Expediente
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Carátula
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[220px]">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {casosUsuario.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{c.numero}</td>
                    <td className="px-3 py-2 text-slate-800">
                      <p className="line-clamp-1" title={c.titulo}>{c.titulo}</p>
                      {c.cliente && (
                        <p className="text-xs text-slate-500">
                          {c.cliente.nombre} {c.cliente.apellido || ''}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={decisionesPorCaso[c.id] || ""}
                        onValueChange={(v) =>
                          setDecisionesPorCaso(prev => ({ ...prev, [c.id]: v }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Elegir acción..." />
                        </SelectTrigger>
                        <SelectContent>
                          {abogadosParaReasignar.length === 0 && (
                            <div className="px-2 py-1.5 text-xs text-slate-400 italic">
                              No hay otros abogados activos
                            </div>
                          )}
                          {abogadosParaReasignar.map((abogado) => (
                            <SelectItem key={abogado.id} value={`reasignar:${abogado.id}`}>
                              Reasignar a {abogado.nombre} {abogado.apellido}
                            </SelectItem>
                          ))}
                          <SelectItem value="traspasar">
                            Traspasar a otro estudio
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Campos extra si hay al menos un traspaso */}
          {Object.values(decisionesPorCaso).includes('traspasar') && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-purple-800">
                Datos del traspaso (se aplican a los casos marcados como traspasados)
              </p>
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Estudio destino <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={estudioDestino}
                  onChange={(e) => setEstudioDestino(e.target.value)}
                  placeholder="Ej: Estudio Pérez & Asociados"
                  className="mt-1 w-full p-2 border border-purple-200 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Motivo del traspaso <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={motivoTraspaso}
                  onChange={(e) => setMotivoTraspaso(e.target.value)}
                  placeholder="Ej: El cliente decidió continuar con otro estudio..."
                  rows={2}
                  className="mt-1 w-full p-2 border border-purple-200 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>
          )}
        </>
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
        onClick={aplicarGestionCasos}
        disabled={
          procesandoEliminacion ||
          loadingCasos ||
          casosUsuario.length === 0 ||
          Object.values(decisionesPorCaso).some(v => !v)   // hay casos sin decisión
        }
        className="bg-slate-900 hover:bg-slate-800"
      >
        {procesandoEliminacion ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Procesando...</>
        ) : (
          'Aplicar y desactivar'
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* MODAL: REACTIVAR USUARIO */}
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
              El usuario podrá volver a acceder al sistema con su contraseña anterior.
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