"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Bell, Clock, CheckCheck, ArrowRight, FileText, MessageCircle,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  getTareasParaNotificaciones,
  marcarTareasComoVistasAction,
} from "src/lib/actions/tarea-actions";
import { getBurbujasComentarios } from "src/lib/actions/comentario-actions";
import type { TareaNotificacion } from "src/lib/actions/tarea-actions";
import type { BurbujaTareaComentarios } from "src/lib/actions/comentario-actions";

// ============================================================================
// HELPERS
// ============================================================================

const PRIORIDAD_CONFIG: Record<string, { color: string; label: string }> = {
  FATAL: { color: "text-red-600", label: "Fatal" },
  ALTA: { color: "text-orange-600", label: "Alta" },
  MEDIA: { color: "text-slate-600", label: "Media" },
  BAJA: { color: "text-slate-500", label: "Baja" },
}

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins}m`
  const horas = Math.floor(mins / 60)
  if (horas < 24) return `Hace ${horas}h`
  const dias = Math.floor(horas / 24)
  return `Hace ${dias}d`
}

function getNombreAutor(autor: { nombre: string | null; apellido: string | null }): string {
  const n = autor.nombre ?? ""
  const a = autor.apellido ?? ""
  return `${n} ${a}`.trim() || "Usuario"
}

// ============================================================================
// TIPO UNIFICADO DE ITEM DEL FEED
// Permite ordenar tareas nuevas y burbujas de comentarios cronológicamente
// ============================================================================
type ItemFeed =
  | { kind: "tarea"; ordenFecha: number; data: TareaNotificacion }
  | { kind: "comentario"; ordenFecha: number; data: BurbujaTareaComentarios }

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function Header() {
  const { data: session } = useSession();
  const router = useRouter()
  const user = session?.user;

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [tareasNuevas, setTareasNuevas] = useState<TareaNotificacion[]>([]);
  const [burbujasComentarios, setBurbujasComentarios] = useState<BurbujaTareaComentarios[]>([]);
  const [isPending, startTransition] = useTransition();

  // Contador total combinado
  const totalItems = tareasNuevas.length + burbujasComentarios.length
  const totalComentariosAcumulados = burbujasComentarios.reduce((acc, b) => acc + b.cantidadNuevos, 0)

  useEffect(() => {
    cargarNotificaciones()
  }, [])

  useEffect(() => {
    if (sheetOpen) cargarNotificaciones()
  }, [sheetOpen])

  const cargarNotificaciones = () => {
    startTransition(async () => {
      try {
        const [tareasResp, burbujasResp] = await Promise.all([
          getTareasParaNotificaciones(),
          getBurbujasComentarios(),
        ])
        setTareasNuevas(tareasResp.nuevas)
        setBurbujasComentarios(burbujasResp)
      } catch (e) {
        console.error("Error cargando notificaciones:", e)
      }
    })
  }

  const handleMarcarTodasVistas = () => {
    startTransition(async () => {
      // Las tareas nuevas se marcan con la action existente (ultimoAccesoTareas)
      const result = await marcarTareasComoVistasAction()
      if (result.success) {
        setTareasNuevas([])
      }
      // Las burbujas de comentarios se marcan al abrir cada tarea,
      // no hay "marcar todos los comentarios como vistos" porque sería
      // perder el beneficio de la granularidad por tarea.
      // Si el usuario quiere ver los comentarios, clickea en cada burbuja.
    })
  }

  const handleClickTarea = () => {
    setSheetOpen(false)
    // Link normal a /gestion-tareas (navegación estándar)
  }

  const handleClickBurbuja = (tareaId: string) => {
    setSheetOpen(false)
    // Navegar con query param para que el Board abra el Drawer de esa tarea
    router.push(`/gestion-tareas?tareaAbierta=${tareaId}`)
  }

  const handleSignOut = () => {
    setShowUserMenu(false)
    signOut({ callbackUrl: "/auth/signin" })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Construir feed mezclado cronológico
  const feed: ItemFeed[] = [
    ...tareasNuevas.map<ItemFeed>(t => ({
      kind: "tarea",
      ordenFecha: new Date(t.updatedAt).getTime(),
      data: t,
    })),
    ...burbujasComentarios.map<ItemFeed>(b => ({
      kind: "comentario",
      ordenFecha: new Date(b.ultimoComentario.createdAt).getTime(),
      data: b,
    })),
  ].sort((a, b) => b.ordenFecha - a.ordenFecha)

  const nombre = user?.name ?? "Usuario";
  const rol = user?.rol ?? "sin rol";
  const avatar = user?.image ?? null;
  const initials = getInitials(nombre);
  const isAdmin = typeof rol === 'string' && rol.toLowerCase() === "admin";

  const getRolLabel = (rol: string) => {
    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      ABOGADO: 'Abogado',
      ASISTENTE: 'Asistente',
      CLIENTE: 'Cliente'
    };
    return roles[rol?.toUpperCase()] || rol;
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-6">
      <button
        className="lg:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        ☰
      </button>

      <h1 className="text-xl font-semibold">Sistema de Gestión Legal</h1>

      <div className="ml-auto flex items-center gap-3">

        {/* CAMPANITA CON SHEET */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="relative rounded-full bg-slate-100 p-2.5 hover:bg-slate-200 transition-colors">
              <Bell className="w-4.5 h-4.5 text-slate-600" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-pulse">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent className="w-full sm:w-[440px] p-0 flex flex-col">
            <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <SheetTitle className="text-base font-bold text-slate-800">
                Novedades
                {totalItems > 0 && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                    {totalItems}
                  </span>
                )}
              </SheetTitle>
              {/* Resumen breve del contenido — ayuda a entender qué tipo de novedades hay */}
              {totalItems > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {tareasNuevas.length > 0 && (
                    <span>{tareasNuevas.length} evento{tareasNuevas.length !== 1 ? "s" : ""} nuevo{tareasNuevas.length !== 1 ? "s" : ""}</span>
                  )}
                  {tareasNuevas.length > 0 && burbujasComentarios.length > 0 && <span> · </span>}
                  {burbujasComentarios.length > 0 && (
                    <span>{totalComentariosAcumulados} comentario{totalComentariosAcumulados !== 1 ? "s" : ""} en {burbujasComentarios.length} tarea{burbujasComentarios.length !== 1 ? "s" : ""}</span>
                  )}
                </p>
              )}
              {tareasNuevas.length > 0 && (
                <button
                  onClick={handleMarcarTodasVistas}
                  disabled={isPending}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors w-fit mt-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar eventos nuevos como vistos
                </button>
              )}
            </SheetHeader>

            <div className="flex-1 overflow-y-auto">
              {feed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Bell className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Estás al día</p>
                  <p className="text-xs text-slate-400 mt-1">No hay novedades desde tu última visita</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {feed.map((item, idx) => {
                    if (item.kind === "tarea") {
                      const t = item.data
                      const prioCfg = PRIORIDAD_CONFIG[t.prioridad] ?? PRIORIDAD_CONFIG.MEDIA
                      return (
                        <Link
                          key={`t-${t.id}`}
                          href="/gestion-tareas"
                          onClick={handleClickTarea}
                          className="block"
                        >
                          <div className="px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-start gap-3">
                              {/* Icono diferenciador: FileText para evento nuevo */}
                              <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                                <FileText className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Nuevo evento</span>
                                  <span className={`w-1 h-1 rounded-full ${t.tipo === "PROCESAL" ? "bg-red-500" : "bg-blue-500"}`} />
                                </div>
                                <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors leading-snug">
                                  {t.titulo}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {t.caso && (
                                    <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                      {t.caso.numero}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-medium ${prioCfg.color}`}>
                                    {prioCfg.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {t.creador.nombre} {t.creador.apellido}
                                  </span>
                                </div>
                                {t.fechaVencimiento && (
                                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Vence: {new Date(t.fechaVencimiento).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                                {tiempoRelativo(t.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      )
                    } else {
                      // Burbuja de comentarios agrupada por tarea
                      const b = item.data
                      return (
                        <button
                          key={`c-${b.tareaId}`}
                          onClick={() => handleClickBurbuja(b.tareaId)}
                          className="block w-full text-left"
                        >
                          <div className="px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-start gap-3">
                              {/* Icono diferenciador: MessageCircle para comentario */}
                              <div className="mt-0.5 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 relative">
                                <MessageCircle className="w-4 h-4 text-emerald-600" />
                                {b.cantidadNuevos > 1 && (
                                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-emerald-600 text-white text-[9px] font-bold px-1">
                                    {b.cantidadNuevos}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                                    {b.cantidadNuevos === 1 ? "Nuevo comentario" : `${b.cantidadNuevos} nuevos comentarios`}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-slate-800 group-hover:text-emerald-700 transition-colors leading-snug truncate">
                                  en "{b.tituloTarea}"
                                </p>
                                <div className="mt-1">
                                  <p className="text-xs text-slate-600 line-clamp-2">
                                    <span className="font-medium text-slate-700">{getNombreAutor(b.ultimoComentario.autor)}:</span>{" "}
                                    <span className="italic">{b.ultimoComentario.textoPreview}</span>
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                                {tiempoRelativo(b.ultimoComentario.createdAt)}
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    }
                  })}
                </div>
              )}
            </div>

            {feed.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-3 shrink-0 bg-slate-50">
                <Link
                  href="/gestion-tareas"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center justify-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Ver todo en Agenda y Seguimientos
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* MENÚ DE USUARIO */}
        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {avatar ? (
              <img src={avatar} className="w-6 h-6 rounded-full" alt="avatar" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                {initials}
              </div>
            )}
            <span>{nombre}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white py-1 shadow-lg">
              <div className="border-b px-4 py-2">
                <p className="font-medium">{nombre}</p>
                <p className="text-sm text-gray-500">{user?.email ?? ""}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Rol: {getRolLabel(rol)}
                </p>
              </div>

              <Link
                href="/perfil"
                onClick={() => setShowUserMenu(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Mi Perfil
              </Link>

              {isAdmin && (
                <Link
                  href="/configuracion"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Configuración
                </Link>
              )}

              <button
                onClick={handleSignOut}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}