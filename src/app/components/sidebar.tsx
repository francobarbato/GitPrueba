"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  FileText, PieChart, Users, Calendar, FileCheck,
  Calculator, UserPlus, Home, Menu, Settings, ShieldAlert
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

// ============================================================================
// HELPERS DE ROL (sin cambios)
// ============================================================================
const isAdmin = (rol?: string) => rol?.toUpperCase() === 'ADMIN'
const isAbogado = (rol?: string) => rol?.toUpperCase() === 'ABOGADO'
const isAsistente = (rol?: string) => rol?.toUpperCase() === 'ASISTENTE'

const getMenuItems = (rol?: string) => {
  const userRol = rol?.toUpperCase()
  const items = [
    { name: "Inicio", href: "/", icon: Home, roles: ['ADMIN', 'ABOGADO', 'ASISTENTE'] },
    { name: "Gestión de Expedientes", href: "/casos", icon: FileText, roles: ['ABOGADO', 'ASISTENTE'] },
    { name: "Gestión de clientes", href: "/clientes", icon: Users, roles: ['ABOGADO', 'ASISTENTE'] },
    { name: "Agenda y Seguimientos", href: "/gestion-tareas", icon: Calendar, roles: ['ABOGADO', 'ASISTENTE'] },
    { name: "Reportes", href: "/reportes", icon: PieChart, roles: ['ABOGADO', 'ASISTENTE'] },
  ]
  if (isAdmin(rol)) {
    items.push({ name: "Configuración", href: "/configuracion", icon: Settings, roles: ['ADMIN'] })
  }
  return items.filter(item => item.roles.includes(userRol || ''))
}

// ============================================================================
// SIDEBAR DESKTOP — colapsable por click (patrón Claude)
// ============================================================================
// Estados:
//   isCollapsed = true  → ancho 72px, solo íconos. Tooltip nativo al hover de cada ítem.
//   isCollapsed = false → ancho 256px, íconos + texto.
//
// Toggle: solo por click en el botón de menú. NO se expande al hover del mouse.
// Por defecto arranca contraído.
// ============================================================================

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRol = session?.user?.rol ?? undefined

  const [isCollapsed, setIsCollapsed] = useState(true)

  const menuItems = getMenuItems(userRol)

  return (
    <aside
      className={`hidden md:flex bg-card border-r min-h-screen flex-col transition-[width] duration-200 ease-in-out relative z-50 ${
        isCollapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Cabecera con el botón de toggle */}
      <div className="flex items-center h-16 px-4 border-b shrink-0 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="shrink-0"
          title={isCollapsed ? "Expandir menú" : "Contraer menú"}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {!isCollapsed && (
          <span className="font-bold ml-3 whitespace-nowrap">
            Sistema Legal
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 overflow-hidden flex flex-col gap-1">
        {/* Indicador de rol Asistente */}
        {isAsistente(userRol) && (
          <div
            className="mb-4 mx-2 flex items-center bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs p-2 overflow-hidden shrink-0"
            title={isCollapsed ? "Modo Asistente" : undefined}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap ml-2">Modo Asistente</span>
            )}
          </div>
        )}

        {/* Menú de navegación.
            Cuando está contraído, el atributo `title` muestra tooltip nativo
            del navegador al pasar el mouse — sirve como hint sin animación. */}
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center mx-1 px-2 py-2.5 rounded-lg transition-colors overflow-hidden ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {/* Caja fija de 32px para el ícono — alineación perfecta sin importar el estado */}
              <div className="w-8 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5" />
              </div>

              {!isCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap ml-2">
                  {item.name}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

// ============================================================================
// MOBILE SIDEBAR (sin cambios — funcionaba bien)
// ============================================================================

export function MobileSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRol = session?.user?.rol ?? undefined
  const [open, setOpen] = useState(false)

  const menuItems = getMenuItems(userRol)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Sistema Legal</h2>
          <p className="text-sm text-muted-foreground">Gestión de Casos</p>
        </div>
        <nav className="p-4">
          {isAsistente(userRol) && (
            <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Modo Asistente</span>
            </div>
          )}

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}