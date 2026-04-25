'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu"
import { 
  Scale, 
  User, 
  LogOut, 
  ChevronDown,
  Home,
  FileText,
  Bell,
  Settings
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface PortalHeaderProps {
  user: {
    nombre?: string | null
    apellido?: string | null
    email: string
  }
}

export function PortalHeader({ user }: PortalHeaderProps) {
  const nombreCompleto = user.nombre && user.apellido 
    ? `${user.nombre} ${user.apellido}` 
    : user.email

  const iniciales = user.nombre && user.apellido
    ? `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`
    : user.email.charAt(0).toUpperCase()

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo y nombre del estudio */}
          <Link href="/portal" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-slate-900">Portal del Cliente</p>
              <p className="text-xs text-slate-500">Estudio Jurídico</p>
            </div>
          </Link>

          {/* Navegación central */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/portal">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Button>
            </Link>
            <Link href="/portal/casos">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <FileText className="h-4 w-4 mr-2" />
                Mis Expedientes
              </Button>
            </Link>
          </nav>

          {/* Usuario y acciones */}
          <div className="flex items-center gap-3">
<<<<<<< Updated upstream
            {/* Notificaciones (placeholder) */}
            <Button variant="ghost" size="icon" className="relative text-slate-600">
              <Bell className="h-5 w-5" />
              {/* Badge de notificaciones - descomentar cuando se implementen
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                3
              </span>
              */}
            </Button>
=======

            {/* Campanita con Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-600">
                  <Bell className="h-5 w-5" />
                  {totalNuevas > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-pulse">
                      {totalNuevas > 99 ? "99+" : totalNuevas}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-[400px] p-0 flex flex-col">
                <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
                  <SheetTitle className="text-base font-bold text-slate-800">
                    Novedades
                    {totalNuevas > 0 && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {totalNuevas}
                      </span>
                    )}
                  </SheetTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Eventos nuevos o actualizados por su estudio</p>
                  {totalNuevas > 0 && (
                    <button
                      onClick={handleMarcarVistas}
                      disabled={isPending}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors w-fit mt-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Marcar como vistas
                    </button>
                  )}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                  {tareas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">Sin novedades</p>
                      <p className="text-xs text-slate-400 mt-1">No hay eventos nuevos desde su última visita</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {tareas.map(t => {
                        const vencida = t.fechaVencimiento && new Date(t.fechaVencimiento) < new Date()
                        const lugarLimpio = t.lugarFisico?.replace(/^\[.*?\]\s?/, "") ?? null

                        return (
                          <div key={t.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${vencida ? "bg-red-500" : "bg-blue-500"}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800">{t.titulo}</p>
                                {t.descripcion && (
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                    {t.descripcion.slice(0, 100)}{t.descripcion.length > 100 ? "..." : ""}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                    t.estado === "BLOQUEADA" ? "bg-red-100 text-red-700" :
                                    t.estado === "EN_PROCESO" ? "bg-blue-100 text-blue-700" :
                                    "bg-slate-100 text-slate-600"
                                  }`}>
                                    {ESTADO_LABELS[t.estado] ?? t.estado}
                                  </span>
                                  {t.caso && (
                                    <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                      {t.caso.numero}
                                    </span>
                                  )}
                                </div>
                                {t.fechaVencimiento && (
                                  <p className={`text-[10px] mt-1 flex items-center gap-1 ${vencida ? "text-red-600 font-semibold" : "text-slate-400"}`}>
                                    <Clock className="w-3 h-3" />
                                    {vencida ? "Vencida — " : "Vence: "}{formatearFechaCorta(t.fechaVencimiento)}
                                  </p>
                                )}
                                {lugarLimpio && lugarLimpio !== "Estudio Jurídico" && (
                                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />{lugarLimpio}
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                                {tiempoRelativo(t.updatedAt)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {tareas.length > 0 && (
                  <div className="border-t border-slate-100 px-5 py-3 shrink-0 bg-slate-50">
                    <Link href="/portal" onClick={() => setSheetOpen(false)}
                      className="flex items-center justify-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                      Ver todas en el portal
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </SheetContent>
            </Sheet>
>>>>>>> Stashed changes

            {/* Menú de usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-700">{iniciales}</span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {nombreCompleto}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{nombreCompleto}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="flex items-center cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/portal/configuracion" className="flex items-center cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
