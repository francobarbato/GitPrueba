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

// Helper para verificar roles
const isAdmin = (rol?: string) => rol?.toUpperCase() === 'ADMIN'
const isAbogado = (rol?: string) => rol?.toUpperCase() === 'ABOGADO'
const isAsistente = (rol?: string) => rol?.toUpperCase() === 'ASISTENTE'

// Definición de items del menú con permisos
const getMenuItems = (rol?: string) => {
  const userRol = rol?.toUpperCase()
  
  const items = [
    { 
      name: "Inicio", 
      href: "/", 
      icon: Home,
      roles: ['ADMIN', 'ABOGADO', 'ASISTENTE'] 
    },
    { 
      name: "Gestión de casos", 
      href: "/casos", 
      icon: FileText,
      roles: ['ABOGADO', 'ASISTENTE']
    },
    { 
      name: "Gestión de clientes", 
      href: "/clientes", 
      icon: Users,
      roles: ['ABOGADO', 'ASISTENTE']
    },
    { 
      name: "Gestión de tareas", 
      href: "/gestion-tareas", 
      icon: Calendar,
      roles: ['ABOGADO', 'ASISTENTE']
    },
    // { 
    //   name: "Plantillas de documentos", 
    //   href: "/plantilla-documentos", 
    //   icon: FileCheck,
    //   roles: ['ADMIN', 'ABOGADO', 'ASISTENTE']
    // },
    // { 
    //   name: "Cálculos de indemnización", 
    //   href: "/calculos-indemnizacion", 
    //   icon: Calculator,
    //   roles: ['ADMIN', 'ABOGADO'] 
    // },
    { 
      name: "Reportes", 
      href: "/reportes", 
      icon: PieChart,
      roles: ['ADMIN', 'ABOGADO', 'ASISTENTE'] 
    },
  ]

  // Agregar Configuración solo para Admin
  if (isAdmin(rol)) {
    items.push({
      name: "Configuración",
      href: "/configuracion",
      icon: Settings,
      roles: ['ADMIN']
    })
  }

  // Filtrar según rol
  return items.filter(item => item.roles.includes(userRol || ''))
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRol = session?.user?.rol ?? undefined

  const menuItems = getMenuItems(userRol)

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-card border-r min-h-screen flex-col">
        <nav className="flex-1 p-4">
          {/* Indicador de rol */}
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
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground">
            <p>v1.0.0</p>
            <p>© 2025 Estudio Jurídico</p>
          </div>
        </div>
      </aside>
    </>
  )
}

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
          {/* Indicador de rol */}
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