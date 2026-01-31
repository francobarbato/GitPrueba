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
                Mis Casos
              </Button>
            </Link>
          </nav>

          {/* Usuario y acciones */}
          <div className="flex items-center gap-3">
            {/* Notificaciones (placeholder) */}
            <Button variant="ghost" size="icon" className="relative text-slate-600">
              <Bell className="h-5 w-5" />
              {/* Badge de notificaciones - descomentar cuando se implementen
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                3
              </span>
              */}
            </Button>

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
