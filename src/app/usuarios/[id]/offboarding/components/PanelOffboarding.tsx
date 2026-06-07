'use client'

// src/app/usuarios/[id]/offboarding/components/PanelOffboarding.tsx
//
// Panel de offboarding adaptado para que el ADMIN procese eventos pendientes
// del usuario que se va SIN entrar al módulo de eventos.
//
// CAMBIO en esta versión: barras de filtros compactos en las secciones que
// pueden volverse largas (carteras propias y eventos pendientes). Búsqueda
// por texto + filtros + orden + contador. Todo client-side con useMemo.

import { useState, useTransition, useMemo, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, ChevronRight, Briefcase, Users, ClipboardList, AlertTriangle,
  CheckCircle2, X, Loader2, ShieldAlert, UserX, ArrowRightLeft, Calendar,
  XCircle, UserCheck, Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { useConfirmacion } from "@/components/confirmacion/ConfirmacionProvider"
import {
  reasignarCarteraAction,
  reasignarClienteSoloAction,
  desactivarUsuarioDefinitivamenteAction,
  reasignarEventosExpedienteDelUsuarioAction,
  reasignarEventoPendienteAction,
  cerrarEventoPorTraspasoEnOffboardingAction,
  type EstadoCuentaUsuario,
  type CarteraOffboarding,
  type ClienteSoloOffboarding,
  type AbogadoDisponible,
  type UsuarioDisponible,
  type AccionCartera,
  type AccionCliente,
  type EventoLibrePendiente,
} from "../actions"

type Mensaje = { tipo: 'success' | 'error'; texto: string }

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function PanelOffboarding({ estado }: { estado: EstadoCuentaUsuario }) {
  const router = useRouter()
  const { confirm: confirmar } = useConfirmacion()
  const [isPending, startTransition] = useTransition()
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)

  const usuarioNombre = `${estado.usuario.nombre || ''} ${estado.usuario.apellido || ''}`.trim()
    || estado.usuario.email
  const esAbogado = estado.usuario.rol === 'ABOGADO'
  const esAsistente = estado.usuario.rol === 'ASISTENTE'

  const onSuccess = (texto: string) => {
    setMensaje({ tipo: 'success', texto })
    router.refresh()
    setTimeout(() => setMensaje(m => m?.texto === texto ? null : m), 5000)
  }
  const onError = (texto: string) => {
    setMensaje({ tipo: 'error', texto })
    setTimeout(() => setMensaje(m => m?.texto === texto ? null : m), 8000)
  }

  const handleDesactivar = async () => {
    const ok = await confirmar({
      titulo: "Desactivar usuario definitivamente",
      descripcion: `Se va a desactivar a ${usuarioNombre} del sistema. El usuario perderá el acceso. La información histórica se mantiene.`,
      variante: "danger",
      textoConfirmar: "Sí, desactivar definitivamente",
      textoCancelar: "Cancelar",
    })
    if (!ok) return

    startTransition(async () => {
      const result = await desactivarUsuarioDefinitivamenteAction(estado.usuario.id)
      if ('error' in result) {
        onError(result.error)
      } else {
        setMensaje({ tipo: 'success', texto: result.mensaje })
        setTimeout(() => router.push('/configuracion'), 1500)
      }
    })
  }

  const handleReasignarEventosExpediente = async () => {
    const ok = await confirmar({
      titulo: "Reasignar eventos vinculados a expediente",
      descripcion: `Los ${estado.eventosVinculadosCount} evento(s) vinculados pasarán al titular del expediente correspondiente. Esta acción procesa todos en bloque siguiendo el caso.`,
      textoConfirmar: "Sí, reasignar todos",
      textoCancelar: "Cancelar",
    })
    if (!ok) return

    startTransition(async () => {
      const result = await reasignarEventosExpedienteDelUsuarioAction(estado.usuario.id)
      if ('error' in result) onError(result.error)
      else onSuccess(result.mensaje)
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2">
          <Link href="/configuracion">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/configuracion" className="text-slate-500 hover:text-slate-700 transition-colors">
              Administración
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-900 font-medium">Estado de Cuenta</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">

        <div>
          <div className="flex items-center gap-2">
            <UserX className="w-6 h-6 text-slate-700" />
            <h1 className="text-2xl font-bold text-slate-900">Estado de Cuenta</h1>
            <Badge variant="outline" className="text-xs">{estado.usuario.rol}</Badge>
          </div>
          <p className="text-slate-500 mt-1">
            Liberá los recursos asignados a <strong>{usuarioNombre}</strong> antes de cerrar su cuenta definitivamente.
          </p>
        </div>

        {mensaje && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            mensaje.tipo === 'success'
              ? 'bg-green-50 border-l-4 border-green-500 text-green-700'
              : 'bg-red-50 border-l-4 border-red-500 text-red-700'
          }`}>
            {mensaje.tipo === 'success'
              ? <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
              : <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />}
            <p className="text-sm flex-1">{mensaje.texto}</p>
            <button onClick={() => setMensaje(null)} className="text-current opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <Kpis estado={estado} />

        {estado.puedeDesactivarse ? (
          <div className="bg-white border-2 border-green-300 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-900">Todo está en orden</p>
            <p className="text-sm text-slate-500 mt-1">No quedan recursos asignados. Podés desactivar la cuenta.</p>
            <Button
              onClick={handleDesactivar}
              disabled={isPending}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Desactivar Usuario Definitivamente
            </Button>
          </div>
        ) : (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">Falta liberar recursos</p>
              <p className="text-sm text-amber-700 mt-1">{estado.motivoBloqueo}</p>
            </div>
          </div>
        )}

        {/* SECCIONES DE ABOGADO */}
        {esAbogado && estado.carteras.length > 0 && (
          <SeccionCarteras
            carteras={estado.carteras}
            userIdQueSeVa={estado.usuario.id}
            abogadosDisponibles={estado.abogadosDisponibles}
            isPending={isPending}
            startTransition={startTransition}
            onSuccess={onSuccess}
            onError={onError}
            confirmar={confirmar}
          />
        )}

        {esAbogado && estado.clientesSinCasos.length > 0 && (
          <SeccionClientesSinCasos
            clientes={estado.clientesSinCasos}
            userIdQueSeVa={estado.usuario.id}
            abogadosDisponibles={estado.abogadosDisponibles}
            isPending={isPending}
            startTransition={startTransition}
            onSuccess={onSuccess}
            onError={onError}
            confirmar={confirmar}
          />
        )}

        {esAsistente && estado.eventosVinculadosCount > 0 && (
          <SeccionEventosVinculadosAsistente
            cantidad={estado.eventosVinculadosCount}
            isPending={isPending}
            onReasignar={handleReasignarEventosExpediente}
          />
        )}

        {estado.eventosLibresPendientes.length > 0 && (
          <SeccionEventosPendientes
            eventos={estado.eventosLibresPendientes}
            userIdQueSeVa={estado.usuario.id}
            usuariosDestino={estado.usuariosActivosParaReasignacion}
            isPending={isPending}
            startTransition={startTransition}
            onSuccess={onSuccess}
            onError={onError}
            confirmar={confirmar}
          />
        )}

      </div>
    </div>
  )
}

// ============================================================================
// KPIs
// ============================================================================

function Kpis({ estado }: { estado: EstadoCuentaUsuario }) {
  const esAbogado = estado.usuario.rol === 'ABOGADO'
  const esAsistente = estado.usuario.rol === 'ASISTENTE'

  if (esAbogado) {
    return (
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
        <KpiBox icon={<Briefcase className="w-4 h-4" />} label="Carteras propias" value={estado.contadores.carteras} color="blue" />
        <KpiBox icon={<Users className="w-4 h-4" />} label="Clientes sin expedientes" value={estado.contadores.clientesSinCasos} color="slate" />
        <KpiBox icon={<ArrowRightLeft className="w-4 h-4" />} label="Eventos vinculados" value={estado.contadores.eventosVinculados} color="indigo" />
        <KpiBox icon={<ClipboardList className="w-4 h-4" />} label="Eventos libres" value={estado.contadores.eventosLibres} color="amber" />
      </div>
    )
  }

  if (esAsistente) {
    return (
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <KpiBox icon={<ArrowRightLeft className="w-4 h-4" />} label="Eventos vinculados a expediente" value={estado.contadores.eventosVinculados} color="indigo" />
        <KpiBox icon={<ClipboardList className="w-4 h-4" />} label="Eventos libres" value={estado.contadores.eventosLibres} color="amber" />
      </div>
    )
  }

  return (
    <div className="grid gap-3 grid-cols-1">
      <KpiBox icon={<ClipboardList className="w-4 h-4" />} label="Eventos activos" value={estado.contadores.eventosActivos} color="amber" />
    </div>
  )
}

function KpiBox({ icon, label, value, color }: {
  icon: ReactNode; label: string; value: number
  color: 'blue' | 'slate' | 'amber' | 'indigo'
}) {
  const filled = {
    blue:   'border-blue-200 bg-blue-50 text-blue-700',
    slate:  'border-slate-200 bg-slate-50 text-slate-700',
    amber:  'border-amber-200 bg-amber-50 text-amber-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  }
  const empty = 'border-slate-200 bg-white text-slate-400'

  return (
    <div className={`rounded-xl border p-4 ${value === 0 ? empty : filled[color]}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
        {icon}<span>{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

// ============================================================================
// SECCIÓN: CARTERAS PROPIAS — con filtros
// ============================================================================

type ConfirmarFn = ReturnType<typeof useConfirmacion>['confirm']

type SeccionProps = {
  userIdQueSeVa: string
  abogadosDisponibles: AbogadoDisponible[]
  isPending: boolean
  startTransition: (fn: () => void) => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
  confirmar: ConfirmarFn
}

type FiltroCarteras = 'todas' | 'con_eventos' | 'sin_eventos'
type OrdenCarteras = 'nombre' | 'eventos_desc' | 'expedientes_desc'

function SeccionCarteras({ carteras, ...rest }: SeccionProps & { carteras: CarteraOffboarding[] }) {
  const [busqueda, setBusqueda] = useState("")
  const [filtro, setFiltro] = useState<FiltroCarteras>('todas')
  const [orden, setOrden] = useState<OrdenCarteras>('nombre')

  const carterasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    let result = carteras

    // Filtro de eventos
    if (filtro === 'con_eventos') {
      result = result.filter(c => c.eventosActivosCount > 0)
    } else if (filtro === 'sin_eventos') {
      result = result.filter(c => c.eventosActivosCount === 0)
    }

    // Búsqueda
    if (q) {
      result = result.filter(c => {
        const nombre = `${c.cliente.nombre} ${c.cliente.apellido || ''}`.toLowerCase()
        const doc = c.cliente.numeroDocumento.toLowerCase()
        return nombre.includes(q) || doc.includes(q)
      })
    }

    // Orden
    const sorted = [...result]
    if (orden === 'nombre') {
      sorted.sort((a, b) => {
        const na = `${a.cliente.nombre} ${a.cliente.apellido || ''}`.trim().toLowerCase()
        const nb = `${b.cliente.nombre} ${b.cliente.apellido || ''}`.trim().toLowerCase()
        return na.localeCompare(nb)
      })
    } else if (orden === 'eventos_desc') {
      sorted.sort((a, b) => b.eventosActivosCount - a.eventosActivosCount)
    } else if (orden === 'expedientes_desc') {
      sorted.sort((a, b) => b.casos.length - a.casos.length)
    }
    return sorted
  }, [carteras, busqueda, filtro, orden])

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-bold text-slate-800">Carteras propias</h2>
        <Badge variant="outline">{carteras.length}</Badge>
      </div>
      <p className="text-sm text-slate-500">
        Cada cartera agrupa al cliente y todos sus expedientes. Se reasignan juntos y los eventos vinculados se propagan automáticamente.
      </p>

      {/* BARRA DE FILTROS */}
      <BarraFiltros
        totalFiltrado={carterasFiltradas.length}
        totalSinFiltrar={carteras.length}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o documento..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroCarteras)}>
          <SelectTrigger className="h-8 text-xs w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="con_eventos">Con eventos pendientes</SelectItem>
            <SelectItem value="sin_eventos">Sin eventos pendientes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={orden} onValueChange={(v) => setOrden(v as OrdenCarteras)}>
          <SelectTrigger className="h-8 text-xs w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nombre">Nombre A-Z</SelectItem>
            <SelectItem value="eventos_desc">Más eventos primero</SelectItem>
            <SelectItem value="expedientes_desc">Más expedientes primero</SelectItem>
          </SelectContent>
        </Select>
      </BarraFiltros>

      {carterasFiltradas.length === 0 ? (
        <SinResultados onLimpiar={() => { setBusqueda(""); setFiltro('todas') }} />
      ) : (
        <div className="space-y-3">
          {carterasFiltradas.map(c => (
            <CarteraCard key={c.cliente.id} cartera={c} {...rest} />
          ))}
        </div>
      )}
    </section>
  )
}

function CarteraCard({
  cartera, userIdQueSeVa, abogadosDisponibles,
  isPending, startTransition, onSuccess, onError, confirmar,
}: SeccionProps & { cartera: CarteraOffboarding }) {
  const [accion, setAccion] = useState<string>("")
  const [estudioDestino, setEstudioDestino] = useState("")
  const [motivoTraspaso, setMotivoTraspaso] = useState("")

  const clienteNombre = `${cartera.cliente.nombre} ${cartera.cliente.apellido || ''}`.trim()
  const casosActivos = cartera.casos.filter(c => !c.estaCerrado).length
  const casosCerrados = cartera.casos.length - casosActivos
  const tieneEventos = cartera.eventosActivosCount > 0

  const ejecutar = async () => {
    if (!accion) return
    let accionEjecutable: AccionCartera
    if (accion === 'traspasar') {
      const ok = await confirmar({
        titulo: "Traspasar cartera a otro estudio",
        descripcion: `Los ${cartera.casos.length} expediente(s) de ${clienteNombre} quedarán cerrados como traspasados${tieneEventos ? `, los ${cartera.eventosActivosCount} evento(s) pendiente(s) se cerrarán automáticamente con motivo TRASPASO_EXPEDIENTE` : ''} y el cliente se desactivará. ¿Continuar?`,
        variante: "danger",
        textoConfirmar: "Sí, traspasar",
        textoCancelar: "Cancelar",
      })
      if (!ok) return
      accionEjecutable = { tipo: 'traspasar', estudioDestino, motivoTraspaso }
    } else if (accion.startsWith('reasignar:')) {
      accionEjecutable = { tipo: 'reasignar', abogadoDestinoId: accion.substring('reasignar:'.length) }
    } else {
      return
    }

    startTransition(async () => {
      const result = await reasignarCarteraAction(cartera.cliente.id, userIdQueSeVa, accionEjecutable)
      if ('error' in result) onError(result.error)
      else onSuccess(result.mensaje)
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800">{clienteNombre}</h3>
          <p className="text-xs text-slate-500">Doc: {cartera.cliente.numeroDocumento}</p>
          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
              {cartera.casos.length} expediente{cartera.casos.length !== 1 ? 's' : ''}
            </Badge>
            {casosActivos > 0 && (
              <Badge variant="outline" className="text-slate-700">{casosActivos} activo{casosActivos !== 1 ? 's' : ''}</Badge>
            )}
            {casosCerrados > 0 && (
              <Badge variant="outline" className="text-slate-500">{casosCerrados} cerrado{casosCerrados !== 1 ? 's' : ''}</Badge>
            )}
            {tieneEventos && (
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                {cartera.eventosActivosCount} evento{cartera.eventosActivosCount !== 1 ? 's' : ''} a propagar
              </Badge>
            )}
          </div>
        </div>
      </div>

      <details className="mb-3 group">
        <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 select-none">
          Ver {cartera.casos.length} expediente{cartera.casos.length !== 1 ? 's' : ''}
        </summary>
        <ul className="mt-2 space-y-1 text-xs pl-2 border-l-2 border-slate-100">
          {cartera.casos.map(c => (
            <li key={c.id} className="flex items-center gap-2 text-slate-600">
              <span className="font-mono text-slate-500">{c.numero}</span>
              <span className="truncate flex-1">{c.titulo}</span>
              {c.estaCerrado && <Badge variant="outline" className="text-[10px] py-0">cerrado</Badge>}
              {c.eventosActivosUsuarioCount > 0 && (
                <Badge className="text-[10px] py-0 bg-indigo-100 text-indigo-700 border-indigo-200">
                  {c.eventosActivosUsuarioCount} evento{c.eventosActivosUsuarioCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      </details>

      {tieneEventos && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-3">
          <p className="text-xs text-indigo-900">
            <strong>{cartera.eventosActivosCount} evento(s) vinculado(s)</strong> a esta cartera se procesarán automáticamente:
            al reasignar, pasan al nuevo abogado; al traspasar, se cierran con motivo administrativo.
          </p>
        </div>
      )}

      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={accion} onValueChange={setAccion} disabled={isPending}>
            <SelectTrigger className="flex-1 min-w-[280px] max-w-md">
              <SelectValue placeholder="¿Qué hacer con esta cartera?" />
            </SelectTrigger>
            <SelectContent>
              {abogadosDisponibles.length === 0 && (
                <div className="px-2 py-2 text-xs text-slate-400 italic">No hay otros abogados activos</div>
              )}
              {abogadosDisponibles.map(a => (
                <SelectItem key={a.id} value={`reasignar:${a.id}`}>
                  Reasignar a {a.nombre} {a.apellido}
                </SelectItem>
              ))}
              <SelectItem value="traspasar">Traspasar a otro estudio</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={ejecutar} disabled={!accion || isPending} className="bg-slate-900 hover:bg-slate-800">
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Aplicar
          </Button>
        </div>

        {accion === 'traspasar' && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
            <p className="text-xs text-purple-800 font-medium">Datos del traspaso (opcionales)</p>
            <Input
              value={estudioDestino}
              onChange={(e) => setEstudioDestino(e.target.value)}
              placeholder="Estudio destino (ej: Estudio Pérez & Asociados)"
              className="bg-white text-sm"
            />
            <Textarea
              value={motivoTraspaso}
              onChange={(e) => setMotivoTraspaso(e.target.value)}
              placeholder="Motivo del traspaso"
              rows={2}
              className="bg-white text-sm"
            />
            <p className="text-xs text-purple-700">
              Todos los expedientes se cierran como traspasados, los eventos pendientes se cierran automáticamente, y el cliente se desactiva.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// SECCIÓN: CLIENTES SIN EXPEDIENTES
// ============================================================================

function SeccionClientesSinCasos({ clientes, ...rest }: SeccionProps & { clientes: ClienteSoloOffboarding[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-slate-600" />
        <h2 className="text-lg font-bold text-slate-800">Clientes sin expedientes</h2>
        <Badge variant="outline">{clientes.length}</Badge>
      </div>
      <p className="text-sm text-slate-500">
        Clientes asignados al abogado pero sin expedientes. Pueden reasignarse a otro abogado o desactivarse.
      </p>
      <div className="space-y-3">
        {clientes.map(c => (
          <ClienteSoloCard key={c.cliente.id} clienteSolo={c} {...rest} />
        ))}
      </div>
    </section>
  )
}

function ClienteSoloCard({
  clienteSolo, userIdQueSeVa, abogadosDisponibles,
  isPending, startTransition, onSuccess, onError, confirmar,
}: SeccionProps & { clienteSolo: ClienteSoloOffboarding }) {
  const [accion, setAccion] = useState<string>("")
  const { cliente } = clienteSolo
  const clienteNombre = `${cliente.nombre} ${cliente.apellido || ''}`.trim()

  const ejecutar = async () => {
    if (!accion) return
    let accionEjecutable: AccionCliente
    if (accion === 'desactivar') {
      const ok = await confirmar({
        titulo: "Desactivar cliente",
        descripcion: `Se va a desactivar al cliente ${clienteNombre} del sistema.`,
        variante: "danger",
        textoConfirmar: "Sí, desactivar cliente",
        textoCancelar: "Cancelar",
      })
      if (!ok) return
      accionEjecutable = { tipo: 'desactivar' }
    } else if (accion.startsWith('reasignar:')) {
      accionEjecutable = { tipo: 'reasignar', abogadoDestinoId: accion.substring('reasignar:'.length) }
    } else {
      return
    }

    startTransition(async () => {
      const result = await reasignarClienteSoloAction(cliente.id, userIdQueSeVa, accionEjecutable)
      if ('error' in result) onError(result.error)
      else onSuccess(result.mensaje)
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800">{clienteNombre}</h3>
          <p className="text-xs text-slate-500">Doc: {cliente.numeroDocumento}</p>
        </div>
      </div>
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={accion} onValueChange={setAccion} disabled={isPending}>
            <SelectTrigger className="flex-1 min-w-[280px] max-w-md">
              <SelectValue placeholder="¿Qué hacer con este cliente?" />
            </SelectTrigger>
            <SelectContent>
              {abogadosDisponibles.length === 0 && (
                <div className="px-2 py-2 text-xs text-slate-400 italic">No hay otros abogados activos</div>
              )}
              {abogadosDisponibles.map(a => (
                <SelectItem key={a.id} value={`reasignar:${a.id}`}>Reasignar a {a.nombre} {a.apellido}</SelectItem>
              ))}
              <SelectItem value="desactivar">Desactivar cliente del sistema</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={ejecutar} disabled={!accion || isPending} className="bg-slate-900 hover:bg-slate-800">
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SECCIÓN: EVENTOS VINCULADOS DEL ASISTENTE (acción en lote)
// ============================================================================

function SeccionEventosVinculadosAsistente({
  cantidad, isPending, onReasignar,
}: {
  cantidad: number; isPending: boolean; onReasignar: () => void
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-800">Eventos vinculados a expediente</h2>
        <Badge variant="outline">{cantidad}</Badge>
      </div>
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <ArrowRightLeft className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-indigo-900">{cantidad} evento(s) vinculados a expediente</p>
            <p className="text-xs text-indigo-700 mt-1">
              Estos eventos están asociados a expedientes de distintos abogados. Cada uno pasará automáticamente
              al titular del expediente correspondiente. Si algún titular también está inactivo, esos eventos
              quedarán en la lista de pendientes para procesar uno por uno.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={onReasignar} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Reasignar todos al titular del expediente
          </Button>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// SECCIÓN: EVENTOS PENDIENTES — con filtros + acciones INLINE
// ============================================================================

type FiltroRolEvento = 'todos' | 'responsable' | 'supervisor'
type OrdenEventos = 'fecha_asc' | 'fecha_desc' | 'titulo'

function SeccionEventosPendientes({
  eventos, userIdQueSeVa, usuariosDestino,
  isPending, startTransition, onSuccess, onError, confirmar,
}: {
  eventos: EventoLibrePendiente[]
  userIdQueSeVa: string
  usuariosDestino: UsuarioDisponible[]
  isPending: boolean
  startTransition: (fn: () => void) => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
  confirmar: ConfirmarFn
}) {
  const [busqueda, setBusqueda] = useState("")
  const [filtroRol, setFiltroRol] = useState<FiltroRolEvento>('todos')
  const [orden, setOrden] = useState<OrdenEventos>('fecha_asc')

  const eventosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    let result = eventos

    // Filtro rol
    if (filtroRol === 'responsable') {
      result = result.filter(e => e.esResponsable)
    } else if (filtroRol === 'supervisor') {
      result = result.filter(e => e.esSupervisor)
    }

    // Búsqueda por título
    if (q) {
      result = result.filter(e => e.titulo.toLowerCase().includes(q))
    }

    // Orden
    const sorted = [...result]
    if (orden === 'fecha_asc' || orden === 'fecha_desc') {
      // Los que no tienen fecha al final SIEMPRE (independiente del orden)
      sorted.sort((a, b) => {
        if (!a.fechaVencimiento && !b.fechaVencimiento) return 0
        if (!a.fechaVencimiento) return 1
        if (!b.fechaVencimiento) return -1
        const dif = new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
        return orden === 'fecha_asc' ? dif : -dif
      })
    } else if (orden === 'titulo') {
      sorted.sort((a, b) => a.titulo.toLowerCase().localeCompare(b.titulo.toLowerCase()))
    }
    return sorted
  }, [eventos, busqueda, filtroRol, orden])

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-amber-600" />
        <h2 className="text-lg font-bold text-slate-800">Eventos pendientes</h2>
        <Badge variant="outline">{eventos.length}</Badge>
      </div>
      <p className="text-sm text-slate-500">
        Eventos donde el usuario figura como responsable o supervisor y no se pudieron resolver automáticamente.
        Para cada uno podés reasignarlo a otro usuario activo o cerrarlo administrativamente por traspaso del abogado.
      </p>

      {/* BARRA DE FILTROS */}
      <BarraFiltros
        totalFiltrado={eventosFiltrados.length}
        totalSinFiltrar={eventos.length}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por título..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={filtroRol} onValueChange={(v) => setFiltroRol(v as FiltroRolEvento)}>
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los roles</SelectItem>
            <SelectItem value="responsable">Como responsable</SelectItem>
            <SelectItem value="supervisor">Como supervisor</SelectItem>
          </SelectContent>
        </Select>
        <Select value={orden} onValueChange={(v) => setOrden(v as OrdenEventos)}>
          <SelectTrigger className="h-8 text-xs w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fecha_asc">Fecha más cercana</SelectItem>
            <SelectItem value="fecha_desc">Fecha más lejana</SelectItem>
            <SelectItem value="titulo">Título A-Z</SelectItem>
          </SelectContent>
        </Select>
      </BarraFiltros>

      {eventosFiltrados.length === 0 ? (
        <SinResultados onLimpiar={() => { setBusqueda(""); setFiltroRol('todos') }} />
      ) : (
        <div className="space-y-3">
          {eventosFiltrados.map(ev => (
            <EventoPendienteCard
              key={ev.id}
              evento={ev}
              userIdQueSeVa={userIdQueSeVa}
              usuariosDestino={usuariosDestino}
              isPending={isPending}
              startTransition={startTransition}
              onSuccess={onSuccess}
              onError={onError}
              confirmar={confirmar}
            />
          ))}
        </div>
      )}

      <div className="text-xs text-slate-500 italic bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
        <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p>
          Los eventos cerrados por traspaso del abogado quedan registrados como cierre administrativo —
          no se cuentan como vencidos sin cumplir en los reportes operativos.
        </p>
      </div>
    </section>
  )
}

function EventoPendienteCard({
  evento, userIdQueSeVa, usuariosDestino,
  isPending, startTransition, onSuccess, onError, confirmar,
}: {
  evento: EventoLibrePendiente
  userIdQueSeVa: string
  usuariosDestino: UsuarioDisponible[]
  isPending: boolean
  startTransition: (fn: () => void) => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
  confirmar: ConfirmarFn
}) {
  const [accion, setAccion] = useState<'' | 'reasignar' | 'cerrar'>('')
  const [destinoId, setDestinoId] = useState('')
  const [motivoExtra, setMotivoExtra] = useState('')

  const formatearFecha = (iso: string | null) => {
    if (!iso) return "Sin fecha"
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const ejecutar = async () => {
    if (accion === 'reasignar') {
      if (!destinoId) {
        onError("Elegí un usuario destino")
        return
      }
      startTransition(async () => {
        const result = await reasignarEventoPendienteAction(evento.id, userIdQueSeVa, destinoId)
        if ('error' in result) onError(result.error)
        else { onSuccess(result.mensaje); resetear() }
      })
    } else if (accion === 'cerrar') {
      const ok = await confirmar({
        titulo: "Cerrar evento por traspaso del abogado",
        descripcion: `Se va a cerrar administrativamente el evento "${evento.titulo}". El cierre queda registrado en bitácora y no afecta las métricas operativas.`,
        variante: "danger",
        textoConfirmar: "Sí, cerrar el evento",
        textoCancelar: "Cancelar",
      })
      if (!ok) return
      startTransition(async () => {
        const result = await cerrarEventoPorTraspasoEnOffboardingAction(evento.id, userIdQueSeVa, motivoExtra.trim() || undefined)
        if ('error' in result) onError(result.error)
        else { onSuccess(result.mensaje); resetear() }
      })
    }
  }

  const resetear = () => {
    setAccion('')
    setDestinoId('')
    setMotivoExtra('')
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{evento.titulo}</h3>
          <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
            {evento.esResponsable && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0">
                Es responsable
              </Badge>
            )}
            {evento.esSupervisor && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] py-0">
                Es supervisor
              </Badge>
            )}
            <span className="text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatearFecha(evento.fechaVencimiento)}
            </span>
            {evento.caso && (
              <span className="text-slate-500 flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                <span className="font-mono text-[10px]">{evento.caso.numero}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={accion} onValueChange={(v) => { setAccion(v as any); setDestinoId(''); setMotivoExtra('') }} disabled={isPending}>
            <SelectTrigger className="flex-1 min-w-[260px] max-w-sm">
              <SelectValue placeholder="¿Qué hacer con este evento?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reasignar">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Reasignar a otro usuario
                </span>
              </SelectItem>
              <SelectItem value="cerrar">
                <span className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-amber-600" />
                  Cerrar por traspaso del abogado
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {accion === 'reasignar' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <p className="text-xs text-blue-800 font-medium">Elegí el usuario destino</p>
            <Select value={destinoId} onValueChange={setDestinoId} disabled={isPending}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Seleccionar usuario..." />
              </SelectTrigger>
              <SelectContent>
                {usuariosDestino.length === 0 && (
                  <div className="px-2 py-2 text-xs text-slate-400 italic">No hay otros usuarios activos disponibles</div>
                )}
                {usuariosDestino.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nombre} {u.apellido} <span className="text-slate-400 text-[10px] ml-1">({u.rol})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={resetear}
                disabled={isPending}
                className="px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-md hover:bg-slate-50 text-slate-600"
              >
                Cancelar
              </button>
              <Button
                onClick={ejecutar}
                disabled={!destinoId || isPending}
                className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                size="sm"
              >
                {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
                Reasignar
              </Button>
            </div>
          </div>
        )}

        {accion === 'cerrar' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <p className="text-xs text-amber-800 font-medium">Cerrar por traspaso del abogado</p>
            <p className="text-[11px] text-amber-700">
              Detalle opcional. El cierre queda con motivo administrativo y no impacta métricas.
            </p>
            <Textarea
              value={motivoExtra}
              onChange={e => setMotivoExtra(e.target.value)}
              placeholder="Ej: tarea específica del Dr. X, ya no aplica al estudio"
              rows={2}
              className="bg-white text-sm"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={resetear}
                disabled={isPending}
                className="px-3 py-1.5 text-xs border border-amber-300 bg-white rounded-md hover:bg-amber-100 text-amber-700"
              >
                Cancelar
              </button>
              <Button
                onClick={ejecutar}
                disabled={isPending}
                className="bg-amber-600 hover:bg-amber-700 h-8 text-xs"
                size="sm"
              >
                {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
                Confirmar cierre
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTES AUXILIARES DE LA UI DE FILTROS
// ============================================================================

function BarraFiltros({
  children, totalFiltrado, totalSinFiltrar,
}: {
  children: ReactNode
  totalFiltrado: number
  totalSinFiltrar: number
}) {
  const hayFiltrado = totalFiltrado !== totalSinFiltrar
  return (
    <div className="flex items-center gap-2 flex-wrap p-2 bg-white border border-slate-200 rounded-lg">
      {children}
      <span className={`text-[11px] font-medium ml-auto px-2 ${hayFiltrado ? 'text-blue-600' : 'text-slate-400'}`}>
        {hayFiltrado ? `${totalFiltrado} de ${totalSinFiltrar}` : `${totalSinFiltrar} total`}
      </span>
    </div>
  )
}

function SinResultados({ onLimpiar }: { onLimpiar: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
      <p className="text-sm text-slate-500">No hay resultados con los filtros aplicados</p>
      <button
        onClick={onLimpiar}
        className="mt-2 text-xs text-blue-600 hover:text-blue-700 hover:underline"
      >
        Limpiar filtros
      </button>
    </div>
  )
}